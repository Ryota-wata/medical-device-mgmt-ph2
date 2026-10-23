'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { AppHeader } from '@/components/layouts/AppHeader';
import { WireframeFrame } from '@/components/wireframes/WireframeFrame';
import { findLatestByKey, useWireframeManifest, wireframeUrl, WIREFRAME_KIND_LABEL } from '@/lib/wireframes/manifest';

const BACK_LINK_CLASS =
  'inline-flex items-center gap-1 min-h-[44px] px-3 border border-stroke-input rounded bg-white text-sm text-content-primary hover:bg-bg-light';

function WireframeViewer() {
  const key = useSearchParams().get('key') ?? '';
  const state = useWireframeManifest();

  if (state.status === 'loading') {
    return <p className="px-4 lg:px-8 py-6 text-sm text-content-sub">ワイヤーを読み込み中です。</p>;
  }

  const entry = state.status === 'ready' ? findLatestByKey(state.manifest.wireframes, key) : undefined;

  if (!entry) {
    return (
      <section className="mx-4 lg:mx-8 my-6 bg-surface-card border border-stroke-card rounded-lg p-6 flex flex-col items-start gap-3 max-w-[760px]">
        <h1 className="text-lg font-bold text-content-primary">ワイヤーが見つかりません</h1>
        <p className="text-sm text-content-primary text-pretty">
          {state.status === 'missing'
            ? 'この環境にはワイヤーが取り込まれていません。一覧画面の案内に沿って取り込んでください。'
            : '正本から削除されたか、フォルダが移動した可能性があります。一覧から開き直してください。'}
        </p>
        <Link href="/ph2-wireframes" className={BACK_LINK_CLASS}>
          <ArrowLeft className="w-4 h-4" aria-hidden />
          一覧へ戻る
        </Link>
      </section>
    );
  }

  const src = wireframeUrl(entry);

  return (
    <>
      <div className="px-4 lg:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-stroke-card bg-surface-card">
        <Link href="/ph2-wireframes" className={BACK_LINK_CLASS}>
          <ArrowLeft className="w-4 h-4" aria-hidden />
          一覧へ戻る
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-content-sub">
            {entry.category}
            {entry.subCategory && ` / ${entry.subCategory}`}
          </p>
          <h1 className="text-lg font-bold text-content-primary text-balance">{entry.screenName}</h1>
        </div>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <div className="flex gap-1">
            <dt className="text-content-sub">版</dt>
            <dd className="text-content-primary tabular-nums">{entry.version || '—'}</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-content-sub">種別</dt>
            <dd className="text-content-primary">{WIREFRAME_KIND_LABEL[entry.kind]}</dd>
          </div>
          <div className="flex gap-1 min-w-0">
            <dt className="text-content-sub">ファイル</dt>
            <dd className="text-content-primary break-all">{entry.fileName}</dd>
          </div>
        </dl>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 min-h-[44px] text-sm text-content-link hover:underline"
        >
          新しいタブで開く
          <ExternalLink className="w-4 h-4" aria-hidden />
        </a>
      </div>
      <WireframeFrame key={src} src={src} title={entry.fileName} hasAdapter={entry.adapter !== null} />
    </>
  );
}

export default function WireframeViewPage() {
  return (
    <div className="h-dvh flex flex-col bg-surface-screen">
      <AppHeader />
      <Suspense fallback={<p className="px-4 lg:px-8 py-6 text-sm text-content-sub">ワイヤーを読み込み中です。</p>}>
        <WireframeViewer />
      </Suspense>
    </div>
  );
}
