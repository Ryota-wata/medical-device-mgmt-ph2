'use client';

import { useEffect, useState } from 'react';

/**
 * 顧客ワイヤーの一覧（scripts/sync-wireframes.mjs が public/wireframes/phase2/manifest.json に出力する）。
 * コピーは .gitignore 対象のため、同期していない環境（GitHub Pages 等）では manifest が存在しない。
 */
export type WireframeKind = 'interactive' | 'static' | 'document';

export interface WireframeEntry {
  /** 版数を除いたパス。版が上がっても変わらない */
  key: string;
  /** 正本フォルダからの相対パス */
  path: string;
  category: string;
  subCategory: string;
  fileName: string;
  screenName: string;
  version: string;
  kind: WireframeKind;
  adapter: string | null;
  sizeKB: number;
}

export interface WireframeManifest {
  syncedAt: string;
  source: {
    path: string;
    branch: string;
    commit: string;
    committedAt: string;
    uncommitted: string[];
  };
  wireframes: WireframeEntry[];
  warnings: string[];
}

export const WIREFRAME_KIND_LABEL: Record<WireframeKind, string> = {
  interactive: '操作できる',
  static: '静的な画面図',
  document: '説明資料',
};

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/wireframes/phase2`;

/** ワイヤー本体の URL（日本語・全角括弧を含むパスをエンコードする） */
export const wireframeUrl = (entry: WireframeEntry) =>
  `${BASE}/${entry.path.split('/').map(encodeURIComponent).join('/')}`;

/** 版数の比較（"1.10" > "1.9"）。版数のないものは最も古い扱い */
const compareVersion = (a: string, b: string) => {
  const pa = a ? a.split('.').map(Number) : [-1];
  const pb = b ? b.split('.').map(Number) : [-1];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

/**
 * key に対応するワイヤー。旧版を OLD に移し忘れて同じ key が複数ある場合は最新版を返す
 * （key は「版が上がっても URL が変わらない」ための識別子なので）
 */
export const findLatestByKey = (wireframes: WireframeEntry[], key: string) =>
  wireframes
    .filter((w) => w.key === key)
    .reduce<WireframeEntry | undefined>((latest, w) => (!latest || compareVersion(w.version, latest.version) > 0 ? w : latest), undefined);

export type ManifestState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; manifest: WireframeManifest };

export function useWireframeManifest(): ManifestState {
  const [state, setState] = useState<ManifestState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`${BASE}/manifest.json`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((manifest: WireframeManifest | null) => {
        if (cancelled) return;
        setState(manifest ? { status: 'ready', manifest } : { status: 'missing' });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'missing' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/** 日時を「2026-10-22 09:29」形式で表示する */
export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
