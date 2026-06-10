'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import { useAuthStore } from '@/lib/stores';
import { getUserType } from '@/lib/types/user';
import {
  BarChart3,
  FileSpreadsheet,
  ListChecks,
  Calculator,
  Box,
  ClipboardCheck,
  Building2,
  Users,
  ScrollText,
  Archive,
  Stethoscope,
  Send,
} from 'lucide-react';

interface FeatureItem {
  category: string;
  code: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  persona: 'hospital' | 'ship' | 'both';
  size: '大' | '中' | '小';
}

const FEATURES: FeatureItem[] = [
  // 区分2 ダッシュボード
  {
    category: '区分2 ダッシュボード',
    code: 'S1',
    title: '病院職員用ダッシュボード',
    description: '自施設の点検超過 / 修理進行 / 棚卸進捗 / 申請承認待ち / お知らせ を集約',
    href: '/dashboard-hospital',
    icon: BarChart3,
    persona: 'hospital',
    size: '大',
  },
  // 区分1 全Data
  {
    category: '区分1 全Data（電帳法対応）',
    code: 'S3/S4',
    title: '電帳法対応 申請一覧（購入・廃棄）',
    description: '訂正・削除履歴 / 業務処理期間経過後の入力 / 帳簿関連性 + 高度検索ペイン',
    href: '/ledger-applications',
    icon: ScrollText,
    persona: 'both',
    size: '大',
  },
  {
    category: '区分1 全Data',
    code: 'S5',
    title: '取得見積一覧',
    description: 'フェーズ別 / 日付 / 業者 / 品目 で検索 + Excel出力 + 全施設・自施設切替',
    href: '/quotation-list',
    icon: FileSpreadsheet,
    persona: 'both',
    size: '大',
  },
  // 区分3 医療監視出力
  {
    category: '区分3 医療監視Excel出力',
    code: 'S6-S9',
    title: 'Excel出力センター（棚卸 / 点検計画 / 貸出実績 / 修理点検実績）',
    description: '4種の監査用Excel出力を統合。期間指定 / カテゴリ絞込 / 出力項目選択',
    href: '/ph2-excel-exports',
    icon: FileSpreadsheet,
    persona: 'both',
    size: '中',
  },
  // 区分5 積み残し
  {
    category: '区分5 積み残し',
    code: 'S13',
    title: '資産マスタ カラム設定',
    description: 'カラム動的追加削除 + DataLink制限 + SHIPのみ編集可フラグ + テンプレート',
    href: '/ph2-asset-master-columns',
    icon: ListChecks,
    persona: 'ship',
    size: '中',
  },
  {
    category: '区分5 積み残し',
    code: 'S14',
    title: 'リモデル管理 + クローズ確認',
    description: '新個別部署マスタを既存マスタに昇格させるクローズフロー + バリデーション',
    href: '/ph2-remodel-close',
    icon: Building2,
    persona: 'both',
    size: '中',
  },
  {
    category: '区分5 積み残し',
    code: 'S15',
    title: 'STEP⑤ 個体登録・金額按分（再構築）',
    description: '一覧表形式横並び編集 + 数量按分 / 金額比率 / 手動 の切替式',
    href: '/ph2-step5-allocation',
    icon: Calculator,
    persona: 'both',
    size: '大',
  },
  {
    category: '区分5 積み残し',
    code: 'S16',
    title: '貸出時 部署選択ピッカー（最適化）',
    description: 'お気に入り / 最頻使用順 / 検索 / 直近選択順',
    href: '/ph2-borrowing-dept-picker',
    icon: Users,
    persona: 'hospital',
    size: '小',
  },
  {
    category: '区分5 積み残し',
    code: 'S17',
    title: '棚卸 4段階運用',
    description: '依頼中 / 実施中 / 集約中 / 除却中 / 完了 の状態遷移と権限制御',
    href: '/ph2-inventory-4step',
    icon: Archive,
    persona: 'hospital',
    size: '中',
  },
  {
    category: '区分5 積み残し',
    code: 'S18',
    title: '点検管理タブ 日常点検併載',
    description: '点検種別フィルタに日常点検 + 列追加 + メニュー変更 / 登録解除',
    href: '/ph2-inspection-daily',
    icon: Stethoscope,
    persona: 'hospital',
    size: '中',
  },
  {
    category: '区分2/認証 共有アカウント',
    code: 'S19',
    title: '代理見積登録 専用画面',
    description: '各病院から飛んできた見積依頼キュー + STEP1-6 実行（共有アカウント専用）',
    href: '/proxy-quotation',
    icon: Send,
    persona: 'ship',
    size: '中',
  },
  // 認証
  {
    category: '認証 / 共通',
    code: 'S20',
    title: 'Microsoft SSO 風ログイン + ペルソナバッジ',
    description: 'メールドメインで 病院 / SHIP 自動判別、ヘッダにペルソナ表示',
    href: '/login',
    icon: Box,
    persona: 'both',
    size: '中',
  },
];

const CATEGORY_ORDER = [
  '区分2 ダッシュボード',
  '区分1 全Data（電帳法対応）',
  '区分1 全Data',
  '区分3 医療監視Excel出力',
  '区分5 積み残し',
  '区分2/認証 共有アカウント',
  '認証 / 共通',
];

const SIZE_COLOR: Record<'大' | '中' | '小', string> = {
  大: 'bg-rose-50 text-rose-700 border-rose-200',
  中: 'bg-amber-50 text-amber-700 border-amber-200',
  小: 'bg-stone-100 text-stone-600 border-stone-200',
};

export default function Ph2IndexPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const persona = user?.email ? getUserType(user.email) : null;

  // ペルソナでフィルタ（未ログインは全件）
  const visible = persona
    ? FEATURES.filter((f) => f.persona === 'both' || f.persona === persona)
    : FEATURES;

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: visible.filter((f) => f.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button
              type="button"
              onClick={() => router.push('/main')}
              className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
            >
              メイン
            </button>
            <span>/</span>
            <span>Ph2 提案機能</span>
          </div>
          <h1 className="text-[28px] font-bold text-content-primary text-balance">
            Ph2 提案機能 一覧
          </h1>
          <p className="mt-2 text-sm text-content-sub text-pretty max-w-2xl">
            Ph1 で取得・管理したデータを「どう出力・どう表示するか」を起点に組み立てた Ph2 提案画面群です。
            {persona && (
              <>
                <br />
                <span className="font-medium">
                  {persona === 'ship' ? 'SHIP コンサル向け' : '病院職員向け'}
                </span>
                {' '}
                の機能を表示しています。
              </>
            )}
          </p>
        </div>

        {grouped.map((g) => (
          <section key={g.category} className="mb-8">
            <h2 className="text-base font-semibold text-content-primary mb-3">
              {g.category}
            </h2>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => router.push(item.href)}
                    className="text-left bg-white border border-stroke-card rounded-lg p-4 hover:border-cta-primary hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center size-8 rounded-md bg-emerald-50 text-emerald-700">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-mono text-content-sub tabular-nums">
                          {item.code}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border ${SIZE_COLOR[item.size]}`}
                      >
                        規模 {item.size}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-content-primary mb-1 text-balance">
                      {item.title}
                    </h3>
                    <p className="text-xs text-content-sub text-pretty leading-relaxed">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
