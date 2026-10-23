'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';

export interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
}

interface ActionDialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** 実行ボタン。キャンセルは自動で付ける（cancelLabel を null にすると付けない） */
  actions?: DialogAction[];
  cancelLabel?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const ACTION_CLASS: Record<NonNullable<DialogAction['variant']>, string> = {
  primary: 'bg-cta-primary text-white hover:bg-cta-primary-dark border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-transparent',
  secondary: 'bg-white text-content-primary border-stroke-input hover:bg-bg-light',
};

/** 施設マスタの確認・完了ダイアログ。本文に「この操作で起きること」を書き、ボタンは結果を表す動詞にする */
export function ActionDialog({ isOpen, title, onClose, children, actions = [], cancelLabel = 'キャンセル', size = 'sm' }: ActionDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="p-4 flex flex-col gap-3 text-sm text-content-primary text-pretty">{children}</div>
      <div className="px-4 pb-4 flex flex-wrap justify-end gap-2">
        {cancelLabel && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded-md border border-stroke-input bg-white text-sm font-semibold text-content-primary hover:bg-bg-light"
          >
            {cancelLabel}
          </button>
        )}
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            disabled={a.disabled}
            className={`min-h-[44px] px-4 rounded-md border text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${ACTION_CLASS[a.variant ?? 'primary']}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}

/** 本文中の注意書き（情報／警告） */
export function DialogNote({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'danger'; children: React.ReactNode }) {
  const cls =
    tone === 'warn'
      ? 'bg-amber-50 border-amber-200 text-amber-900'
      : tone === 'danger'
        ? 'bg-red-50 border-red-200 text-red-900'
        : 'bg-sky-50 border-sky-200 text-sky-900';
  return <div className={`border rounded-md px-3 py-2 text-pretty ${cls}`}>{children}</div>;
}
