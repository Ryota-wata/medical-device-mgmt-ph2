'use client';

import React from 'react';

export interface DashboardCardProps {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  severity?: 'normal' | 'warn' | 'alert' | 'ok';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const SEV_BORDER: Record<NonNullable<DashboardCardProps['severity']>, string> = {
  normal: 'border-stroke-card',
  warn: 'border-amber-300',
  alert: 'border-rose-300',
  ok: 'border-emerald-300',
};

const SEV_BG: Record<NonNullable<DashboardCardProps['severity']>, string> = {
  normal: 'bg-white',
  warn: 'bg-amber-50/30',
  alert: 'bg-rose-50/30',
  ok: 'bg-emerald-50/30',
};

const TREND_COLOR = {
  up: 'text-rose-600',
  down: 'text-emerald-600',
  flat: 'text-stone-500',
} as const;

const TREND_ARROW = { up: '▲', down: '▼', flat: '—' } as const;

export const DashboardCard: React.FC<DashboardCardProps> = ({
  label,
  value,
  unit,
  hint,
  trend,
  severity = 'normal',
  icon,
  onClick,
}) => {
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      className={`text-left ${SEV_BG[severity]} border ${SEV_BORDER[severity]} rounded-lg p-4 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs text-content-sub font-medium text-balance">
          {label}
        </span>
        {icon && (
          <span className="text-content-sub" aria-hidden>
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-bold tabular-nums leading-none text-content-primary">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-content-sub font-medium">{unit}</span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3 text-xs">
        {trend && (
          <span className={`inline-flex items-center gap-0.5 ${TREND_COLOR[trend.direction]}`}>
            <span aria-hidden>{TREND_ARROW[trend.direction]}</span>
            <span>{trend.label}</span>
          </span>
        )}
        {hint && <span className="text-content-sub text-pretty">{hint}</span>}
      </div>
    </Wrapper>
  );
};

export interface SimpleBarChartDatum {
  label: string;
  value: number;
  hint?: string;
}

export const SimpleBarChart: React.FC<{
  data: SimpleBarChartDatum[];
  max?: number;
  unit?: string;
  highlightIndex?: number;
}> = ({ data, max, unit, highlightIndex }) => {
  const m = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d, idx) => {
        const ratio = (d.value / m) * 100;
        const isHi = idx === highlightIndex;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex-1 flex items-end">
              <div
                className={`w-full rounded-t ${isHi ? 'bg-emerald-500' : 'bg-emerald-300'}`}
                style={{ height: `${ratio}%`, minHeight: 4 }}
                aria-hidden
              />
            </div>
            <span className="text-xs tabular-nums font-semibold text-content-primary">
              {d.value}
              {unit && <span className="text-content-sub font-normal">{unit}</span>}
            </span>
            <span className="text-[11px] text-content-sub">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export const HorizontalBar: React.FC<{
  label: string;
  value: number;
  max: number;
  color?: 'emerald' | 'amber' | 'rose' | 'sky';
  rightText?: string;
}> = ({ label, value, max, color = 'emerald', rightText }) => {
  const ratio = Math.min(100, (value / max) * 100);
  const colorClass = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    sky: 'bg-sky-500',
  }[color];
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 text-xs text-content-primary truncate">{label}</span>
      <div className="flex-1 h-4 bg-surface-screen rounded">
        <div
          className={`h-full rounded ${colorClass}`}
          style={{ width: `${ratio}%` }}
          aria-hidden
        />
      </div>
      <span className="w-20 text-right text-xs tabular-nums text-content-primary font-medium">
        {rightText ?? `${value}/${max}`}
      </span>
    </div>
  );
};
