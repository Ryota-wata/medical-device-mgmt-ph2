'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  Archive,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Layers,
  Send,
  Trash2,
  Users,
} from 'lucide-react';

type InventoryStage = '依頼中' | '実施中' | '集約中' | '除却中' | '完了';

interface InventoryProject {
  id: string;
  title: string;
  facility: string;
  startedAt: string;
  stage: InventoryStage;
  totalAssets: number;
  checkedAssets: number;
  unaccountedAssets: number;
  disposalCandidates: number;
  requestedTo: string[];
  responsibleDept: string;
}

const STAGES: InventoryStage[] = ['依頼中', '実施中', '集約中', '除却中', '完了'];

const STAGE_STYLE: Record<InventoryStage, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  '依頼中': { bg: 'bg-stone-100 text-stone-700 border-stone-200', text: 'text-stone-700', icon: Send },
  '実施中': { bg: 'bg-sky-50 text-sky-700 border-sky-200', text: 'text-sky-700', icon: ClipboardList },
  '集約中': { bg: 'bg-violet-50 text-violet-700 border-violet-200', text: 'text-violet-700', icon: Layers },
  '除却中': { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', icon: Trash2 },
  '完了': { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
};

const STAGE_HINT: Record<InventoryStage, string> = {
  '依頼中': '事務（機器担当）→ 管理部署へ棚卸依頼を発出済',
  '実施中': '管理部署の責任者が棚卸を実施中。判定: 確認済(在庫一致) / 移動予定 / 廃棄予定 / 要対応(保留)',
  '集約中': '事務（機器担当）が判定結果を集約。「完了する」押下時に移動申請・廃棄申請を一括自動作成し、除却中へ',
  '除却中': '事務（会計担当）が廃棄申請対象の除却処理を実行中',
  '完了': '全工程完了',
};

const ALLOWED_NEXT: Record<InventoryStage, InventoryStage | null> = {
  '依頼中': '実施中',
  '実施中': '集約中',
  '集約中': '除却中',
  '除却中': '完了',
  '完了': null,
};

const INITIAL_PROJECTS: InventoryProject[] = [
  {
    id: 'INV-2026-Q2-01',
    title: '2026年度 第1四半期 棚卸し',
    facility: '東京中央病院',
    startedAt: '2026-04-01',
    stage: '集約中',
    totalAssets: 1840,
    checkedAssets: 1812,
    unaccountedAssets: 8,
    disposalCandidates: 12,
    requestedTo: ['ME室', '看護部', '手術部'],
    responsibleDept: '医療機器管理課',
  },
  {
    id: 'INV-2026-Q2-02',
    title: 'NICU 抜き打ち棚卸し',
    facility: '東京中央病院',
    startedAt: '2026-05-15',
    stage: '実施中',
    totalAssets: 84,
    checkedAssets: 56,
    unaccountedAssets: 0,
    disposalCandidates: 0,
    requestedTo: ['NICU'],
    responsibleDept: '医療機器管理課',
  },
  {
    id: 'INV-2026-Q1-03',
    title: '2026年度 第1四半期 棚卸し（横浜）',
    facility: '横浜総合病院',
    startedAt: '2026-04-10',
    stage: '除却中',
    totalAssets: 920,
    checkedAssets: 920,
    unaccountedAssets: 2,
    disposalCandidates: 18,
    requestedTo: ['ME室', '一般病棟'],
    responsibleDept: '機器管理担当',
  },
  {
    id: 'INV-2026-Q4-04',
    title: '昨年度第4四半期 棚卸し',
    facility: '東京中央病院',
    startedAt: '2026-01-15',
    stage: '完了',
    totalAssets: 1798,
    checkedAssets: 1798,
    unaccountedAssets: 0,
    disposalCandidates: 24,
    requestedTo: ['全部署'],
    responsibleDept: '医療機器管理課',
  },
];

export default function Inventory4StepPage() {
  const router = useRouter();
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selected, setSelected] = useState<InventoryProject>(INITIAL_PROJECTS[0]);

  const handleAdvance = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = ALLOWED_NEXT[p.stage];
        if (!next) return p;
        return { ...p, stage: next };
      }),
    );
    if (selected.id === id) {
      const next = ALLOWED_NEXT[selected.stage];
      if (next) setSelected({ ...selected, stage: next });
    }
  };

  const stageIndex = (s: InventoryStage) => STAGES.indexOf(s);

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
            <span>棚卸 4段階運用</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Archive className="w-6 h-6 text-emerald-600" aria-hidden />
            棚卸 4段階運用フロー (S17)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            依頼中 → 実施中 → 集約中 → 除却中 → 完了 の状態遷移と権限制御。
            状態ごとに操作可能アクションを制限し、運用責任を明確化。
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* 一覧 */}
          <section className="lg:col-span-1 bg-white border border-stroke-card rounded-lg">
            <div className="px-4 py-3 border-b border-stroke-card">
              <h2 className="text-sm font-semibold text-content-primary">棚卸プロジェクト</h2>
            </div>
            <ul className="divide-y divide-stroke-card max-h-[640px] overflow-y-auto">
              {projects.map((p) => {
                const sty = STAGE_STYLE[p.stage];
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(p)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface-screen transition-colors cursor-pointer border-0 ${
                        selected.id === p.id ? 'bg-surface-screen' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-xs tabular-nums text-content-sub">
                          {p.id}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${sty.bg}`}
                        >
                          {p.stage}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-content-primary text-pretty">
                        {p.title}
                      </div>
                      <div className="text-xs text-content-sub mt-0.5">
                        {p.facility} · 開始 {p.startedAt}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 詳細 + 状態遷移 */}
          <section className="lg:col-span-2 bg-white border border-stroke-card rounded-lg p-5">
            <div className="flex items-start justify-between gap-2 mb-4 flex-wrap">
              <div>
                <div className="text-xs font-mono text-content-sub tabular-nums">
                  {selected.id}
                </div>
                <h2 className="text-base font-semibold text-content-primary text-balance">
                  {selected.title}
                </h2>
                <p className="text-xs text-content-sub mt-0.5">
                  {selected.facility} · 開始 {selected.startedAt} · 主管: {selected.responsibleDept}
                </p>
              </div>
              {selected.stage !== '完了' && (
                <button
                  type="button"
                  onClick={() => handleAdvance(selected.id)}
                  className="h-10 px-4 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
                >
                  次フェーズへ進める
                  <ArrowRight className="w-4 h-4" aria-hidden />
                </button>
              )}
            </div>

            {/* ステッパー */}
            <ol className="flex items-center mb-5 overflow-x-auto">
              {STAGES.map((s, idx) => {
                const Icon = STAGE_STYLE[s].icon;
                const current = stageIndex(selected.stage);
                const done = idx < current;
                const active = idx === current;
                return (
                  <React.Fragment key={s}>
                    <li className="flex flex-col items-center min-w-[110px]">
                      <div
                        className={`size-10 rounded-full flex items-center justify-center border-2 ${
                          done
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : active
                              ? 'bg-cta-primary text-white border-cta-primary'
                              : 'bg-white text-content-sub border-stroke-card'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                          active ? 'text-content-primary' : 'text-content-sub'
                        }`}
                      >
                        {s}
                      </span>
                    </li>
                    {idx < STAGES.length - 1 && (
                      <li
                        className={`flex-1 h-0.5 mx-1 ${done ? 'bg-emerald-500' : 'bg-stroke-card'}`}
                        aria-hidden
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </ol>

            <div className="bg-surface-screen border border-stroke-card rounded-md px-3 py-2 mb-4 text-xs text-content-primary text-pretty">
              <span className="font-semibold">{selected.stage}: </span>
              {STAGE_HINT[selected.stage]}
            </div>

            {/* 進捗メトリクス */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4">
              <div className="border border-stroke-card rounded-md p-3">
                <div className="text-xs text-content-sub">対象資産</div>
                <div className="text-lg font-bold tabular-nums text-content-primary">
                  {selected.totalAssets.toLocaleString()}
                </div>
              </div>
              <div className="border border-stroke-card rounded-md p-3">
                <div className="text-xs text-content-sub">確認済</div>
                <div className="text-lg font-bold tabular-nums text-content-primary">
                  {selected.checkedAssets.toLocaleString()}
                </div>
                <div className="text-xs text-content-sub mt-0.5">
                  {Math.round((selected.checkedAssets / selected.totalAssets) * 100)}%
                </div>
              </div>
              <div className="border border-stroke-card rounded-md p-3">
                <div className="text-xs text-content-sub">所在不明</div>
                <div
                  className={`text-lg font-bold tabular-nums ${
                    selected.unaccountedAssets > 0 ? 'text-rose-600' : 'text-content-primary'
                  }`}
                >
                  {selected.unaccountedAssets}
                </div>
              </div>
              <div className="border border-stroke-card rounded-md p-3">
                <div className="text-xs text-content-sub">廃棄候補</div>
                <div className="text-lg font-bold tabular-nums text-content-primary">
                  {selected.disposalCandidates}
                </div>
              </div>
            </div>

            {/* 状態別 操作可能アクション */}
            <div>
              <h3 className="text-xs font-semibold text-content-primary mb-2 inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5" aria-hidden />
                このフェーズで可能な操作
              </h3>
              <div className="bg-surface-screen border border-stroke-card rounded-md p-3">
                <ActionMatrix stage={selected.stage} />
              </div>
            </div>

            {selected.stage === '依頼中' && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-content-primary mb-1.5">
                  依頼先部署
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.requestedTo.map((dept) => (
                    <span
                      key={dept}
                      className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-white border border-stroke-card text-content-primary"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

const ActionMatrix: React.FC<{ stage: InventoryStage }> = ({ stage }) => {
  const matrix: Record<
    InventoryStage,
    { role: string; actions: string[]; enabled: boolean }[]
  > = {
    '依頼中': [
      { role: '事務（機器担当）', actions: ['依頼内容編集', '依頼取下げ', 'リマインダ送信'], enabled: true },
      { role: '管理部署 責任者', actions: ['依頼受領 → 実施中へ進める'], enabled: true },
      { role: '事務（会計担当）', actions: ['—'], enabled: false },
    ],
    '実施中': [
      { role: '事務（機器担当）', actions: ['進捗閲覧', '催促送信'], enabled: true },
      { role: '管理部署 責任者', actions: ['棚卸チェック', '所在不明登録', '備考編集'], enabled: true },
      { role: '事務（会計担当）', actions: ['—'], enabled: false },
    ],
    '集約中': [
      { role: '事務（機器担当）', actions: ['判定結果集約', '差分整合', '完了する押下→申請一括自動作成'], enabled: true },
      { role: '管理部署 責任者', actions: ['結果閲覧のみ'], enabled: false },
      { role: '事務（会計担当）', actions: ['結果プレビュー'], enabled: true },
    ],
    '除却中': [
      { role: '事務（機器担当）', actions: ['閲覧のみ'], enabled: false },
      { role: '管理部署 責任者', actions: ['閲覧のみ'], enabled: false },
      { role: '事務（会計担当）', actions: ['廃棄申請発出', '会計除却処理', '完了確定'], enabled: true },
    ],
    '完了': [
      { role: '全ロール', actions: ['結果Excel出力', '監査用閲覧'], enabled: true },
      { role: '事務（会計担当）', actions: ['会計確定済（編集不可）'], enabled: false },
      { role: '—', actions: ['—'], enabled: false },
    ],
  };

  const rows = matrix[stage];
  return (
    <ul className="space-y-1.5">
      {rows.map((r, idx) => (
        <li key={idx} className="flex items-start gap-2 text-xs">
          <span className="w-32 font-semibold text-content-primary whitespace-nowrap">
            {r.role}
          </span>
          <span
            className={`flex-1 text-pretty ${
              r.enabled ? 'text-content-primary' : 'text-content-sub italic'
            }`}
          >
            {r.actions.join(' / ')}
          </span>
          {r.enabled ? (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              操作可
            </span>
          ) : (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
              不可
            </span>
          )}
        </li>
      ))}
    </ul>
  );
};
