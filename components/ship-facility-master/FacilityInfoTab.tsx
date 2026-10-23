'use client';

/**
 * MS-102 施設情報タブ（契約情報・基本情報・認定情報・病床／諸室情報を 1 画面に統合）
 * 顧客ワイヤー 操作UI_施設マスタ v3.3 の #tab0
 */
import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SuggestInput } from './SuggestInput';
import type { FacilityMaster } from '@/lib/types/master';
import { BED_ITEMS_LEFT, BED_ITEMS_RIGHT, CERT_CATEGORIES, ROOM_ITEMS, type BedItem } from '@/lib/data/facilityMasterSamples';
import { bedsOf, contractStatusOf, roomsOf } from '@/lib/utils/shipFacilityMaster';

export interface FacilitySuggestions {
  prefectures: string[];
  cities: string[];
  areas: string[];
  owners: string[];
}

interface FacilityInfoTabProps {
  draft: FacilityMaster;
  editing: boolean;
  onChange: (patch: Partial<FacilityMaster>) => void;
  errors: Record<string, string>;
  groupNames: string[];
  suggestions: FacilitySuggestions;
  /** 利用状況の帯（契約状況ごとの説明と、停止・再開などの操作）。親が描画する */
  usageBox: React.ReactNode;
}

const inputCls = (readOnly: boolean, invalid?: boolean) =>
  `h-10 px-3 border rounded-md text-sm ${invalid ? 'border-red-500' : 'border-stroke-input'} ${readOnly ? 'bg-bg-light' : 'bg-white'}`;

function Field({
  label,
  required,
  note,
  error,
  children,
}: {
  label: string;
  required?: boolean | string;
  note?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-sm font-semibold text-content-primary">
        {label}
        {required && <span className="ml-1 text-xs text-red-700">{typeof required === 'string' ? required : '必須'}</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-700">{error}</span>}
      {note && <span className="text-xs text-content-sub text-pretty">{note}</span>}
    </div>
  );
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-lg p-6 flex flex-col gap-4">
      <h2 className="text-base font-bold text-content-primary">
        {title}
        {sub && <span className="ml-3 text-xs font-normal text-content-sub">{sub}</span>}
      </h2>
      {children}
    </section>
  );
}

const toNum = (v: string | undefined) => (v ? parseInt(v, 10) || 0 : 0);

export function FacilityInfoTab({ draft, editing, onChange, errors, groupNames, suggestions, usageBox }: FacilityInfoTabProps) {
  const ro = !editing;
  const status = contractStatusOf(draft);
  const beds = bedsOf(draft);
  const rooms = roomsOf(draft);
  const certs = draft.certifications ?? [];

  const setBed = (label: string, value: string) => onChange({ beds: { ...beds, [label]: value.replace(/[^\d]/g, '') } });
  const setRoom = (label: string, value: string) => onChange({ rooms: { ...rooms, [label]: value.replace(/[^\d]/g, '') } });

  // 法定区分（level 1）の合計と総病床数の一致。不一致でも保存はできる（警告のみ）
  const total = toNum(beds['総病床数']);
  const legalSum = BED_ITEMS_LEFT.filter((b) => b.level === 1).reduce((s, b) => s + toNum(beds[b.label]), 0);
  const icu = toNum(beds['ICU']);
  const icuKids = ['E-ICU', 'G-ICU', 'CCU'].reduce((s, l) => s + toNum(beds[l]), 0);
  const missing = BED_ITEMS_RIGHT.filter((b) => !beds[b.label]).map((b) => b.label);

  const bedRow = (b: BedItem, values: Record<string, string>, setter: (l: string, v: string) => void, unit = '床') => {
    const empty = !values[b.label];
    return (
      <label key={b.label} className={`flex items-center gap-2 py-1 ${b.level === 2 ? 'pl-6' : b.level === 1 ? 'pl-3' : ''}`}>
        <span className={`flex-1 text-sm ${b.level === 0 ? 'font-bold' : ''} text-content-primary`}>{b.label}</span>
        <input
          inputMode="numeric"
          value={values[b.label] ?? ''}
          onChange={(e) => setter(b.label, e.target.value)}
          readOnly={ro}
          placeholder="未入力"
          className={`w-20 h-9 px-2 text-right tabular-nums border rounded-md text-sm ${ro ? 'bg-bg-light' : 'bg-white'} border-stroke-input`}
        />
        <span className="w-6 text-xs text-content-sub">{unit}</span>
        {empty && <span className="text-xs text-amber-800">未入力</span>}
      </label>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 契約情報 */}
      <Panel title="契約情報" sub="契約は紙で管理。システム上は「利用を開始したら 契約中 と表示する」">
        {usageBox}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 max-w-[960px]">
          <Field label="契約状況" note="利用の開始・停止の操作で自動的に変わります。直接は変更できません">
            <input value={status} readOnly className={`${inputCls(true)} w-[150px]`} aria-label="契約状況" />
          </Field>
          <Field label="契約開始日" note="紙の契約書の日付。利用開始日とは別物">
            <input
              type="date"
              value={draft.contractStartDate ?? ''}
              onChange={(e) => onChange({ contractStartDate: e.target.value })}
              readOnly={ro}
              aria-label="契約開始日"
              className={`${inputCls(ro)} w-[180px]`}
            />
          </Field>
          <Field
            label="契約終了日"
            required={status === '未契約' ? '必須（契約後）' : true}
            error={errors.contractEndDate}
            note="紙の契約書の日付を手で入れます。契約すれば期間は必ず決まるため、契約後は空欄にできません"
          >
            <input
              type="date"
              value={draft.contractEndDate ?? ''}
              onChange={(e) => onChange({ contractEndDate: e.target.value })}
              readOnly={ro}
              aria-label="契約終了日"
              aria-invalid={!!errors.contractEndDate || undefined}
              className={`${inputCls(ro, !!errors.contractEndDate)} w-[180px]`}
            />
          </Field>
          <Field label="リモデル契約" note="契約状況とは独立。通常契約と併存できます">
            <div className="flex gap-4" role="radiogroup" aria-label="リモデル契約">
              {(['なし', 'あり'] as const).map((v) => (
                <label key={v} className="inline-flex items-center gap-2 min-h-[44px] text-sm">
                  <input
                    type="radio"
                    name="remodelContract"
                    checked={(draft.remodelContract ?? 'なし') === v}
                    onChange={() => onChange({ remodelContract: v })}
                    disabled={ro}
                    className="w-4 h-4"
                  />
                  {v}
                </label>
              ))}
            </div>
          </Field>
          <Field label="利用開始日" note="［利用を開始する］を押した日を自動記録">
            <input value={draft.useStartDate || '－'} readOnly className={`${inputCls(true)} w-[150px] tabular-nums`} aria-label="利用開始日" />
          </Field>
          <Field label="利用停止予定日" note="［利用停止を設定する］で設定。予定日が来ると自動的に停止します">
            <input value={draft.stopPlanDate || '－'} readOnly className={`${inputCls(true)} w-[150px] tabular-nums`} aria-label="利用停止予定日" />
          </Field>
          <Field label="利用停止日" note="停止した日を自動記録（予定日到来／今すぐ停止）">
            <input value={draft.stopDate || '－'} readOnly className={`${inputCls(true)} w-[150px] tabular-nums`} aria-label="利用停止日" />
          </Field>
        </div>
      </Panel>

      {/* 基本情報 */}
      <Panel title="基本情報">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-[auto_auto] justify-start max-w-[960px]">
          <Field label="医療機関コード" note="10桁。全国で一意。介護施設・健診センターは未付番のため空欄可">
            <input
              value={draft.facilityCode ?? ''}
              onChange={(e) => onChange({ facilityCode: e.target.value })}
              readOnly={ro}
              aria-label="医療機関コード"
              className={`${inputCls(ro)} w-[150px] tabular-nums`}
            />
          </Field>
          <Field label="施設名" required error={errors.facilityName}>
            <input
              value={draft.facilityName ?? ''}
              onChange={(e) => onChange({ facilityName: e.target.value })}
              readOnly={ro}
              aria-label="施設名"
              aria-invalid={!!errors.facilityName || undefined}
              className={`${inputCls(ro, !!errors.facilityName)} w-[400px] max-w-full`}
            />
          </Field>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4 max-w-[1100px]">
          <Field label="施設略称" required error={errors.shortName} note="一覧・帳票ヘッダの表示に使用">
            <input
              value={draft.shortName ?? ''}
              onChange={(e) => onChange({ shortName: e.target.value })}
              readOnly={ro}
              aria-label="施設略称"
              aria-invalid={!!errors.shortName || undefined}
              className={`${inputCls(ro, !!errors.shortName)} w-[200px]`}
            />
          </Field>
          <Field label="経営主体" required error={errors.foundingBody} note="手入力。登録済みの値が候補に出ます">
            <SuggestInput
              value={draft.foundingBody ?? ''}
              onChange={(v) => onChange({ foundingBody: v })}
              suggestions={suggestions.owners}
              readOnly={ro}
              ariaLabel="経営主体"
              invalid={!!errors.foundingBody}
            />
          </Field>
          <Field
            label="施設グループ"
            note={
              <>
                法人とは独立。1施設あたり最大2グループまで。編集は
                <Link href="/facility-group-management" className="text-content-link hover:underline">
                  施設グループ管理
                </Link>
                から（開示設定はグループの属性のため）
              </>
            }
          >
            <div className="flex flex-wrap gap-2 min-h-10 items-center">
              {groupNames.length ? (
                groupNames.map((g) => (
                  <span key={g} className="inline-flex px-2 py-1 rounded border border-stroke-card bg-bg-light text-sm">
                    {g}
                  </span>
                ))
              ) : (
                <span className="text-sm text-content-sub">未所属</span>
              )}
            </div>
          </Field>
          <Field label="開設日">
            <input
              type="date"
              value={draft.establishedDate ?? ''}
              onChange={(e) => onChange({ establishedDate: e.target.value })}
              readOnly={ro}
              aria-label="開設日"
              className={`${inputCls(ro)} w-[180px]`}
            />
          </Field>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4 max-w-[1100px]">
          <Field label="都道府県" required error={errors.prefecture} note="フリー入力。コード番号は付けません">
            <SuggestInput
              value={draft.prefecture ?? ''}
              onChange={(v) => onChange({ prefecture: v })}
              suggestions={suggestions.prefectures}
              readOnly={ro}
              className="w-[150px]"
              ariaLabel="都道府県"
              invalid={!!errors.prefecture}
            />
          </Field>
          <Field label="市区町村" required error={errors.city} note="フリー入力。市区町村合併に備えてコードは持ちません">
            <SuggestInput
              value={draft.city ?? ''}
              onChange={(v) => onChange({ city: v })}
              suggestions={suggestions.cities}
              readOnly={ro}
              ariaLabel="市区町村"
              invalid={!!errors.city}
            />
          </Field>
          <Field label="二次医療圏" note="手入力。マスタは持たず、登録済みの値が候補に出ます">
            <SuggestInput
              value={draft.secondaryMedicalArea ?? ''}
              onChange={(v) => onChange({ secondaryMedicalArea: v })}
              suggestions={suggestions.areas}
              readOnly={ro}
              ariaLabel="二次医療圏"
            />
          </Field>
          <Field label="延床面積" note="建物全体の延床面積。リモデルの規模感の目安に使います">
            <span className="inline-flex items-center gap-2">
              <input
                inputMode="numeric"
                value={draft.floorArea ?? ''}
                onChange={(e) => onChange({ floorArea: e.target.value })}
                readOnly={ro}
                aria-label="延床面積"
                placeholder="例：24,580"
                className={`${inputCls(ro)} w-[120px] text-right tabular-nums`}
              />
              <span className="text-xs text-content-sub">㎡</span>
            </span>
          </Field>
        </div>
      </Panel>

      {/* 認定情報 */}
      <Panel title="認定情報" sub="分類ごとに該当するものを選びます（複数選択可）。選択肢の追加・変更はコード値マスタで行います">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {CERT_CATEGORIES.map((c) => {
            const selected = certs.filter((v) => c.options.includes(v));
            const rest = c.options.filter((o) => !selected.includes(o));
            return (
              <div key={c.name} className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-content-primary">
                  {c.name}
                  <span className="ml-2 font-normal text-content-sub tabular-nums">
                    {selected.length} / {c.options.length}
                  </span>
                </span>
                <div className="flex flex-wrap gap-2 min-h-10 items-center">
                  {selected.length ? (
                    selected.map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded border border-stroke-card bg-bg-light text-sm">
                        {v}
                        {editing && (
                          <button
                            type="button"
                            onClick={() => onChange({ certifications: certs.filter((x) => x !== v) })}
                            aria-label={`${v} を外す`}
                            className="inline-flex items-center justify-center w-11 h-11 -my-2 rounded hover:bg-stroke-card"
                          >
                            <X className="w-4 h-4" aria-hidden />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-content-sub">該当なし</span>
                  )}
                </div>
                {editing && rest.length > 0 && (
                  <div className="w-[320px] max-w-full">
                    <SearchableSelect
                      value=""
                      onChange={(v) => v && onChange({ certifications: [...certs, v] })}
                      options={rest}
                      placeholder="＋ 追加する"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* 病床・諸室情報 */}
      <Panel title="病床・諸室情報">
        <p
          className={`self-start text-sm px-3 py-1 rounded-md border ${
            legalSum === total ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {legalSum === total
            ? '法定区分の合計と総病床数が一致しています'
            : `法定区分の合計 ${legalSum} と 総病床数 ${total} が一致しません（警告のみ。この状態でも保存できます）`}
        </p>
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <div>
            <h3 className="text-sm font-bold text-content-sub mb-1">総病床数</h3>
            {BED_ITEMS_LEFT.map((b) => bedRow(b, beds, setBed))}
            <p className="pt-2 pl-3 text-xs text-content-sub tabular-nums">法定区分の小計 {legalSum} 床</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-sub mb-1">治療室（一般病床の内数）</h3>
            {BED_ITEMS_RIGHT.map((b) => bedRow(b, beds, setBed))}
            <p className={`pt-2 pl-3 text-xs tabular-nums ${icu === icuKids ? 'text-emerald-800' : 'text-amber-800'}`}>
              {icu === icuKids ? `ICU ${icu} 床 ＝ 内訳（E-ICU／G-ICU／CCU）${icuKids} 床` : `ICU ${icu} 床 と 内訳 ${icuKids} 床 が一致しません`}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-content-sub mb-1">諸室情報</h3>
            {ROOM_ITEMS.map((r) => bedRow({ level: 1, label: r.label }, rooms, setRoom, r.unit))}
          </div>
        </div>
        {missing.length > 0 && (
          <p className="text-sm px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-900 text-pretty">
            治療室に未入力が <b className="tabular-nums">{missing.length}</b> 項目あります（{missing.join('／')}）。未入力は 0 と区別して保持し、分析時に除外できます。
          </p>
        )}
      </Panel>
    </div>
  );
}
