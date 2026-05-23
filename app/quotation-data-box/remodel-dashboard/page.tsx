'use client';

import React, { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useEditListStore } from '@/lib/stores/editListStore';
import type { Asset } from '@/lib/types';

type DecisionKey = 'new' | 'replace' | 'addition' | 'disposal' | 'transfer' | 'undecided';

const DECISION_LABEL: Record<DecisionKey, string> = {
  new: '新規購入',
  replace: '更新購入',
  addition: '増設購入',
  disposal: '廃棄',
  transfer: '移動',
  undecided: '方針未決',
};

const DECISION_COLOR: Record<DecisionKey, { bg: string; text: string; border: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  replace: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  addition: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  disposal: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  transfer: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  undecided: { bg: 'bg-stroke-card', text: 'text-content-sub', border: 'border-stroke-input' },
};

const purchaseCategoryToDecision = (cat: Asset['purchaseCategory']): DecisionKey => {
  switch (cat) {
    case '新規': return 'new';
    case '更新': return 'replace';
    case '増設': return 'addition';
    case '廃棄予定': return 'disposal';
    case '移設': return 'transfer';
    default: return 'undecided';
  }
};

const hasNewLocation = (a: Asset): boolean => {
  return Boolean(a.newRoom || a.newDepartment || a.newDivision || a.newRoomName || a.newSection);
};

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editListIdParam = searchParams.get('editListId') || '';

  const { editLists } = useEditListStore();

  // リモデルモードの編集リストのみ対象
  const remodelLists = useMemo(
    () => editLists.filter(l => l.mode === 'remodel'),
    [editLists],
  );

  const targetList = useMemo(() => {
    if (editListIdParam) return remodelLists.find(l => l.id === editListIdParam);
    return remodelLists[0];
  }, [remodelLists, editListIdParam]);

  // 方針別カウント
  const decisionCounts = useMemo(() => {
    const init: Record<DecisionKey, number> = {
      new: 0, replace: 0, addition: 0, disposal: 0, transfer: 0, undecided: 0,
    };
    if (!targetList) return init;
    for (const a of targetList.baseAssets) {
      const key = purchaseCategoryToDecision(a.purchaseCategory);
      init[key]++;
    }
    return init;
  }, [targetList]);

  // 設置場所入力済み件数（disposal以外が対象）
  const locationStats = useMemo(() => {
    if (!targetList) return { needsLocation: 0, filled: 0, missing: 0 };
    const targets = targetList.baseAssets.filter(a => purchaseCategoryToDecision(a.purchaseCategory) !== 'disposal');
    const filled = targets.filter(hasNewLocation).length;
    return { needsLocation: targets.length, filled, missing: targets.length - filled };
  }, [targetList]);

  const totalAssets = targetList?.baseAssets.length || 0;
  const decidedAssets = totalAssets - decisionCounts.undecided;
  const decisionRate = totalAssets > 0 ? Math.round((decidedAssets / totalAssets) * 100) : 0;
  const locationRate = locationStats.needsLocation > 0
    ? Math.round((locationStats.filled / locationStats.needsLocation) * 100)
    : 100;

  // クローズ判定（リモデルの完了は方針決定 + 新設置場所入力で判断する）
  const canClose = useMemo(() => {
    if (!targetList || totalAssets === 0) return false;
    if (decisionCounts.undecided > 0) return false;
    if (locationStats.missing > 0) return false;
    return true;
  }, [targetList, totalAssets, decisionCounts.undecided, locationStats.missing]);

  const handleClose = () => {
    if (!canClose) return;
    alert('リモデルクローズを実行します（モック）。\n個別部署マスタの旧→新切替が行われます。');
  };

  if (!targetList) {
    return (
      <div className="min-h-dvh flex flex-col bg-surface-screen">
        <Header title="リモデルダッシュボード" showBackButton backHref="/main" hideMenu />
        <div className="max-w-[1200px] mx-auto w-full p-5">
          <div className="bg-surface-card rounded-lg shadow-lg p-8 text-center">
            <p className="text-base text-content-primary mb-2 font-medium">リモデル編集リストが見つかりません</p>
            <p className="text-sm text-content-sub">
              リモデルモードの編集リストが存在しないか、URLパラメータの editListId が無効です。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      <Header
        title="リモデルダッシュボード"
        stepBadge="リモデル管理"
        showBackButton
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu
      />

      <div className="max-w-[1400px] mx-auto w-full p-5 flex flex-col gap-4">
        {/* プロジェクト概要 */}
        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                  リモデル
                </span>
                <span className="text-sm text-content-sub">
                  {targetList.facilities.join(' / ')}
                </span>
              </div>
              <h2 className="text-lg font-bold text-content-primary text-balance">{targetList.name}</h2>
              <p className="text-sm text-content-sub mt-1 text-pretty">
                対象資産すべてに方針決定・設置場所入力・原本登録が完了するとリモデルクローズ可能になります。
              </p>
            </div>
            <button
              onClick={() => router.push(`/remodel-application?listId=${targetList.id}`)}
              className="px-4 py-2 bg-content-primary hover:bg-content-primary text-white rounded-md font-medium text-sm transition-colors border-0 cursor-pointer whitespace-nowrap"
            >
              編集リストを開く
            </button>
          </div>

          {/* 全体進捗 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">対象資産</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{totalAssets}</div>
              <div className="text-xs text-content-sub mt-1">件</div>
            </div>
            <div className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">方針決定</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{decidedAssets} <span className="text-sm text-content-sub">/ {totalAssets}</span></div>
              <div className="w-full bg-stroke-input rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-cta-primary h-1.5 transition-all" style={{ width: `${decisionRate}%` }} />
              </div>
            </div>
            <div className="bg-surface-screen border border-stroke-input rounded-md p-3">
              <div className="text-xs text-content-sub font-medium">新設置場所入力</div>
              <div className="text-2xl font-bold text-content-primary tabular-nums">{locationStats.filled} <span className="text-sm text-content-sub">/ {locationStats.needsLocation}</span></div>
              <div className="w-full bg-stroke-input rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-cta-primary h-1.5 transition-all" style={{ width: `${locationRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 方針別 */}
        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input overflow-hidden">
          <div className="px-5 py-3 border-b border-stroke-input">
            <h3 className="text-sm font-semibold text-content-primary">方針別 内訳</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-4">
            {(Object.keys(DECISION_LABEL) as DecisionKey[]).map(k => {
              const c = DECISION_COLOR[k];
              const count = decisionCounts[k];
              return (
                <div key={k} className={`${c.bg} border ${c.border} rounded-md p-3`}>
                  <div className={`text-xs font-medium ${c.text}`}>{DECISION_LABEL[k]}</div>
                  <div className={`text-xl font-bold ${c.text} tabular-nums`}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* アラート（進捗の阻害要因のみ） */}
        {(decisionCounts.undecided > 0 || locationStats.missing > 0) && (
          <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input overflow-hidden">
            <div className="px-5 py-3 border-b border-stroke-input bg-amber-50">
              <h3 className="text-sm font-semibold text-amber-700">対応が必要な項目</h3>
            </div>
            <ul className="divide-y divide-[#E1E1E1]">
              {decisionCounts.undecided > 0 && (
                <li className="px-5 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-content-primary">方針未決の資産: <span className="tabular-nums font-bold">{decisionCounts.undecided}件</span></span>
                  <button
                    onClick={() => router.push(`/remodel-application?listId=${targetList.id}`)}
                    className="px-3 py-1 bg-content-primary hover:bg-content-primary text-white rounded text-xs font-medium transition-colors border-0 cursor-pointer"
                  >
                    編集リストで処理
                  </button>
                </li>
              )}
              {locationStats.missing > 0 && (
                <li className="px-5 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-content-primary">新設置場所未入力: <span className="tabular-nums font-bold">{locationStats.missing}件</span></span>
                  <button
                    onClick={() => router.push(`/remodel-application?listId=${targetList.id}`)}
                    className="px-3 py-1 bg-content-primary hover:bg-content-primary text-white rounded text-xs font-medium transition-colors border-0 cursor-pointer"
                  >
                    編集リストで処理
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* クローズ */}
        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-content-primary">リモデルクローズ</h3>
              <p className="text-xs text-content-sub mt-1 text-pretty">
                全資産の方針決定・新設置場所入力が完了するとクローズ可能になります。クローズすると個別部署マスタの旧→新切替が実行されます。
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={!canClose}
              title={canClose ? undefined : '上記の対応必要項目を解消してください'}
              className="px-5 py-2.5 bg-cta-primary hover:bg-cta-primary-dark disabled:bg-content-sub disabled:cursor-not-allowed text-white rounded-md font-semibold text-sm transition-colors border-0 cursor-pointer whitespace-nowrap"
            >
              {canClose ? 'リモデルをクローズ' : 'クローズ条件未達'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RemodelDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center bg-surface-screen"><p className="text-sm text-content-sub">読み込み中...</p></div>}>
      <DashboardContent />
    </Suspense>
  );
}
