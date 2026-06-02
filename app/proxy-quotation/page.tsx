'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Send,
  Users,
  X,
} from 'lucide-react';

type ProxyStatus = '未着手' | '依頼確認中' | '見積取得中' | 'STEP実行中' | '完了' | '差戻し';

interface ProxyRequest {
  id: string;
  facility: string;
  requestedAt: string;
  requestedBy: string;
  itemName: string;
  category: string;
  quantity: number;
  budgetHint?: number;
  preferredVendor?: string;
  status: ProxyStatus;
  note?: string;
  steps: { id: number; label: string; done: boolean }[];
}

const PROXY_STEPS_TEMPLATE = [
  '依頼内容確認',
  '業者選定',
  '見積依頼送信',
  '見積回収',
  'あいみつ整理',
  '病院担当者へ送付',
];

const buildSteps = (currentDone: number) =>
  PROXY_STEPS_TEMPLATE.map((label, i) => ({
    id: i + 1,
    label,
    done: i < currentDone,
  }));

const MOCK_REQUESTS: ProxyRequest[] = [
  {
    id: 'PQ-2026-0042',
    facility: '東京中央病院',
    requestedAt: '2026-05-21',
    requestedBy: '田中 花子',
    itemName: '超音波診断装置（高機能機）',
    category: '超音波診断装置',
    quantity: 1,
    budgetHint: 12_000_000,
    preferredVendor: '株式会社ライフライン医療',
    status: 'STEP実行中',
    note: '緊急: 6月導入希望',
    steps: buildSteps(3),
  },
  {
    id: 'PQ-2026-0043',
    facility: '横浜総合病院',
    requestedAt: '2026-05-19',
    requestedBy: '木村 圭子',
    itemName: '心電図モニタ × 6 台 一括',
    category: '生体情報モニタ',
    quantity: 6,
    budgetHint: 2_400_000,
    status: '見積取得中',
    steps: buildSteps(2),
  },
  {
    id: 'PQ-2026-0044',
    facility: '東京中央病院',
    requestedAt: '2026-05-22',
    requestedBy: '伊藤 三郎',
    itemName: '人工呼吸器 更新',
    category: '人工呼吸器',
    quantity: 2,
    budgetHint: 8_000_000,
    preferredVendor: '〇〇医療機器株式会社',
    status: '依頼確認中',
    note: '同型機の在庫確認も依頼',
    steps: buildSteps(1),
  },
  {
    id: 'PQ-2026-0045',
    facility: '千葉医療センター',
    requestedAt: '2026-05-17',
    requestedBy: '安田 智',
    itemName: '輸液ポンプ × 12 台',
    category: '輸液ポンプ',
    quantity: 12,
    budgetHint: 6_240_000,
    status: 'STEP実行中',
    steps: buildSteps(4),
  },
  {
    id: 'PQ-2026-0046',
    facility: '横浜総合病院',
    requestedAt: '2026-05-20',
    requestedBy: '木村 圭子',
    itemName: 'シリンジポンプ 更新',
    category: 'シリンジポンプ',
    quantity: 4,
    status: '未着手',
    steps: buildSteps(0),
  },
  {
    id: 'PQ-2026-0047',
    facility: '東京中央病院',
    requestedAt: '2026-05-22',
    requestedBy: '田中 花子',
    itemName: 'パルスオキシメータ × 8 台',
    category: 'パルスオキシメータ',
    quantity: 8,
    budgetHint: 320_000,
    status: '未着手',
    steps: buildSteps(0),
  },
];

const STATUS_STYLE: Record<ProxyStatus, string> = {
  '未着手': 'bg-stone-100 text-stone-700 border-stone-200',
  '依頼確認中': 'bg-sky-50 text-sky-700 border-sky-200',
  '見積取得中': 'bg-violet-50 text-violet-700 border-violet-200',
  'STEP実行中': 'bg-amber-50 text-amber-700 border-amber-200',
  '完了': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '差戻し': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function ProxyQuotationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<ProxyRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ProxyStatus>('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return MOCK_REQUESTS;
    return MOCK_REQUESTS.filter((r) => r.status === statusFilter);
  }, [statusFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of MOCK_REQUESTS) {
      c[r.status] = (c[r.status] ?? 0) + 1;
    }
    return c;
  }, []);

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
            <span>代理見積登録</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Send className="w-6 h-6 text-emerald-600" aria-hidden />
            代理見積登録 専用画面 (S19)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-2xl">
            共有アカウント（代理見積登録）でログインした SHIP コンサルが、各病院から依頼された見積をまとめて処理するキューです。
          </p>
        </div>

        {/* ステータスサマリー */}
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-5">
          {(['未着手', '依頼確認中', '見積取得中', 'STEP実行中', '完了', '差戻し'] as ProxyStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`text-left bg-white border rounded-lg p-3 transition-colors cursor-pointer ${
                statusFilter === s ? 'border-cta-primary shadow-sm' : 'border-stroke-card hover:border-stroke-input'
              }`}
            >
              <div className="text-xs text-content-sub mb-1">{s}</div>
              <div className="text-2xl font-bold tabular-nums text-content-primary">
                {counts[s] ?? 0}
                <span className="text-xs font-medium text-content-sub ml-1">件</span>
              </div>
            </button>
          ))}
        </div>

        {statusFilter !== 'all' && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-xs text-content-link hover:underline inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
            >
              <X className="w-3 h-3" />
              {statusFilter} フィルタを解除（全件表示）
            </button>
          </div>
        )}

        {/* 一覧 + 詳細 2 ペイン */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
          {/* 一覧 */}
          <section className="lg:col-span-3 bg-white border border-stroke-card rounded-lg">
            <div className="px-4 py-3 border-b border-stroke-card flex items-center justify-between">
              <h2 className="text-sm font-semibold text-content-primary inline-flex items-center gap-2">
                <Inbox className="w-4 h-4" aria-hidden />
                見積依頼キュー（{filtered.length} 件）
              </h2>
            </div>
            <ul className="divide-y divide-stroke-card max-h-[680px] overflow-y-auto">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(r)}
                    className={`w-full text-left px-4 py-3 hover:bg-surface-screen transition-colors cursor-pointer border-0 ${
                      selected?.id === r.id ? 'bg-surface-screen' : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs tabular-nums text-content-sub">
                          {r.id}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${STATUS_STYLE[r.status]}`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <span className="text-xs text-content-sub tabular-nums whitespace-nowrap">
                        {r.requestedAt}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-content-primary text-pretty">
                      {r.itemName}
                    </div>
                    <div className="text-xs text-content-sub mt-1 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-0.5">
                        <Users className="w-3 h-3" aria-hidden />
                        {r.facility}
                      </span>
                      <span>·</span>
                      <span>{r.requestedBy}</span>
                      {r.budgetHint && (
                        <>
                          <span>·</span>
                          <span className="tabular-nums">
                            予算目安: ¥{r.budgetHint.toLocaleString('ja-JP')}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* 詳細 */}
          <section className="lg:col-span-2 bg-white border border-stroke-card rounded-lg p-5">
            {selected ? (
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="text-xs font-mono text-content-sub tabular-nums">
                      {selected.id}
                    </div>
                    <h3 className="text-base font-semibold text-content-primary mt-0.5 text-balance">
                      {selected.itemName}
                    </h3>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${STATUS_STYLE[selected.status]}`}
                  >
                    {selected.status}
                  </span>
                </div>

                <dl className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs mb-4">
                  <dt className="text-content-sub">依頼施設</dt>
                  <dd className="col-span-2 text-content-primary">{selected.facility}</dd>
                  <dt className="text-content-sub">依頼者</dt>
                  <dd className="col-span-2 text-content-primary">{selected.requestedBy}</dd>
                  <dt className="text-content-sub">依頼日</dt>
                  <dd className="col-span-2 text-content-primary tabular-nums">
                    {selected.requestedAt}
                  </dd>
                  <dt className="text-content-sub">カテゴリ</dt>
                  <dd className="col-span-2 text-content-primary">{selected.category}</dd>
                  <dt className="text-content-sub">数量</dt>
                  <dd className="col-span-2 text-content-primary tabular-nums">
                    {selected.quantity} 台
                  </dd>
                  {selected.budgetHint && (
                    <>
                      <dt className="text-content-sub">予算目安</dt>
                      <dd className="col-span-2 text-content-primary tabular-nums">
                        ¥{selected.budgetHint.toLocaleString('ja-JP')}
                      </dd>
                    </>
                  )}
                  {selected.preferredVendor && (
                    <>
                      <dt className="text-content-sub">優先業者</dt>
                      <dd className="col-span-2 text-content-primary">
                        {selected.preferredVendor}
                      </dd>
                    </>
                  )}
                  {selected.note && (
                    <>
                      <dt className="text-content-sub">備考</dt>
                      <dd className="col-span-2 text-content-primary text-pretty">{selected.note}</dd>
                    </>
                  )}
                </dl>

                {/* STEP プログレス */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-content-primary mb-2 inline-flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" aria-hidden />
                    実行ステップ（STEP1-6）
                  </h4>
                  <ol className="space-y-1.5">
                    {selected.steps.map((s) => (
                      <li
                        key={s.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border ${
                          s.done
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-white border-stroke-card text-content-primary'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center size-5 rounded-full text-[10px] font-bold ${
                            s.done
                              ? 'bg-emerald-500 text-white'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {s.done ? '✓' : s.id}
                        </span>
                        <span className="text-xs">{s.label}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* アクション */}
                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 h-10 px-4 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    次の STEP へ
                    <ArrowRight className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="h-10 px-3 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
                  >
                    病院担当者に確認
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <Inbox className="w-12 h-12 text-content-sub mb-2" aria-hidden />
                <p className="text-sm font-medium text-content-primary">依頼を選択してください</p>
                <p className="text-xs text-content-sub mt-1 text-pretty">
                  キューから依頼を選ぶと詳細・STEP プログレスが表示されます
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
