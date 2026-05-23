'use client';

import React, { useEffect, useRef } from 'react';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  variant = 'default',
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      confirmButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    default: 'bg-emerald-500 hover:bg-emerald-600',
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden"
      >
        <div className="p-6">
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-slate-800 mb-2 text-balance"
          >
            {title}
          </h2>
          <p className="text-slate-600 text-sm text-pretty">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 text-slate-700 border-0 rounded-md cursor-pointer text-sm font-semibold transition-colors hover:bg-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 text-white border-0 rounded-md cursor-pointer text-sm font-semibold transition-colors ${variantStyles[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
