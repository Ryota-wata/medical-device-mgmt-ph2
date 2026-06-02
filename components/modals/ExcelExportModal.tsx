'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { X, FileSpreadsheet, Calendar, Filter, ListChecks } from 'lucide-react';

export interface ExcelExportColumn {
  key: string;
  label: string;
  defaultSelected: boolean;
}

export interface ExcelExportContext {
  /** 内部識別子 */
  key: string;
  /** 画面に表示する出力名 */
  title: string;
  /** 説明（電帳法/医療監視ガイドライン準拠 等） */
  description: string;
  /** 期間ラベル（点検計画は「対象期間」、貸出実績は「貸出日範囲」等） */
  periodLabel: string;
  /** 機器カテゴリ等のフィルタ選択肢 */
  categoryOptions: string[];
  /** 出力可能項目 */
  columns: ExcelExportColumn[];
  /** ファイル名のプレフィクス */
  filenamePrefix: string;
  /** プレビュー行データ生成（カテゴリ + 期間 を反映してダミー件数を返す） */
  buildPreview: (params: {
    category: string;
    dateFrom: string;
    dateTo: string;
  }) => { count: number; rows: Record<string, string | number>[] };
}

export interface ExcelExportModalProps {
  open: boolean;
  onClose: () => void;
  context: ExcelExportContext;
}

const inputBase =
  'h-10 px-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white text-content-primary placeholder:text-content-placeholder';

export const ExcelExportModal: React.FC<ExcelExportModalProps> = ({ open, onClose, context }) => {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo] = useState(today);
  const [category, setCategory] = useState<string>('all');
  const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(context.columns.map((c) => [c.key, c.defaultSelected])),
  );
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setSelectedColumns(
      Object.fromEntries(context.columns.map((c) => [c.key, c.defaultSelected])),
    );
    setShowPreview(false);
  }, [context]);

  const preview = useMemo(
    () => context.buildPreview({ category, dateFrom, dateTo }),
    [context, category, dateFrom, dateTo],
  );

  const activeColumnKeys = context.columns
    .filter((c) => selectedColumns[c.key])
    .map((c) => c.key);

  const handleToggleAll = (v: boolean) => {
    setSelectedColumns(Object.fromEntries(context.columns.map((c) => [c.key, v])));
  };

  const handleExport = () => {
    if (activeColumnKeys.length === 0) return;
    const filteredRows = preview.rows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const col of context.columns) {
        if (selectedColumns[col.key]) {
          out[col.label] = row[col.key] ?? '';
        }
      }
      return out;
    });
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, context.title.slice(0, 28));
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${context.filenamePrefix}_${dateFrom}_${dateTo}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-export-title"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダ */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-stroke-card">
          <div className="min-w-0">
            <h2
              id="excel-export-title"
              className="text-lg font-semibold text-content-primary inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" aria-hidden />
              {context.title}
            </h2>
            <p className="mt-1 text-xs text-content-sub text-pretty">
              {context.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 rounded text-content-sub hover:bg-surface-screen border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 本文 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 期間 */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-content-primary mb-1 inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" aria-hidden />
              {context.periodLabel}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={`${inputBase} w-[170px]`}
              />
              <span className="text-sm text-content-sub">〜</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={`${inputBase} w-[170px]`}
              />
            </div>
          </div>

          {/* カテゴリ */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-content-primary mb-1 inline-flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" aria-hidden />
              対象機器カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputBase} w-full max-w-[400px]`}
            >
              <option value="all">すべて</option>
              {context.categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 出力項目 */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-content-primary inline-flex items-center gap-1">
                <ListChecks className="w-3.5 h-3.5" aria-hidden />
                出力項目（{activeColumnKeys.length} / {context.columns.length}）
              </span>
              <div className="text-xs flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAll(true)}
                  className="text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  すべて
                </button>
                <span className="text-content-sub">/</span>
                <button
                  type="button"
                  onClick={() => handleToggleAll(false)}
                  className="text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
                >
                  クリア
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-stroke-card rounded-lg p-3 bg-surface-screen">
              {context.columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedColumns[c.key] ?? false}
                    onChange={(e) =>
                      setSelectedColumns({ ...selectedColumns, [c.key]: e.target.checked })
                    }
                    className="accent-cta-primary"
                  />
                  <span className="text-content-primary">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* プレビュー */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-content-primary">
                プレビュー: <span className="tabular-nums font-semibold">{preview.count}</span> 件を出力
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                {showPreview ? '隠す' : '先頭5件を見る'}
              </button>
            </div>
            {showPreview && (
              <div className="overflow-x-auto border border-stroke-card rounded-lg max-h-[200px]">
                <table className="w-full text-xs">
                  <thead className="bg-surface-screen sticky top-0">
                    <tr>
                      {context.columns
                        .filter((c) => selectedColumns[c.key])
                        .map((c) => (
                          <th
                            key={c.key}
                            className="px-2 py-1.5 text-left font-semibold text-content-sub border-b border-stroke-card whitespace-nowrap"
                          >
                            {c.label}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 5).map((r, idx) => (
                      <tr key={idx} className="border-b border-stroke-card">
                        {context.columns
                          .filter((c) => selectedColumns[c.key])
                          .map((c) => (
                            <td
                              key={c.key}
                              className="px-2 py-1.5 text-content-primary whitespace-nowrap"
                            >
                              {String(r[c.key] ?? '')}
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* フッタ */}
        <div className="px-6 py-4 border-t border-stroke-card flex items-center justify-between gap-3 bg-surface-screen rounded-b-2xl">
          <p className="text-xs text-content-sub">
            出力フォーマット: Excel (.xlsx) — 監査用ガイドライン準拠
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={activeColumnKeys.length === 0 || preview.count === 0}
              className="h-10 px-5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" aria-hidden />
              Excelを出力
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
