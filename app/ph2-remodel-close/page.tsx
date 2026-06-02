'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ChevronRight,
} from 'lucide-react';

type RemodelStatus = '計画中' | '実施中' | 'クローズ準備可' | 'クローズ済';

interface RemodelCheck {
  key: string;
  label: string;
  detail: string;
  passed: boolean;
}

interface RemodelProject {
  id: string;
  title: string;
  facility: string;
  startedAt: string;
  oldDeptCount: number;
  newDeptCount: number;
  newAssetTotal: number;
  newAssetRegistered: number;
  status: RemodelStatus;
  checks: RemodelCheck[];
}

const MOCK_PROJECTS: RemodelProject[] = [
  {
    id: 'RM-2026-0001',
    title: '東棟 3F リモデル（ICU・CCU 集約）',
    facility: '東京中央病院',
    startedAt: '2026-02-15',
    oldDeptCount: 4,
    newDeptCount: 2,
    newAssetTotal: 86,
    newAssetRegistered: 86,
    status: 'クローズ準備可',
    checks: [
      { key: 'c1', label: '新マスタの全機器が原本登録済', detail: '86 / 86 台', passed: true },
      { key: 'c2', label: '旧マスタの機器が新マスタへ移設済 or 廃棄済', detail: '74 / 74 台', passed: true },
      { key: 'c3', label: '新部署マスタの設置場所が全件設定済', detail: '2 部署 / 2 部署', passed: true },
      { key: 'c4', label: '保守契約の継承が完了', detail: '12 件 / 12 件', passed: true },
    ],
  },
  {
    id: 'RM-2026-0002',
    title: '西棟 ICU 拡張リモデル',
    facility: '東京中央病院',
    startedAt: '2026-04-01',
    oldDeptCount: 2,
    newDeptCount: 3,
    newAssetTotal: 64,
    newAssetRegistered: 52,
    status: '実施中',
    checks: [
      { key: 'c1', label: '新マスタの全機器が原本登録済', detail: '52 / 64 台', passed: false },
      { key: 'c2', label: '旧マスタの機器が新マスタへ移設済 or 廃棄済', detail: '38 / 50 台', passed: false },
      { key: 'c3', label: '新部署マスタの設置場所が全件設定済', detail: '3 部署 / 3 部署', passed: true },
      { key: 'c4', label: '保守契約の継承が完了', detail: '8 件 / 10 件', passed: false },
    ],
  },
  {
    id: 'RM-2026-0003',
    title: '南棟 一般病棟リモデル',
    facility: '千葉医療センター',
    startedAt: '2026-05-10',
    oldDeptCount: 6,
    newDeptCount: 4,
    newAssetTotal: 124,
    newAssetRegistered: 18,
    status: '計画中',
    checks: [],
  },
];

const STATUS_STYLE: Record<RemodelStatus, string> = {
  '計画中': 'bg-stone-100 text-stone-700 border-stone-200',
  '実施中': 'bg-amber-50 text-amber-700 border-amber-200',
  'クローズ準備可': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'クローズ済': 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function RemodelClosePage() {
  const router = useRouter();
  const [confirmTarget, setConfirmTarget] = useState<RemodelProject | null>(null);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [completed, setCompleted] = useState<string | null>(null);

  const handleConfirmClose = () => {
    if (!confirmTarget) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === confirmTarget.id ? { ...p, status: 'クローズ済' as RemodelStatus } : p,
      ),
    );
    setCompleted(confirmTarget.id);
    setConfirmTarget(null);
  };

  return (
    <div className="min-h-dvh bg-surface-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1200px] w-full mx-auto">
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
            <span>リモデル管理 + クローズ</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" aria-hidden />
            リモデル管理 + クローズ確認 (S14)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            新個別部署マスタ → 既存個別部署マスタ への昇格処理（クローズ）を実行できます。
            前提条件をバリデーションした上で確定。
          </p>
        </div>

        {completed && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" aria-hidden />
            <span className="text-sm text-pretty">
              リモデル <span className="font-mono font-semibold">{completed}</span> をクローズしました。
              新部署マスタが既存マスタに昇格し、Ph1 通常運用に切り替わります。
            </span>
          </div>
        )}

        <div className="space-y-4">
          {projects.map((p) => {
            const passed = p.checks.length > 0 && p.checks.every((c) => c.passed);
            const failed = p.checks.filter((c) => !c.passed);
            const canClose = p.status === 'クローズ準備可' && passed;
            const progress = Math.round((p.newAssetRegistered / p.newAssetTotal) * 100);
            return (
              <section
                key={p.id}
                className={`bg-white border rounded-lg p-5 ${
                  canClose ? 'border-emerald-300' : 'border-stroke-card'
                }`}
              >
                {/* ヘッダ */}
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-content-sub tabular-nums">
                        {p.id}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${STATUS_STYLE[p.status]}`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <h2 className="text-base font-semibold text-content-primary text-balance">
                      {p.title}
                    </h2>
                    <p className="text-xs text-content-sub mt-0.5">
                      {p.facility} ／ 開始 {p.startedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canClose}
                    onClick={() => setConfirmTarget(p)}
                    className="h-10 px-4 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-default"
                  >
                    {p.status === 'クローズ済' ? (
                      <>
                        <Lock className="w-4 h-4" aria-hidden />
                        クローズ済
                      </>
                    ) : (
                      <>
                        クローズ確定
                        <ChevronRight className="w-4 h-4" aria-hidden />
                      </>
                    )}
                  </button>
                </div>

                {/* メタ */}
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-4">
                  <div>
                    <div className="text-xs text-content-sub">旧部署数</div>
                    <div className="text-lg font-bold tabular-nums text-content-primary">
                      {p.oldDeptCount}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-content-sub">新部署数</div>
                    <div className="text-lg font-bold tabular-nums text-content-primary">
                      {p.newDeptCount}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs text-content-sub mb-0.5">新マスタへの原本登録進捗</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-screen rounded">
                        <div
                          className={`h-full rounded ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-content-primary whitespace-nowrap">
                        {p.newAssetRegistered} / {p.newAssetTotal} 台 ({progress}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* チェックリスト */}
                {p.checks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-content-primary mb-2">
                      クローズ前提チェック
                    </h3>
                    <ul className="space-y-1.5">
                      {p.checks.map((c) => (
                        <li
                          key={c.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded border text-sm ${
                            c.passed
                              ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50/40 border-rose-200 text-rose-800'
                          }`}
                        >
                          {c.passed ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden />
                          ) : (
                            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
                          )}
                          <span className="flex-1">{c.label}</span>
                          <span className="text-xs tabular-nums">{c.detail}</span>
                        </li>
                      ))}
                    </ul>
                    {failed.length > 0 && (
                      <p className="mt-2 text-xs text-rose-700">
                        ※ 未完了の前提が {failed.length} 件あります。クローズには全項目通過が必要です。
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>

      {/* クローズ確認モーダル */}
      {confirmTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmTarget(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-content-primary mb-2 inline-flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" aria-hidden />
              リモデルをクローズ確定
            </h3>
            <p className="text-sm text-content-sub mb-3 text-pretty">
              <span className="font-mono">{confirmTarget.id}</span> ／{' '}
              {confirmTarget.title}
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-emerald-800 text-pretty">
                クローズすると以下が確定します。<strong>取り消しはできません。</strong>
              </p>
              <ul className="mt-2 space-y-1 text-xs text-emerald-800 list-disc pl-5">
                <li>新個別部署マスタが既存個別部署マスタに昇格</li>
                <li>旧部署マスタ ({confirmTarget.oldDeptCount} 部署) の参照が停止</li>
                <li>Ph1 通常運用フローに切り替わる</li>
              </ul>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="h-10 px-5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                クローズを確定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
