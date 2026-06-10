'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  FileText,
  Files,
  Layers,
  ScrollText,
  Inbox,
  FolderSearch,
  Search,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';

interface SearchCategory {
  id: string;
  number: string;
  title: string;
  description: string;
  examples: string[];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exportFormats: string[];
}

const CATEGORIES: SearchCategory[] = [
  {
    id: 'single',
    number: '❶',
    title: '単一レコード検索（資産1台に対して1レコード）',
    description: '資産1台に対して情報が1つだけ存在するデータの検索・出力',
    examples: ['現有情報（原本情報）', '廃棄情報（除却時用）'],
    href: '/performance-search/single',
    icon: FileText,
    exportFormats: ['CSV', 'Excel'],
  },
  {
    id: 'multi',
    number: '❷',
    title: '複数レコード検索（資産1台に対して複数レコード）',
    description: '資産1台に対して時系列で複数記録されるデータの検索・出力',
    examples: ['修理履歴', 'メーカー点検履歴', '院内点検履歴', '貸出実績'],
    href: '/performance-search/multi',
    icon: Files,
    exportFormats: ['CSV', 'Excel'],
  },
  {
    id: 'group',
    number: '❸',
    title: 'グループ単位検索（業務単位の集約データ）',
    description: '業務遂行のために資産をグループ化した単位での検索・出力',
    examples: ['見積グループ', '契約グループ', '点検グループ', '貸出グループ'],
    href: '/performance-search/group',
    icon: Layers,
    exportFormats: ['CSV', 'Excel'],
  },
  {
    id: 'quotation',
    number: '❹',
    title: '取得見積データの閲覧・出力',
    description: '参考見積・あいみつを含む取得見積データを閲覧・検索・出力',
    examples: ['フェーズ別検索', '業者別検索', '金額範囲検索'],
    href: '/quotation-list',
    icon: ScrollText,
    exportFormats: ['CSV', 'Excel'],
  },
  {
    id: 'applications-pending',
    number: '❺',
    title: '未執行の申請一覧',
    description: '承認待ち / 差戻し / 取下げ等の未執行状態にある申請を一覧表示',
    examples: ['購入申請（承認待ち）', '廃棄申請（差戻し）', '移動申請（取下げ）'],
    href: '/performance-search/applications-pending',
    icon: Inbox,
    exportFormats: ['CSV', 'Excel'],
  },
  {
    id: 'documents',
    number: '❻',
    title: 'ドキュメント検索・閲覧・出力（自施設）',
    description: '登録済みの各種ドキュメント（請求書/納品書/見積書/検収書/契約書等）を検索',
    examples: ['書類種別検索', 'OCR取込内容検索', '関連資産検索'],
    href: '/performance-search/documents',
    icon: FolderSearch,
    exportFormats: ['CSV', 'Excel', 'PDF'],
  },
];

const UNCOVERED_AREAS = [
  { label: '年度毎の資産額推移', reason: '別途集計が必要' },
  { label: '契約の年度比較', reason: '別途集計が必要' },
];

export default function PerformanceSearchPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1200px] w-full mx-auto">
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
            <span>実績データ 検索・出力</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Search className="w-6 h-6 text-emerald-600" aria-hidden />
            実績データ 検索・閲覧・出力
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            Ph1 で蓄積したデータを「単一/複数/グループ」の3軸 + 取得見積 + 未執行申請 + ドキュメント で検索・出力します。
            基本 CSV 出力に加え、テンプレート出力（RAG 対応）にも対応予定。
          </p>
        </div>

        {/* カテゴリカード */}
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 mb-6">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(c.href)}
                className="text-left bg-white border border-stroke-card rounded-lg p-5 hover:border-cta-primary hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="inline-flex items-center justify-center size-10 rounded-md bg-emerald-50 text-emerald-700">
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-emerald-700">{c.number}</span>
                      <h3 className="text-sm font-semibold text-content-primary text-balance">
                        {c.title}
                      </h3>
                    </div>
                    <p className="text-xs text-content-sub text-pretty">{c.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-content-sub shrink-0" aria-hidden />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2 pl-13 ml-13">
                  {c.examples.map((ex) => (
                    <span
                      key={ex}
                      className="inline-flex items-center px-2 py-0.5 text-xs rounded border bg-stone-50 text-content-sub border-stone-200"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-content-sub">
                  <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden />
                  出力:
                  {c.exportFormats.map((f) => (
                    <span key={f} className="font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* 検索しにくい情報の注記 */}
        <section className="bg-amber-50/40 border border-amber-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-content-primary mb-2">
            ※ 上記検索では取得しにくい情報（要別途集計）
          </h2>
          <ul className="space-y-1">
            {UNCOVERED_AREAS.map((u) => (
              <li
                key={u.label}
                className="flex items-center gap-2 text-xs text-content-primary"
              >
                <span className="font-medium">・{u.label}</span>
                <span className="text-content-sub">— {u.reason}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-content-sub mt-2 text-pretty">
            これらは編集・分析リスト / Excel・PowerBI 連携での対応を検討中
          </p>
        </section>
      </main>
    </div>
  );
}
