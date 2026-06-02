'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  ExcelExportModal,
  type ExcelExportContext,
} from '@/components/modals/ExcelExportModal';
import {
  Archive,
  ClipboardCheck,
  FileSpreadsheet,
  HandHeart,
  Wrench,
} from 'lucide-react';

const CATEGORIES = [
  '生体情報モニタ',
  '人工呼吸器',
  '輸液ポンプ',
  'シリンジポンプ',
  '除細動器',
  '超音波診断装置',
  '電気メス',
];

const seededRows = (
  prefix: string,
  count: number,
  category: string,
  template: (i: number) => Record<string, string | number>,
) => {
  const total = category === 'all' ? count : Math.floor(count * 0.4);
  return Array.from({ length: total }, (_, i) => template(i));
};

const inventoryContext: ExcelExportContext = {
  key: 'inventory',
  title: '棚卸し実績 Excel 出力（事務担当）',
  description:
    '監査用ガイドライン準拠 / 区分1-3・5-6。事務（機器担当）が集約後の棚卸結果を Excel で出力。',
  periodLabel: '棚卸期間',
  filenamePrefix: '棚卸実績',
  categoryOptions: CATEGORIES,
  columns: [
    { key: 'asset_id', label: '資産ID', defaultSelected: true },
    { key: 'category', label: 'カテゴリ', defaultSelected: true },
    { key: 'large', label: '大分類', defaultSelected: true },
    { key: 'medium', label: '中分類', defaultSelected: true },
    { key: 'item', label: '品目', defaultSelected: true },
    { key: 'maker', label: 'メーカー', defaultSelected: true },
    { key: 'model', label: '型式', defaultSelected: true },
    { key: 'serial', label: '製造番号', defaultSelected: true },
    { key: 'location', label: '設置場所', defaultSelected: true },
    { key: 'status', label: '棚卸ステータス', defaultSelected: true },
    { key: 'checked_at', label: '確認日時', defaultSelected: true },
    { key: 'checked_by', label: '確認者', defaultSelected: true },
    { key: 'note', label: '備考', defaultSelected: false },
    { key: 'photo', label: '写真', defaultSelected: false },
  ],
  buildPreview: ({ category, dateFrom, dateTo }) => {
    const rows = seededRows('inv', 1840, category, (i) => ({
      asset_id: `AST-${(10000 + i).toString()}`,
      category: category === 'all' ? CATEGORIES[i % CATEGORIES.length] : category,
      large: ['監視', '呼吸', '注入', '生体'][i % 4],
      medium: ['ベッドサイド', 'ポータブル', '据置'][i % 3],
      item: ['BSM-3500', 'TE-SS720', 'SV-300', 'LISENDO 880'][i % 4],
      maker: ['日本光電', 'テルモ', 'マッケ', '日立'][i % 4],
      model: `MDL-${100 + (i % 30)}`,
      serial: `SN${(202600 + i).toString()}`,
      location: ['ICU', '手術室', '一般病棟', '内視鏡室'][i % 4],
      status: ['確認済', '未確認', '所在不明'][i % 3] ?? '確認済',
      checked_at: dateFrom,
      checked_by: ['佐藤 美智子', '高橋 健二', '田中 花子'][i % 3],
      note: '',
      photo: '添付済',
    }));
    return { count: rows.length, rows };
  },
};

const inspectionPlanContext: ExcelExportContext = {
  key: 'inspection-plan',
  title: '点検計画表 Excel 出力',
  description:
    '医療法ガイドライン準拠 / 区分3-1。点検管理タブから次期点検計画を一括出力。',
  periodLabel: '対象期間',
  filenamePrefix: '点検計画表',
  categoryOptions: CATEGORIES,
  columns: [
    { key: 'asset_id', label: '資産ID', defaultSelected: true },
    { key: 'asset_name', label: '機器名', defaultSelected: true },
    { key: 'maker', label: 'メーカー', defaultSelected: true },
    { key: 'model', label: '型式', defaultSelected: true },
    { key: 'serial', label: '製造番号', defaultSelected: true },
    { key: 'location', label: '設置場所', defaultSelected: true },
    { key: 'inspection_type', label: '点検種別', defaultSelected: true },
    { key: 'next_date', label: '次回点検予定日', defaultSelected: true },
    { key: 'last_date', label: '前回点検日', defaultSelected: true },
    { key: 'inspector', label: '担当', defaultSelected: true },
    { key: 'contract', label: '保守契約', defaultSelected: true },
    { key: 'criticality', label: '生命維持装置', defaultSelected: false },
  ],
  buildPreview: ({ category }) => {
    const rows = seededRows('insp', 412, category, (i) => ({
      asset_id: `AST-${(20000 + i).toString()}`,
      asset_name: ['生体情報モニタ', '輸液ポンプ', '人工呼吸器'][i % 3],
      maker: ['日本光電', 'テルモ', 'マッケ'][i % 3],
      model: `MDL-${200 + (i % 20)}`,
      serial: `SN${(202600 + i).toString()}`,
      location: ['ICU', '手術室', '一般病棟'][i % 3],
      inspection_type: ['始業前', '定期', '日常'][i % 3],
      next_date: `2026-06-${(1 + (i % 28)).toString().padStart(2, '0')}`,
      last_date: `2026-03-${(1 + (i % 28)).toString().padStart(2, '0')}`,
      inspector: ['田中 花子', '高橋 健二'][i % 2],
      contract: ['契約あり', '契約なし'][i % 2],
      criticality: i % 5 === 0 ? '〇' : '',
    }));
    return { count: rows.length, rows };
  },
};

const lendingContext: ExcelExportContext = {
  key: 'lending',
  title: '貸出実績 Excel 出力',
  description: '監査用 / 区分3-2。貸出管理タブから貸出ログを Excel で出力。',
  periodLabel: '貸出日範囲',
  filenamePrefix: '貸出実績',
  categoryOptions: CATEGORIES,
  columns: [
    { key: 'lend_id', label: '貸出ID', defaultSelected: true },
    { key: 'asset_id', label: '資産ID', defaultSelected: true },
    { key: 'asset_name', label: '機器名', defaultSelected: true },
    { key: 'lend_at', label: '貸出日時', defaultSelected: true },
    { key: 'return_at', label: '返却日時', defaultSelected: true },
    { key: 'dept', label: '貸出先部署', defaultSelected: true },
    { key: 'requester', label: '依頼者', defaultSelected: true },
    { key: 'handler', label: '貸出担当', defaultSelected: true },
    { key: 'status', label: '状態', defaultSelected: true },
    { key: 'note', label: '備考', defaultSelected: false },
  ],
  buildPreview: ({ category, dateFrom, dateTo }) => {
    const rows = seededRows('lnd', 258, category, (i) => ({
      lend_id: `LND-2026-${(1000 + i).toString()}`,
      asset_id: `AST-${(30000 + i).toString()}`,
      asset_name: ['輸液ポンプ', 'シリンジポンプ', '生体情報モニタ'][i % 3],
      lend_at: dateFrom,
      return_at: dateTo,
      dept: ['ICU', '内視鏡室', '手術室', '一般病棟'][i % 4],
      requester: ['伊藤 三郎', '渡辺 京子'][i % 2],
      handler: ['倉庫 三郎', '高橋 健二'][i % 2],
      status: ['返却済', '貸出中'][i % 2],
      note: '',
    }));
    return { count: rows.length, rows };
  },
};

const repairInspectionResultContext: ExcelExportContext = {
  key: 'repair-inspection-result',
  title: '修理・点検実績 Excel 出力',
  description: '監査用 / 区分3-3。修理管理 + 点検管理 の実績を Excel で出力。',
  periodLabel: '実施日範囲',
  filenamePrefix: '修理点検実績',
  categoryOptions: CATEGORIES,
  columns: [
    { key: 'work_id', label: '作業ID', defaultSelected: true },
    { key: 'kind', label: '区分', defaultSelected: true },
    { key: 'asset_id', label: '資産ID', defaultSelected: true },
    { key: 'asset_name', label: '機器名', defaultSelected: true },
    { key: 'performed_at', label: '実施日', defaultSelected: true },
    { key: 'duration', label: '所要時間', defaultSelected: true },
    { key: 'result', label: '結果', defaultSelected: true },
    { key: 'engineer', label: '実施者', defaultSelected: true },
    { key: 'parts', label: '部品交換', defaultSelected: true },
    { key: 'cost', label: '費用', defaultSelected: false },
    { key: 'next_action', label: '次回アクション', defaultSelected: false },
  ],
  buildPreview: ({ category }) => {
    const rows = seededRows('rpi', 312, category, (i) => ({
      work_id: `WRK-2026-${(2000 + i).toString()}`,
      kind: ['修理', '定期点検', '始業前点検'][i % 3],
      asset_id: `AST-${(40000 + i).toString()}`,
      asset_name: ['人工呼吸器', '生体情報モニタ', '輸液ポンプ'][i % 3],
      performed_at: `2026-04-${(1 + (i % 28)).toString().padStart(2, '0')}`,
      duration: `${30 + (i % 60)}分`,
      result: ['正常', '要観察', '部品交換'][i % 3] ?? '正常',
      engineer: ['田中 花子', '点検 モバイル'][i % 2],
      parts: i % 3 === 0 ? 'バッテリー交換' : '—',
      cost: i % 3 === 0 ? 28000 + i * 100 : 0,
      next_action: '',
    }));
    return { count: rows.length, rows };
  },
};

const CONTEXTS: { ctx: ExcelExportContext; icon: React.ComponentType<{ className?: string }>; tagline: string }[] = [
  {
    ctx: inventoryContext,
    icon: Archive,
    tagline: '区分1-3 / 5-6 — 棚卸し（事務）画面',
  },
  {
    ctx: inspectionPlanContext,
    icon: ClipboardCheck,
    tagline: '区分3-1 — 点検計画表（医療法準拠）',
  },
  {
    ctx: lendingContext,
    icon: HandHeart,
    tagline: '区分3-2 — 貸出管理タブ',
  },
  {
    ctx: repairInspectionResultContext,
    icon: Wrench,
    tagline: '区分3-3 — 修理管理 + 点検管理',
  },
];

export default function ExcelExportsPage() {
  const router = useRouter();
  const [openCtx, setOpenCtx] = useState<ExcelExportContext | null>(null);

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1200px] w-full mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button
              type="button"
              onClick={() => router.push('/ph2')}
              className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
            >
              Ph2 提案機能
            </button>
            <span>/</span>
            <span>Excel 出力センター</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" aria-hidden />
            監査用 Excel 出力センター (S6 / S7 / S8 / S9)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-2xl">
            棚卸し / 点検計画 / 貸出実績 / 修理点検実績 の 4 種を共通モーダルで出力。
            実画面では各タブの「Excel出力」ボタンから起動します。
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {CONTEXTS.map(({ ctx, icon: Icon, tagline }) => (
            <section
              key={ctx.key}
              className="bg-white border border-stroke-card rounded-lg p-5"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="inline-flex items-center justify-center size-10 rounded-md bg-emerald-50 text-emerald-700">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-content-primary text-balance">
                    {ctx.title}
                  </h2>
                  <p className="text-xs text-content-sub mt-0.5">{tagline}</p>
                </div>
              </div>
              <p className="text-xs text-content-sub mb-4 text-pretty">{ctx.description}</p>
              <button
                type="button"
                onClick={() => setOpenCtx(ctx)}
                className="h-10 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" aria-hidden />
                Excel 出力モーダルを開く
              </button>
            </section>
          ))}
        </div>
      </main>

      <ExcelExportModal
        open={openCtx !== null}
        onClose={() => setOpenCtx(null)}
        context={openCtx ?? CONTEXTS[0].ctx}
      />
    </div>
  );
}
