'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Search, FileText } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  AdvancedSearchPanel,
  countActiveAdvancedFilters,
  EMPTY_ADVANCED_SEARCH_VALUES,
  type AdvancedSearchValues,
} from '@/components/search/AdvancedSearchPanel';
import { useAuthStore } from '@/lib/stores';
import { getUserType } from '@/lib/types/user';

type QuotationPhase = '見積依頼' | '見積取得' | 'あいみつ中' | '発注承認待ち' | '発注済' | '完了';

interface QuotationListItem {
  id: string;
  phase: QuotationPhase;
  requestedAt: string; // YYYY-MM-DD
  acquiredAt?: string; // YYYY-MM-DD
  vendor: string;
  itemName: string;
  category: string;
  amount: number;
  facility: string;
  applicant: string;
  hasReference: boolean; // 参考見積有無
}

const PHASES: QuotationPhase[] = [
  '見積依頼',
  '見積取得',
  'あいみつ中',
  '発注承認待ち',
  '発注済',
  '完了',
];

const PHASE_STYLE: Record<QuotationPhase, string> = {
  '見積依頼': 'bg-stone-100 text-stone-700 border-stone-200',
  '見積取得': 'bg-sky-50 text-sky-700 border-sky-200',
  'あいみつ中': 'bg-amber-50 text-amber-700 border-amber-200',
  '発注承認待ち': 'bg-violet-50 text-violet-700 border-violet-200',
  '発注済': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '完了': 'bg-stone-100 text-stone-600 border-stone-200',
};

const MOCK_QUOTATIONS: QuotationListItem[] = [
  {
    id: 'Q-2026-0101',
    phase: 'あいみつ中',
    requestedAt: '2026-04-15',
    acquiredAt: '2026-04-22',
    vendor: '〇〇医療機器株式会社',
    itemName: '超音波診断装置 LISENDO 880',
    category: '超音波診断装置',
    amount: 12_600_000,
    facility: '東京中央病院',
    applicant: '田中 花子',
    hasReference: true,
  },
  {
    id: 'Q-2026-0102',
    phase: '発注承認待ち',
    requestedAt: '2026-04-10',
    acquiredAt: '2026-04-18',
    vendor: '株式会社メディコサプライ',
    itemName: '輸液ポンプ TE-SS720 × 12 台',
    category: '輸液ポンプ',
    amount: 6_240_000,
    facility: '東京中央病院',
    applicant: '高橋 健二',
    hasReference: false,
  },
  {
    id: 'Q-2026-0103',
    phase: '見積取得',
    requestedAt: '2026-04-25',
    acquiredAt: '2026-05-02',
    vendor: '株式会社ライフライン医療',
    itemName: '人工呼吸器 SV-300 更新',
    category: '人工呼吸器',
    amount: 3_850_000,
    facility: '横浜総合病院',
    applicant: '木村 圭子',
    hasReference: true,
  },
  {
    id: 'Q-2026-0104',
    phase: '見積依頼',
    requestedAt: '2026-05-10',
    vendor: '〇〇医療機器株式会社',
    itemName: '生体情報モニタ BSM-3500 × 8 台',
    category: '生体情報モニタ',
    amount: 4_800_000,
    facility: '東京中央病院',
    applicant: '田中 花子',
    hasReference: false,
  },
  {
    id: 'Q-2026-0105',
    phase: '発注済',
    requestedAt: '2026-03-05',
    acquiredAt: '2026-03-12',
    vendor: '株式会社メディコサプライ',
    itemName: 'シリンジポンプ TE-SS831 × 6 台',
    category: 'シリンジポンプ',
    amount: 5_280_000,
    facility: '東京中央病院',
    applicant: '高橋 健二',
    hasReference: false,
  },
  {
    id: 'Q-2026-0106',
    phase: 'あいみつ中',
    requestedAt: '2026-05-03',
    acquiredAt: '2026-05-10',
    vendor: '産業医療 △△商事',
    itemName: '電気メス ESG-400',
    category: '電気メス',
    amount: 980_000,
    facility: '千葉医療センター',
    applicant: '安田 智',
    hasReference: true,
  },
  {
    id: 'Q-2026-0107',
    phase: '完了',
    requestedAt: '2026-02-01',
    acquiredAt: '2026-02-08',
    vendor: '〇〇医療機器株式会社',
    itemName: '除細動器 LIFEPAK 20 × 3 台',
    category: '除細動器',
    amount: 4_350_000,
    facility: '千葉医療センター',
    applicant: '安田 智',
    hasReference: false,
  },
  {
    id: 'Q-2026-0108',
    phase: '見積取得',
    requestedAt: '2026-05-08',
    acquiredAt: '2026-05-15',
    vendor: '株式会社ライフライン医療',
    itemName: 'パルスオキシメータ × 20 台',
    category: 'パルスオキシメータ',
    amount: 720_000,
    facility: '横浜総合病院',
    applicant: '木村 圭子',
    hasReference: false,
  },
  {
    id: 'Q-2026-0109',
    phase: '発注承認待ち',
    requestedAt: '2026-04-28',
    acquiredAt: '2026-05-06',
    vendor: '産業医療 △△商事',
    itemName: '手術用顕微鏡 OPMI Lumera',
    category: '超音波診断装置',
    amount: 8_900_000,
    facility: '東京中央病院',
    applicant: '伊藤 三郎',
    hasReference: true,
  },
  {
    id: 'Q-2026-0110',
    phase: 'あいみつ中',
    requestedAt: '2026-05-15',
    acquiredAt: '2026-05-21',
    vendor: '株式会社メディコサプライ',
    itemName: '心電図モニタ BSM-2401 × 6 台',
    category: '生体情報モニタ',
    amount: 2_310_000,
    facility: '横浜総合病院',
    applicant: '木村 圭子',
    hasReference: false,
  },
];

export default function QuotationListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const persona = user?.email ? getUserType(user.email) : null;
  const isShip = persona === 'ship';

  const [keyword, setKeyword] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | QuotationPhase>('all');
  const [facilityFilter, setFacilityFilter] = useState<string>('all');
  const [advanced, setAdvanced] = useState<AdvancedSearchValues>(EMPTY_ADVANCED_SEARCH_VALUES);
  const [appliedAdvanced, setAppliedAdvanced] = useState<AdvancedSearchValues>(
    EMPTY_ADVANCED_SEARCH_VALUES,
  );

  const allFacilities = useMemo(
    () => Array.from(new Set(MOCK_QUOTATIONS.map((q) => q.facility))).sort(),
    [],
  );

  // ペルソナによるスコープ
  const personaScoped = useMemo(() => {
    if (isShip) return MOCK_QUOTATIONS;
    if (!user?.hospital) return MOCK_QUOTATIONS;
    return MOCK_QUOTATIONS.filter((q) => q.facility === user.hospital);
  }, [isShip, user?.hospital]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const f = appliedAdvanced;
    const aFrom = f.amountFrom ? Number(f.amountFrom) : null;
    const aTo = f.amountTo ? Number(f.amountTo) : null;
    return personaScoped.filter((q) => {
      if (isShip && facilityFilter !== 'all' && q.facility !== facilityFilter) return false;
      if (phaseFilter !== 'all' && q.phase !== phaseFilter) return false;
      if (kw) {
        const hay = `${q.id} ${q.vendor} ${q.itemName} ${q.applicant} ${q.facility} ${q.category}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (f.dateFrom && q.requestedAt < f.dateFrom) return false;
      if (f.dateTo && q.requestedAt > f.dateTo) return false;
      if (aFrom !== null && q.amount < aFrom) return false;
      if (aTo !== null && q.amount > aTo) return false;
      if (f.vendor && !q.vendor.includes(f.vendor)) return false;
      return true;
    });
  }, [personaScoped, keyword, phaseFilter, facilityFilter, appliedAdvanced, isShip]);

  const activeAdvanced = countActiveAdvancedFilters(appliedAdvanced);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const buildRows = () =>
    filtered.map((q) => ({
      見積ID: q.id,
      フェーズ: q.phase,
      依頼日: q.requestedAt,
      取得日: q.acquiredAt ?? '',
      業者: q.vendor,
      品目: q.itemName,
      カテゴリ: q.category,
      金額: q.amount,
      施設: q.facility,
      申請者: q.applicant,
      参考見積: q.hasReference ? 'あり' : 'なし',
    }));

  const handleExcel = () => {
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '取得見積一覧');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadFile(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `取得見積一覧_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleCsv = () => {
    const rows = buildRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => esc((r as Record<string, unknown>)[h])).join(','),
      ),
    ].join('\n');
    downloadFile(
      new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8' }),
      `取得見積一覧_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button
              type="button"
              onClick={() => router.push('/ph2')}
              className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
            >
              Ph2 提案機能
            </button>
            <span>/</span>
            <span>取得見積一覧</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance">
            取得見積一覧（区分1-2）
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty">
            参考見積・あいみつ含む取得見積を横断閲覧。フェーズ別 / 業者 / 品目 / 金額で検索可能。
          </p>
        </div>

        {/* キーワード + フェーズ + 施設 + 出力 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[420px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub"
              aria-hidden
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="見積ID / 業者 / 品目 / 申請者 でキーワード検索"
              className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white text-content-primary placeholder:text-content-placeholder"
              aria-label="キーワード検索"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="phase-filter" className="text-xs text-content-sub">
              フェーズ:
            </label>
            <select
              id="phase-filter"
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value as 'all' | QuotationPhase)}
              className="h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white"
            >
              <option value="all">すべて</option>
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {isShip && (
            <div className="flex items-center gap-2">
              <label htmlFor="facility-filter" className="text-xs text-content-sub">
                施設:
              </label>
              <select
                id="facility-filter"
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white"
              >
                <option value="all">全施設</option>
                {allFacilities.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCsv}
              disabled={filtered.length === 0}
              className="h-10 px-3 inline-flex items-center gap-1.5 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" aria-hidden />
              CSV出力
            </button>
            <button
              type="button"
              onClick={handleExcel}
              disabled={filtered.length === 0}
              className="h-10 px-3 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden />
              Excel出力
            </button>
          </div>
        </div>

        {/* 高度検索ペイン */}
        <div className="mb-4">
          <AdvancedSearchPanel
            values={advanced}
            onChange={setAdvanced}
            onApply={() => setAppliedAdvanced(advanced)}
            onReset={() => {
              setAdvanced(EMPTY_ADVANCED_SEARCH_VALUES);
              setAppliedAdvanced(EMPTY_ADVANCED_SEARCH_VALUES);
            }}
            activeFilterCount={activeAdvanced}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-content-sub">
            <span className="tabular-nums font-semibold text-content-primary">
              {filtered.length}
            </span>{' '}
            件 / 全 <span className="tabular-nums">{personaScoped.length}</span> 件
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-stroke-card rounded-lg p-12 text-center">
            <p className="text-sm text-content-primary font-medium mb-2">
              該当する見積が見つかりません
            </p>
            <p className="text-xs text-content-sub mb-4 text-pretty">
              検索条件を見直してください
            </p>
          </div>
        ) : (
          <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                  <th className="px-3 py-2 text-left w-[120px]">見積ID</th>
                  <th className="px-3 py-2 text-left w-[110px]">フェーズ</th>
                  <th className="px-3 py-2 text-left w-[100px]">依頼日</th>
                  <th className="px-3 py-2 text-left w-[100px]">取得日</th>
                  <th className="px-3 py-2 text-left">業者 / 品目</th>
                  <th className="px-3 py-2 text-right w-[140px]">金額</th>
                  {isShip && <th className="px-3 py-2 text-left w-[140px]">施設</th>}
                  <th className="px-3 py-2 text-left w-[80px]">参考</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-stroke-card hover:bg-surface-screen">
                    <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{q.id}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${PHASE_STYLE[q.phase]}`}
                      >
                        {q.phase}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">{q.requestedAt}</td>
                    <td className="px-3 py-2.5 tabular-nums text-content-sub">
                      {q.acquiredAt ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-content-primary">{q.vendor}</div>
                      <div className="text-xs text-content-sub mt-0.5">
                        {q.itemName}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-content-primary">
                      ¥{q.amount.toLocaleString('ja-JP')}
                    </td>
                    {isShip && <td className="px-3 py-2.5 text-xs">{q.facility}</td>}
                    <td className="px-3 py-2.5 text-xs">
                      {q.hasReference ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-sky-100 text-sky-700">
                          あり
                        </span>
                      ) : (
                        <span className="text-content-sub">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
