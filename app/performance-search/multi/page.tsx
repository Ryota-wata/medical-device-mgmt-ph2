'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Files, FileSpreadsheet, Search, FileText, Wrench, ClipboardCheck, HandHeart, Building2 } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';

type MultiMode = 'repair' | 'maker_inspection' | 'in_house_inspection' | 'lending';

interface RepairRecord {
  recordId: string;
  assetId: string;
  assetName: string;
  reportedAt: string;
  startedAt: string;
  completedAt: string;
  description: string;
  vendor: string;
  cost: number;
  result: string;
}

interface InspectionRecord {
  recordId: string;
  assetId: string;
  assetName: string;
  performedAt: string;
  performedBy: string;
  result: string;
  nextDate: string;
  duration: string;
}

interface LendingRecord {
  recordId: string;
  assetId: string;
  assetName: string;
  lendAt: string;
  returnAt: string;
  toDept: string;
  status: string;
}

const REPAIR_MOCK: RepairRecord[] = Array.from({ length: 28 }, (_, i) => ({
  recordId: `RPR-${(20000 + i).toString()}`,
  assetId: `AST-${(10000 + (i % 12)).toString()}`,
  assetName: ['生体情報モニタ BSM-3500', '人工呼吸器 SV-300', '輸液ポンプ TE-SS720'][i % 3],
  reportedAt: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${((i % 28) + 1).toString().padStart(2, '0')}`,
  startedAt: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${(((i + 2) % 28) + 1).toString().padStart(2, '0')}`,
  completedAt: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${(((i + 7) % 28) + 1).toString().padStart(2, '0')}`,
  description: ['電源不調', '画面ノイズ', 'バッテリー劣化', '消耗品交換', '計測精度不良'][i % 5],
  vendor: ['SHIPメンテ', '日本光電サービス', 'テルモCS'][i % 3],
  cost: 28_000 + i * 4_300,
  result: ['完了', '完了', '完了', '部品交換完了'][i % 4] ?? '完了',
}));

const MAKER_INSP_MOCK: InspectionRecord[] = Array.from({ length: 18 }, (_, i) => ({
  recordId: `MI-${(30000 + i).toString()}`,
  assetId: `AST-${(10000 + (i % 12)).toString()}`,
  assetName: ['人工呼吸器 SV-300', '除細動器 LIFEPAK 20', '生体情報モニタ BSM-3500'][i % 3],
  performedAt: `2026-${((i % 6) + 1).toString().padStart(2, '0')}-10`,
  performedBy: ['日本光電 田中', 'マッケ 鈴木', '日本ストライカー 木村'][i % 3],
  result: ['正常', '正常', '部品交換要', '次回観察'][i % 4] ?? '正常',
  nextDate: `2026-${(((i % 6) + 7) % 12 + 1).toString().padStart(2, '0')}-10`,
  duration: `${45 + (i % 60)}分`,
}));

const IN_HOUSE_INSP_MOCK: InspectionRecord[] = Array.from({ length: 32 }, (_, i) => ({
  recordId: `IH-${(40000 + i).toString()}`,
  assetId: `AST-${(10000 + (i % 12)).toString()}`,
  assetName: ['輸液ポンプ TE-SS720', 'シリンジポンプ TE-SS831', '生体情報モニタ BSM-3500'][i % 3],
  performedAt: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${((i % 28) + 1).toString().padStart(2, '0')}`,
  performedBy: ['田中 花子', '高橋 健二', '渡辺 京子'][i % 3],
  result: ['正常', '正常', '正常', '要観察'][i % 4] ?? '正常',
  nextDate: `2026-${(((i % 5) + 2) % 12 + 1).toString().padStart(2, '0')}-15`,
  duration: `${15 + (i % 30)}分`,
}));

const LENDING_MOCK: LendingRecord[] = Array.from({ length: 24 }, (_, i) => ({
  recordId: `LND-${(50000 + i).toString()}`,
  assetId: `AST-${(10000 + (i % 12)).toString()}`,
  assetName: ['輸液ポンプ TE-SS720', 'シリンジポンプ TE-SS831', 'パルスオキシメータ'][i % 3],
  lendAt: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${((i % 28) + 1).toString().padStart(2, '0')} 09:00`,
  returnAt: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${(((i + 3) % 28) + 1).toString().padStart(2, '0')} 17:00`,
  toDept: ['ICU', '一般病棟', '内視鏡室', '救急処置室'][i % 4],
  status: ['返却済', '返却済', '貸出中'][i % 3] ?? '返却済',
}));

const MODE_CONFIG = {
  repair: { label: '修理履歴', icon: Wrench, count: REPAIR_MOCK.length },
  maker_inspection: { label: 'メーカー点検', icon: Building2, count: MAKER_INSP_MOCK.length },
  in_house_inspection: { label: '院内点検', icon: ClipboardCheck, count: IN_HOUSE_INSP_MOCK.length },
  lending: { label: '貸出実績', icon: HandHeart, count: LENDING_MOCK.length },
} as const;

export default function MultiPerformanceSearchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<MultiMode>('repair');
  const [keyword, setKeyword] = useState('');

  const filteredRows = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const rows: Record<string, unknown>[] =
      mode === 'repair' ? (REPAIR_MOCK as unknown as Record<string, unknown>[]) :
      mode === 'maker_inspection' ? (MAKER_INSP_MOCK as unknown as Record<string, unknown>[]) :
      mode === 'in_house_inspection' ? (IN_HOUSE_INSP_MOCK as unknown as Record<string, unknown>[]) :
      (LENDING_MOCK as unknown as Record<string, unknown>[]);
    if (!kw) return rows;
    return rows.filter((r) => Object.values(r).join(' ').toLowerCase().includes(kw));
  }, [mode, keyword]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleExport = (fmt: 'csv' | 'xlsx') => {
    if (filteredRows.length === 0) return;
    const name = MODE_CONFIG[mode].label;
    if (fmt === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(filteredRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, name);
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadFile(new Blob([out], { type: 'application/octet-stream' }), `${name}_${new Date().toISOString().slice(0,10)}.xlsx`);
    } else {
      const headers = Object.keys(filteredRows[0]);
      const esc = (v: unknown) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = [headers.join(','), ...filteredRows.map(r => headers.map(h => esc((r as Record<string, unknown>)[h])).join(','))].join('\n');
      downloadFile(new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8' }), `${name}_${new Date().toISOString().slice(0,10)}.csv`);
    }
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
            <span>❷ 複数レコード検索</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Files className="w-6 h-6 text-emerald-600" aria-hidden />
            ❷ 複数レコード検索（資産1台に対して複数レコード）
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty">
            資産1台に対して時系列で複数記録されるデータ。修理 / メーカー点検 / 院内点検 / 貸出実績 を切替表示。
          </p>
        </div>

        {/* モード切替 */}
        <div className="bg-white border border-stroke-card rounded-lg p-1 mb-4 inline-flex gap-1 flex-wrap">
          {(Object.entries(MODE_CONFIG) as [MultiMode, typeof MODE_CONFIG[MultiMode]][]).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={`px-3 py-2 text-sm rounded-md cursor-pointer border-0 inline-flex items-center gap-1.5 ${
                  mode === k ? 'bg-cta-primary text-white' : 'bg-transparent text-content-primary hover:bg-surface-screen'
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden /> {v.label} ({v.count})
              </button>
            );
          })}
        </div>

        {/* 検索 + 出力 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub" aria-hidden />
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="資産ID / 機器名 / 内容で検索"
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

        {/* テーブル */}
        <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                {filteredRows.length > 0 && Object.keys(filteredRows[0]).map((k) => (
                  <th key={k} className="px-3 py-2 text-left">{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i} className="border-b border-stroke-card hover:bg-surface-screen">
                  {Object.entries(r).map(([k, v]) => (
                    <td key={k} className={`px-3 py-2.5 text-xs ${typeof v === 'number' ? 'text-right tabular-nums font-semibold' : ''}`}>
                      {typeof v === 'number' && k.toLowerCase().includes('cost') ? `¥${v.toLocaleString('ja-JP')}` : String(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-content-sub">
          表示: <span className="font-semibold tabular-nums">{filteredRows.length}</span> 件 / 全 <span className="tabular-nums">{MODE_CONFIG[mode].count}</span> 件
        </p>
      </main>
    </div>
  );
}
