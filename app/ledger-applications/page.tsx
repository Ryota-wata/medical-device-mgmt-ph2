'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { ChevronDown, ChevronUp, FileSpreadsheet, FileText, History, Info, Search } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  AdvancedSearchPanel,
  countActiveAdvancedFilters,
  EMPTY_ADVANCED_SEARCH_VALUES,
  type AdvancedSearchValues,
} from '@/components/search/AdvancedSearchPanel';
import { useAuthStore, useLedgerApplicationStore } from '@/lib/stores';
import { getUserType } from '@/lib/types/user';
import {
  LEDGER_APPLICATION_STATUSES,
  LEDGER_APPLICATION_TYPES,
  type LedgerApplication,
  type LedgerApplicationStatus,
  type LedgerApplicationType,
} from '@/lib/types/ledgerApplication';

const formatYen = (n: number) => `¥${n.toLocaleString('ja-JP')}`;
const formatDate = (iso: string) => {
  // iso = 'YYYY-MM-DD' or full
  return iso.length === 10 ? iso : new Date(iso).toLocaleString('ja-JP');
};

const STATUS_STYLE: Record<LedgerApplicationStatus, string> = {
  申請中: 'bg-amber-50 text-amber-700 border-amber-200',
  承認済: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  差戻し: 'bg-rose-50 text-rose-700 border-rose-200',
  取下げ: 'bg-stone-100 text-stone-600 border-stone-200',
};

const TYPE_STYLE: Record<LedgerApplicationType, string> = {
  購入: 'bg-sky-50 text-sky-700 border-sky-200',
  廃棄: 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function LedgerApplicationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const entries = useLedgerApplicationStore((s) => s.entries);

  const persona = user?.email ? getUserType(user.email) : null;
  const isShip = persona === 'ship';

  const [keyword, setKeyword] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedSearchValues>(EMPTY_ADVANCED_SEARCH_VALUES);
  const [appliedAdvanced, setAppliedAdvanced] = useState<AdvancedSearchValues>(EMPTY_ADVANCED_SEARCH_VALUES);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [facilityFilter, setFacilityFilter] = useState<string>('all');

  // 施設選択肢（SHIP のみ）
  const allFacilities = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.facility))).sort();
  }, [entries]);

  // ペルソナによる初期フィルタ（病院ペルソナは自施設のみ）
  const personaScopedEntries = useMemo(() => {
    if (isShip) return entries;
    const myFacility = user?.hospital;
    if (!myFacility) return entries;
    return entries.filter((e) => e.facility === myFacility);
  }, [entries, isShip, user?.hospital]);

  // フィルタ適用
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const f = appliedAdvanced;
    const amountFrom = f.amountFrom ? Number(f.amountFrom) : null;
    const amountTo = f.amountTo ? Number(f.amountTo) : null;
    return personaScopedEntries.filter((e) => {
      // 施設フィルタ (SHIP)
      if (isShip && facilityFilter !== 'all' && e.facility !== facilityFilter) return false;

      // シンプルキーワード
      if (kw) {
        const hay = `${e.id} ${e.vendor} ${e.assetName} ${e.applicant} ${e.facility}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      // 取引年月日
      if (f.dateFrom && e.transactionDate < f.dateFrom) return false;
      if (f.dateTo && e.transactionDate > f.dateTo) return false;
      // 金額
      if (amountFrom !== null && e.amount < amountFrom) return false;
      if (amountTo !== null && e.amount > amountTo) return false;
      // 取引先（部分一致）
      if (f.vendor && !e.vendor.includes(f.vendor)) return false;
      // 申請種別
      if (f.applicationType && e.type !== f.applicationType) return false;
      // ステータス
      if (f.status && e.status !== f.status) return false;
      return true;
    });
  }, [personaScopedEntries, keyword, appliedAdvanced, facilityFilter, isShip]);

  const activeAdvancedCount = countActiveAdvancedFilters(appliedAdvanced);

  const handleApply = () => {
    setAppliedAdvanced(advanced);
  };
  const handleReset = () => {
    setAdvanced(EMPTY_ADVANCED_SEARCH_VALUES);
    setAppliedAdvanced(EMPTY_ADVANCED_SEARCH_VALUES);
  };

  // ─── 出力 ─────────────────────────────────────────
  const buildExportRows = () =>
    filtered.map((e) => ({
      申請ID: e.id,
      申請種別: e.type,
      取引年月日: e.transactionDate,
      取引先: e.vendor,
      金額: e.amount,
      ステータス: e.status,
      申請者: e.applicant,
      申請日: e.applicationDate,
      施設: e.facility,
      対象資産: e.assetName,
      業務処理期間経過後入力: e.lateEntry ? 'はい' : 'いいえ',
      訂正削除履歴件数: e.history.length,
      関連帳簿: e.relatedDocuments.map((d) => `${d.type}:${d.documentNumber}`).join(' / '),
    }));

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

  const handleExportExcel = () => {
    const rows = buildExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '申請一覧');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(blob, `電帳法申請一覧_${today}.xlsx`);
  };

  const handleExportCsv = () => {
    const rows = buildExportRows();
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(','))].join('\n');
    // UTF-8 BOM 付与（Excel で文字化け防止）
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
    const today = new Date().toISOString().slice(0, 10);
    downloadFile(blob, `電帳法申請一覧_${today}.csv`);
  };

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />

      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        {/* タイトル */}
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button
              type="button"
              onClick={() => router.push('/main')}
              className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
            >
              メイン
            </button>
            <span>/</span>
            <span>申請一覧</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance">
            電帳法対応 申請一覧（購入・廃棄）
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty flex items-center gap-1">
            <Info className="w-4 h-4" aria-hidden />
            電帳法準拠: 訂正・削除履歴 / 業務処理期間経過後の入力事実 / 帳簿関連性 を保持
          </p>
        </div>

        {/* シンプル検索 + 操作 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub" aria-hidden />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="申請ID / 取引先 / 資産名 / 申請者 でキーワード検索"
              className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white text-content-primary placeholder:text-content-placeholder"
              aria-label="キーワード検索"
            />
          </div>

          {/* SHIP: 施設フィルタ */}
          {isShip && (
            <div className="flex items-center gap-2">
              <label htmlFor="facility-filter" className="text-xs text-content-sub">
                施設:
              </label>
              <select
                id="facility-filter"
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white text-content-primary"
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
              onClick={handleExportCsv}
              disabled={filtered.length === 0}
              className="h-10 px-3 inline-flex items-center gap-1.5 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
              aria-label="CSV出力"
            >
              <FileText className="w-4 h-4" aria-hidden />
              CSV出力
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={filtered.length === 0}
              className="h-10 px-3 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
              aria-label="Excel出力"
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
            onApply={handleApply}
            onReset={handleReset}
            applicationTypeOptions={[...LEDGER_APPLICATION_TYPES]}
            statusOptions={[...LEDGER_APPLICATION_STATUSES]}
            showApplicationType
            showStatus
            defaultOpen={false}
            activeFilterCount={activeAdvancedCount}
          />
        </div>

        {/* 件数表示 */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-content-sub">
            <span className="tabular-nums font-semibold text-content-primary">
              {filtered.length.toLocaleString()}
            </span>{' '}
            件 / 全{' '}
            <span className="tabular-nums">{personaScopedEntries.length.toLocaleString()}</span>{' '}
            件
          </p>
        </div>

        {/* テーブル / 空状態 */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-stroke-card rounded-lg p-12 text-center">
            <p className="text-sm text-content-primary font-medium mb-2">
              該当する申請が見つかりません
            </p>
            <p className="text-xs text-content-sub mb-4 text-pretty">
              検索条件を見直してください
            </p>
            <button
              type="button"
              onClick={() => {
                setKeyword('');
                handleReset();
              }}
              className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
            >
              条件をすべてクリア
            </button>
          </div>
        ) : (
          <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                  <th className="px-3 py-2 text-left w-[140px]">申請ID</th>
                  <th className="px-3 py-2 text-left w-[80px]">種別</th>
                  <th className="px-3 py-2 text-left w-[120px]">取引年月日</th>
                  <th className="px-3 py-2 text-left">取引先 / 対象資産</th>
                  <th className="px-3 py-2 text-right w-[140px]">金額</th>
                  <th className="px-3 py-2 text-left w-[100px]">ステータス</th>
                  {isShip && <th className="px-3 py-2 text-left w-[160px]">施設</th>}
                  <th className="px-3 py-2 text-left w-[100px]">履歴</th>
                  <th className="px-3 py-2 text-left w-[80px]">詳細</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <RowGroup
                    key={e.id}
                    entry={e}
                    expanded={expandedId === e.id}
                    onToggle={() => setExpandedId(expandedId === e.id ? null : e.id)}
                    showFacility={isShip}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

interface RowGroupProps {
  entry: LedgerApplication;
  expanded: boolean;
  onToggle: () => void;
  showFacility: boolean;
}

const RowGroup: React.FC<RowGroupProps> = ({ entry, expanded, onToggle, showFacility }) => {
  return (
    <>
      <tr className="border-b border-stroke-card hover:bg-surface-screen">
        <td className="px-3 py-2.5 font-mono text-xs text-content-primary tabular-nums">
          {entry.id}
        </td>
        <td className="px-3 py-2.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${TYPE_STYLE[entry.type]}`}
          >
            {entry.type}
          </span>
        </td>
        <td className="px-3 py-2.5 tabular-nums text-content-primary">
          {entry.transactionDate}
          {entry.lateEntry && (
            <span
              title="業務処理期間経過後の入力"
              className="ml-1.5 inline-flex items-center px-1 py-0.5 text-[10px] font-semibold rounded bg-orange-100 text-orange-700"
            >
              遅延
            </span>
          )}
        </td>
        <td className="px-3 py-2.5">
          <div className="text-content-primary font-medium">{entry.vendor}</div>
          <div className="text-xs text-content-sub mt-0.5">{entry.assetName}</div>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-content-primary">
          {formatYen(entry.amount)}
        </td>
        <td className="px-3 py-2.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${STATUS_STYLE[entry.status]}`}
          >
            {entry.status}
          </span>
        </td>
        {showFacility && (
          <td className="px-3 py-2.5 text-xs text-content-primary">{entry.facility}</td>
        )}
        <td className="px-3 py-2.5">
          <span className="inline-flex items-center gap-1 text-xs text-content-sub">
            <History className="w-3.5 h-3.5" aria-hidden />
            <span className="tabular-nums">{entry.history.length}</span>件
          </span>
        </td>
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={onToggle}
            className="h-8 px-2 inline-flex items-center gap-1 text-xs text-content-link bg-transparent border-0 cursor-pointer hover:underline"
            aria-expanded={expanded}
            aria-label={expanded ? '詳細を閉じる' : '詳細を開く'}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden /> 閉じる
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden /> 開く
              </>
            )}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-stroke-card bg-surface-screen">
          <td colSpan={showFacility ? 9 : 8} className="px-4 py-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 訂正・削除履歴 */}
              <div>
                <h3 className="text-sm font-semibold text-content-primary mb-2 flex items-center gap-1">
                  <History className="w-4 h-4" aria-hidden />
                  訂正・削除履歴
                </h3>
                <ol className="space-y-2">
                  {entry.history.map((h, idx) => (
                    <li
                      key={idx}
                      className="border-l-2 border-stroke-card pl-3 py-1"
                    >
                      <div className="flex items-center gap-2 text-xs text-content-sub">
                        <span className="tabular-nums">{formatDate(h.at)}</span>
                        <span className="text-content-primary font-medium">{h.by}</span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                            h.action === '訂正' || h.action === '削除'
                              ? 'bg-amber-100 text-amber-800'
                              : h.action === '承認'
                                ? 'bg-emerald-100 text-emerald-800'
                                : h.action === '差戻し'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {h.action}
                        </span>
                      </div>
                      <div className="text-sm text-content-primary mt-0.5 text-pretty">
                        {h.detail}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 関連帳簿 + メタ情報 */}
              <div>
                <h3 className="text-sm font-semibold text-content-primary mb-2">
                  関連帳簿（帳簿同士の関連性）
                </h3>
                {entry.relatedDocuments.length === 0 ? (
                  <p className="text-xs text-content-sub">関連帳簿はありません</p>
                ) : (
                  <ul className="space-y-1.5">
                    {entry.relatedDocuments.map((d, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-content-primary"
                      >
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border bg-white border-stroke-card text-content-sub">
                          {d.type}
                        </span>
                        <span className="font-mono text-xs tabular-nums">{d.documentNumber}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <h3 className="text-sm font-semibold text-content-primary mt-4 mb-2">
                  申請メタ情報
                </h3>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-content-sub">申請者</dt>
                  <dd className="text-content-primary">{entry.applicant}</dd>
                  <dt className="text-content-sub">申請日</dt>
                  <dd className="text-content-primary tabular-nums">{entry.applicationDate}</dd>
                  <dt className="text-content-sub">施設</dt>
                  <dd className="text-content-primary">{entry.facility}</dd>
                  <dt className="text-content-sub">業務処理期間経過後</dt>
                  <dd className="text-content-primary">{entry.lateEntry ? 'はい' : 'いいえ'}</dd>
                </dl>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
