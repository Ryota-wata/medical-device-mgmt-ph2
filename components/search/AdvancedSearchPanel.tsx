'use client';

import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export interface AdvancedSearchValues {
  /** 取引年月日 From (YYYY-MM-DD) */
  dateFrom: string;
  /** 取引年月日 To (YYYY-MM-DD) */
  dateTo: string;
  /** 金額 From (整数, 空文字なら未指定) */
  amountFrom: string;
  /** 金額 To */
  amountTo: string;
  /** 取引先 部分一致 */
  vendor: string;
  /** 申請種別（任意） */
  applicationType?: string;
  /** ステータス（任意） */
  status?: string;
}

export const EMPTY_ADVANCED_SEARCH_VALUES: AdvancedSearchValues = {
  dateFrom: '',
  dateTo: '',
  amountFrom: '',
  amountTo: '',
  vendor: '',
  applicationType: '',
  status: '',
};

export interface AdvancedSearchPanelProps {
  values: AdvancedSearchValues;
  onChange: (next: AdvancedSearchValues) => void;
  onApply: () => void;
  onReset: () => void;
  applicationTypeOptions?: string[];
  statusOptions?: string[];
  showApplicationType?: boolean;
  showStatus?: boolean;
  /** 初期展開状態 */
  defaultOpen?: boolean;
  /** 現在アクティブな条件数（バッジ表示） */
  activeFilterCount?: number;
}

const labelClass = 'block text-xs font-medium text-content-primary mb-1';
const inputBase =
  'h-10 px-3 text-sm border border-stroke-input rounded-lg outline-none focus:border-content-link transition-colors bg-white text-content-primary placeholder:text-content-placeholder';

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  values,
  onChange,
  onApply,
  onReset,
  applicationTypeOptions = [],
  statusOptions = [],
  showApplicationType = false,
  showStatus = false,
  defaultOpen = false,
  activeFilterCount,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  const update = <K extends keyof AdvancedSearchValues>(
    key: K,
    v: AdvancedSearchValues[K],
  ) => {
    onChange({ ...values, [key]: v });
  };

  const handleAmountChange = (
    key: 'amountFrom' | 'amountTo',
    raw: string,
  ) => {
    // 数値のみ許容（カンマ・桁区切りは表示時のみ）
    const cleaned = raw.replace(/[^0-9]/g, '');
    update(key, cleaned);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply();
  };

  return (
    <section
      className="bg-white border border-stroke-card rounded-lg"
      aria-label="高度検索ペイン"
    >
      {/* ヘッダ（折りたたみトグル） */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-transparent border-0 cursor-pointer"
        aria-expanded={open}
        aria-controls="advanced-search-body"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-content-primary">
            高度検索（電帳法準拠）
          </span>
          {typeof activeFilterCount === 'number' && activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-semibold rounded-full bg-cta-primary text-white tabular-nums">
              {activeFilterCount}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-content-sub" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-content-sub" aria-hidden />
        )}
      </button>

      {open && (
        <form
          id="advanced-search-body"
          onSubmit={onSubmit}
          className="px-4 pb-4 border-t border-stroke-card"
        >
          {/* グリッド: 1行3項目（CLAUDE.md §2 密度ルール） */}
          <div className="mt-4 grid gap-x-4 gap-y-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* 取引年月日 範囲 */}
            <div className="lg:col-span-2">
              <span className={labelClass}>取引年月日（範囲）</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={values.dateFrom}
                  onChange={(e) => update('dateFrom', e.target.value)}
                  className={`${inputBase} w-[170px]`}
                  aria-label="取引年月日 開始"
                />
                <span className="text-sm text-content-sub">〜</span>
                <input
                  type="date"
                  value={values.dateTo}
                  onChange={(e) => update('dateTo', e.target.value)}
                  className={`${inputBase} w-[170px]`}
                  aria-label="取引年月日 終了"
                />
              </div>
            </div>

            {/* 取引先（部分一致） */}
            <div>
              <label htmlFor="adv-vendor" className={labelClass}>
                取引先（部分一致）
              </label>
              <input
                id="adv-vendor"
                type="text"
                value={values.vendor}
                onChange={(e) => update('vendor', e.target.value)}
                placeholder="例: 〇〇商事"
                className={`${inputBase} w-[280px] max-w-full`}
              />
            </div>

            {/* 金額 範囲 */}
            <div className="lg:col-span-2">
              <span className={labelClass}>金額（円・範囲）</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.amountFrom}
                  onChange={(e) => handleAmountChange('amountFrom', e.target.value)}
                  placeholder="下限"
                  className={`${inputBase} w-[140px] text-right tabular-nums`}
                  aria-label="金額 下限"
                />
                <span className="text-sm text-content-sub">〜</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={values.amountTo}
                  onChange={(e) => handleAmountChange('amountTo', e.target.value)}
                  placeholder="上限"
                  className={`${inputBase} w-[140px] text-right tabular-nums`}
                  aria-label="金額 上限"
                />
              </div>
            </div>

            {/* 申請種別 */}
            {showApplicationType && (
              <div>
                <span className={labelClass}>申請種別</span>
                <SearchableSelect
                  value={values.applicationType ?? ''}
                  onChange={(v) => update('applicationType', v)}
                  options={applicationTypeOptions}
                  placeholder="すべて"
                  dropdownMinWidth="200px"
                />
              </div>
            )}

            {/* ステータス */}
            {showStatus && (
              <div>
                <span className={labelClass}>ステータス</span>
                <SearchableSelect
                  value={values.status ?? ''}
                  onChange={(v) => update('status', v)}
                  options={statusOptions}
                  placeholder="すべて"
                  dropdownMinWidth="200px"
                />
              </div>
            )}
          </div>

          {/* AND 条件 注記 + アクション */}
          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-content-sub text-pretty">
              指定した条件は AND（すべて満たす）で適用されます
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReset}
                className="h-10 px-4 text-sm text-content-primary border border-stroke-input rounded-lg bg-white hover:bg-surface-screen transition-colors cursor-pointer"
              >
                条件をクリア
              </button>
              <button
                type="submit"
                className="h-10 px-5 text-sm font-medium text-white bg-cta-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              >
                この条件で検索
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};

/**
 * AdvancedSearchValues から「未指定でない」フィールド数を数える
 * UI バッジ表示等に使用
 */
export function countActiveAdvancedFilters(v: AdvancedSearchValues): number {
  let n = 0;
  if (v.dateFrom) n++;
  if (v.dateTo) n++;
  if (v.amountFrom) n++;
  if (v.amountTo) n++;
  if (v.vendor.trim()) n++;
  if (v.applicationType) n++;
  if (v.status) n++;
  return n;
}
