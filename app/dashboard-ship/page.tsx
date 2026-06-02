'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  DashboardCard,
  HorizontalBar,
} from '@/components/dashboard/DashboardCard';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  FileSpreadsheet,
  Globe2,
  Inbox,
  TrendingUp,
  Users,
} from 'lucide-react';

const FACILITIES = ['東京中央病院', '横浜総合病院', '千葉医療センター'] as const;
type Facility = (typeof FACILITIES)[number] | 'all';

interface FacilityRow {
  facility: string;
  quotationsInProgress: number;
  approvalPending: number;
  maintenanceCoverage: number; // %
  inspectionOverdue: number;
  remodelInProgress: number;
}

const FACILITY_ROWS: FacilityRow[] = [
  {
    facility: '東京中央病院',
    quotationsInProgress: 14,
    approvalPending: 8,
    maintenanceCoverage: 87,
    inspectionOverdue: 12,
    remodelInProgress: 2,
  },
  {
    facility: '横浜総合病院',
    quotationsInProgress: 8,
    approvalPending: 5,
    maintenanceCoverage: 72,
    inspectionOverdue: 18,
    remodelInProgress: 0,
  },
  {
    facility: '千葉医療センター',
    quotationsInProgress: 2,
    approvalPending: 1,
    maintenanceCoverage: 65,
    inspectionOverdue: 9,
    remodelInProgress: 1,
  },
];

interface ProxyQuotationItem {
  id: string;
  facility: string;
  itemName: string;
  requestedBy: string;
  daysWaiting: number;
}

const PROXY_QUEUE: ProxyQuotationItem[] = [
  {
    id: 'PQ-2026-0042',
    facility: '東京中央病院',
    itemName: '超音波診断装置（高機能機）',
    requestedBy: '田中 花子',
    daysWaiting: 2,
  },
  {
    id: 'PQ-2026-0043',
    facility: '横浜総合病院',
    itemName: '心電図モニタ × 6 台 一括',
    requestedBy: '木村 圭子',
    daysWaiting: 4,
  },
  {
    id: 'PQ-2026-0044',
    facility: '東京中央病院',
    itemName: '人工呼吸器 更新',
    requestedBy: '伊藤 三郎',
    daysWaiting: 1,
  },
  {
    id: 'PQ-2026-0045',
    facility: '千葉医療センター',
    itemName: '輸液ポンプ × 12 台',
    requestedBy: '安田 智',
    daysWaiting: 6,
  },
  {
    id: 'PQ-2026-0046',
    facility: '横浜総合病院',
    itemName: 'シリンジポンプ 更新',
    requestedBy: '木村 圭子',
    daysWaiting: 3,
  },
  {
    id: 'PQ-2026-0047',
    facility: '東京中央病院',
    itemName: 'パルスオキシメータ × 8 台',
    requestedBy: '田中 花子',
    daysWaiting: 1,
  },
];

interface AlertItem {
  id: string;
  facility: string;
  assetName: string;
  issue: string;
  severity: 'alert' | 'warn';
}

const ALERTS: AlertItem[] = [
  {
    id: 'a1',
    facility: '横浜総合病院',
    assetName: '人工呼吸器 SV-300',
    issue: '保守契約 30日後切れ。更新見積未取得',
    severity: 'alert',
  },
  {
    id: 'a2',
    facility: '千葉医療センター',
    assetName: '除細動器 LIFEPAK 20',
    issue: '点検期限 14日超過',
    severity: 'alert',
  },
  {
    id: 'a3',
    facility: '東京中央病院',
    assetName: '輸液ポンプ TE-SS720 (12台)',
    issue: '取得見積期限まで 3 日',
    severity: 'warn',
  },
  {
    id: 'a4',
    facility: '東京中央病院',
    assetName: '生体情報モニタ BSM-3500',
    issue: '同型機の薬機法不具合情報あり (要確認)',
    severity: 'warn',
  },
  {
    id: 'a5',
    facility: '横浜総合病院',
    assetName: '電気メス ESG-400',
    issue: '修理待ち 21日',
    severity: 'warn',
  },
];

const SEV_STYLE = {
  alert: 'bg-rose-50 border-rose-200 text-rose-700',
  warn: 'bg-amber-50 border-amber-200 text-amber-800',
} as const;

export default function DashboardShipPage() {
  const router = useRouter();
  const [scope, setScope] = useState<Facility>('all');

  const filteredRows = useMemo(() => {
    if (scope === 'all') return FACILITY_ROWS;
    return FACILITY_ROWS.filter((r) => r.facility === scope);
  }, [scope]);

  const filteredQueue = useMemo(() => {
    if (scope === 'all') return PROXY_QUEUE;
    return PROXY_QUEUE.filter((q) => q.facility === scope);
  }, [scope]);

  const filteredAlerts = useMemo(() => {
    if (scope === 'all') return ALERTS;
    return ALERTS.filter((a) => a.facility === scope);
  }, [scope]);

  // 集計
  const totals = useMemo(() => {
    const sumQ = filteredRows.reduce((s, r) => s + r.quotationsInProgress, 0);
    const sumA = filteredRows.reduce((s, r) => s + r.approvalPending, 0);
    const avgCov = Math.round(
      filteredRows.reduce((s, r) => s + r.maintenanceCoverage, 0) / Math.max(filteredRows.length, 1),
    );
    const sumOver = filteredRows.reduce((s, r) => s + r.inspectionOverdue, 0);
    const sumRem = filteredRows.reduce((s, r) => s + r.remodelInProgress, 0);
    return { sumQ, sumA, avgCov, sumOver, sumRem };
  }, [filteredRows]);

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1400px] w-full mx-auto">
        {/* タイトル + 切替 */}
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
              <span>SHIPダッシュボード</span>
            </div>
            <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
              <Globe2 className="w-6 h-6 text-emerald-600" aria-hidden />
              SHIP コンサル ダッシュボード
            </h1>
            <p className="mt-1 text-sm text-content-sub text-pretty">
              全 {FACILITIES.length} 施設を横断管理 ／ 本日 2026-05-23
            </p>
          </div>

          {/* 全施設 / 自施設 切替 */}
          <div className="inline-flex items-center gap-1 bg-white border border-stroke-input rounded-lg p-1">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer border-0 ${
                scope === 'all'
                  ? 'bg-cta-primary text-white'
                  : 'bg-transparent text-content-primary hover:bg-surface-screen'
              }`}
            >
              全施設
            </button>
            {FACILITIES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setScope(f)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer border-0 ${
                  scope === f
                    ? 'bg-cta-primary text-white'
                    : 'bg-transparent text-content-primary hover:bg-surface-screen'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <DashboardCard
            label="取得見積 進行中"
            value={totals.sumQ}
            unit="件"
            severity="normal"
            hint="期限切れ間近 3 件"
            icon={<TrendingUp className="w-4 h-4" />}
            onClick={() => router.push('/quotation-list')}
          />
          <DashboardCard
            label="代理見積登録キュー"
            value={filteredQueue.length}
            unit="件"
            severity="warn"
            hint={`6日以上 ${filteredQueue.filter((q) => q.daysWaiting >= 6).length} 件`}
            icon={<Inbox className="w-4 h-4" />}
            onClick={() => router.push('/proxy-quotation')}
          />
          <DashboardCard
            label="保守契約カバレッジ (平均)"
            value={`${totals.avgCov}%`}
            severity={totals.avgCov >= 80 ? 'ok' : totals.avgCov >= 70 ? 'warn' : 'alert'}
            hint={scope === 'all' ? '3 施設平均' : '当該施設'}
            icon={<FileSpreadsheet className="w-4 h-4" />}
          />
          <DashboardCard
            label="点検超過機器 (合計)"
            value={totals.sumOver}
            unit="台"
            severity="alert"
            hint="14日以上 4 台"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <DashboardCard
            label="承認待ち申請"
            value={totals.sumA}
            unit="件"
            severity="warn"
            icon={<Bell className="w-4 h-4" />}
            onClick={() => router.push('/ledger-applications')}
          />
          <DashboardCard
            label="リモデル進行中"
            value={totals.sumRem}
            unit="件"
            severity="normal"
            icon={<Users className="w-4 h-4" />}
            onClick={() => router.push('/ph2-remodel-close')}
          />
        </div>

        {/* 2列レイアウト: 施設別サマリー + 代理見積キュー */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
          {/* 施設別サマリー */}
          <section className="lg:col-span-2 bg-white border border-stroke-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-content-primary">
                施設別サマリー
              </h2>
              <button
                type="button"
                onClick={() => router.push('/quotation-list')}
                className="text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                取得見積一覧へ →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-content-sub border-b border-stroke-card">
                    <th className="px-2 py-2 text-left">施設</th>
                    <th className="px-2 py-2 text-right">見積進行</th>
                    <th className="px-2 py-2 text-right">承認待ち</th>
                    <th className="px-2 py-2 text-left w-[180px]">保守カバレッジ</th>
                    <th className="px-2 py-2 text-right">点検超過</th>
                    <th className="px-2 py-2 text-right">リモデル</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.facility} className="border-b border-stroke-card hover:bg-surface-screen">
                      <td className="px-2 py-2.5 font-medium text-content-primary">
                        {r.facility}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {r.quotationsInProgress}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{r.approvalPending}</td>
                      <td className="px-2 py-2.5">
                        <HorizontalBar
                          label=""
                          value={r.maintenanceCoverage}
                          max={100}
                          color={
                            r.maintenanceCoverage >= 80
                              ? 'emerald'
                              : r.maintenanceCoverage >= 70
                                ? 'amber'
                                : 'rose'
                          }
                          rightText={`${r.maintenanceCoverage}%`}
                        />
                      </td>
                      <td
                        className={`px-2 py-2.5 text-right tabular-nums ${
                          r.inspectionOverdue >= 15 ? 'text-rose-600 font-semibold' : ''
                        }`}
                      >
                        {r.inspectionOverdue}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">
                        {r.remodelInProgress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 代理見積登録キュー */}
          <section className="bg-white border border-stroke-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-content-primary">
                代理見積登録 キュー
              </h2>
              <button
                type="button"
                onClick={() => router.push('/proxy-quotation')}
                className="text-xs text-content-link hover:underline bg-transparent border-0 cursor-pointer p-0"
              >
                登録画面へ →
              </button>
            </div>
            <ul className="space-y-2">
              {filteredQueue.slice(0, 5).map((q) => (
                <li
                  key={q.id}
                  className="border border-stroke-card rounded-md p-3 hover:bg-surface-screen transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-content-primary truncate">
                        {q.itemName}
                      </div>
                      <div className="text-xs text-content-sub mt-0.5 flex items-center gap-2">
                        <span>{q.facility}</span>
                        <span>·</span>
                        <span>{q.requestedBy}</span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold tabular-nums whitespace-nowrap ${
                        q.daysWaiting >= 5
                          ? 'text-rose-600'
                          : q.daysWaiting >= 3
                            ? 'text-amber-700'
                            : 'text-content-sub'
                      }`}
                    >
                      {q.daysWaiting}日待ち
                    </span>
                  </div>
                </li>
              ))}
              {filteredQueue.length === 0 && (
                <li className="text-center text-xs text-content-sub py-6">
                  該当施設の依頼はありません
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* アラート機器一覧 */}
        <section className="bg-white border border-stroke-card rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-content-primary inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" aria-hidden />
              アラート機器 一覧（横断）
            </h2>
            <span className="text-xs text-content-sub tabular-nums">
              {filteredAlerts.length} 件
            </span>
          </div>
          <ul className="space-y-2">
            {filteredAlerts.map((a) => (
              <li
                key={a.id}
                className={`border rounded-md px-3 py-2.5 flex items-start gap-3 ${SEV_STYLE[a.severity]}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-content-primary">{a.facility}</span>
                    <span className="text-content-sub">·</span>
                    <span className="text-content-primary">{a.assetName}</span>
                  </div>
                  <p className="text-xs mt-0.5 text-pretty">{a.issue}</p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-white border border-current rounded hover:opacity-80 transition-opacity cursor-pointer"
                >
                  対応へ
                  <ChevronRight className="w-3 h-3" aria-hidden />
                </button>
              </li>
            ))}
            {filteredAlerts.length === 0 && (
              <li className="text-center text-xs text-content-sub py-6">
                該当アラートはありません
              </li>
            )}
          </ul>
        </section>
      </main>
    </div>
  );
}
