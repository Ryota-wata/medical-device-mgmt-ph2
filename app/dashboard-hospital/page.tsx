'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  DashboardCard,
  SimpleBarChart,
  HorizontalBar,
} from '@/components/dashboard/DashboardCard';
import { useAuthStore } from '@/lib/stores';
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  Hammer,
  PackageSearch,
  Wrench,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from 'lucide-react';

// ─── モックデータ（自施設集計の想定） ───────────────────────────────
const KPI = {
  inspectionOverdue: 12,
  repairInProgress: 5,
  inventoryProgress: 67, // %
  inventoryCounted: 1234,
  inventoryTotal: 1840,
  remodelInProgress: 2,
  applicationPending: 8,
  notice: 3,
};

const MONTHLY_INSPECTIONS = [
  { label: '12月', value: 142 },
  { label: '1月', value: 158 },
  { label: '2月', value: 124 },
  { label: '3月', value: 186 },
  { label: '4月', value: 201 },
  { label: '5月', value: 167 },
];

const COVERAGE_BY_CATEGORY = [
  { label: '生体情報モニタ', covered: 38, total: 42 },
  { label: '人工呼吸器', covered: 18, total: 18 },
  { label: '輸液ポンプ', covered: 124, total: 165 },
  { label: 'シリンジポンプ', covered: 72, total: 88 },
  { label: '除細動器', covered: 12, total: 14 },
  { label: '超音波診断装置', covered: 6, total: 8 },
];

interface Recommendation {
  id: string;
  label: string;
  detail: string;
  severity: 'alert' | 'warn' | 'info';
  href?: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1',
    label: '今日点検期限の機器が 3 件あります',
    detail: '生体情報モニタ BSM-3500 ほか',
    severity: 'alert',
    href: '/asset-search-result',
  },
  {
    id: 'r2',
    label: '修理進行中の機器について業者から見積到着',
    detail: '人工呼吸器 SV-300 (1件)',
    severity: 'warn',
    href: '/quotation-data-box/repair-requests',
  },
  {
    id: 'r3',
    label: 'リモデル管理: 新部署マスタへの移設完了が近づいています',
    detail: '東棟 3F リモデル: 残 12 台',
    severity: 'info',
    href: '/ph2-remodel-close',
  },
  {
    id: 'r4',
    label: '棚卸し: 集約フェーズに進行可能',
    detail: '実施中 → 集約中 へ移行できる施設が 1 件',
    severity: 'info',
    href: '/ph2-inventory-4step',
  },
];

const PENDING_APPROVALS = [
  { id: 'LA-2026-0004', type: '購入', amount: 12_600_000, vendor: '株式会社ライフライン医療', applicant: '田中 花子', daysWaiting: 3 },
  { id: 'LA-2026-0007', type: '購入', amount: 880_000, vendor: '株式会社メディコサプライ', applicant: '高橋 健二', daysWaiting: 1 },
  { id: 'TR-2026-0021', type: '移動', amount: 0, vendor: '—', applicant: '伊藤 三郎', daysWaiting: 5 },
];

const SEV_STYLE = {
  alert: 'bg-rose-50 border-rose-200 text-rose-700',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-sky-50 border-sky-200 text-sky-800',
} as const;

export default function DashboardHospitalPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const facility = user?.hospital ?? '東京中央病院';

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        {/* タイトル */}
        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
              <button
                type="button"
                onClick={() => router.push('/ph2')}
                className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0"
              >
                Ph2 提案機能
              </button>
              <span>/</span>
              <span>病院職員ダッシュボード</span>
            </div>
            <h1 className="text-[24px] font-bold text-content-primary text-balance">
              病院職員ダッシュボード
            </h1>
            <p className="mt-1 text-sm text-content-sub text-pretty">
              対象施設: <span className="font-semibold text-content-primary">{facility}</span> ／ 本日 2026-05-23
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/asset-search-result')}
            className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
          >
            資産リストへ
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <DashboardCard
            label="点検超過機器"
            value={KPI.inspectionOverdue}
            unit="台"
            severity="alert"
            hint="うち緊急 3 台"
            icon={<AlertTriangle className="w-4 h-4" />}
            onClick={() => router.push('/asset-search-result')}
          />
          <DashboardCard
            label="修理進行中"
            value={KPI.repairInProgress}
            unit="件"
            severity="warn"
            hint="見積待ち 2 件"
            icon={<Wrench className="w-4 h-4" />}
            onClick={() => router.push('/quotation-data-box/repair-requests')}
          />
          <DashboardCard
            label="棚卸進捗"
            value={`${KPI.inventoryProgress}%`}
            severity="normal"
            hint={`${KPI.inventoryCounted.toLocaleString()} / ${KPI.inventoryTotal.toLocaleString()} 台`}
            icon={<PackageSearch className="w-4 h-4" />}
            onClick={() => router.push('/inventory')}
          />
          <DashboardCard
            label="リモデル進行中"
            value={KPI.remodelInProgress}
            unit="件"
            severity="normal"
            hint="東棟3F / 西棟ICU"
            icon={<Hammer className="w-4 h-4" />}
            onClick={() => router.push('/ph2-remodel-close')}
          />
          <DashboardCard
            label="申請承認待ち"
            value={KPI.applicationPending}
            unit="件"
            severity="warn"
            hint="3日以上経過 1 件"
            icon={<ClipboardList className="w-4 h-4" />}
            onClick={() => router.push('/ledger-applications')}
          />
          <DashboardCard
            label="お知らせ"
            value={KPI.notice}
            unit="件"
            severity="normal"
            hint="新着 1 件"
            icon={<Bell className="w-4 h-4" />}
          />
        </div>

        {/* 2列レイアウト: チャート + レコメンド */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
          {/* 左: 月別点検実施数推移 */}
          <section className="lg:col-span-2 bg-white border border-stroke-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-content-primary">
                月別 点検実施数 推移
              </h2>
              <span className="text-xs text-content-sub">直近 6 ヶ月</span>
            </div>
            <SimpleBarChart data={MONTHLY_INSPECTIONS} unit="件" highlightIndex={5} />
          </section>

          {/* 右: レコメンド */}
          <section className="bg-white border border-stroke-card rounded-lg p-5">
            <h2 className="text-base font-semibold text-content-primary mb-3">
              本日のおすすめアクション
            </h2>
            <ul className="space-y-2">
              {RECOMMENDATIONS.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => r.href && router.push(r.href)}
                    className={`w-full text-left border rounded-md px-3 py-2 ${SEV_STYLE[r.severity]} hover:opacity-90 transition-opacity cursor-pointer`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-pretty">{r.label}</p>
                        <p className="text-[11px] mt-0.5 text-pretty opacity-90">{r.detail}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 2列レイアウト: カバレッジ + 承認待ち申請 */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* 機器カテゴリ別 保守契約カバレッジ */}
          <section className="bg-white border border-stroke-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-content-primary text-balance">
                機器カテゴリ別 保守契約カバレッジ
              </h2>
              <span className="inline-flex items-center gap-1 text-xs text-content-sub">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
                良好
              </span>
            </div>
            <div className="space-y-2.5">
              {COVERAGE_BY_CATEGORY.map((c) => {
                const ratio = c.covered / c.total;
                const color: 'emerald' | 'amber' | 'rose' =
                  ratio >= 0.9 ? 'emerald' : ratio >= 0.7 ? 'amber' : 'rose';
                return (
                  <HorizontalBar
                    key={c.label}
                    label={c.label}
                    value={c.covered}
                    max={c.total}
                    color={color}
                    rightText={`${Math.round(ratio * 100)}% (${c.covered}/${c.total})`}
                  />
                );
              })}
            </div>
          </section>

          {/* 承認待ち申請 */}
          <section className="bg-white border border-stroke-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-content-primary">
                申請承認待ち（直近）
              </h2>
              <button
                type="button"
                onClick={() => router.push('/ledger-applications')}
                className="text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                すべて見る →
              </button>
            </div>
            <ul className="space-y-2">
              {PENDING_APPROVALS.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-3 py-2 border border-stroke-card rounded-md hover:bg-surface-screen transition-colors"
                >
                  <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded border bg-sky-50 text-sky-700 border-sky-200">
                    {a.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-content-primary truncate">
                      {a.vendor}
                    </div>
                    <div className="text-xs text-content-sub mt-0.5 flex items-center gap-2">
                      <span className="font-mono tabular-nums">{a.id}</span>
                      <span>{a.applicant}</span>
                    </div>
                  </div>
                  {a.amount > 0 && (
                    <div className="text-sm font-semibold tabular-nums text-content-primary">
                      ¥{a.amount.toLocaleString('ja-JP')}
                    </div>
                  )}
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      a.daysWaiting >= 3 ? 'text-rose-600' : 'text-content-sub'
                    }`}
                  >
                    {a.daysWaiting}日経過
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 今後の点検予定 */}
        <section className="bg-white border border-stroke-card rounded-lg p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-content-primary inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden />
              今後 7 日間の点検予定
            </h2>
            <button
              type="button"
              onClick={() => router.push('/inspection-prep')}
              className="text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
            >
              点検準備へ →
            </button>
          </div>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            {['5/24 (土)', '5/25 (日)', '5/26 (月)', '5/27 (火)', '5/28 (水)', '5/29 (木)', '5/30 (金)'].map(
              (d, idx) => {
                const counts = [3, 0, 12, 8, 5, 11, 6];
                const c = counts[idx];
                return (
                  <div
                    key={d}
                    className={`border rounded-md p-2 text-center ${
                      c === 0
                        ? 'border-stroke-card bg-surface-screen text-content-sub'
                        : c >= 10
                          ? 'border-rose-200 bg-rose-50/40'
                          : 'border-stroke-card bg-white'
                    }`}
                  >
                    <div className="text-[11px] text-content-sub">{d}</div>
                    <div className="text-lg font-bold tabular-nums text-content-primary mt-0.5">
                      {c}
                    </div>
                    <div className="text-[10px] text-content-sub">件</div>
                  </div>
                );
              },
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
