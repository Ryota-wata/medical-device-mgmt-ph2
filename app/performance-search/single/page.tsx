'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { FileText, FileSpreadsheet, Search, Trash2 } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';

type SearchMode = 'current' | 'disposed';

interface CurrentAssetRecord {
  assetId: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  maker: string;
  model: string;
  serial: string;
  acquiredDate: string;
  acquiredAmount: number;
  location: string;
  department: string;
}

interface DisposedAssetRecord {
  assetId: string;
  assetName: string;
  maker: string;
  model: string;
  acquiredDate: string;
  disposalDate: string;
  disposalReason: string;
  manifestNo: string;
  disposalVendor: string;
}

const CURRENT_MOCK: CurrentAssetRecord[] = Array.from({ length: 24 }, (_, i) => ({
  assetId: `AST-${(10000 + i).toString()}`,
  category: '医療機器',
  largeClass: ['監視', '呼吸', '注入', '生体'][i % 4],
  mediumClass: ['ベッドサイド', 'ポータブル', '据置'][i % 3],
  item: ['生体情報モニタ BSM-3500', '輸液ポンプ TE-SS720', '人工呼吸器 SV-300', '超音波診断装置 LISENDO 880'][i % 4],
  maker: ['日本光電', 'テルモ', 'マッケ', '日立'][i % 4],
  model: `MDL-${100 + (i % 30)}`,
  serial: `SN${(202600 + i).toString()}`,
  acquiredDate: `2024-${((i % 12) + 1).toString().padStart(2, '0')}-15`,
  acquiredAmount: 1_200_000 + i * 87_000,
  location: ['ICU', '手術室', '一般病棟', '内視鏡室'][i % 4],
  department: ['集中治療部門', '手術部門', '入院部門', '検査部門'][i % 4],
}));

const DISPOSED_MOCK: DisposedAssetRecord[] = Array.from({ length: 12 }, (_, i) => ({
  assetId: `AST-${(98000 + i).toString()}`,
  assetName: ['生体情報モニタ BSM-2401（旧）', '人工呼吸器 SV-300（旧）', '輸液ポンプ TE-SS610'][i % 3],
  maker: ['日本光電', 'マッケ', 'テルモ'][i % 3],
  model: `MDL-OLD-${i + 1}`,
  acquiredDate: `2014-${((i % 12) + 1).toString().padStart(2, '0')}-10`,
  disposalDate: `2026-${((i % 5) + 1).toString().padStart(2, '0')}-${((i % 28) + 1).toString().padStart(2, '0')}`,
  disposalReason: ['経年劣化', '故障修理不能', '更新による除却'][i % 3],
  manifestNo: `MF-2026-${(100 + i).toString().padStart(5, '0')}`,
  disposalVendor: ['産業廃棄物処理 ◇◇興業', '医療廃棄物処理 △△環境'][i % 2],
}));

export default function SinglePerformanceSearchPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>('current');
  const [keyword, setKeyword] = useState('');

  const currentFiltered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return CURRENT_MOCK;
    return CURRENT_MOCK.filter((r) =>
      `${r.assetId} ${r.item} ${r.maker} ${r.model} ${r.serial} ${r.location}`.toLowerCase().includes(kw),
    );
  }, [keyword]);

  const disposedFiltered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return DISPOSED_MOCK;
    return DISPOSED_MOCK.filter((r) =>
      `${r.assetId} ${r.assetName} ${r.maker} ${r.disposalVendor} ${r.manifestNo}`.toLowerCase().includes(kw),
    );
  }, [keyword]);

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

  const handleExport = (format: 'csv' | 'xlsx') => {
    const rows = mode === 'current' ? currentFiltered : disposedFiltered;
    if (rows.length === 0) return;
    const fname = mode === 'current' ? '現有資産' : '廃棄資産';
    if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, fname);
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      downloadFile(
        new Blob([wbout], { type: 'application/octet-stream' }),
        `${fname}_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } else {
      const headers = Object.keys(rows[0]);
      const esc = (v: unknown) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => esc((r as unknown as Record<string, unknown>)[h])).join(','))].join('\n');
      downloadFile(
        new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8' }),
        `${fname}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
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
            <span>❶ 単一レコード検索</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance">
            ❶ 単一レコード検索（資産1台に対して1レコード）
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty">
            資産1台に対して情報が1つだけ存在するデータ。現有情報（原本）と廃棄情報（除却時用）を切替表示。
          </p>
        </div>

        {/* モード切替 */}
        <div className="bg-white border border-stroke-card rounded-lg p-1 mb-4 inline-flex gap-1">
          <button
            type="button"
            onClick={() => setMode('current')}
            className={`px-4 py-2 text-sm rounded-md cursor-pointer border-0 inline-flex items-center gap-1.5 ${
              mode === 'current' ? 'bg-cta-primary text-white' : 'bg-transparent text-content-primary hover:bg-surface-screen'
            }`}
          >
            <FileText className="w-4 h-4" aria-hidden /> 現有情報（原本情報）
          </button>
          <button
            type="button"
            onClick={() => setMode('disposed')}
            className={`px-4 py-2 text-sm rounded-md cursor-pointer border-0 inline-flex items-center gap-1.5 ${
              mode === 'disposed' ? 'bg-cta-primary text-white' : 'bg-transparent text-content-primary hover:bg-surface-screen'
            }`}
          >
            <Trash2 className="w-4 h-4" aria-hidden /> 廃棄情報（除却時用）
          </button>
        </div>

        {/* 検索 + 出力 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub" aria-hidden />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="資産ID / 機器名 / メーカー / 型式 で検索"
              className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white"
            />
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
        {mode === 'current' ? (
          <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                  <th className="px-3 py-2 text-left">資産ID</th>
                  <th className="px-3 py-2 text-left">カテゴリ / 大分類 / 中分類</th>
                  <th className="px-3 py-2 text-left">品目</th>
                  <th className="px-3 py-2 text-left">メーカー / 型式 / 製造番号</th>
                  <th className="px-3 py-2 text-left">取得日</th>
                  <th className="px-3 py-2 text-right">取得金額</th>
                  <th className="px-3 py-2 text-left">部署 / 設置場所</th>
                </tr>
              </thead>
              <tbody>
                {currentFiltered.map((r) => (
                  <tr key={r.assetId} className="border-b border-stroke-card hover:bg-surface-screen">
                    <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{r.assetId}</td>
                    <td className="px-3 py-2.5 text-xs text-content-sub">{r.category} / {r.largeClass} / {r.mediumClass}</td>
                    <td className="px-3 py-2.5 text-content-primary">{r.item}</td>
                    <td className="px-3 py-2.5 text-xs"><div>{r.maker}</div><div className="text-content-sub">{r.model} / {r.serial}</div></td>
                    <td className="px-3 py-2.5 tabular-nums text-xs">{r.acquiredDate}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">¥{r.acquiredAmount.toLocaleString('ja-JP')}</td>
                    <td className="px-3 py-2.5 text-xs"><div>{r.department}</div><div className="text-content-sub">{r.location}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                  <th className="px-3 py-2 text-left">資産ID</th>
                  <th className="px-3 py-2 text-left">資産名</th>
                  <th className="px-3 py-2 text-left">メーカー / 型式</th>
                  <th className="px-3 py-2 text-left">取得日</th>
                  <th className="px-3 py-2 text-left">廃棄日</th>
                  <th className="px-3 py-2 text-left">廃棄理由</th>
                  <th className="px-3 py-2 text-left">マニフェストNo</th>
                  <th className="px-3 py-2 text-left">処理業者</th>
                </tr>
              </thead>
              <tbody>
                {disposedFiltered.map((r) => (
                  <tr key={r.assetId} className="border-b border-stroke-card hover:bg-surface-screen">
                    <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{r.assetId}</td>
                    <td className="px-3 py-2.5 text-content-primary">{r.assetName}</td>
                    <td className="px-3 py-2.5 text-xs"><div>{r.maker}</div><div className="text-content-sub">{r.model}</div></td>
                    <td className="px-3 py-2.5 tabular-nums text-xs text-content-sub">{r.acquiredDate}</td>
                    <td className="px-3 py-2.5 tabular-nums text-xs">{r.disposalDate}</td>
                    <td className="px-3 py-2.5 text-xs">{r.disposalReason}</td>
                    <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{r.manifestNo}</td>
                    <td className="px-3 py-2.5 text-xs">{r.disposalVendor}</td>
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
