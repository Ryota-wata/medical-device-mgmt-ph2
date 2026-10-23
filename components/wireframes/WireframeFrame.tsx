'use client';

import React, { useRef } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useWireframeBridge, type WireframeControl } from '@/lib/wireframes/useWireframeBridge';

/** 選択肢がこれ以下ならラジオボタン、超えたら SearchableSelect で出す */
const MAX_RADIO_OPTIONS = 5;

interface WireframeFrameProps {
  src: string;
  title: string;
  /** 連携アダプタがあるワイヤーだけ、操作欄を出す */
  hasAdapter: boolean;
}

function ControlInput({ control, onChange }: { control: WireframeControl; onChange: (value: string) => void }) {
  if (control.type === 'buttons') {
    // 画面切替はワイヤー内の画面遷移ボタンを押す操作なので、ボタンで出す
    return (
      <div className="flex flex-wrap gap-2" role="group" aria-label={control.label}>
        {control.options.map((o) => {
          const current = o.value === control.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-current={current ? 'page' : undefined}
              disabled={current}
              onClick={() => onChange(o.value)}
              className={`min-h-[44px] px-3 rounded text-sm border bg-white ${
                current
                  ? 'border-cta-primary text-content-primary font-semibold cursor-default'
                  : 'border-stroke-input text-content-primary hover:bg-bg-light'
              }`}
            >
              {current && <span className="sr-only">表示中: </span>}
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (control.options.length <= MAX_RADIO_OPTIONS) {
    return (
      <div className="flex flex-wrap gap-x-4" role="radiogroup" aria-label={control.label}>
        {control.options.map((o) => (
          <label key={o.value} className="inline-flex items-center gap-2 min-h-[44px] text-sm text-content-primary cursor-pointer">
            <input
              type="radio"
              name={`wf-control-${control.id}`}
              checked={o.value === control.value}
              onChange={() => onChange(o.value)}
              className="w-4 h-4"
            />
            {o.label}
          </label>
        ))}
      </div>
    );
  }

  const labelOf = (value: string) => control.options.find((o) => o.value === value)?.label ?? '';
  return (
    <div className="w-[280px]">
      <SearchableSelect
        value={labelOf(control.value)}
        onChange={(label) => {
          const option = control.options.find((o) => o.label === label);
          if (option) onChange(option.value);
        }}
        options={control.options.map((o) => o.label)}
      />
    </div>
  );
}

export function WireframeFrame({ src, title, hasAdapter }: WireframeFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const bridge = useWireframeBridge(iframeRef);
  const showPanel = hasAdapter && bridge.isReady;

  return (
    <>
      {showPanel && (
        <div className="px-4 lg:px-8 py-2 flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-stroke-card bg-bg-light">
          {bridge.controls.map((control) => (
            <div key={control.id} className="flex flex-wrap items-center gap-x-3">
              <span className="text-sm text-content-sub">{control.label}</span>
              <ControlInput control={control} onChange={(value) => bridge.setControl(control.id, value)} />
            </div>
          ))}
          {bridge.hasGuide && (
            <label className="inline-flex items-center gap-2 min-h-[44px] text-sm text-content-primary cursor-pointer">
              <input
                type="checkbox"
                checked={bridge.guideVisible}
                onChange={(e) => bridge.setGuideVisible(e.target.checked)}
                className="w-4 h-4"
              />
              顧客の説明書き（見出し・設計メモ）も表示する
            </label>
          )}
          {bridge.selection.length > 0 && (
            <p className="text-sm text-content-primary" aria-live="polite">
              ワイヤーで選択中 <span className="font-bold tabular-nums">{bridge.selection.length}</span> 件
            </p>
          )}
          {bridge.lastResult && (
            <p className="text-sm text-content-primary" aria-live="polite">
              「{bridge.lastResult.action}」を受信（対象 <span className="tabular-nums">{bridge.lastResult.items.length}</span> 件・
              {bridge.lastResult.receivedAt}）
            </p>
          )}
          {bridge.missingSelectors.length > 0 && (
            <p className="text-sm text-content-alert">
              ワイヤーの新しい版で要素が見つかりません: {bridge.missingSelectors.join('、')}（アダプタの見直しが必要）
            </p>
          )}
          {bridge.unknownNeeds.length > 0 && (
            <p className="text-sm text-content-alert">
              モック側に未登録のデータがあります: {bridge.unknownNeeds.join('、')}（lib/wireframes/dataSources.ts に追加が必要）
            </p>
          )}
        </div>
      )}
      <iframe ref={iframeRef} src={src} title={title} className="flex-1 w-full min-h-[600px] border-0 bg-white" />
    </>
  );
}
