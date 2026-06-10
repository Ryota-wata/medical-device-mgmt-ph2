'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { FolderSearch, FileSpreadsheet, FileText, Search, Download, Image, FileType } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';

type DocType = '見積書' | '発注書' | '納品書' | '請求書' | '検収書' | '契約書' | 'マニフェスト' | '廃棄証明' | '点検報告書' | '修理報告書' | 'その他';

interface DocumentRecord {
  documentId: string;
  type: DocType;
  documentNumber: string;
  registeredAt: string;
  registeredBy: string;
  relatedAssetId?: string;
  relatedAssetName?: string;
  relatedApplicationId?: string;
  vendor?: string;
  amount?: number;
  fileFormat: 'PDF' | 'PNG' | 'JPG';
  fileSize: string;
  ocrExtracted: boolean;
}

const MOCK_DOCS: DocumentRecord[] = [
  { documentId: 'DOC-2026-00231', type: '見積書', documentNumber: 'EST-2026-00231', registeredAt: '2026-04-08', registeredBy: '田中 花子', relatedApplicationId: 'APP-2026-PR-0084', vendor: '株式会社ライフライン医療', amount: 12_600_000, fileFormat: 'PDF', fileSize: '420KB', ocrExtracted: true },
  { documentId: 'DOC-2026-00232', type: '発注書', documentNumber: 'PO-2026-00132', registeredAt: '2026-03-15', registeredBy: '高橋 健二', relatedAssetId: 'AST-10024', relatedAssetName: '生体情報モニタ BSM-3500', vendor: '〇〇医療機器株式会社', amount: 4_280_000, fileFormat: 'PDF', fileSize: '180KB', ocrExtracted: false },
  { documentId: 'DOC-2026-00233', type: '納品書', documentNumber: 'DN-2026-00132', registeredAt: '2026-03-22', registeredBy: '倉庫 三郎', relatedAssetId: 'AST-10024', relatedAssetName: '生体情報モニタ BSM-3500', vendor: '〇〇医療機器株式会社', fileFormat: 'PDF', fileSize: '156KB', ocrExtracted: true },
  { documentId: 'DOC-2026-00234', type: '請求書', documentNumber: 'IV-2026-00098', registeredAt: '2026-03-25', registeredBy: '高橋 健二', relatedAssetId: 'AST-10024', vendor: '〇〇医療機器株式会社', amount: 4_280_000, fileFormat: 'PDF', fileSize: '210KB', ocrExtracted: true },
  { documentId: 'DOC-2026-00235', type: '検収書', documentNumber: 'RC-2026-00099', registeredAt: '2026-03-23', registeredBy: '田中 花子', relatedAssetId: 'AST-10024', vendor: '〇〇医療機器株式会社', fileFormat: 'PDF', fileSize: '186KB', ocrExtracted: false },
  { documentId: 'DOC-2026-00236', type: 'マニフェスト', documentNumber: 'MF-2026-00078', registeredAt: '2026-03-02', registeredBy: '高橋 健二', relatedApplicationId: 'APP-2026-DP-0019', vendor: '産業廃棄物処理 ◇◇興業', fileFormat: 'PDF', fileSize: '320KB', ocrExtracted: false },
  { documentId: 'DOC-2026-00237', type: '廃棄証明', documentNumber: 'CR-2026-00078', registeredAt: '2026-03-05', registeredBy: '高橋 健二', relatedApplicationId: 'APP-2026-DP-0019', vendor: '産業廃棄物処理 ◇◇興業', fileFormat: 'PDF', fileSize: '128KB', ocrExtracted: true },
  { documentId: 'DOC-2026-00238', type: '点検報告書', documentNumber: 'IR-2026-00342', registeredAt: '2026-04-15', registeredBy: '田中 花子', relatedAssetId: 'AST-10024', relatedAssetName: '生体情報モニタ BSM-3500', fileFormat: 'PDF', fileSize: '480KB', ocrExtracted: false },
  { documentId: 'DOC-2026-00239', type: '修理報告書', documentNumber: 'RR-2026-00112', registeredAt: '2026-05-08', registeredBy: 'SHIPメンテ', relatedAssetId: 'AST-10024', vendor: 'SHIPメンテ', amount: 28_000, fileFormat: 'PDF', fileSize: '290KB', ocrExtracted: true },
  { documentId: 'DOC-2026-00240', type: '契約書', documentNumber: 'CT-2026-00012', registeredAt: '2026-04-01', registeredBy: '佐藤 美智子', vendor: 'SHIPメンテ', amount: 10_200_000, fileFormat: 'PDF', fileSize: '1.2MB', ocrExtracted: false },
];

const TYPE_OPTIONS: DocType[] = ['見積書', '発注書', '納品書', '請求書', '検収書', '契約書', 'マニフェスト', '廃棄証明', '点検報告書', '修理報告書', 'その他'];

const TYPE_STYLE: Record<DocType, string> = {
  見積書: 'bg-violet-50 text-violet-700 border-violet-200',
  発注書: 'bg-sky-50 text-sky-700 border-sky-200',
  納品書: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  請求書: 'bg-amber-50 text-amber-700 border-amber-200',
  検収書: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  契約書: 'bg-rose-50 text-rose-700 border-rose-200',
  マニフェスト: 'bg-stone-100 text-stone-700 border-stone-200',
  廃棄証明: 'bg-stone-100 text-stone-700 border-stone-200',
  点検報告書: 'bg-sky-50 text-sky-700 border-sky-200',
  修理報告書: 'bg-amber-50 text-amber-700 border-amber-200',
  その他: 'bg-white text-content-sub border-stroke-card',
};

export default function DocumentsSearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocType>('all');
  const [ocrOnly, setOcrOnly] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return MOCK_DOCS.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (ocrOnly && !d.ocrExtracted) return false;
      if (kw) {
        const hay = `${d.documentId} ${d.documentNumber} ${d.relatedAssetName ?? ''} ${d.vendor ?? ''} ${d.registeredBy}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [keyword, typeFilter, ocrOnly]);

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleExport = (fmt: 'csv' | 'xlsx') => {
    if (filtered.length === 0) return;
    const name = 'ドキュメント一覧';
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
            <span>❻ ドキュメント検索</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <FolderSearch className="w-6 h-6 text-emerald-600" aria-hidden />
            ❻ ドキュメント検索・閲覧・出力（自施設）
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty">
            登録済みのドキュメント（見積書/発注書/納品書/請求書/検収書/契約書/マニフェスト/廃棄証明/点検報告書/修理報告書）を検索。OCR取込内容も検索対象。
          </p>
        </div>

        {/* フィルタ */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub" aria-hidden />
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="ドキュメントNo / 業者 / 関連資産で検索"
              className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | DocType)} className="h-10 px-3 text-sm border border-stroke-input rounded-lg bg-white">
            <option value="all">種別: すべて</option>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-content-primary cursor-pointer">
            <input type="checkbox" checked={ocrOnly} onChange={(e) => setOcrOnly(e.target.checked)} className="accent-cta-primary" />
            OCR取込済のみ
          </label>
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
          <span className="font-semibold tabular-nums text-content-primary">{filtered.length}</span> 件 / 全 <span className="tabular-nums">{MOCK_DOCS.length}</span> 件
        </p>

        <div className="bg-white border border-stroke-card rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-screen text-xs font-semibold text-content-sub border-b border-stroke-card">
                <th className="px-3 py-2 text-left">ドキュメントID</th>
                <th className="px-3 py-2 text-left w-[110px]">種別</th>
                <th className="px-3 py-2 text-left">書類No</th>
                <th className="px-3 py-2 text-left">登録日</th>
                <th className="px-3 py-2 text-left">関連資産 / 申請</th>
                <th className="px-3 py-2 text-left">業者</th>
                <th className="px-3 py-2 text-right">金額</th>
                <th className="px-3 py-2 text-left w-[80px]">形式</th>
                <th className="px-3 py-2 text-center w-[60px]">OCR</th>
                <th className="px-3 py-2 text-left w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.documentId} className="border-b border-stroke-card hover:bg-surface-screen">
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{d.documentId}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${TYPE_STYLE[d.type]}`}>{d.type}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">{d.documentNumber}</td>
                  <td className="px-3 py-2.5 tabular-nums text-xs">{d.registeredAt}</td>
                  <td className="px-3 py-2.5 text-xs">
                    {d.relatedAssetName && <div>{d.relatedAssetName}</div>}
                    {d.relatedAssetId && <div className="text-content-sub font-mono">{d.relatedAssetId}</div>}
                    {d.relatedApplicationId && <div className="text-content-sub font-mono">{d.relatedApplicationId}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-xs">{d.vendor ?? '—'}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                    {d.amount ? `¥${d.amount.toLocaleString('ja-JP')}` : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-xs">
                      {d.fileFormat === 'PDF' ? <FileType className="w-3 h-3" aria-hidden /> : <Image className="w-3 h-3" aria-hidden />}
                      <span className="font-mono">{d.fileFormat}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {d.ocrExtracted ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-emerald-100 text-emerald-700">済</span>
                    ) : (
                      <span className="text-xs text-content-sub">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <button type="button" className="inline-flex items-center gap-1 text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0">
                      <Download className="w-3 h-3" aria-hidden /> DL
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
