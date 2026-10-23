'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { buildWireframePayload } from './dataSources';

/**
 * 顧客ワイヤー（iframe）との受け渡し（親側）。ワイヤー側は public/wireframe-bridge/bridge.js。
 * メッセージ形式は bridge.js 冒頭のコメントを参照。
 */
export interface WireframeControlOption {
  value: string;
  label: string;
}

export interface WireframeControl {
  id: string;
  label: string;
  /** select: 値を選ぶ（ロール等） / buttons: 押すボタンを選ぶ（画面切替） */
  type: 'select' | 'buttons';
  value: string;
  options: WireframeControlOption[];
}

export interface WireframeResult {
  action: string;
  items: Record<string, unknown>[];
  receivedAt: string;
}

type IncomingMessage =
  | {
      type: 'wf:ready';
      wireframeId: string;
      needs: string[];
      hasGuide: boolean;
      controls: WireframeControl[];
      missingSelectors: string[];
    }
  | { type: 'wf:controls'; wireframeId: string; controls: WireframeControl[] }
  | { type: 'wf:selection'; wireframeId: string; items: Record<string, unknown>[] }
  | { type: 'wf:result'; wireframeId: string; action: string; items: Record<string, unknown>[] };

const post = (iframe: HTMLIFrameElement | null, message: Record<string, unknown>) => {
  iframe?.contentWindow?.postMessage(message, window.location.origin);
};

export function useWireframeBridge(iframeRef: RefObject<HTMLIFrameElement | null>) {
  const [isReady, setIsReady] = useState(false);
  const [hasGuide, setHasGuide] = useState(false);
  const [guideVisible, setGuideVisibleState] = useState(false);
  const [controls, setControls] = useState<WireframeControl[]>([]);
  const [unknownNeeds, setUnknownNeeds] = useState<string[]>([]);
  const [missingSelectors, setMissingSelectors] = useState<string[]>([]);
  const [selection, setSelection] = useState<Record<string, unknown>[]>([]);
  const [lastResult, setLastResult] = useState<WireframeResult | null>(null);

  // iframe を開き直したとき（wf:ready の再受信）にも、現在の説明表示の設定を送り直すため
  const guideVisibleRef = useRef(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent<IncomingMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      switch (msg.type) {
        case 'wf:ready': {
          setIsReady(true);
          setHasGuide(msg.hasGuide);
          setControls(msg.controls);
          setMissingSelectors(msg.missingSelectors ?? []);
          setSelection([]);
          const { payload, unknownNeeds: unknown } = buildWireframePayload(msg.needs);
          setUnknownNeeds(unknown);
          if (msg.needs.length) post(iframeRef.current, { type: 'wf:data', payload });
          post(iframeRef.current, { type: 'wf:guide', visible: guideVisibleRef.current });
          break;
        }
        case 'wf:controls':
          setControls(msg.controls);
          break;
        case 'wf:selection':
          setSelection(msg.items);
          break;
        case 'wf:result':
          setLastResult({ action: msg.action, items: msg.items, receivedAt: new Date().toLocaleTimeString('ja-JP') });
          break;
      }
    };
    window.addEventListener('message', onMessage);
    // ハイドレーション前にワイヤーの wf:ready が届いていた場合に備えて再要求する
    post(iframeRef.current, { type: 'wf:ping' });
    return () => window.removeEventListener('message', onMessage);
  }, [iframeRef]);

  const setGuideVisible = useCallback(
    (visible: boolean) => {
      guideVisibleRef.current = visible;
      setGuideVisibleState(visible);
      post(iframeRef.current, { type: 'wf:guide', visible });
    },
    [iframeRef],
  );

  const setControl = useCallback(
    (id: string, value: string) => {
      post(iframeRef.current, { type: 'wf:control', id, value });
    },
    [iframeRef],
  );

  return {
    isReady,
    hasGuide,
    guideVisible,
    setGuideVisible,
    controls,
    setControl,
    unknownNeeds,
    missingSelectors,
    selection,
    lastResult,
  };
}
