'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Search } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';
import {
  formatDateTime,
  useWireframeManifest,
  WIREFRAME_KIND_LABEL,
  type WireframeEntry,
  type WireframeKind,
} from '@/lib/wireframes/manifest';

const KIND_ORDER: WireframeKind[] = ['interactive', 'static', 'document'];

const KIND_BADGE: Record<WireframeKind, string> = {
  interactive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  static: 'bg-sky-50 text-sky-700 border-sky-200',
  document: 'bg-stone-100 text-stone-600 border-stone-200',
};

const SYNC_COMMAND = 'npm run wireframes:sync';

export default function WireframeListPage() {
  const router = useRouter();
  const state = useWireframeManifest();
  const [keyword, setKeyword] = useState('');
  const [kinds, setKinds] = useState<Set<WireframeKind>>(new Set(KIND_ORDER));

  const wireframes = useMemo(() => (state.status === 'ready' ? state.manifest.wireframes : []), [state]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return wireframes.filter(
      (w) =>
        kinds.has(w.kind) &&
        (!kw || `${w.screenName} ${w.fileName} ${w.category} ${w.subCategory}`.toLowerCase().includes(kw)),
    );
  }, [wireframes, keyword, kinds]);

  const groups = useMemo(() => {
    const map = new Map<string, WireframeEntry[]>();
    for (const w of filtered) map.set(w.category, [...(map.get(w.category) ?? []), w]);
    return [...map.entries()];
  }, [filtered]);

  const toggleKind = (kind: WireframeKind, checked: boolean) => {
    setKinds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(kind);
      else next.delete(kind);
      return next;
    });
  };

  const clearFilters = () => {
    setKeyword('');
    setKinds(new Set(KIND_ORDER));
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      <AppHeader />

      <main className="flex-1 flex flex-col gap-6 px-4 lg:px-8 py-6 max-w-[1200px] w-full mx-auto">
        {/* パンくず・タイトル */}
        <div>
          <div className="flex items-center gap-2 text-xs text-content-sub mb-1">
            <button onClick={() => router.push('/main')} className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0">
              メイン
            </button>
            <span>/</span>
            <button onClick={() => router.push('/ph2')} className="hover:text-content-link bg-transparent border-0 cursor-pointer p-0">
              Ph2 提案機能
            </button>
            <span>/</span>
            <span>顧客ワイヤー</span>
          </div>
          <h1 className="text-2xl font-bold text-content-primary text-balance">顧客ワイヤー一覧</h1>
          <p className="text-sm text-content-sub mt-1 text-pretty max-w-[760px]">
            顧客が作成した Phase2 画面設計（HTML ワイヤー）を、モックの中で開いて確認できます。ワイヤーの内容は正本から取り込んだもので、モック側では書き換えていません。
          </p>
        </div>

        {state.status === 'loading' && <p className="text-sm text-content-sub">ワイヤーの一覧を読み込み中です。</p>}

        {state.status === 'missing' && (
          <section className="bg-surface-card border border-stroke-card rounded-lg p-6 flex flex-col gap-3 max-w-[760px]">
            <h2 className="text-lg font-bold text-content-primary">ワイヤーがまだ取り込まれていません</h2>
            <p className="text-sm text-content-primary text-pretty">
              顧客ワイヤーは公開せずローカルでのみ確認する運用のため、この環境にはコピーがありません。正本（ship_sams-project）を最新化してから、モックのフォルダで次のコマンドを実行してください。
            </p>
            <code className="self-start bg-bg-light border border-stroke-card rounded px-3 py-2 text-sm font-mono">{SYNC_COMMAND}</code>
          </section>
        )}

        {state.status === 'ready' && (
          <>
            {/* 取込元 */}
            <section className="bg-surface-card border border-stroke-card rounded-lg p-4 flex flex-col gap-2">
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr] max-w-[900px]">
                <dt className="text-content-sub">正本</dt>
                <dd className="text-content-primary tabular-nums">
                  ship_sams-project {state.manifest.source.branch} @ {state.manifest.source.commit}（{formatDateTime(state.manifest.source.committedAt)} のコミット）
                </dd>
                <dt className="text-content-sub">取込日時</dt>
                <dd className="text-content-primary tabular-nums">{formatDateTime(state.manifest.syncedAt)}</dd>
              </dl>
              {state.manifest.warnings.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-content-alert inline-flex items-center gap-1 min-h-[44px]">
                    <AlertTriangle className="w-4 h-4" aria-hidden />
                    取込時の警告 {state.manifest.warnings.length} 件
                  </summary>
                  <ul className="mt-1 flex flex-col gap-1 pl-5 list-disc text-content-primary">
                    {state.manifest.warnings.map((w) => (
                      <li key={w} className="text-pretty">{w}</li>
                    ))}
                  </ul>
                </details>
              )}
            </section>

            {/* 絞込 */}
            <section className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <label className="flex flex-col gap-1 text-sm text-content-primary">
                キーワード
                <span className="relative">
                  <Search className="w-4 h-4 text-content-sub absolute left-2 top-1/2 -translate-y-1/2" aria-hidden />
                  <input
                    type="search"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="画面名・ファイル名"
                    className="w-[280px] h-10 pl-8 pr-2 border border-stroke-input rounded bg-white text-sm"
                  />
                </span>
              </label>
              <fieldset className="flex flex-col gap-1">
                <legend className="text-sm text-content-primary mb-1">種別</legend>
                <div className="flex flex-wrap gap-x-4">
                  {KIND_ORDER.map((kind) => (
                    <label key={kind} className="inline-flex items-center gap-2 min-h-[44px] text-sm text-content-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={kinds.has(kind)}
                        onChange={(e) => toggleKind(kind, e.target.checked)}
                        className="w-4 h-4"
                      />
                      {WIREFRAME_KIND_LABEL[kind]}
                      <span className="text-content-sub tabular-nums">
                        （{wireframes.filter((w) => w.kind === kind).length}）
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="text-sm text-content-sub pb-3 tabular-nums">
                {filtered.length} / {wireframes.length} 本を表示
              </p>
            </section>

            {groups.length === 0 ? (
              <section className="bg-surface-card border border-stroke-card rounded-lg p-6 flex flex-col items-start gap-3">
                <p className="text-sm text-content-primary">条件に合うワイヤーがありません。キーワードや種別を見直してください。</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="min-h-[44px] px-4 border border-stroke-input rounded bg-white text-sm text-content-primary hover:bg-bg-light"
                >
                  絞込を解除
                </button>
              </section>
            ) : (
              groups.map(([category, items]) => (
                <section key={category} className="flex flex-col gap-2">
                  <h2 className="text-base font-bold text-content-primary">
                    {category}
                    <span className="ml-2 text-sm font-normal text-content-sub tabular-nums">{items.length} 本</span>
                  </h2>
                  <div className="overflow-x-auto bg-surface-card border border-stroke-card rounded-lg">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-bg-light text-content-sub text-xs">
                        <tr>
                          <th className="text-left font-semibold px-4 py-2">画面名</th>
                          <th className="text-left font-semibold px-4 py-2 w-[220px]">フォルダ</th>
                          <th className="text-left font-semibold px-4 py-2 w-[120px]">種別</th>
                          <th className="text-right font-semibold px-4 py-2 w-[72px]">版</th>
                          <th className="text-right font-semibold px-4 py-2 w-[96px]">サイズ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((w) => (
                          <tr key={w.path} className="border-t border-stroke-card hover:bg-bg-light">
                            <td className="px-4 py-1">
                              <Link
                                href={`/ph2-wireframes/view?key=${encodeURIComponent(w.key)}`}
                                className="inline-flex items-center min-h-[44px] text-content-link hover:underline text-pretty"
                              >
                                {w.screenName}
                              </Link>
                            </td>
                            <td className="px-4 py-1 text-content-sub text-pretty">{w.subCategory || '—'}</td>
                            <td className="px-4 py-1">
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded border ${KIND_BADGE[w.kind]}`}>
                                {WIREFRAME_KIND_LABEL[w.kind]}
                              </span>
                            </td>
                            <td className="px-4 py-1 text-right tabular-nums text-content-primary">{w.version || '—'}</td>
                            <td className="px-4 py-1 text-right tabular-nums text-content-sub">{w.sizeKB.toLocaleString()} KB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </main>
    </div>
  );
}
