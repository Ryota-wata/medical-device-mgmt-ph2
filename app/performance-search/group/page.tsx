'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Layers, FileSpreadsheet, FileText, Search, Package, ScrollText, ClipboardCheck, HandHeart, ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';

type GroupMode = 'quotation' | 'contract' | 'inspection' | 'lending';

interface QuotationGroup {
  groupId: string;
  groupName: string;
  vendor: string;
  itemCount: number;
  totalAmount: number;
  acquiredAt: string;
  phase: string;
}

interface ContractGroup {
  groupId: string;
  groupName: string;
  vendor: string;
  contractType: string;
  startDate: string;
  endDate: string;
  monthlyAmount: number;
  assetCount: number;
}

interface InspectionGroup {
  groupId: string;
  groupName: string;
  inspectionType: string;
  cycle: string;
  assetCount: number;
  lastDate: string;
  nextDate: string;
}

interface LendingGroup {
  groupId: string;
  groupName: string;
  toDept: string;
  startDate: string;
  endDate: string;
  assetCount: number;
  status: string;
}

const QUOTATION_GROUPS: QuotationGroup[] = [
  { groupId: 'QG-2026-001', groupName: '2026年度 ICU機器更新', vendor: '〇〇医療機器株式会社', itemCount: 14, totalAmount: 28_600_000, acquiredAt: '2026-04-15', phase: '発注済' },
  { groupId: 'QG-2026-002', groupName: '輸液ポンプ一括更新（12台）', vendor: '株式会社メディコサプライ', itemCount: 12, totalAmount: 6_240_000, acquiredAt: '2026-04-18', phase: 'あいみつ中' },
  { groupId: 'QG-2026-003', groupName: '人工呼吸器更新', vendor: '株式会社ライフライン医療', itemCount: 2, totalAmount: 7_700_000, acquiredAt: '2026-05-02', phase: '見積取得' },
  { groupId: 'QG-2026-004', groupName: '生体情報モニタ 8台', vendor: '〇〇医療機器株式会社', itemCount: 8, totalAmount: 4_800_000, acquiredAt: '2026-05-10', phase: '見積依頼' },
  { groupId: 'QG-2026-005', groupName: 'シリンジポンプ 6台', vendor: '株式会社メディコサプライ', itemCount: 6, totalAmount: 5_280_000, acquiredAt: '2026-03-12', phase: '発注済' },
];

const CONTRACT_GROUPS: ContractGroup[] = [
  { groupId: 'CG-2026-001', groupName: 'ICU機器 包括保守契約', vendor: 'SHIPメンテ', contractType: '包括保守', startDate: '2026-04-01', endDate: '2027-03-31', monthlyAmount: 850_000, assetCount: 42 },
  { groupId: 'CG-2026-002', groupName: '人工呼吸器 メーカー保守', vendor: 'マッケジャパン', contractType: 'メーカー保守', startDate: '2026-04-01', endDate: '2027-03-31', monthlyAmount: 280_000, assetCount: 8 },
  { groupId: 'CG-2026-003', groupName: '生体情報モニタ スポット契約', vendor: '日本光電サービス', contractType: 'スポット保守', startDate: '2026-04-01', endDate: '2027-03-31', monthlyAmount: 180_000, assetCount: 24 },
  { groupId: 'CG-2026-004', groupName: '超音波診断装置 フル保守', vendor: '日立ヘルスケア', contractType: 'フル保守', startDate: '2026-04-01', endDate: '2029-03-31', monthlyAmount: 320_000, assetCount: 6 },
];

const INSPECTION_GROUPS: InspectionGroup[] = [
  { groupId: 'IG-2026-001', groupName: 'ICU 機器 月次点検G', inspectionType: '定期点検', cycle: '月次', assetCount: 42, lastDate: '2026-05-15', nextDate: '2026-06-15' },
  { groupId: 'IG-2026-002', groupName: '一般病棟 輸液ポンプ点検G', inspectionType: '日常点検', cycle: '毎日', assetCount: 36, lastDate: '2026-05-23', nextDate: '2026-05-24' },
  { groupId: 'IG-2026-003', groupName: '手術部門 始業前点検G', inspectionType: '始業前', cycle: '毎日', assetCount: 18, lastDate: '2026-05-23', nextDate: '2026-05-24' },
  { groupId: 'IG-2026-004', groupName: '人工呼吸器 四半期点検G', inspectionType: '定期点検', cycle: '四半期', assetCount: 8, lastDate: '2026-03-15', nextDate: '2026-06-15' },
];

const LENDING_GROUPS: LendingGroup[] = [
  { groupId: 'LG-2026-001', groupName: 'ICU増床対応貸出', toDept: 'ICU', startDate: '2026-05-01', endDate: '2026-05-31', assetCount: 6, status: '貸出中' },
  { groupId: 'LG-2026-002', groupName: '救急対応 一時貸出', toDept: '救急処置室', startDate: '2026-05-20', endDate: '2026-05-25', assetCount: 3, status: '返却済' },
  { groupId: 'LG-2026-003', groupName: '手術室 機器補充', toDept: '手術室1', startDate: '2026-05-22', endDate: '2026-06-22', assetCount: 4, status: '貸出中' },
];

const MODE_CONFIG = {
  quotation: { label: '見積グループ', icon: ScrollText, count: QUOTATION_GROUPS.length },
  contract: { label: '契約グループ', icon: Package, count: CONTRACT_GROUPS.length },
  inspection: { label: '点検グループ', icon: ClipboardCheck, count: INSPECTION_GROUPS.length },
  lending: { label: '貸出グループ', icon: HandHeart, count: LENDING_GROUPS.length },
} as const;

export default function GroupPerformanceSearchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<GroupMode>('quotation');
  const [keyword, setKeyword] = useState('');

  const rows: Record<string, unknown>[] = useMemo(() => {
    const all: Record<string, unknown>[] =
      mode === 'quotation' ? (QUOTATION_GROUPS as unknown as Record<string, unknown>[]) :
      mode === 'contract' ? (CONTRACT_GROUPS as unknown as Record<string, unknown>[]) :
      mode === 'inspection' ? (INSPECTION_GROUPS as unknown as Record<string, unknown>[]) :
      (LENDING_GROUPS as unknown as Record<string, unknown>[]);
    const kw = keyword.trim().toLowerCase();
    if (!kw) return all;
    return all.filter(r => Object.values(r).join(' ').toLowerCase().includes(kw));
  }, [mode, keyword]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleExport = (fmt: 'csv' | 'xlsx') => {
    if (rows.length === 0) return;
    const name = MODE_CONFIG[mode].label;
    if (fmt === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, name);
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadFile(new Blob([out], { type: 'application/octet-stream' }), `${name}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } else {
      const headers = Object.keys(rows[0]);
      const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = [headers.join(','), ...rows.map(r => headers.map(h => esc((r as Record<string, unknown>)[h])).join(','))].join('\n');
      downloadFile(new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8' }), `${name}_${new Date().toISOString().slice(0,10)}.csv`);
    }
  };

  const formatCell = (k: string, v: unknown) => {
    if (typeof v === 'number') {
      if (k.toLowerCase().includes('amount')) return `¥${v.toLocaleString('ja-JP')}`;
      return v.toLocaleString();
    }
    return String(v);
  };

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
            <span>❸ グループ単位検索</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" aria-hidden />
            ❸ グループ単位検索（業務単位の集約データ）
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty">
            業務遂行のために資産をグループ化した単位での検索・出力。見積G / 契約G / 点検G / 貸出G を切替表示。
          </p>
        </div>

        {/* モード切替 */}
        <div className="bg-white border border-stroke-card rounded-lg p-1 mb-4 inline-flex gap-1 flex-wrap">
          {(Object.entries(MODE_CONFIG) as [GroupMode, typeof MODE_CONFIG[GroupMode]][]).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button key={k} type="button" onClick={() => setMode(k)}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer border-0 inline-flex items-center gap-1.5 ${
                  mode === k ? 'bg-cta-primary text-white' : 'bg-transparent text-content-primary hover:bg-surface-screen'
                }`}>
                <Icon className="w-4 h-4" aria-hidden /> {v.label} ({v.count})
              </button>
            );
          })}
        </div>

        {/* 検索 + 出力 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub" aria-hidden />
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="グループID / 名称 / 業者で検索"
              className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => handleExport('csv')} className="h-10 px-3 inline-flex items-center gap-1.5 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer">
              <FileText className="w-4 h-4" aria-hidden /> CSV出力
            </button>
            <button onClick={() => handleExport('xlsx')} className="h-10 px-3 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" aria-hidden /> Excel出力
            </button>
          </div>
        </div>

        {/* グループカード一覧 */}
        <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                {rows.length > 0 && Object.keys(rows[0]).map((k) => (
                  <th key={k} className="px-3 py-2 text-left">{k}</th>
                ))}
                <th className="px-3 py-2 text-left w-[80px]">明細</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-stroke-card hover:bg-surface-screen">
                  {Object.entries(r).map(([k, v]) => (
                    <td key={k} className={`px-3 py-2.5 text-xs ${typeof v === 'number' && k.toLowerCase().includes('amount') ? 'text-right tabular-nums font-semibold' : typeof v === 'number' ? 'text-right tabular-nums' : ''}`}>
                      {formatCell(k, v)}
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <button type="button" className="inline-flex items-center gap-1 text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0">
                      明細 <ChevronRight className="w-3 h-3" aria-hidden />
                    </button>
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
