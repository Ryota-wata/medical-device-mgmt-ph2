'use client';

/**
 * 管理者登録モーダル（MS-102 権限設定タブ）
 * 区分＝病院管理者 / 管理組織。登録した時点では招待メールを送らない（状態は「未招待」から始まる）。
 */
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SuggestInput } from './SuggestInput';
import { DialogNote } from './ActionDialog';
import type { AdminType, FacilityAdmin } from '@/lib/stores/facilityAdminStore';
import { HOSPITAL_DEPT_CANDIDATES, SHIP_MANAGING_ORGS } from '@/lib/data/facilityMasterSamples';

export interface AdminFormValue {
  type: AdminType;
  /** 病院管理者＝氏名 / 管理組織＝管理組織名 */
  name: string;
  person: string;
  org: string;
  mail: string;
}

interface AdminModalProps {
  isOpen: boolean;
  /** 編集する管理者。null は新規登録 */
  admin: FacilityAdmin | null;
  /** この施設に登録済みの病院管理者の所属部署（候補に足す） */
  extraDeptCandidates: string[];
  onClose: () => void;
  onSave: (value: AdminFormValue) => void;
}

const NEW_ORG = '（新しく登録する）';
const inputCls = (invalid?: boolean) => `h-10 px-3 border rounded-md text-sm bg-white ${invalid ? 'border-red-500' : 'border-stroke-input'}`;

function initialValue(admin: FacilityAdmin | null): AdminFormValue {
  if (!admin) return { type: '病院管理者', name: '', person: '', org: '', mail: '' };
  return { type: admin.type, name: admin.name, person: admin.person, org: admin.org, mail: admin.mail };
}

function AdminForm({ admin, extraDeptCandidates, onClose, onSave }: Omit<AdminModalProps, 'isOpen'>) {
  const [value, setValue] = useState<AdminFormValue>(() => initialValue(admin));
  const [orgChoice, setOrgChoice] = useState(() => (admin?.type === '管理組織' && SHIP_MANAGING_ORGS.includes(admin.name) ? admin.name : NEW_ORG));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isHospital = value.type === '病院管理者';
  const set = (patch: Partial<AdminFormValue>) => setValue((v) => ({ ...v, ...patch }));

  const submit = () => {
    const e: Record<string, string> = {};
    const name = isHospital ? value.person.trim() : (orgChoice === NEW_ORG ? value.name : orgChoice).trim();
    if (!value.person.trim()) e.person = '氏名を入力してください';
    if (!isHospital && !name) e.name = '管理組織名を入力してください';
    if (!value.mail.trim()) e.mail = 'メールアドレスを入力してください';
    else if (!/^[^@\s]+@[^@\s]+$/.test(value.mail.trim())) e.mail = 'メールアドレスの形式で入力してください';
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ ...value, name, person: value.person.trim(), org: value.org.trim() || '－', mail: value.mail.trim() });
  };

  const deptCandidates = Array.from(new Set([...HOSPITAL_DEPT_CANDIDATES, ...extraDeptCandidates]));

  return (
    <>
      <div className="p-4 flex flex-col gap-4 text-sm">
        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold text-content-primary mb-1">区分</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ['病院管理者', '自院のユーザーを管理'],
                ['管理組織', '枠を受け取り、組織のメンバーへ配る'],
              ] as const
            ).map(([k, desc]) => (
              <label
                key={k}
                className={`flex items-center gap-2 px-3 min-h-[44px] rounded-md border ${
                  value.type === k ? 'border-sky-300 bg-sky-50' : 'border-stroke-input'
                } ${admin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input type="radio" name="admType" aria-label={k} checked={value.type === k} disabled={!!admin} onChange={() => set({ type: k })} className="w-4 h-4" />
                <span className="font-semibold whitespace-nowrap">{k}</span>
                <span className="ml-auto text-xs text-content-sub">{desc}</span>
              </label>
            ))}
          </div>
          {admin && <span className="text-xs text-content-sub">区分は登録後に変更できません</span>}
        </fieldset>

        {isHospital ? (
          <>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">
                氏名<span className="ml-1 text-xs text-red-700">必須</span>
              </span>
              <input value={value.person} onChange={(e) => set({ person: e.target.value })} placeholder="山田 太郎" className={`${inputCls(!!errors.person)} w-[240px]`} />
              {errors.person && <span className="text-xs text-red-700">{errors.person}</span>}
            </label>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">所属部署</span>
              <SuggestInput value={value.org} onChange={(v) => set({ org: v })} suggestions={deptCandidates} placeholder="事務部／総務課" className="w-[280px]" ariaLabel="所属部署" />
              <span className="text-xs text-content-sub text-pretty">
                この施設の病院ユーザーに登録されている所属部署を候補に出します。候補に無い部署名もそのまま入力できます（マスタは持ちません）
              </span>
            </div>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">
                メールアドレス<span className="ml-1 text-xs text-red-700">必須</span>
              </span>
              <input type="email" value={value.mail} onChange={(e) => set({ mail: e.target.value })} placeholder="admin@aaa-hp.jp" className={`${inputCls(!!errors.mail)} w-[280px]`} />
              {errors.mail && <span className="text-xs text-red-700">{errors.mail}</span>}
              <span className="text-xs text-content-sub">招待メールの宛先。登録した時点では送りません。権限設定を完了してから一覧の［招待する］で送ります</span>
            </label>
            <DialogNote>個別ユーザーマスタに病院管理者として作成されます。担当できる機能は、実施主体が 病院／両方 の機能すべてです。</DialogNote>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">管理組織名</span>
              <div className="w-[320px] max-w-full">
                {/* 先頭の「すべて選択」は空文字が来るので無視する */}
                <SearchableSelect value={orgChoice} onChange={(v) => v && setOrgChoice(v)} options={[NEW_ORG, ...SHIP_MANAGING_ORGS]} />
              </div>
            </div>
            {orgChoice === NEW_ORG && (
              <label className="flex flex-col gap-1">
                <span className="font-semibold">
                  新しく登録する場合の名称<span className="ml-1 text-xs text-red-700">必須</span>
                </span>
                <input value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="例：コンサル1部（営業サポート）" className={`${inputCls(!!errors.name)} w-[320px]`} />
                {errors.name && <span className="text-xs text-red-700">{errors.name}</span>}
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="font-semibold">
                氏名<span className="ml-1 text-xs text-red-700">必須</span>
              </span>
              <input value={value.person} onChange={(e) => set({ person: e.target.value })} placeholder="佐藤 一郎" className={`${inputCls(!!errors.person)} w-[240px]`} />
              {errors.person && <span className="text-xs text-red-700">{errors.person}</span>}
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">
                メールアドレス<span className="ml-1 text-xs text-red-700">必須</span>
              </span>
              <input type="email" value={value.mail} onChange={(e) => set({ mail: e.target.value })} placeholder="sato.i@ship-hd.co.jp" className={`${inputCls(!!errors.mail)} w-[280px]`} />
              {errors.mail && <span className="text-xs text-red-700">{errors.mail}</span>}
              <span className="text-xs text-content-sub text-pretty">
                既存のSHIPユーザーのアドレスなら、確認のうえそのアカウントを引き継いで管理者にします（新しいアカウントは作りません）
              </span>
            </label>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">所属組織</span>
              <SuggestInput value={value.org} onChange={(v) => set({ org: v })} suggestions={['コンサル1部', 'コンサル2部', 'データ分析室']} placeholder="例：コンサル1部" ariaLabel="所属組織" />
              <span className="text-xs text-content-sub">マスタは持たず入力履歴から候補が出ます</span>
            </div>
            <DialogNote>
              ここではこの施設に参加させるところまでです。どの機能を担当するかは、権限設定の一覧で組織の列にチェックを入れて割り当ててください。
            </DialogNote>
          </>
        )}
      </div>
      <div className="px-4 pb-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="min-h-[44px] px-4 rounded-md border border-stroke-input bg-white text-sm font-semibold hover:bg-bg-light">
          キャンセル
        </button>
        <button type="button" onClick={submit} className="min-h-[44px] px-4 rounded-md bg-cta-primary text-white text-sm font-semibold hover:bg-cta-primary-dark">
          {admin ? '変更を保存する' : '登録する'}
        </button>
      </div>
    </>
  );
}

export function AdminModal({ isOpen, admin, extraDeptCandidates, onClose, onSave }: AdminModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={admin ? `管理者の編集［${admin.name}］` : '管理者登録'} size="md">
      {/* 開くたびにフォームを作り直す（前回の入力を残さない） */}
      {isOpen && <AdminForm key={admin?.id ?? 'new'} admin={admin} extraDeptCandidates={extraDeptCandidates} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}
