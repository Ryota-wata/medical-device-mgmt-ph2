'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className ?? ''}`}
    >
      <div className="text-content-sub mb-3">
        {icon ?? <Inbox size={48} strokeWidth={1.5} />}
      </div>

      <h3 className="text-base font-bold text-content-primary mb-1 text-balance">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-content-sub mb-4 max-w-[320px] text-pretty">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2 bg-cta-primary text-white rounded text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
