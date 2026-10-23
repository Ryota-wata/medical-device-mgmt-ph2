'use client';

/**
 * MS-102 権限設定タブ
 * 顧客ワイヤー 操作UI_施設マスタ v3.3 の #tab1（手順①〜⑤・施設管理者一覧・機能 × 担当管理組織のマトリクス）
 * 機能の一覧は正本の最新カタログ（lib/data/featureCatalog.ts）。
 */
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import type { FacilityContractStatus } from '@/lib/types/master';
import { FEATURE_CATEGORIES, FEATURES, type FeatureSubject } from '@/lib/data/featureCatalog';
import type { FacilityAdmin, FacilityAdminState, FeatureSetting } from '@/lib/stores/facilityAdminStore';

interface PermissionTabProps {
  state: FacilityAdminState;
  status: FacilityContractStatus;
  stopPlanDate?: string;
  onFeatureChange: (code: string, patch: Partial<FeatureSetting>) => void;
  onToggleColumn: (org: string, on: boolean, categoryCode: string) => void;
  onOpenAdmin: (admin: FacilityAdmin | null) => void;
  onInvite: (admin: FacilityAdmin) => void;
  onRevoke: (admin: FacilityAdmin) => void;
  onPermDone: () => void;
  onStart: () => void;
  onGoContract: () => void;
}

const UNSET = '－';
const needsOrg = (s: FeatureSetting) => s.use && (s.subject === 'SHIP' || s.subject === '両方');
const shortOrg = (name: string) => name.replace(/（.*$/, '');

export function unassignedCount(state: FacilityAdminState) {
  return Object.values(state.features).filter((s) => needsOrg(s) && !s.orgs.length).length;
}

const pill = (text: string, tone: 'ok' | 'warn' | 'blue' | 'gray') => {
  const cls = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-800 border-amber-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
    gray: 'bg-stone-100 text-stone-600 border-stone-200',
  }[tone];
  return <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${cls}`}>{text}</span>;
};

const btn = 'min-h-[44px] px-3 rounded-md border text-xs font-semibold whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed';
const btnSecondary = `${btn} border-stroke-input bg-white text-content-primary hover:bg-bg-light`;
const btnPrimary = `${btn} border-transparent bg-cta-primary text-white hover:bg-cta-primary-dark`;

export function PermissionTab(props: PermissionTabProps) {
  const { state, status, stopPlanDate, onFeatureChange, onToggleColumn, onOpenAdmin, onInvite, onRevoke, onPermDone, onStart, onGoContract } = props;
  const [category, setCategory] = useState(FEATURE_CATEGORIES[0].code);

  const orgs = Array.from(new Set(state.admins.filter((a) => a.type === '管理組織').map((a) => a.name)));
  const hospitalAdmins = state.admins.filter((a) => a.type === '病院管理者');
  const settings = state.features;
  const useCount = Object.values(settings).filter((s) => s.use).length;
  const configurableCount = Object.keys(settings).length;
  const unassigned = unassignedCount(state);
  const notInvited = state.admins.filter((a) => a.status === '未招待').length;
  const canInvite = state.permDone && status === '契約中';
  const inviteWhy = !state.permDone ? '権限設定の完了と利用開始の両方が済むと押せます' : '利用を開始する（契約中にする）と押せます';

  // ── 手順 ①〜⑤ ──
  const steps = [
    { t: '管理者を登録', d: '管理組織と病院管理者', ok: state.admins.length > 0 && orgs.length > 0 },
    { t: '権限設定', d: '利用・実施主体・担当管理組織', ok: useCount > 0 && unassigned === 0 },
    { t: '権限設定を完了する', d: '利用開始が押せるようになる', ok: state.permDone },
    { t: '利用を開始する', d: '契約中になり、施設契約の段が通る', ok: status === '契約中' },
    { t: '招待する', d: '③④の両方が済むと管理者一覧から送れる。有効期限7日', ok: state.admins.length > 0 && notInvited === 0 },
  ];
  const current = steps.findIndex((s) => !s.ok);
  const NO = '①②③④⑤';

  const hospitalScope = Object.values(settings).filter((s) => s.use && (s.subject === '病院' || s.subject === '両方')).length;
  // 列の一括操作と同じく、利用 ON かつ実施主体が SHIP／両方の機能だけを数える
  const featuresOfOrg = (org: string) =>
    FEATURES.filter((f) => settings[f.code] && needsOrg(settings[f.code]) && settings[f.code].orgs.includes(org));

  const catFeatures = FEATURES.filter((f) => f.category === category);
  const catConfigurable = catFeatures.filter((f) => settings[f.code]);
  const colState = (org: string) => {
    const targets = catConfigurable.filter((f) => needsOrg(settings[f.code]));
    if (!targets.length) return 'none' as const;
    const n = targets.filter((f) => settings[f.code].orgs.includes(org)).length;
    return n === 0 ? ('off' as const) : n === targets.length ? ('all' as const) : ('some' as const);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 手順 */}
      <section className="bg-surface-card border border-stroke-card rounded-lg p-4 flex flex-col gap-3" aria-label="この施設を使えるようにするまでの手順">
        <h2 className="text-sm font-bold text-content-primary flex items-center gap-3">
          この施設を使えるようにするまでの手順
          {current < 0 ? pill('すべて完了', 'ok') : pill(`いま ${NO[current]} ${steps[current].t}`, 'warn')}
        </h2>
        <ol className="grid gap-2 grid-cols-1 md:grid-cols-5">
          {steps.map((s, i) => (
            <li
              key={s.t}
              className={`flex gap-2 p-2 rounded-md border text-sm ${
                s.ok ? 'border-emerald-200 bg-emerald-50' : i === current ? 'border-amber-300 bg-amber-50' : 'border-stroke-card'
              }`}
            >
              <span className="font-bold">{s.ok ? <Check className="w-4 h-4 text-emerald-700" aria-label="済み" /> : NO[i]}</span>
              <span>
                {s.t}
                <span className="block text-xs text-content-sub">{s.d}</span>
              </span>
            </li>
          ))}
        </ol>
        {current === 1 && unassigned > 0 && (
          <p className="text-xs text-amber-800">
            担当管理組織が未割り当ての機能が <b className="tabular-nums">{unassigned}</b> 件あります。そのままでも完了できますが、その機能は誰も使えません。
          </p>
        )}
        {current === 4 && notInvited > 0 && (
          <p className="text-xs text-amber-800">
            未招待の管理者が <b className="tabular-nums">{notInvited}</b> 名います。下の一覧の［招待する］で送ってください。
          </p>
        )}
      </section>

      {/* 施設管理者一覧 */}
      <section className="bg-surface-card border border-stroke-card rounded-lg p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-bold text-content-primary">施設管理者一覧</h2>
          <span className="text-xs text-content-sub">この施設に関わる管理者。SAMS管理者が登録します</span>
          <button type="button" onClick={() => onOpenAdmin(null)} className={`${btnSecondary} ml-auto`}>
            ＋ 管理者登録
          </button>
        </div>
        {state.admins.length === 0 ? (
          <p className="text-sm text-content-primary py-4">
            管理者がまだ登録されていません。［＋ 管理者登録］から、病院管理者と管理組織を登録してください。
          </p>
        ) : (
          <div className="overflow-x-auto border border-stroke-card rounded-md">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-bg-light text-xs text-content-sub">
                <tr>
                  {['区分', '管理組織／管理者名', '所属組織', '担当している機能'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold">配下</th>
                  <th className="px-3 py-2 text-center font-semibold">状態</th>
                  <th className="px-3 py-2 text-left font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {state.admins.map((a) => {
                  const isH = a.type === '病院管理者';
                  const fs = isH ? [] : featuresOfOrg(a.name);
                  const lastHospital = isH && hospitalAdmins.length <= 1;
                  return (
                    <tr key={a.id} className={`border-t border-stroke-card ${!isH && !fs.length ? 'bg-amber-50' : ''}`}>
                      <td className="px-3 py-2">{pill(a.type, isH ? 'ok' : 'blue')}</td>
                      <td className="px-3 py-2">
                        <span className="font-semibold">{a.name}</span>
                        {!isH && <span className="block text-xs text-content-sub">管理者：{a.person || '－'}</span>}
                      </td>
                      <td className="px-3 py-2">{a.org || '－'}</td>
                      <td className="px-3 py-2 text-pretty">
                        {isH ? (
                          `病院／両方 の全機能（${hospitalScope}）`
                        ) : fs.length ? (
                          <>
                            {fs.slice(0, 2).map((f) => f.name.replace(/（.*$/, '')).join('／')}
                            {fs.length > 2 && ` ほか ${fs.length - 2}機能`}
                          </>
                        ) : (
                          <span className="font-bold text-amber-800">未割り当て</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{a.members} 名</td>
                      <td className="px-3 py-2 text-center">{pill(a.status, a.status === '有効' ? 'ok' : 'warn')}</td>
                      <td className="px-3 py-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.status === '有効' ? (
                            <span className="text-xs text-content-sub">利用中</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onInvite(a)}
                              disabled={!canInvite}
                              title={canInvite ? undefined : inviteWhy}
                              className={btnSecondary}
                            >
                              {a.status === '招待中' ? '再送' : '招待する'}
                            </button>
                          )}
                          <button type="button" onClick={() => onOpenAdmin(a)} className={btnSecondary}>
                            編集
                          </button>
                          {lastHospital ? (
                            <span className="text-xs text-content-sub" title="病院管理者は最低 1 名必要です">解除不可</span>
                          ) : (
                            <button type="button" onClick={() => onRevoke(a)} className={`${btn} border-transparent bg-transparent text-red-700 hover:bg-red-50`}>
                              解除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-content-sub text-pretty">
          病院管理者の担当機能は、下の一覧で実施主体を「病院／両方」にした機能が自動的に範囲になります（個別に指定しません）。
          SHIPの管理組織は、機能ごとに組織の列にチェックを入れて割り当てます。1つの機能を複数の組織で担当できます。
        </p>
      </section>

      {/* 機能 × 担当管理組織 */}
      <section className="bg-surface-card border border-stroke-card rounded-lg flex flex-col">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 border-b border-stroke-card text-sm">
          <span className="font-bold tabular-nums">
            利用する機能 {useCount} / {configurableCount}
          </span>
          {unassigned > 0 && (
            <span className="font-bold text-amber-800 tabular-nums">担当管理組織が未割り当ての機能 {unassigned} 件</span>
          )}
          <span className="ml-auto text-content-sub">この施設の担当管理組織</span>
          {orgs.length ? (
            orgs.map((o) => (
              <span key={o} className="inline-flex px-2 py-0.5 rounded border border-sky-200 bg-sky-50 text-xs text-sky-900">
                {o}
              </span>
            ))
          ) : (
            <span className="text-xs text-amber-800">まだ登録されていません。先に管理者（管理組織）を登録してください</span>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-[420px]">
          <nav className="border-b lg:border-b-0 lg:border-r border-stroke-card py-2" aria-label="機能カテゴリ">
            <ul>
              {FEATURE_CATEGORIES.map((c) => {
                const fs = FEATURES.filter((f) => f.category === c.code && settings[f.code]);
                const on = fs.filter((f) => settings[f.code].use).length;
                const active = c.code === category;
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => setCategory(c.code)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full min-h-[44px] px-4 flex items-center justify-between gap-2 text-left text-sm ${
                        active ? 'bg-sky-50 font-semibold text-content-primary' : 'hover:bg-bg-light'
                      }`}
                    >
                      <span>
                        {c.code} {c.name}
                      </span>
                      <span className={`text-xs tabular-nums ${fs.length && on === fs.length ? 'text-emerald-700' : 'text-content-sub'}`}>
                        {fs.length ? `${on}/${fs.length}` : '対象外'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-bg-light text-xs text-content-sub">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold w-[84px]">機能ID</th>
                  <th className="px-3 py-2 text-left font-semibold">機能名</th>
                  <th className="px-3 py-2 text-center font-semibold w-[64px]">利用</th>
                  <th className="px-3 py-2 text-left font-semibold w-[128px]">実施主体</th>
                  {orgs.map((o) => {
                    const st = colState(o);
                    return (
                      <th key={o} className="px-1 py-1 text-center font-semibold w-[110px]">
                        <button
                          type="button"
                          disabled={st === 'none'}
                          onClick={() => onToggleColumn(o, st !== 'all', category)}
                          title={`${o}　このカテゴリの対象機能に${st === 'all' ? 'すべて外す' : 'すべて割り当てる'}`}
                          className="w-full min-h-[44px] px-1 rounded hover:bg-stroke-card disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <span className="block text-content-primary">{shortOrg(o)}</span>
                          <span className="block text-xs font-normal text-content-link">{st === 'all' ? 'すべて外す' : 'すべて割当'}</span>
                        </button>
                      </th>
                    );
                  })}
                  <th className="px-3 py-2 text-center font-semibold w-[72px]">備考</th>
                </tr>
              </thead>
              <tbody>
                {catFeatures.map((f) => {
                  const s = settings[f.code];
                  if (!s) {
                    return (
                      <tr key={f.code} className="border-t border-stroke-card text-content-sub">
                        <td className="px-3 py-2 tabular-nums">{f.code}</td>
                        <td className="px-3 py-2 text-pretty">{f.name}</td>
                        <td colSpan={3 + orgs.length} className="px-3 py-2 text-xs">
                          施設ごとの設定対象外です（施設に依存しない機能、または病院・SHIPとも管理者専用の機能）
                        </td>
                      </tr>
                    );
                  }
                  const unassignedRow = needsOrg(s) && !s.orgs.length;
                  const subjectOptions: (FeatureSubject | typeof UNSET)[] = [...f.subjectOptions, UNSET];
                  return (
                    <tr key={f.code} className={`border-t border-stroke-card ${unassignedRow ? 'bg-amber-50' : ''} ${s.use ? '' : 'text-content-sub'}`}>
                      <td className="px-3 py-2 tabular-nums text-content-sub">{f.code}</td>
                      <td className="px-3 py-2 text-pretty">{f.name}</td>
                      <td className="px-3 py-1 text-center">
                        <label className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                          <input
                            type="checkbox"
                            role="switch"
                            aria-checked={s.use}
                            aria-label={`${f.name} を利用する`}
                            checked={s.use}
                            onChange={(e) => onFeatureChange(f.code, { use: e.target.checked })}
                            className="w-5 h-5"
                          />
                        </label>
                      </td>
                      <td className="px-3 py-1">
                        {f.subjectOptions.length === 1 ? (
                          <span className="text-sm">{f.subjectOptions[0]}のみ</span>
                        ) : (
                          <div className="w-[112px]">
                            <SearchableSelect
                              value={s.subject}
                              // 先頭の「すべて選択」は空文字が来るので無視する
                              onChange={(v) => v && onFeatureChange(f.code, { subject: v as FeatureSetting['subject'] })}
                              options={subjectOptions}
                              disabled={!s.use}
                              dropdownMinWidth="112px"
                            />
                          </div>
                        )}
                      </td>
                      {orgs.map((o) => (
                        <td key={o} className="px-1 py-1 text-center">
                          {needsOrg(s) ? (
                            <label className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                              <input
                                type="checkbox"
                                aria-label={`${f.name} を ${o} に割り当てる`}
                                checked={s.orgs.includes(o)}
                                onChange={(e) =>
                                  onFeatureChange(f.code, { orgs: e.target.checked ? [...s.orgs, o] : s.orgs.filter((x) => x !== o) })
                                }
                                className="w-4 h-4"
                              />
                            </label>
                          ) : (
                            <span className="text-xs text-content-sub">－</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center text-xs">{unassignedRow ? <span className="text-amber-800">未割当</span> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 次の操作 */}
      <section className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-md border border-sky-200 bg-sky-50 text-sm text-sky-900">
        <span className="text-pretty flex-1 min-w-[280px]">
          {status === '契約中' && 'この施設は利用中です。設定を変えると、病院ユーザーの画面にすぐ反映されます。招待メールは管理者一覧の［招待する］から送ります。'}
          {status === '停止予定' &&
            `この施設は利用停止予定です（${stopPlanDate || '－'} に自動停止）。病院ユーザーは閲覧のみですが、SHIP側の設定変更はこれまでどおり行えます。`}
          {status === '停止中' && 'この施設は利用停止中です。契約情報から利用を再開してください。SHIP側は付与済み権限どおり利用できます。'}
          {status === '未契約' &&
            (state.permDone
              ? '権限設定は完了しています。次は［利用を開始する］。招待メールは利用開始のあと、管理者一覧の［招待する］で送ります。'
              : '設定が終わったら ①［権限設定を完了する］→ ②［利用を開始する］の順に押します。招待メールはそのあと、管理者一覧の［招待する］から送ります。')}
        </span>
        {status === '未契約' && (
          <>
            <button type="button" onClick={onPermDone} disabled={state.permDone} className={state.permDone ? btnSecondary : btnPrimary}>
              {state.permDone ? '権限設定は完了しました' : '権限設定を完了する'}
            </button>
            <button type="button" onClick={onStart} disabled={!state.permDone} className={state.permDone ? btnPrimary : btnSecondary}>
              利用を開始する
            </button>
          </>
        )}
        {(status === '停止予定' || status === '停止中') && (
          <button type="button" onClick={onGoContract} className={btnSecondary}>
            契約情報へ
          </button>
        )}
      </section>
      <p className="text-xs text-content-sub text-pretty">
        実施主体が1つしか選べない機能は、正本の機能カタログで病院側またはSHIP側が対象外のものです。前提となる機能がある機能を利用ONにすると、前提の機能も自動でONになります。前提の機能をOFFにすると、それに依存する機能もOFFになります。
        組織の列見出しを押すと、このカテゴリの対象機能にその組織をまとめて割り当て／解除できます。
      </p>
    </div>
  );
}
