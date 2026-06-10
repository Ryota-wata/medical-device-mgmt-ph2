'use client';

import React from 'react';
import { X, ChevronRight, Sparkles } from 'lucide-react';

export interface MenuChoiceItem {
  /** メニュー識別子 */
  key: string;
  /** 表示ラベル */
  label: string;
  /** 詳細説明 */
  description: string;
  /** 遷移先 or アクション */
  onSelect: () => void;
  /** Ph1既存 / Ph2新規 のバッジ */
  badge?: 'Ph1' | 'Ph2' | 'Ph2 拡張';
  /** アイコン */
  icon?: React.ReactNode;
  /** 無効化 */
  disabled?: boolean;
  /** 推奨フラグ */
  recommended?: boolean;
}

export interface MenuChoiceModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  items: MenuChoiceItem[];
}

const BADGE_STYLE: Record<NonNullable<MenuChoiceItem['badge']>, string> = {
  'Ph1': 'bg-stone-100 text-stone-700 border-stone-200',
  'Ph2': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Ph2 拡張': 'bg-sky-50 text-sky-700 border-sky-200',
};

export const MenuChoiceModal: React.FC<MenuChoiceModalProps> = ({
  open,
  onClose,
  title,
  description,
  items,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="menu-choice-title"
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-stroke-card">
          <div>
            <h2
              id="menu-choice-title"
              className="text-lg font-semibold text-content-primary"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-content-sub text-pretty">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="p-1 rounded text-content-sub hover:bg-surface-screen border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (!it.disabled) {
                      it.onSelect();
                      onClose();
                    }
                  }}
                  disabled={it.disabled}
                  className={`w-full text-left p-4 border rounded-lg transition-all cursor-pointer ${
                    it.disabled
                      ? 'border-stroke-card bg-stone-50 opacity-50 cursor-default'
                      : it.recommended
                        ? 'border-cta-primary bg-emerald-50/30 hover:shadow-md'
                        : 'border-stroke-card bg-white hover:border-cta-primary hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {it.icon && (
                      <span className="shrink-0 inline-flex items-center justify-center size-10 rounded-md bg-emerald-50 text-emerald-700">
                        {it.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-content-primary text-balance">
                          {it.label}
                        </span>
                        {it.recommended && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0 text-[10px] font-semibold rounded bg-cta-primary text-white">
                            <Sparkles className="w-2.5 h-2.5" aria-hidden />
                            推奨
                          </span>
                        )}
                        {it.badge && (
                          <span
                            className={`inline-flex items-center px-1.5 py-0 text-[10px] font-semibold rounded border ${BADGE_STYLE[it.badge]}`}
                          >
                            {it.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-content-sub text-pretty">{it.description}</p>
                    </div>
                    {!it.disabled && (
                      <ChevronRight className="w-4 h-4 text-content-sub shrink-0 mt-0.5" aria-hidden />
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
