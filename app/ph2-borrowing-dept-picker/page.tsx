'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  Clock,
  Search,
  Star,
  StarOff,
  TrendingUp,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  parent: string;
  floor: string;
  usageCount: number;
  lastUsedAt?: string;
}

const ALL_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'ICU', parent: '集中治療部門', floor: '東棟3F', usageCount: 152, lastUsedAt: '2026-05-22' },
  { id: 'd2', name: 'CCU', parent: '集中治療部門', floor: '東棟3F', usageCount: 98, lastUsedAt: '2026-05-23' },
  { id: 'd3', name: 'HCU', parent: '集中治療部門', floor: '東棟3F', usageCount: 64 },
  { id: 'd4', name: '手術室1', parent: '手術部門', floor: '南棟2F', usageCount: 188, lastUsedAt: '2026-05-23' },
  { id: 'd5', name: '手術室2', parent: '手術部門', floor: '南棟2F', usageCount: 175 },
  { id: 'd6', name: '手術室3', parent: '手術部門', floor: '南棟2F', usageCount: 92 },
  { id: 'd7', name: '内視鏡室', parent: '検査部門', floor: '西棟1F', usageCount: 124, lastUsedAt: '2026-05-21' },
  { id: 'd8', name: 'カテ室', parent: '検査部門', floor: '西棟1F', usageCount: 78 },
  { id: 'd9', name: '透析室', parent: '透析部門', floor: '北棟2F', usageCount: 56 },
  { id: 'd10', name: '一般病棟 4東', parent: '入院部門', floor: '東棟4F', usageCount: 32 },
  { id: 'd11', name: '一般病棟 4西', parent: '入院部門', floor: '西棟4F', usageCount: 28 },
  { id: 'd12', name: '小児病棟', parent: '入院部門', floor: '北棟3F', usageCount: 18 },
  { id: 'd13', name: '産科病棟', parent: '入院部門', floor: '北棟4F', usageCount: 22 },
  { id: 'd14', name: 'NICU', parent: '集中治療部門', floor: '北棟3F', usageCount: 41, lastUsedAt: '2026-05-20' },
  { id: 'd15', name: '救急処置室', parent: '救急部門', floor: '南棟1F', usageCount: 89, lastUsedAt: '2026-05-23' },
  { id: 'd16', name: '外来 内科', parent: '外来部門', floor: '本館1F', usageCount: 14 },
  { id: 'd17', name: '外来 整形外科', parent: '外来部門', floor: '本館1F', usageCount: 11 },
  { id: 'd18', name: '画像診断室', parent: '検査部門', floor: '西棟B1F', usageCount: 36 },
];

const DEFAULT_FAVORITES = new Set(['d1', 'd4', 'd7']);

const RECENT_IDS = ['d2', 'd4', 'd15', 'd7', 'd1'];

type ViewMode = 'favorites' | 'frequent' | 'recent' | 'all';

export default function BorrowingDeptPickerPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(DEFAULT_FAVORITES);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('favorites');
  const [selected, setSelected] = useState<Department | null>(null);

  const toggleFav = (id: string) => {
    const next = new Set(favorites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavorites(next);
  };

  const filteredAll = useMemo(() => {
    if (!search.trim()) return ALL_DEPARTMENTS;
    const q = search.trim().toLowerCase();
    return ALL_DEPARTMENTS.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.parent.toLowerCase().includes(q) ||
        d.floor.toLowerCase().includes(q),
    );
  }, [search]);

  const lists: Record<ViewMode, Department[]> = useMemo(() => {
    const favs = filteredAll.filter((d) => favorites.has(d.id));
    const sorted = [...filteredAll].sort((a, b) => b.usageCount - a.usageCount);
    const recent = RECENT_IDS.map((id) => filteredAll.find((d) => d.id === id)).filter(
      (d): d is Department => !!d,
    );
    return {
      favorites: favs,
      frequent: sorted,
      recent,
      all: filteredAll,
    };
  }, [filteredAll, favorites]);

  const visible = lists[view];

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
            <span>貸出先 部署選択ピッカー</span>
          </div>
          <h1 className="text-[24px] font-bold text-content-primary text-balance inline-flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" aria-hidden />
            貸出時 部署選択ピッカー（最適化）(S16)
          </h1>
          <p className="mt-1 text-sm text-content-sub text-pretty max-w-3xl">
            「担当者不要・部署選択のみ」運用の最適化。お気に入り / 最頻使用順 / 直近選択順 / 検索で素早く選択。
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* ピッカー（メイン） */}
          <section className="lg:col-span-2 bg-white border border-stroke-card rounded-lg">
            {/* 検索 + ビュー切替 */}
            <div className="p-4 border-b border-stroke-card">
              <div className="relative mb-3">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-sub"
                  aria-hidden
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="部署名 / 親部門 / フロアで検索"
                  className="w-full h-10 pl-9 pr-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link bg-white text-content-primary placeholder:text-content-placeholder"
                  aria-label="部署検索"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setView('favorites')}
                  className={`h-9 px-3 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    view === 'favorites'
                      ? 'bg-cta-primary text-white border-cta-primary'
                      : 'bg-white text-content-primary border-stroke-input hover:bg-surface-screen'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" aria-hidden />
                  お気に入り ({lists.favorites.length})
                </button>
                <button
                  type="button"
                  onClick={() => setView('recent')}
                  className={`h-9 px-3 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    view === 'recent'
                      ? 'bg-cta-primary text-white border-cta-primary'
                      : 'bg-white text-content-primary border-stroke-input hover:bg-surface-screen'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" aria-hidden />
                  直近選択
                </button>
                <button
                  type="button"
                  onClick={() => setView('frequent')}
                  className={`h-9 px-3 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    view === 'frequent'
                      ? 'bg-cta-primary text-white border-cta-primary'
                      : 'bg-white text-content-primary border-stroke-input hover:bg-surface-screen'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden />
                  最頻使用順
                </button>
                <button
                  type="button"
                  onClick={() => setView('all')}
                  className={`h-9 px-3 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    view === 'all'
                      ? 'bg-cta-primary text-white border-cta-primary'
                      : 'bg-white text-content-primary border-stroke-input hover:bg-surface-screen'
                  }`}
                >
                  全部署 ({lists.all.length})
                </button>
              </div>
            </div>

            {/* リスト */}
            <ul className="divide-y divide-stroke-card max-h-[540px] overflow-y-auto">
              {visible.length === 0 ? (
                <li className="p-10 text-center text-sm text-content-sub">
                  該当する部署はありません
                </li>
              ) : (
                visible.map((d, idx) => (
                  <li key={d.id} className="flex items-center gap-2 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleFav(d.id)}
                      aria-label={favorites.has(d.id) ? `${d.name} をお気に入り解除` : `${d.name} をお気に入り登録`}
                      className="p-1.5 rounded hover:bg-surface-screen bg-transparent border-0 cursor-pointer text-content-sub"
                    >
                      {favorites.has(d.id) ? (
                        <Star className="w-4 h-4 fill-amber-400 text-amber-500" aria-hidden />
                      ) : (
                        <StarOff className="w-4 h-4" aria-hidden />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelected(d)}
                      className={`flex-1 text-left px-3 py-1.5 rounded-md transition-colors cursor-pointer border-0 ${
                        selected?.id === d.id
                          ? 'bg-emerald-50 border border-emerald-300'
                          : 'bg-transparent hover:bg-surface-screen'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-content-primary">
                            {d.name}
                          </div>
                          <div className="text-xs text-content-sub">
                            {d.parent} · {d.floor}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                          {view === 'recent' && (
                            <span className="text-content-sub">直近 #{idx + 1}</span>
                          )}
                          {(view === 'frequent' || view === 'all') && (
                            <span className="inline-flex items-center gap-1 text-content-sub">
                              <TrendingUp className="w-3 h-3" aria-hidden />
                              <span className="tabular-nums">{d.usageCount}</span>
                            </span>
                          )}
                          {d.lastUsedAt && view !== 'frequent' && (
                            <span className="text-content-sub tabular-nums">
                              {d.lastUsedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* 選択結果 + 確認 */}
          <section className="bg-white border border-stroke-card rounded-lg p-5">
            <h2 className="text-sm font-semibold text-content-primary mb-3">
              選択中
            </h2>
            {selected ? (
              <>
                <div className="border border-emerald-300 bg-emerald-50/40 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden />
                    <span className="text-base font-semibold text-content-primary">
                      {selected.name}
                    </span>
                  </div>
                  <div className="text-xs text-content-sub">
                    {selected.parent} · {selected.floor}
                  </div>
                  <div className="text-xs text-content-sub mt-1 tabular-nums">
                    過去利用回数: {selected.usageCount} 回
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full h-10 px-4 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer mb-2"
                >
                  この部署で貸出を続行
                </button>
                <button
                  type="button"
                  onClick={() => toggleFav(selected.id)}
                  className="w-full h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {favorites.has(selected.id) ? (
                    <>
                      <StarOff className="w-4 h-4" aria-hidden />
                      お気に入りから外す
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" aria-hidden />
                      お気に入りに追加
                    </>
                  )}
                </button>
              </>
            ) : (
              <p className="text-sm text-content-sub text-pretty">
                左の一覧から貸出先部署を選択してください
              </p>
            )}

            <div className="mt-5 pt-4 border-t border-stroke-card">
              <h3 className="text-xs font-semibold text-content-primary mb-2">
                ユーザー単位の最適化
              </h3>
              <ul className="space-y-1 text-xs text-content-sub list-disc pl-5 text-pretty">
                <li>お気に入りはユーザーごとに保存（{favorites.size} 件）</li>
                <li>最頻使用順は過去 3 ヶ月の貸出履歴から集計</li>
                <li>直近選択は最新 5 件まで保持</li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
