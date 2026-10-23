'use client';

/**
 * SHIP施設マスタ MS-102 施設情報／権限設定
 * 顧客ワイヤー: ship_sams-project docs/design/screen/phase2/共通マスタ/施設マスタ/操作UI_施設マスタ_v3.3.html
 */
import React, { Suspense, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useToast } from '@/components/ui/Toast';
import { ActionDialog, DialogNote } from '@/components/ship-facility-master/ActionDialog';
import { FacilityInfoTab, type FacilitySuggestions } from '@/components/ship-facility-master/FacilityInfoTab';
import { PermissionTab, unassignedCount } from '@/components/ship-facility-master/PermissionTab';
import { AdminModal, type AdminFormValue } from '@/components/ship-facility-master/AdminModal';
import { useFacilityMasterRole } from '@/components/ship-facility-master/useFacilityMasterRole';
import { useShipFacilities } from '@/lib/hooks/useShipFacilities';
import { useMasterStore } from '@/lib/stores/masterStore';
import { useFacilityGroupStore } from '@/lib/stores/facilityGroupStore';
import { newAdminId, useFacilityAdminStore, type FacilityAdmin, type FeatureSetting } from '@/lib/stores/facilityAdminStore';
import { FEATURE_PREREQUISITES } from '@/lib/data/featureCatalog';
import { SHIP_USER_SAMPLES, type ShipUserSample } from '@/lib/data/facilityMasterSamples';
import type { FacilityMaster } from '@/lib/types/master';
import { CONTRACT_STATUS_PILL, MOCK_TODAY, addDays, contractStatusOf, toSlashDate } from '@/lib/utils/shipFacilityMaster';

type Dialog =
  | { kind: 'start' }
  | { kind: 'started' }
  | { kind: 'stop' }
  | { kind: 'planChange' }
  | { kind: 'planCancel' }
  | { kind: 'stopNow' }
  | { kind: 'permDone' }
  | { kind: 'permDoneBlocked'; reason: string }
  | { kind: 'guard' }
  | { kind: 'invite'; admin: FacilityAdmin }
  | { kind: 'revoke'; admin: FacilityAdmin }
  | { kind: 'takeoverBlocked'; message: string; orgName: string }
  | { kind: 'takeover'; value: AdminFormValue; user: ShipUserSample }
  | { kind: 'adminSaved'; value: AdminFormValue; takenOver: boolean; user?: ShipUserSample };

const uniqSorted = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'ja'));

const btn = 'min-h-[44px] px-4 rounded-md border text-sm font-semibold whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed';
const btnSecondary = `${btn} border-stroke-input bg-white text-content-primary hover:bg-bg-light`;
const btnPrimary = `${btn} border-transparent bg-cta-primary text-white hover:bg-cta-primary-dark`;
const btnDanger = `${btn} border-red-200 bg-white text-red-700 hover:bg-red-50`;

const blankFacility = (): FacilityMaster => ({
  id: '',
  facilityCode: '',
  facilityName: '',
  prefecture: '',
  foundingBody: '',
  city: '',
  address: '',
  postalCode: '',
  phoneNumber: '',
  establishedDate: '',
  facilityType: '',
  bedCount: 0,
  status: 'active',
  createdAt: '',
  updatedAt: '',
  contractStatus: '未契約',
  remodelContract: 'なし',
  certifications: [],
  beds: {},
  rooms: {},
});

function validate(d: FacilityMaster) {
  const e: Record<string, string> = {};
  if (!d.facilityName?.trim()) e.facilityName = '施設名を入力してください';
  if (!d.shortName?.trim()) e.shortName = '施設略称を入力してください';
  if (!d.foundingBody?.trim()) e.foundingBody = '経営主体を入力してください';
  if (!d.prefecture?.trim()) e.prefecture = '都道府県を入力してください';
  if (!d.city?.trim()) e.city = '市区町村を入力してください';
  if (contractStatusOf(d) !== '未契約' && !d.contractEndDate) e.contractEndDate = '契約後は契約終了日を空欄にできません';
  return e;
}

function FacilityDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const { showToast } = useToast();
  const { isSams } = useFacilityMasterRole();
  const { facilities, isLoading } = useShipFacilities();
  const updateFacility = useMasterStore((s) => s.updateFacility);
  const addFacility = useMasterStore((s) => s.addFacility);
  const groups = useFacilityGroupStore((s) => s.groups);
  const adminStateOf = useFacilityAdminStore((s) => s.stateOf);
  useFacilityAdminStore((s) => s.byFacility); // 変更を描画に反映するため購読する
  const updateAdmin = useFacilityAdminStore((s) => s.update);

  const isNew = params.get('new') === '1';
  const id = params.get('id') ?? '';
  const facility = useMemo(() => (isNew ? null : facilities.find((f) => f.id === id) ?? null), [facilities, id, isNew]);

  const [tab, setTab] = useState<0 | 1>(0);
  const [draft, setDraft] = useState<FacilityMaster | null>(() => (isNew ? blankFacility() : null));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [adminModal, setAdminModal] = useState<{ admin: FacilityAdmin | null } | null>(null);
  const [stopMode, setStopMode] = useState<'plan' | 'now'>('plan');
  const [stopDate, setStopDate] = useState(addDays(MOCK_TODAY, 7));
  const [stopConfirm, setStopConfirm] = useState('');
  const [planDate, setPlanDate] = useState('');
  const guardShown = useRef(false);

  const suggestions: FacilitySuggestions = useMemo(
    () => ({
      prefectures: uniqSorted(facilities.map((f) => f.prefecture)),
      cities: uniqSorted(facilities.map((f) => f.city)),
      areas: uniqSorted(facilities.map((f) => f.secondaryMedicalArea)),
      owners: uniqSorted(facilities.map((f) => f.foundingBody)),
    }),
    [facilities],
  );

  if (!isSams) {
    return (
      <Notice title="施設情報・権限設定を開けるのはSAMS管理者だけです" body="SHIP管理者は施設の一覧だけを見られます。" />
    );
  }
  if (!isNew && !facility) {
    return isLoading ? (
      <p className="px-6 py-6 text-sm text-content-sub">施設を読み込み中です。</p>
    ) : (
      <Notice title="施設が見つかりません" body="一覧から開き直してください。" />
    );
  }

  const editing = draft !== null;
  const current = (draft ?? facility) as FacilityMaster;
  const status = contractStatusOf(current);
  const adminState = facility ? adminStateOf(facility) : null;
  const groupNames = groups.filter((g) => g.facilityIds.includes(current.facilityName)).map((g) => g.name);
  const title = isNew ? '施設マスタ 新規登録' : `施設マスタ［${facility?.facilityCode || '－'}　${facility?.facilityName}］`;

  // ── 施設情報の編集 ──
  const startEdit = () => {
    setDraft({ ...(facility as FacilityMaster) });
    setErrors({});
  };
  const cancelEdit = () => {
    if (isNew) {
      router.push('/ship-facility-master');
      return;
    }
    setDraft(null);
    setErrors({});
    showToast('変更を取り消しました', 'info');
  };
  const save = () => {
    if (!draft) return;
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length) {
      showToast('入力内容を確認してください', 'error');
      return;
    }
    const total = parseInt(draft.beds?.['総病床数'] ?? '', 10) || 0;
    if (isNew) {
      const newId = `FAC-NEW-${Date.now()}`;
      const now = new Date().toISOString();
      addFacility({ ...draft, id: newId, bedCount: total, createdAt: now, updatedAt: now });
      // 下書きは消さない。URL が変わると FacilityDetail を作り直すので、登録した施設の確認表示になる
      showToast(`${draft.facilityName} を登録しました。次は権限設定タブで管理者を登録します`, 'success');
      router.replace(`/ship-facility-master/detail?id=${encodeURIComponent(newId)}`);
      return;
    }
    updateFacility(draft.id, { ...draft, bedCount: total, updatedAt: new Date().toISOString() });
    setDraft(null);
    showToast('施設情報を保存しました', 'success');
  };

  const switchTab = (next: 0 | 1) => {
    if (editing && next !== 0) {
      showToast('編集中です。保存またはキャンセルしてください', 'info');
      return;
    }
    if (isNew && next === 1) {
      showToast('先に施設情報を登録してください', 'info');
      return;
    }
    setTab(next);
  };

  // ── 契約（利用の開始・停止）──
  const f = facility as FacilityMaster;
  const today = toSlashDate(MOCK_TODAY);
  const close = () => setDialog(null);
  const doStart = () => {
    updateFacility(f.id, { contractStatus: '契約中', useStartDate: f.useStartDate || today, stopDate: '', stopPlanDate: '' });
    setDialog({ kind: 'started' });
  };
  const openStop = () => {
    setStopMode('plan');
    setStopDate(addDays(MOCK_TODAY, 7));
    setStopConfirm('');
    setDialog({ kind: 'stop' });
  };
  const doStop = () => {
    if (stopMode === 'now') {
      updateFacility(f.id, { contractStatus: '停止中', stopDate: today, stopPlanDate: '' });
      showToast('利用を停止しました。病院ユーザーはログインできません', 'success');
    } else {
      updateFacility(f.id, { contractStatus: '停止予定', stopPlanDate: toSlashDate(stopDate), stopDate: '' });
      showToast(`利用停止を設定しました（${toSlashDate(stopDate)}）。それまで病院ユーザーは閲覧のみです`, 'success');
    }
    close();
  };

  // ── 権限設定 ──
  const touchPermission = () => {
    if (status === '契約中' && !guardShown.current) {
      guardShown.current = true;
      setDialog({ kind: 'guard' });
    }
  };
  const onFeatureChange = (code: string, patch: Partial<FeatureSetting>) => {
    touchPermission();
    const turnedOff: string[] = [];
    updateAdmin(f, (st) => {
      const features = { ...st.features, [code]: { ...st.features[code], ...patch } };
      // 前提の機能を OFF にしたら、それに依存する機能も OFF にする（ON の集合は前提をすべて含む必要がある）
      if (patch.use === false) {
        const stack = [code];
        while (stack.length) {
          const c = stack.pop() as string;
          FEATURE_PREREQUISITES.filter(([, pre]) => pre === c).forEach(([feat]) => {
            if (features[feat]?.use) {
              features[feat] = { ...features[feat], use: false };
              turnedOff.push(feat);
              stack.push(feat);
            }
          });
        }
      }
      // 前提となる機能を自動で利用 ON にする
      if (patch.use) {
        const stack = [code];
        while (stack.length) {
          const c = stack.pop() as string;
          FEATURE_PREREQUISITES.filter(([feat]) => feat === c).forEach(([, pre]) => {
            if (features[pre] && !features[pre].use) {
              features[pre] = { ...features[pre], use: true };
              stack.push(pre);
            }
          });
        }
      }
      return { ...st, features };
    });
    if (turnedOff.length) showToast(`前提の機能を OFF にしたため、依存する ${turnedOff.join('・')} も OFF にしました`, 'info');
  };
  const onToggleColumn = (org: string, on: boolean, categoryCode: string) => {
    touchPermission();
    updateAdmin(f, (st) => {
      const features = { ...st.features };
      Object.entries(features).forEach(([code, s]) => {
        if (!code.startsWith(`F-${categoryCode.slice(1)}-`)) return;
        if (!(s.use && (s.subject === 'SHIP' || s.subject === '両方'))) return;
        const has = s.orgs.includes(org);
        if (on && !has) features[code] = { ...s, orgs: [...s.orgs, org] };
        if (!on && has) features[code] = { ...s, orgs: s.orgs.filter((x) => x !== org) };
      });
      return { ...st, features };
    });
    showToast(`${org.replace(/（.*$/, '')}を、このカテゴリの対象機能に${on ? 'すべて割り当てました' : 'すべて外しました'}`, 'success');
  };
  const askPermDone = () => {
    if (!adminState) return;
    const useCount = Object.values(adminState.features).filter((s) => s.use).length;
    const orgCount = adminState.admins.filter((a) => a.type === '管理組織').length;
    if (!useCount) return setDialog({ kind: 'permDoneBlocked', reason: '利用する機能が1つも選ばれていません。機能一覧で利用をONにしてください。' });
    if (!orgCount)
      return setDialog({
        kind: 'permDoneBlocked',
        reason: 'SHIPの管理組織が1つも登録されていません。枠を受け取る相手がいないため完了できません。先に［＋ 管理者登録］で管理組織を登録してください。',
      });
    setDialog({ kind: 'permDone' });
  };

  // ── 管理者 ──
  const saveAdmin = (value: AdminFormValue) => {
    const editingAdmin = adminModal?.admin ?? null;
    if (editingAdmin) {
      updateAdmin(f, (st) => ({
        ...st,
        admins: st.admins.map((a) => (a.id === editingAdmin.id ? { ...a, name: value.name, person: value.person, org: value.org, mail: value.mail } : a)),
        // 管理組織名を変えたら、機能の割り当ても付け替える
        features:
          editingAdmin.type === '管理組織' && editingAdmin.name !== value.name
            ? Object.fromEntries(
                Object.entries(st.features).map(([c, s]) => [c, { ...s, orgs: s.orgs.map((o) => (o === editingAdmin.name ? value.name : o)) }]),
              )
            : st.features,
      }));
      setAdminModal(null);
      showToast('管理者を更新しました', 'success');
      return;
    }
    // 同じ管理組織は 1 施設に 1 回だけ登録する（管理者の交代は［編集］で行う）
    if (value.type === '管理組織' && adminState?.admins.some((a) => a.type === '管理組織' && a.name === value.name)) {
      setDialog({
        kind: 'takeoverBlocked',
        orgName: value.name,
        message: 'この管理組織は既にこの施設に登録されています。管理者を交代する場合は、一覧の［編集］から変更してください',
      });
      return;
    }
    // 既存の SHIP ユーザーのアドレスなら、新規作成せず確認のうえ引き継ぐ（2026-09-11 SE 回答）
    if (value.type === '管理組織') {
      const user = SHIP_USER_SAMPLES.find((u) => u.mail.toLowerCase() === value.mail.toLowerCase());
      if (user) {
        const already = adminState?.admins.some((a) => a.type === '管理組織' && a.mail.toLowerCase() === user.mail.toLowerCase());
        if (already || user.managingOrg !== value.name || (user.status !== '利用中' && user.status !== '招待中')) {
          setDialog({
            kind: 'takeoverBlocked',
            orgName: value.name,
            message: already ? 'このアドレスは既にこの施設の管理者として登録されています' : 'このアドレスは登録できません（別組織または利用停止中）',
          });
          return;
        }
        setDialog({ kind: 'takeover', value, user });
        return;
      }
    }
    addAdmin(value, '未招待');
    setAdminModal(null);
    setDialog({ kind: 'adminSaved', value, takenOver: false });
  };
  const addAdmin = (value: AdminFormValue, adminStatus: FacilityAdmin['status']) => {
    updateAdmin(f, (st) => ({
      ...st,
      admins: [...st.admins, { id: newAdminId(), type: value.type, name: value.name, person: value.person, org: value.org, members: 0, status: adminStatus, mail: value.mail }],
    }));
  };

  // ── 利用状況の帯（契約情報）──
  const usageBox = !isNew && (
    <div
      className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-md border text-sm ${
        status === '契約中' ? 'border-sky-200 bg-sky-50 text-sky-900' : status === '未契約' ? 'border-stroke-card bg-bg-light' : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <span className="flex-1 min-w-[280px] text-pretty">
        {status === '契約中' && (
          <>
            <b>利用中</b>　{f.useStartDate && `${f.useStartDate} から利用しています`}
            {f.contractEndDate && `　／　${toSlashDate(f.contractEndDate)} に自動更新`}
            {f.remodelContract === 'あり' && '　／　リモデル契約あり'}
          </>
        )}
        {status === '停止予定' && (
          <>
            <b>利用停止予定</b>　<b>{f.stopPlanDate || '－'}</b> に自動的に停止します。それまで病院ユーザーは閲覧のみです（登録・変更・申請・取込は不可。エクスポートはできます）。SHIP側は付与済み権限どおり閲覧・更新できます
          </>
        )}
        {status === '停止中' && (
          <>
            <b>利用停止中</b>　{f.stopDate && `${f.stopDate} に停止しました。`}病院ユーザーはログインできません。SHIP側は付与済み権限どおり閲覧・更新できます（担当施設・権限は自動解除されません）
          </>
        )}
        {status === '未契約' &&
          (adminState?.permDone
            ? '未契約　権限設定は完了しています。権限設定タブの［利用を開始する］で契約中になります'
            : '未契約　権限設定タブで ①［権限設定を完了する］→ ②［利用を開始する］の順に進めてください')}
      </span>
      {status === '契約中' && (
        <button type="button" onClick={openStop} disabled={editing} className={btnSecondary}>
          利用停止を設定する
        </button>
      )}
      {status === '停止予定' && (
        <>
          <button
            type="button"
            onClick={() => {
              setPlanDate((f.stopPlanDate ?? '').replace(/\//g, '-'));
              setDialog({ kind: 'planChange' });
            }}
            disabled={editing}
            className={btnSecondary}
          >
            予定日を変更する
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'planCancel' })} disabled={editing} className={btnSecondary}>
            予定を取り消す
          </button>
          <button type="button" onClick={() => setDialog({ kind: 'stopNow' })} disabled={editing} className={btnDanger}>
            今すぐ停止する
          </button>
        </>
      )}
      {status === '停止中' && (
        <button type="button" onClick={() => setDialog({ kind: 'start' })} disabled={editing} className={btnPrimary}>
          利用を再開する
        </button>
      )}
      {status === '未契約' && (
        <button type="button" onClick={() => switchTab(1)} disabled={editing} className={btnSecondary}>
          権限設定へ
        </button>
      )}
    </div>
  );

  const reopen = status === '停止中';
  const unsetSubject = adminState ? Object.values(adminState.features).filter((s) => s.use && s.subject === '－').length : 0;

  return (
    <>
      {/* タイトル・タブ */}
      <div className="bg-surface-card border-b border-stroke-card px-6 pt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold text-content-primary text-balance">{title}</h1>
          {isNew ? (
            <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-sky-50 text-sky-800 border-sky-200">新規</span>
          ) : (
            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${CONTRACT_STATUS_PILL[status]}`}>{status}</span>
          )}
          {editing && <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-amber-50 text-amber-800 border-amber-200">編集中</span>}
        </div>
        <div className="flex gap-1" role="tablist">
          {(['施設情報', '権限設定'] as const).map((t, i) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === i}
              onClick={() => switchTab(i as 0 | 1)}
              className={`min-h-[44px] px-5 text-sm font-semibold border-b-2 ${
                tab === i ? 'border-cta-primary text-content-primary' : 'border-transparent text-content-sub hover:text-content-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-6 py-6 flex flex-col gap-4">
        {tab === 0 && (
          <>
            <div
              className={`flex flex-wrap items-center gap-3 px-4 py-2 rounded-md border text-sm ${
                editing ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'
              }`}
            >
              <span className="flex-1 min-w-[280px] text-pretty">
                {editing
                  ? '編集中です。施設情報タブ全体（契約情報・基本情報・認定情報・病床／諸室情報）が入力できます。'
                  : '内容を確認しています。変更するには［編集］を押してください。［利用を開始する］［停止する］は確認中でも実行できます。'}
              </span>
              {editing ? (
                <>
                  <button type="button" onClick={cancelEdit} className={btnSecondary}>
                    キャンセル
                  </button>
                  <button type="button" onClick={save} className={btnPrimary}>
                    {isNew ? '登録する' : '保存する'}
                  </button>
                </>
              ) : (
                <button type="button" onClick={startEdit} className={btnSecondary}>
                  編集
                </button>
              )}
            </div>
            <FacilityInfoTab
              draft={current}
              editing={editing}
              onChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
              errors={errors}
              groupNames={groupNames}
              suggestions={suggestions}
              usageBox={usageBox}
            />
          </>
        )}
        {tab === 1 && adminState && (
          <PermissionTab
            state={adminState}
            status={status}
            stopPlanDate={f.stopPlanDate}
            onFeatureChange={onFeatureChange}
            onToggleColumn={onToggleColumn}
            onOpenAdmin={(admin) => setAdminModal({ admin })}
            onInvite={(admin) => setDialog({ kind: 'invite', admin })}
            onRevoke={(admin) => setDialog({ kind: 'revoke', admin })}
            onPermDone={askPermDone}
            onStart={() => setDialog({ kind: 'start' })}
            onGoContract={() => setTab(0)}
          />
        )}
      </main>

      <div className="px-6 py-3 border-t border-stroke-card bg-surface-card flex items-center gap-3">
        <span className="text-xs text-content-sub tabular-nums">
          {isNew ? '新規登録（未保存）' : `最終更新：${f.updatedAt ? f.updatedAt.slice(0, 10).replace(/-/g, '/') : '－'}`}
        </span>
        <Link href="/ship-facility-master" className={`${btnSecondary} ml-auto inline-flex items-center gap-1`}>
          <ArrowLeft className="w-4 h-4" aria-hidden />
          一覧に戻る
        </Link>
      </div>

      <AdminModal
        isOpen={!!adminModal}
        admin={adminModal?.admin ?? null}
        extraDeptCandidates={adminState?.admins.filter((a) => a.type === '病院管理者').map((a) => a.org) ?? []}
        onClose={() => setAdminModal(null)}
        onSave={saveAdmin}
      />

      {/* ── 確認・完了ダイアログ ── */}
      <ActionDialog
        isOpen={dialog?.kind === 'start'}
        title={reopen ? '利用を再開する' : '利用を開始する'}
        onClose={close}
        actions={[{ label: reopen ? '利用を再開する' : '利用を開始する', onClick: doStart, disabled: !f?.contractEndDate }]}
      >
        {!f?.contractEndDate && (
          <DialogNote tone="warn">契約終了日が入っていません。契約中にすると契約終了日は空欄にできないため、先に施設情報の［編集］で契約終了日を入力してください。</DialogNote>
        )}
        <p>
          <b>{f?.facilityName}</b> の利用を{reopen ? '再開' : '開始'}します。この操作で次のことが起きます。
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>契約状況が 契約中 になります</li>
          <li>利用{reopen ? '再開' : '開始'}日を記録します</li>
          <li>{reopen ? '病院ユーザーが再びログインできるようになります' : '施設契約の段が通り、権限を持つ人がこの施設を使えるようになります'}</li>
        </ul>
        <DialogNote>招待メールはこの操作では送りません。このあと管理者一覧の［招待する］から送ってください。</DialogNote>
        {unsetSubject > 0 && (
          <DialogNote tone="warn">
            実施主体が未設定の機能が {unsetSubject} 件あります。そのままでも開始できますが、その機能はこの施設で使えません。
          </DialogNote>
        )}
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'started'}
        title="利用を開始しました"
        onClose={close}
        cancelLabel="閉じる"
        actions={[
          {
            label: '管理者一覧へ',
            onClick: () => {
              close();
              setTab(1);
            },
          },
        ]}
      >
        <p>
          <b>{f?.facilityName}</b> を 契約中 にしました。
        </p>
        <DialogNote>次は管理者一覧の［招待する］で、管理者に招待メールを送ってください。届いたリンクから本人がパスワードを設定すると、利用を始められます。</DialogNote>
        <p className="text-xs text-content-sub">招待メールにパスワードは書きません。リンクの有効期限は7日です。切れた場合は［再送］で送り直せます。</p>
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'stop'}
        title="利用停止を設定する"
        onClose={close}
        size="md"
        actions={[
          {
            label: stopMode === 'plan' ? '利用停止を設定する' : '今すぐ停止する',
            onClick: doStop,
            variant: 'danger',
            disabled: stopConfirm !== f?.facilityName || (stopMode === 'plan' && !stopDate),
          },
        ]}
      >
        <DialogNote tone="warn">
          <b>{f?.facilityName}</b> の利用停止を設定します。
        </DialogNote>
        <fieldset className="flex flex-col gap-1">
          <legend className="font-semibold mb-1">いつ停止しますか</legend>
          {(
            [
              ['plan', '予定日に利用停止する（推奨。既定は7日後）'],
              ['now', '今すぐ利用停止する'],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="inline-flex items-center gap-2 min-h-[44px]">
              <input type="radio" name="stopMode" checked={stopMode === v} onChange={() => setStopMode(v)} className="w-4 h-4" />
              {label}
            </label>
          ))}
        </fieldset>
        {stopMode === 'plan' && (
          <label className="flex flex-col gap-1">
            <span className="font-semibold">利用停止予定日</span>
            <input type="date" value={stopDate} onChange={(e) => setStopDate(e.target.value)} className="w-[180px] h-10 px-3 border border-stroke-input rounded-md" />
            <span className="text-xs text-content-sub text-pretty">
              予定日までは停止予定となり、病院ユーザーは閲覧のみ（登録・変更・申請・取込は不可。エクスポートはできます）になります。予定日が来ると自動的に停止します
            </span>
          </label>
        )}
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>病院ユーザーは停止後ログインできなくなります</li>
          <li>データは残します。SHIP側は付与済み権限どおり閲覧・更新できます</li>
          <li>あとから予定日の変更・取消・即時停止ができます。設定・変更・自動停止は監査ログに記録されます</li>
        </ul>
        <p className="text-xs text-content-sub">一部の機能だけ止めたい場合は、停止ではなく権限設定で機能をOFFにしてください。</p>
        <label className="flex flex-col gap-1">
          <span>
            間違いを防ぐため、施設名 <b>{f?.facilityName}</b> を入力してください。
          </span>
          <input
            value={stopConfirm}
            onChange={(e) => setStopConfirm(e.target.value)}
            placeholder={f?.facilityName}
            className="w-[320px] max-w-full h-10 px-3 border border-stroke-input rounded-md"
          />
        </label>
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'planChange'}
        title="停止予定日を変更する"
        onClose={close}
        actions={[
          {
            label: '予定日を変更する',
            disabled: !planDate,
            onClick: () => {
              updateFacility(f.id, { stopPlanDate: toSlashDate(planDate) });
              showToast(`停止予定日を ${toSlashDate(planDate)} に変更しました`, 'success');
              close();
            },
          },
        ]}
      >
        <label className="flex flex-col gap-1">
          <span className="font-semibold">利用停止予定日</span>
          <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} className="w-[180px] h-10 px-3 border border-stroke-input rounded-md" />
          <span className="text-xs text-content-sub">予定日が来ると自動的に停止します</span>
        </label>
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'planCancel'}
        title="利用停止の予定を取り消す"
        onClose={close}
        actions={[
          {
            label: '停止予定を取り消す',
            onClick: () => {
              updateFacility(f.id, { contractStatus: '契約中', stopPlanDate: '' });
              showToast('停止予定を取り消しました', 'success');
              close();
            },
          },
        ]}
      >
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>
            <b>{f?.facilityName}</b> は契約中に戻ります
          </li>
          <li>病院ユーザーはこれまでどおり利用できます</li>
        </ul>
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'stopNow'}
        title="今すぐ利用停止する"
        onClose={close}
        actions={[
          {
            label: '今すぐ停止する',
            variant: 'danger',
            onClick: () => {
              updateFacility(f.id, { contractStatus: '停止中', stopDate: today, stopPlanDate: '' });
              showToast('利用を停止しました', 'success');
              close();
            },
          },
        ]}
      >
        <DialogNote tone="danger">
          この操作で <b>{f?.facilityName}</b> の病院ユーザーはログインできなくなります。
        </DialogNote>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>予定日（{f?.stopPlanDate || '－'}）を待たずに停止します</li>
          <li>SHIP側は付与済み権限どおり利用できます</li>
        </ul>
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'permDone'}
        title="権限設定を完了する"
        onClose={close}
        actions={[
          {
            label: '権限設定を完了する',
            onClick: () => {
              updateAdmin(f, (st) => ({ ...st, permDone: true }));
              showToast('権限設定を完了しました。次は［利用を開始する］。招待はそのあとです', 'success');
              close();
            },
          },
        ]}
      >
        <p>
          <b>{f?.facilityName}</b> の権限設定を完了にします。この操作で次のことが起きます。
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>［利用を開始する］が押せるようになります</li>
          <li>管理者一覧の［招待する］は、利用を開始したあとに押せるようになります</li>
          <li>設定した内容はそのまま残り、あとから変更もできます</li>
        </ul>
        {adminState && unassignedCount(adminState) > 0 && (
          <DialogNote tone="warn">
            担当管理組織が未割り当ての機能が {unassignedCount(adminState)} 件あります。そのままでも完了できますが、その機能は誰も使えません。
          </DialogNote>
        )}
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'permDoneBlocked'}
        title="権限設定を完了できません"
        onClose={close}
        cancelLabel="閉じる"
      >
        <p>{dialog?.kind === 'permDoneBlocked' && dialog.reason}</p>
      </ActionDialog>

      <ActionDialog isOpen={dialog?.kind === 'guard'} title="利用中の施設の権限を変更します" onClose={close} cancelLabel="内容を確認しました">
        <DialogNote tone="warn">
          <b>{f?.facilityName}</b> はすでに利用を開始しています。
        </DialogNote>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>権限を変更すると、病院ユーザーの画面から機能が消えたり、新たに現れたりします</li>
          <li>次回ログインから利用者に見えます。変更内容は監査ログに記録されます</li>
        </ul>
        <p className="text-xs text-content-sub">このお知らせはこの画面で最初の1回だけ表示します。</p>
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'invite'}
        title={dialog?.kind === 'invite' && dialog.admin.status === '招待中' ? '招待メールを再送する' : '招待メールを送る'}
        onClose={close}
        actions={[
          {
            label: dialog?.kind === 'invite' && dialog.admin.status === '招待中' ? '再送する' : '招待メールを送る',
            onClick: () => {
              if (dialog?.kind !== 'invite') return;
              const target = dialog.admin;
              updateAdmin(f, (st) => ({ ...st, admins: st.admins.map((a) => (a.id === target.id ? { ...a, status: '招待中' } : a)) }));
              showToast(`${target.person || target.name} さん宛てに招待メールを送りました（有効期限7日）`, 'success');
              close();
            },
          },
        ]}
      >
        {dialog?.kind === 'invite' && (
          <>
            <p>
              <b>{dialog.admin.name}</b>
              {dialog.admin.type === '管理組織' && `（${dialog.admin.person}）`} に招待メールを送ります（宛先：{dialog.admin.mail}）。
            </p>
            <DialogNote>
              パスワードは書きません。リンクから本人が設定します。リンクの有効期限は7日です。件名と本文に「{dialog.admin.person || dialog.admin.name}{' '}
              さん宛て」と入れます（1つのアドレスを複数人で使う施設があるため）。
            </DialogNote>
            <p className="text-xs text-content-sub">送信後、状態は 招待中 になります。本人がパスワードを設定すると 有効 に変わります。</p>
          </>
        )}
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'revoke'}
        title="管理者を解除する"
        onClose={close}
        actions={[
          {
            label: '管理者を解除する',
            variant: 'danger',
            onClick: () => {
              if (dialog?.kind !== 'revoke') return;
              const target = dialog.admin;
              updateAdmin(f, (st) => ({
                ...st,
                admins: st.admins.filter((a) => a.id !== target.id),
                features:
                  target.type === '管理組織'
                    ? Object.fromEntries(Object.entries(st.features).map(([c, s]) => [c, { ...s, orgs: s.orgs.filter((o) => o !== target.name) }]))
                    : st.features,
              }));
              showToast(`${target.name} を管理者から解除しました`, 'success');
              close();
            },
          },
        ]}
      >
        {dialog?.kind === 'revoke' && (
          <>
            <DialogNote tone="warn">
              <b>{dialog.admin.name}</b> はこの施設を扱えなくなります。
            </DialogNote>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              {dialog.admin.type === '病院管理者' ? (
                <li>この病院管理者は自院のユーザーを管理できなくなります</li>
              ) : (
                <>
                  <li>担当している機能の割り当てが外れます</li>
                  <li>配下 {dialog.admin.members} 名がこの施設に対して持っている権限も、その時点で効かなくなります</li>
                </>
              )}
              <li>データは残ります。再び登録すれば元に戻せます。操作は監査ログに記録されます</li>
            </ul>
          </>
        )}
      </ActionDialog>

      <ActionDialog isOpen={dialog?.kind === 'takeoverBlocked'} title="登録できません" onClose={close} cancelLabel="閉じる">
        {dialog?.kind === 'takeoverBlocked' && (
          <>
            <DialogNote tone="warn">{dialog.message}</DialogNote>
            {!dialog.message.startsWith('この管理組織は既に') && (
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>
                引き継いで登録できるのは、<b>{dialog.orgName}</b> に所属し、利用状態が利用中または招待中のユーザーだけです
              </li>
              <li>別の管理組織の人を管理者にする場合は、先にSHIPユーザーマスタの［管理組織を移す］で異動させてから登録してください</li>
              <li>休止中・退職のユーザーは、先にSHIPユーザーマスタで利用を再開してください</li>
            </ul>
            )}
          </>
        )}
      </ActionDialog>

      <ActionDialog
        isOpen={dialog?.kind === 'takeover'}
        title="既に登録済のアカウントです。管理者として登録しますか？"
        onClose={close}
        cancelLabel="登録しない"
        actions={[
          {
            label: '管理者として登録する',
            onClick: () => {
              if (dialog?.kind !== 'takeover') return;
              const { value, user } = dialog;
              const taken = { ...value, person: user.name, org: user.org };
              addAdmin(taken, user.status === '利用中' ? '有効' : '招待中');
              setAdminModal(null);
              setDialog({ kind: 'adminSaved', value: taken, takenOver: true, user });
            },
          },
        ]}
      >
        {dialog?.kind === 'takeover' && (
          <>
            <DialogNote>
              このメールアドレスは <b>{dialog.user.name}</b>（{dialog.user.org}／管理組織：{dialog.user.managingOrg}／{dialog.user.status}）として登録済みです。
            </DialogNote>
            <p>
              登録すると、新しいアカウントは作らず、この人を <b>{dialog.value.name}</b> の管理者にします。
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li>基本情報・パスワード・招待状況・現在の個人権限はそのまま維持します</li>
              <li>この施設を担当施設に追加します</li>
              <li>{dialog.user.status === '利用中' ? '利用中のため招待メールは送りません（管理者一覧では「利用中」）' : '招待中のため、初期設定が済むまで管理者一覧では「招待中」のままです'}</li>
            </ul>
            <p className="text-xs text-content-sub">氏名欄に入力した「{dialog.value.person}」は使わず、登録済みの氏名を使います。</p>
          </>
        )}
      </ActionDialog>

      <ActionDialog isOpen={dialog?.kind === 'adminSaved'} title="管理者を登録しました" onClose={close} cancelLabel="閉じる">
        {dialog?.kind === 'adminSaved' && (
          <>
            <p>
              <b>{dialog.value.type === '病院管理者' ? dialog.value.name : `${dialog.value.person} さん`}</b> を{' '}
              {dialog.value.type === '病院管理者' ? '病院管理者' : `管理組織「${dialog.value.name}」の管理者`}として登録しました
              {dialog.takenOver && '（既存アカウントを引き継ぎ）'}。
            </p>
            {dialog.value.type === '病院管理者' ? (
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>個別ユーザーマスタに病院管理者として作成されました</li>
                <li>実施主体が 病院／両方 の機能すべてを扱えます</li>
              </ul>
            ) : (
              <ul className="list-disc pl-5 flex flex-col gap-1">
                <li>この施設に参加しました。担当する機能は、下の一覧でこの組織の列にチェックを入れて割り当ててください</li>
                <li>枠は人ではなく管理組織に付きます。管理者が交代しても枠は動きません</li>
              </ul>
            )}
            {dialog.takenOver && dialog.user?.status === '利用中' ? (
              <DialogNote>利用中のユーザーのため招待メールは不要です。</DialogNote>
            ) : (
              <DialogNote tone="warn">
                招待メールはまだ送っていません。権限設定を完了して利用を開始してから、一覧の［招待する］で送ってください。権限が無い状態で招待すると、ログインしても何もできません。
              </DialogNote>
            )}
          </>
        )}
      </ActionDialog>
    </>
  );
}

/** URL（施設 id・新規）が変わったら画面の状態を作り直す */
function FacilityDetailRoute() {
  const params = useSearchParams();
  return <FacilityDetail key={params.toString()} />;
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <section className="m-6 bg-surface-card border border-stroke-card rounded-lg p-6 flex flex-col items-start gap-3 max-w-[640px]">
      <h1 className="text-lg font-bold text-content-primary">{title}</h1>
      <p className="text-sm text-content-primary">{body}</p>
      <Link href="/ship-facility-master" className={`${btnSecondary} inline-flex items-center gap-1`}>
        <ArrowLeft className="w-4 h-4" aria-hidden />
        一覧に戻る
      </Link>
    </section>
  );
}

export default function ShipFacilityDetailPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header title="SHIP施設マスタ" showBackButton backHref="/ship-facility-master" backLabel="一覧に戻る" backButtonVariant="secondary" hideMenu hideHomeButton showOriginalLabel={false} />
      <Suspense fallback={<p className="px-6 py-6 text-sm text-content-sub">読み込み中です。</p>}>
        <FacilityDetailRoute />
      </Suspense>
    </div>
  );
}
