'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Inbox, FileSpreadsheet, FileText, Search, AlertTriangle } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';

type AppType = '購入' | '廃棄' | '移動' | '保守契約' | '修理';
type AppStatus = '申請中' | '差戻し' | '取下げ';

interface PendingApp {
  applicationId: string;
  type: AppType;
  status: AppStatus;
  applicationDate: string;
  applicant: string;
  approver: string;
  assetName: string;
  amount: number;
  vendor: string;
  daysWaiting: number;
}

const MOCK_PENDING: PendingApp[] = [
  { applicationId: 'APP-2026-PR-0084', type: '購入', status: '申請中', applicationDate: '2026-04-08', applicant: '田中 花子', approver: '佐藤 美智子', assetName: '超音波診断装置 LISENDO 880', amount: 12_600_000, vendor: '株式会社ライフライン医療', daysWaiting: 38 },
  { applicationId: 'APP-2026-PR-0089', type: '購入', status: '申請中', applicationDate: '2026-04-18', applicant: '高橋 健二', approver: '佐藤 美智子', assetName: 'シリンジポンプ TE-SS831 × 6台', amount: 5_280_000, vendor: '株式会社メディコサプライ', daysWaiting: 28 },
  { applicationId: 'APP-2026-DP-0021', type: '廃棄', status: '差戻し', applicationDate: '2026-04-13', applicant: '田中 花子', approver: '佐藤 美智子', assetName: '電気メス ESG-400', amount: 42_000, vendor: '産業廃棄物処理 ◇◇興業', daysWaiting: 33 },
  { applicationId: 'APP-2026-TR-0012', type: '移動', status: '申請中', applicationDate: '2026-05-15', applicant: '伊藤 三郎', approver: '佐藤 美智子', assetName: '生体情報モニタ BSM-3500（ICU→CCU）', amount: 0, vendor: '—', daysWaiting: 8 },
  { applicationId: 'APP-2026-PR-0091', type: '購入', status: '申請中', applicationDate: '2026-05-08', applicant: '田中 花子', approver: '佐藤 美智子', assetName: '生体情報モニタ × 8 台', amount: 4_800_000, vendor: '〇〇医療機器株式会社', daysWaiting: 15 },
  { applicationId: 'APP-2026-MC-0034', type: '保守契約', status: '申請中', applicationDate: '2026-05-10', applicant: '田中 花子', approver: '佐藤 美智子', assetName: 'ICU機器 包括保守契約', amount: 10_200_000, vendor: 'SHIPメンテ', daysWaiting: 13 },
  { applicationId: 'APP-2026-RP-0156', type: '修理', status: '申請中', applicationDate: '2026-05-19', applicant: '田中 花子', approver: '佐藤 美智子', assetName: '人工呼吸器 SV-300（バッテリー交換）', amount: 82_000, vendor: 'マッケ サービス', daysWaiting: 4 },
  { applicationId: 'APP-2026-PR-0093', type: '購入', status: '取下げ', applicationDate: '2026-04-22', applicant: '高橋 健二', approver: '佐藤 美智子', assetName: '心電図モニタ BSM-2401', amount: 2_310_000, vendor: '株式会社ライフライン医療', daysWaiting: 24 },
  { applicationId: 'APP-2026-DP-0027', type: '廃棄', status: '申請中', applicationDate: '2026-05-20', applicant: '高橋 健二', approver: '佐藤 美智子', assetName: '輸液ポンプ TE-SS610（旧）× 4台', amount: 24_000, vendor: '産業廃棄物処理 ◇◇興業', daysWaiting: 3 },
];

const TYPE_STYLE: Record<AppType, string> = {
  購入: 'bg-sky-50 text-sky-700 border-sky-200',
  廃棄: 'bg-violet-50 text-violet-700 border-violet-200',
  移動: 'bg-amber-50 text-amber-700 border-amber-200',
  保守契約: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  修理: 'bg-stone-100 text-stone-700 border-stone-200',
};

const STATUS_STYLE: Record<AppStatus, string> = {
  申請中: 'bg-amber-50 text-amber-700 border-amber-200',
  差戻し: 'bg-rose-50 text-rose-700 border-rose-200',
  取下げ: 'bg-stone-100 text-stone-600 border-stone-200',
};

export default function ApplicationsPendingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AppType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AppStatus>('all');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return MOCK_PENDING.filter((a) => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (kw && !`${a.applicationId} ${a.assetName} ${a.applicant} ${a.vendor}`.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [keyword, typeFilter, statusFilter]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleExport = (fmt: 'csv' | 'xlsx') => {
    if (filtered.length === 0) return;
    const name = '未執行申請一覧';
    if (fmt === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(filtered);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, name);
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadFile(new Blob([out], { type: 'application/octet-stream' }), `${name}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } else {
      const headers = Object.keys(filtered[0]);
      const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = [headers.join(','), ...filtered.map(r => headers.map(h => esc((r as unknown as Record<string, unknown>)[h])).join(','))].join('\n');
      downloadFile(new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8' }), `${name}_${new Date().toISOString().slice(0,10)}.csv`);
    }
  };

  const stuckCount = filtered.filter(f => f.daysWaiting >= 30).length;

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-5">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button onClick={() => router.push('/main')} className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0">メイン</button>
            <span>/</span>
            <button onClick={() => router.push('/performance-search')} className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0">実績データ 検索・出力</button>
            <span>/</span>
            <span>❺ 未執行申請一覧</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Inbox className="w-6 h-6 text-emerald-600" aria-hidden />
            ❺ 未執行の申請一覧
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty">
            承認待ち / 差戻し / 取下げ等、まだ完了していない申請を一覧表示。長期滞留の検知にも使用。
          </p>
        </div>

        {stuckCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" aria-hidden />
            <span className="text-sm text-rose-800">
              <span className="font-semibold tabular-nums">{stuckCount}</span> 件が 30 日以上 滞留中
            </span>
          </div>
        )}

        {/* フィルタ + 出力 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub" aria-hidden />
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="申請ID / 資産名 / 申請者で検索"
              className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | AppType)} className="h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white">
            <option value="all">種別: すべて</option>
            <option value="購入">購入</option>
            <option value="廃棄">廃棄</option>
            <option value="移動">移動</option>
            <option value="保守契約">保守契約</option>
            <option value="修理">修理</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | AppStatus)} className="h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white">
            <option value="all">状態: すべて</option>
            <option value="申請中">申請中</option>
            <option value="差戻し">差戻し</option>
            <option value="取下げ">取下げ</option>
          </select>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => handleExport('csv')} className="h-10 px-3 inline-flex items-center gap-1.5 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer">
              <FileText className="w-4 h-4" aria-hidden /> CSV出力
            </button>
            <button onClick={() => handleExport('xlsx')} className="h-10 px-3 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" aria-hidden /> Excel出力
            </button>
          </div>
        </div>

        <p className="text-sm text-content-sub mb-3">
          <span className="font-semibold tabular-nums text-content-primary">{filtered.length}</span> 件 / 全 <span className="tabular-nums">{MOCK_PENDING.length}</span> 件
        </p>

        <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                <th className="px-3 py-2 text-left">申請ID</th>
                <th className="px-3 py-2 text-left">種別</th>
                <th className="px-3 py-2 text-left">状態</th>
                <th className="px-3 py-2 text-left">申請日</th>
                <th className="px-3 py-2 text-right w-[100px]">滞留</th>
                <th className="px-3 py-2 text-left">対象 / 業者</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-left">申請者 / 承認者</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.applicationId} className="border-b border-stroke-card hover:bg-surface-screen">
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{a.applicationId}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${TYPE_STYLE[a.type]}`}>{a.type}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-xs">{a.applicationDate}</td>
                  <td className={`px-3 py-2.5 text-right tabular-nums text-xs font-semibold ${a.daysWaiting >= 30 ? 'text-rose-600' : a.daysWaiting >= 14 ? 'text-amber-600' : 'text-content-sub'}`}>
                    {a.daysWaiting}日
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="text-content-primary">{a.assetName}</div>
                    <div className="text-xs text-content-sub">{a.vendor}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                    {a.amount > 0 ? `¥${a.amount.toLocaleString('ja-JP')}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <div>{a.applicant}</div>
                    <div className="text-content-sub">→ {a.approver}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
