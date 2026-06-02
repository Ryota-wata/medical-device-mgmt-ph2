'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import { Calculator, AlertCircle, Wand2, RotateCcw, CheckCircle2 } from 'lucide-react';

type AllocationMode = 'quantity' | 'ratio' | 'manual';

interface LineItem {
  id: string;
  /** 親見積（業者見積）の明細名 */
  vendorLineName: string;
  /** 数量 */
  quantity: number;
  /** 業者見積の総額（按分前） */
  vendorAmount: number;
  /** マスタ未収載品 */
  unregistered: boolean;
  /** 仮登録カテゴリ */
  provisionalCategory?: string;
  provisionalLarge?: string;
  provisionalMedium?: string;
  /** 個体 */
  individuals: Individual[];
}

interface Individual {
  id: string;
  /** 製造番号（未登録時は空でも可） */
  serialNo: string;
  /** 個体に割り当てる金額 */
  allocatedAmount: number;
  /** 設置場所（任意） */
  location?: string;
}

const INITIAL_LINES: LineItem[] = [
  {
    id: 'L1',
    vendorLineName: '生体情報モニタ BSM-3500',
    quantity: 4,
    vendorAmount: 4_280_000,
    unregistered: false,
    individuals: [
      { id: 'i1', serialNo: 'SN-2026-A001', allocatedAmount: 1_070_000, location: 'ICU-1' },
      { id: 'i2', serialNo: 'SN-2026-A002', allocatedAmount: 1_070_000, location: 'ICU-2' },
      { id: 'i3', serialNo: 'SN-2026-A003', allocatedAmount: 1_070_000, location: 'CCU-1' },
      { id: 'i4', serialNo: 'SN-2026-A004', allocatedAmount: 1_070_000, location: 'CCU-2' },
    ],
  },
  {
    id: 'L2',
    vendorLineName: '輸液ポンプ TE-SS720',
    quantity: 6,
    vendorAmount: 3_120_000,
    unregistered: false,
    individuals: Array.from({ length: 6 }, (_, i) => ({
      id: `j${i + 1}`,
      serialNo: `SN-2026-B${(100 + i).toString()}`,
      allocatedAmount: 520_000,
      location: '一般病棟',
    })),
  },
  {
    id: 'L3',
    vendorLineName: '高機能呼吸モニタ（新製品・未登録）',
    quantity: 2,
    vendorAmount: 1_640_000,
    unregistered: true,
    provisionalCategory: '生体情報モニタ',
    provisionalLarge: '監視',
    provisionalMedium: 'ベッドサイド',
    individuals: [
      { id: 'k1', serialNo: '', allocatedAmount: 820_000 },
      { id: 'k2', serialNo: '', allocatedAmount: 820_000 },
    ],
  },
];

const MODE_LABEL: Record<AllocationMode, string> = {
  quantity: '数量按分',
  ratio: '金額比率按分',
  manual: '手動入力',
};

export default function Step5AllocationPage() {
  const router = useRouter();
  const [lines, setLines] = useState<LineItem[]>(INITIAL_LINES);
  const [mode, setMode] = useState<AllocationMode>('quantity');

  const updateIndividual = (lineId: string, indId: string, patch: Partial<Individual>) => {
    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? {
              ...l,
              individuals: l.individuals.map((i) =>
                i.id === indId ? { ...i, ...patch } : i,
              ),
            }
          : l,
      ),
    );
  };

  const applyAllocationToLine = (line: LineItem): LineItem => {
    if (mode === 'manual') return line;
    const n = line.individuals.length;
    if (n === 0) return line;
    if (mode === 'quantity') {
      const per = Math.floor(line.vendorAmount / n);
      const rem = line.vendorAmount - per * n;
      return {
        ...line,
        individuals: line.individuals.map((ind, idx) => ({
          ...ind,
          allocatedAmount: per + (idx === 0 ? rem : 0),
        })),
      };
    }
    // ratio: 既存比率を維持しつつ合計を vendorAmount に揃える
    const sumExisting = line.individuals.reduce((s, i) => s + i.allocatedAmount, 0) || 1;
    return {
      ...line,
      individuals: line.individuals.map((ind) => ({
        ...ind,
        allocatedAmount: Math.round((ind.allocatedAmount / sumExisting) * line.vendorAmount),
      })),
    };
  };

  const handleApplyAll = () => {
    setLines((prev) => prev.map(applyAllocationToLine));
  };

  const handleResetLine = (lineId: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const per = Math.floor(l.vendorAmount / l.individuals.length);
        return {
          ...l,
          individuals: l.individuals.map((i, idx) => ({
            ...i,
            allocatedAmount: per + (idx === 0 ? l.vendorAmount - per * l.individuals.length : 0),
          })),
        };
      }),
    );
  };

  const totals = useMemo(
    () =>
      lines.map((l) => {
        const sum = l.individuals.reduce((s, i) => s + i.allocatedAmount, 0);
        const diff = sum - l.vendorAmount;
        return { lineId: l.id, sum, diff };
      }),
    [lines],
  );

  const allValid = totals.every((t) => t.diff === 0);
  const grandSum = totals.reduce((s, t) => s + t.sum, 0);
  const grandTarget = lines.reduce((s, l) => s + l.vendorAmount, 0);

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
            <span>STEP⑤ 個体登録・金額按分</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" aria-hidden />
            STEP⑤ 個体登録・金額按分（再構築）(S15)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            一覧表形式で複数明細を横並び編集 / 按分方式の切替 / マスタ未収載品は中分類までの仮登録に対応。
          </p>
        </div>

        {/* モード切替 + 一括適用 */}
        <div className="bg-white border border-stroke-card rounded-lg p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-content-primary">按分方式:</span>
            <div className="inline-flex items-center gap-1 bg-surface-screen border border-stroke-input rounded-lg p-1">
              {(Object.keys(MODE_LABEL) as AllocationMode[]).map((m) => (
                <label
                  key={m}
                  className={`px-3 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
                    mode === m
                      ? 'bg-cta-primary text-white'
                      : 'bg-transparent text-content-primary hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="alloc-mode"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="sr-only"
                  />
                  {MODE_LABEL[m]}
                </label>
              ))}
            </div>
            <span className="text-xs text-content-sub">
              {mode === 'quantity' && '台数で均等按分'}
              {mode === 'ratio' && '現在の金額比を維持して総額に合わせる'}
              {mode === 'manual' && '手動で個別入力'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={mode === 'manual'}
              className="h-10 px-4 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" aria-hidden />
              全明細に適用
            </button>
          </div>
        </div>

        {/* 明細グループ */}
        <div className="space-y-4">
          {lines.map((line, idx) => {
            const t = totals[idx];
            const diffColor = t.diff === 0 ? 'text-emerald-600' : 'text-rose-600';
            return (
              <section
                key={line.id}
                className="bg-white border border-stroke-card rounded-lg overflow-hidden"
              >
                {/* 明細ヘッダ */}
                <div className="px-4 py-3 border-b border-stroke-card bg-surface-screen flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-content-sub tabular-nums">
                      {line.id}
                    </span>
                    <span className="text-sm font-semibold text-content-primary text-balance">
                      {line.vendorLineName}
                    </span>
                    {line.unregistered && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border bg-amber-50 text-amber-800 border-amber-200">
                        <AlertCircle className="w-3 h-3" aria-hidden />
                        マスタ未収載
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="text-content-sub">業者見積総額: </span>
                      <span className="font-semibold tabular-nums text-content-primary">
                        ¥{line.vendorAmount.toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-sub">按分合計: </span>
                      <span className={`font-semibold tabular-nums ${diffColor}`}>
                        ¥{t.sum.toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <div>
                      <span className="text-content-sub">差額: </span>
                      <span className={`font-semibold tabular-nums ${diffColor}`}>
                        {t.diff === 0 ? '±0' : `${t.diff > 0 ? '+' : ''}¥${t.diff.toLocaleString('ja-JP')}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleResetLine(line.id)}
                      className="inline-flex items-center gap-1 text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
                      aria-label="この明細を均等にリセット"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden />
                      均等リセット
                    </button>
                  </div>
                </div>

                {/* マスタ未収載品の仮登録 */}
                {line.unregistered && (
                  <div className="px-4 py-2 bg-amber-50/40 border-b border-amber-100">
                    <div className="text-xs text-amber-800">
                      <span className="font-semibold">仮登録（中分類まで）:</span>{' '}
                      カテゴリ「{line.provisionalCategory}」 / 大分類「{line.provisionalLarge}」 / 中分類「{line.provisionalMedium}」
                      <span className="ml-2 text-content-sub">
                        ※品目・メーカー・型式はマスタ確定後に登録
                      </span>
                    </div>
                  </div>
                )}

                {/* 個体テーブル */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-content-sub border-b border-stroke-card">
                        <th className="px-3 py-2 text-left w-[140px]">個体ID</th>
                        <th className="px-3 py-2 text-left">製造番号</th>
                        <th className="px-3 py-2 text-left">設置場所</th>
                        <th className="px-3 py-2 text-right w-[180px]">割当金額（円）</th>
                      </tr>
                    </thead>
                    <tbody>
                      {line.individuals.map((ind) => (
                        <tr key={ind.id} className="border-b border-stroke-card last:border-b-0">
                          <td className="px-3 py-2 font-mono text-xs text-content-sub tabular-nums">
                            {ind.id}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={ind.serialNo}
                              onChange={(e) =>
                                updateIndividual(line.id, ind.id, { serialNo: e.target.value })
                              }
                              placeholder={line.unregistered ? '未確定可' : '製造番号'}
                              className="w-full max-w-[200px] h-8 px-2 text-sm border border-stroke-input rounded outline-none focus:border-content-link bg-white font-mono"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={ind.location ?? ''}
                              onChange={(e) =>
                                updateIndividual(line.id, ind.id, { location: e.target.value })
                              }
                              placeholder="設置場所"
                              className="w-full max-w-[200px] h-8 px-2 text-sm border border-stroke-input rounded outline-none focus:border-content-link bg-white"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={ind.allocatedAmount.toLocaleString('ja-JP')}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                updateIndividual(line.id, ind.id, {
                                  allocatedAmount: Number(raw || '0'),
                                });
                              }}
                              disabled={mode !== 'manual'}
                              className="w-[160px] h-8 px-2 text-sm border border-stroke-input rounded outline-none focus:border-content-link bg-white text-right tabular-nums disabled:bg-surface-screen disabled:text-content-sub"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })}
        </div>

        {/* 集計 + 確定 */}
        <div className="mt-5 bg-white border border-stroke-card rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm">
            <span className="text-content-sub">明細合計: </span>
            <span className="font-semibold tabular-nums text-content-primary">
              ¥{grandSum.toLocaleString('ja-JP')}
            </span>
            <span className="text-content-sub mx-1">/</span>
            <span className="text-content-sub">業者見積総額: </span>
            <span className="font-semibold tabular-nums text-content-primary">
              ¥{grandTarget.toLocaleString('ja-JP')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {allValid ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-4 h-4" aria-hidden />
                全明細の按分が一致しています
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4" aria-hidden />
                差額が残っています
              </span>
            )}
            <button
              type="button"
              disabled={!allValid}
              className="h-10 px-5 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              STEP⑤ を確定して次へ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
