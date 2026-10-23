'use client';

import React, { useId } from 'react';

interface SuggestInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  invalid?: boolean;
}

/**
 * 候補つきの自由入力欄。マスタを持たず、登録済みの値を候補に出す項目に使う
 * （都道府県・市区町村・二次医療圏・経営主体・所属部署など。表記ゆれを抑えるため）。
 * 候補から選ぶだけの項目は SearchableSelect を使う。
 */
export function SuggestInput({ value, onChange, suggestions, readOnly, placeholder, className = 'w-[200px]', ariaLabel, invalid }: SuggestInputProps) {
  const listId = useId();
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={readOnly ? undefined : listId}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        className={`${className} h-10 px-3 border rounded-md text-sm ${invalid ? 'border-red-500' : 'border-stroke-input'} ${
          readOnly ? 'bg-bg-light text-content-primary' : 'bg-white'
        }`}
      />
      {!readOnly && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
    </>
  );
}
