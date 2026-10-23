import * as XLSX from 'xlsx';
import type { FacilityContractStatus, FacilityMaster } from '@/lib/types/master';
import {
  BED_ITEMS_LEFT,
  BED_ITEMS_RIGHT,
  CERT_CATEGORIES,
  CUSTOMER_BED_KEYS,
  CUSTOMER_ROOM_KEYS,
  ROOM_ITEMS,
} from '@/lib/data/facilityMasterSamples';
import type { FacilityAdminState } from '@/lib/stores/facilityAdminStore';
import { CONFIGURABLE_FEATURES } from '@/lib/data/featureCatalog';

/** 画面上の「今日」。静的書き出し時と表示時で日付がずれないよう固定する（モックのため） */
export const MOCK_TODAY = '2026-10-23';

/** YYYY-MM-DD → YYYY/MM/DD */
export const toSlashDate = (ymd?: string) => (ymd ? ymd.replace(/-/g, '/') : '');

/** YYYY-MM-DD に n 日足す */
export function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysBetween(fromYmd: string, toYmd: string) {
  return Math.round((new Date(`${toYmd}T00:00:00`).getTime() - new Date(`${fromYmd}T00:00:00`).getTime()) / 86_400_000);
}

export const contractStatusOf = (f: FacilityMaster): FacilityContractStatus => f.contractStatus ?? '未契約';

/** 契約更新日（＝契約終了日）が 60 日以内の契約中の施設。自動更新のため、停止依頼が無ければ更新される */
export function isRenewalSoon(f: FacilityMaster) {
  if (contractStatusOf(f) !== '契約中' || !f.contractEndDate) return false;
  const d = daysBetween(MOCK_TODAY, f.contractEndDate);
  return d >= 0 && d <= 60;
}

export const CONTRACT_STATUS_PILL: Record<FacilityContractStatus, string> = {
  契約中: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  停止予定: 'bg-amber-50 text-amber-800 border-amber-200',
  停止中: 'bg-amber-50 text-amber-800 border-amber-200',
  未契約: 'bg-stone-100 text-stone-600 border-stone-200',
};

/** 病床・治療室の値。未設定なら顧客 SHIP施設マスタの列から読み替える */
export function bedsOf(f: FacilityMaster): Record<string, string> {
  if (f.beds) return f.beds;
  const raw = f as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  Object.entries(CUSTOMER_BED_KEYS).forEach(([k, label]) => {
    if (raw[k] != null && raw[k] !== '') out[label] = String(raw[k]);
  });
  return out;
}

export function roomsOf(f: FacilityMaster): Record<string, string> {
  if (f.rooms) return f.rooms;
  const raw = f as unknown as Record<string, unknown>;
  const out: Record<string, string> = {};
  Object.entries(CUSTOMER_ROOM_KEYS).forEach(([k, label]) => {
    if (raw[k] != null && raw[k] !== '') out[label] = String(raw[k]);
  });
  return out;
}

/** 総病床数（一覧の「規模」列）。未入力は空 */
export const totalBedsOf = (f: FacilityMaster) => bedsOf(f)['総病床数'] ?? (f.bedCount ? String(f.bedCount) : '');

/** 権限設定の状況（一覧の「権限設定」列） */
export function permissionStatusOf(state: FacilityAdminState): { label: string; done: boolean } {
  if (state.permDone) return { label: '完了', done: true };
  if (!state.admins.length) return { label: '未設定', done: false };
  const unassigned = CONFIGURABLE_FEATURES.filter((def) => {
    const s = state.features[def.code];
    return s?.use && (s.subject === 'SHIP' || s.subject === '両方') && !s.orgs.length;
  }).length;
  return { label: unassigned ? `設定中（未割当 ${unassigned}）` : '設定中', done: false };
}

/**
 * エクスポート（2026-09-02 SE 協議で確定した仕様）
 * 絞り込み結果 × 施設情報画面（MS-102）の全項目を 1 施設 1 行。シート名「施設マスタ」、日本語の列名、
 * 医療機関コードは文字列、日付は YYYY/MM/DD、未入力は空欄、複数値は「／」区切り。
 */
export function exportShipFacilities(rows: FacilityMaster[], groupNamesOf: (f: FacilityMaster) => string[]) {
  const bedLabels = [...BED_ITEMS_LEFT, ...BED_ITEMS_RIGHT].map((b) => b.label);
  const header = [
    '施設ID', '医療機関コード', '施設名', '施設略称', '経営主体', '施設グループ', '開設日', '都道府県', '市区町村', '二次医療圏', '延床面積（㎡）',
    '契約状況', '契約開始日', '契約終了日', 'リモデル契約', '利用開始日', '利用停止予定日', '利用停止日',
    ...CERT_CATEGORIES.map((c) => `認定情報 ${c.name}`),
    ...bedLabels,
    ...ROOM_ITEMS.map((r) => r.label),
  ];
  const data = rows.map((f) => {
    const beds = bedsOf(f);
    const rooms = roomsOf(f);
    const certs = f.certifications ?? [];
    return [
      f.id, String(f.facilityCode ?? ''), f.facilityName, f.shortName ?? '', f.foundingBody ?? '', groupNamesOf(f).join('／'),
      toSlashDate(f.establishedDate), f.prefecture ?? '', f.city ?? '', f.secondaryMedicalArea ?? '', f.floorArea ?? '',
      contractStatusOf(f), toSlashDate(f.contractStartDate), toSlashDate(f.contractEndDate), f.remodelContract ?? 'なし',
      f.useStartDate ?? '', f.stopPlanDate ?? '', f.stopDate ?? '',
      ...CERT_CATEGORIES.map((c) => certs.filter((v) => c.options.includes(v)).join('／')),
      ...bedLabels.map((l) => beds[l] ?? ''),
      ...ROOM_ITEMS.map((r) => rooms[r.label] ?? ''),
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  // 医療機関コードは先頭の 0 を保持するため文字列セルにする
  data.forEach((_, i) => {
    const cell = ws[XLSX.utils.encode_cell({ r: i + 1, c: 1 })];
    if (cell) cell.t = 's';
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '施設マスタ');
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
  XLSX.writeFile(wb, `施設マスタ_${stamp}.xlsx`);
}
