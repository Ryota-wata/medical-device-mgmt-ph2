'use client';

/**
 * SHIP施設マスタ MS-101 一覧・検索
 * 顧客ワイヤー: ship_sams-project docs/design/screen/phase2/共通マスタ/施設マスタ/操作UI_施設マスタ_v3.3.html
 */
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Download, Plus } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { ActionDialog, DialogNote } from '@/components/ship-facility-master/ActionDialog';
import { useFacilityMasterRole } from '@/components/ship-facility-master/useFacilityMasterRole';
import { useShipFacilities } from '@/lib/hooks/useShipFacilities';
import { useFacilityAdminStore } from '@/lib/stores/facilityAdminStore';
import { useFacilityGroupStore } from '@/lib/stores/facilityGroupStore';
import type { FacilityContractStatus, FacilityMaster } from '@/lib/types/master';
import {
  CONTRACT_STATUS_PILL,
  contractStatusOf,
  exportShipFacilities,
  isRenewalSoon,
  permissionStatusOf,
  toSlashDate,
  totalBedsOf,
} from '@/lib/utils/shipFacilityMaster';

/** 絞り込みなし。SearchableSelect の先頭「すべて選択」は空文字を返すので、空文字を「すべて」として扱う */
const ALL = '';
const DEFAULT_STATUS: FacilityContractStatus = '契約中';
const STATUS_OPTIONS: FacilityContractStatus[] = ['契約中', '停止予定', '未契約', '停止中'];
/** SHIP 管理者の所属管理組織（モックのユーザーは管理組織を持たないため、ワイヤーの MYORG と同じ固定値） */
const MY_ORG = 'コンサル1部（営業サポート）';
const PAGE_SIZE = 50;

const uniqSorted = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'ja'));

export default function ShipFacilityMasterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isSams } = useFacilityMasterRole();
  const { facilities, isLoading } = useShipFacilities();
  const adminStateOf = useFacilityAdminStore((s) => s.stateOf);
  useFacilityAdminStore((s) => s.byFacility); // 権限設定の変更を一覧に反映するため購読する
  const groups = useFacilityGroupStore((s) => s.groups);

  const [pref, setPref] = useState<string>(ALL);
  const [keyword, setKeyword] = useState('');
  // ★P-20 既定の絞込みを「契約中」にしている（顧客ワイヤーで要確認の扱い）
  const [status, setStatus] = useState<string>(DEFAULT_STATUS);
  const [area, setArea] = useState<string>(ALL);
  const [owner, setOwner] = useState<string>(ALL);
  const [remodel, setRemodel] = useState<'all' | 'あり' | 'なし'>('all');
  const [perm, setPerm] = useState<'all' | 'done' | 'notDone'>('all');
  const [onlyRenewal, setOnlyRenewal] = useState(false);
  const [page, setPage] = useState(1);
  const [enterTarget, setEnterTarget] = useState<FacilityMaster | null>(null);

  /** 施設グループの所属（施設グループ管理は施設名で所属を持つ） */
  const groupNamesOf = useMemo(() => {
    const map = new Map<string, string[]>();
    groups.forEach((g) => g.facilityIds.forEach((name) => map.set(name, [...(map.get(name) ?? []), g.name])));
    return (f: FacilityMaster) => map.get(f.facilityName) ?? [];
  }, [groups]);

  const prefOptions = useMemo(() => uniqSorted(facilities.map((f) => f.prefecture)), [facilities]);
  const areaOptions = useMemo(() => uniqSorted(facilities.map((f) => f.secondaryMedicalArea)), [facilities]);
  const ownerOptions = useMemo(() => uniqSorted(facilities.map((f) => f.foundingBody)), [facilities]);

  const renewalSoonCount = useMemo(() => facilities.filter(isRenewalSoon).length, [facilities]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return facilities.filter((f) => {
      // SHIP 管理者は自組織の枠に入っている施設だけ（SE 協議 項2）
      if (!isSams && !(f.managingOrgs ?? []).includes(MY_ORG)) return false;
      if (pref !== ALL && f.prefecture !== pref) return false;
      if (status !== ALL && contractStatusOf(f) !== status) return false;
      if (area !== ALL && f.secondaryMedicalArea !== area) return false;
      if (owner !== ALL && f.foundingBody !== owner) return false;
      if (remodel !== 'all' && (f.remodelContract ?? 'なし') !== remodel) return false;
      if (perm !== 'all' && adminStateOf(f).permDone !== (perm === 'done')) return false;
      if (onlyRenewal && !isRenewalSoon(f)) return false;
      if (kw) {
        const hay = `${f.facilityName} ${f.shortName ?? ''} ${f.facilityCode} ${f.secondaryMedicalArea ?? ''} ${f.foundingBody ?? ''} ${f.prefecture} ${f.city}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [facilities, isSams, pref, status, area, owner, remodel, perm, onlyRenewal, keyword, adminStateOf]);

  const pageCount = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  // ワイヤーの［クリア］と同じく、契約状況は既定の「契約中」に戻す
  const clearFilters = () => {
    setPref(ALL);
    setKeyword('');
    setStatus(DEFAULT_STATUS);
    setArea(ALL);
    setOwner(ALL);
    setRemodel('all');
    setPerm('all');
    setOnlyRenewal(false);
    setPage(1);
  };

  const openDetail = (f: FacilityMaster) => {
    if (!isSams) {
      showToast('施設情報・権限設定を開けるのはSAMS管理者だけです', 'info');
      return;
    }
    router.push(`/ship-facility-master/detail?id=${encodeURIComponent(f.id)}`);
  };

  const handleExport = () => {
    exportShipFacilities(filtered, groupNamesOf);
    showToast(`絞り込み後の ${filtered.length.toLocaleString()} 件を、施設情報の全項目で出力しました`, 'success');
  };

  const enterFacility = () => {
    if (!enterTarget) return;
    const id = enterTarget.id;
    setEnterTarget(null);
    showToast('施設コンテキストに入りました（監査ログに記録）', 'success');
    router.push(`/ship-facility-master/context?id=${encodeURIComponent(id)}`);
  };

  const selectCls = 'w-[200px]';

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="SHIP施設マスタ"
        showBackButton
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu
        hideHomeButton
        resultCount={facilities.length}
        showOriginalLabel={false}
      >
        {isSams ? (
          <>
            <button
              type="button"
              onClick={handleExport}
              disabled={!filtered.length}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-surface-card text-cta-primary-dark border border-cta-primary rounded-md font-semibold whitespace-nowrap hover:bg-surface-select disabled:opacity-40"
            >
              <Download size={16} aria-hidden />
              エクスポート
            </button>
            <button
              type="button"
              onClick={() => router.push('/ship-facility-master/detail?new=1')}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm bg-cta-primary text-white rounded-md font-semibold whitespace-nowrap hover:bg-cta-primary-dark"
            >
              <Plus size={16} aria-hidden />
              新規作成
            </button>
          </>
        ) : (
          <span
            className="inline-flex items-center h-7 px-3 text-xs font-semibold rounded-full border border-stone-200 bg-stone-100 text-stone-600"
            title="SHIP管理者は施設の一覧だけを見られます。施設情報・権限設定・エクスポート・新規作成・この施設で開く はSAMS管理者だけです"
          >
            閲覧のみ（一覧）
          </span>
        )}
      </Header>

      {/* 検索条件 */}
      <section className="bg-surface-card border-b border-stroke-input px-6 py-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div className={selectCls}>
            <SearchableSelect label="都道府県" value={pref} onChange={resetPage(setPref)} options={prefOptions} placeholder="すべて" />
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold text-content-primary">
            全体検索
            <input
              type="search"
              value={keyword}
              onChange={(e) => resetPage(setKeyword)(e.target.value)}
              placeholder="施設名・略称・医療機関コード・二次医療圏・経営主体 など"
              className="w-[400px] max-w-full h-10 px-3 border border-stroke-input rounded-md bg-white text-sm font-normal"
            />
          </label>
          <div className={selectCls}>
            <SearchableSelect label="契約状況" value={status} onChange={resetPage(setStatus)} options={STATUS_OPTIONS} placeholder="すべて" />
          </div>
          <button type="button" onClick={clearFilters} className="min-h-[44px] px-2 text-sm text-content-link hover:underline">
            絞込を解除
          </button>
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-content-link min-h-[44px] inline-flex items-center">
            詳細条件（二次医療圏／経営主体／リモデル契約／権限設定の状況）
          </summary>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 pt-2">
            <div className={selectCls}>
              <SearchableSelect label="二次医療圏" value={area} onChange={resetPage(setArea)} options={areaOptions} placeholder="すべて" />
            </div>
            <div className={selectCls}>
              <SearchableSelect label="経営主体" value={owner} onChange={resetPage(setOwner)} options={ownerOptions} placeholder="すべて" />
            </div>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-sm font-semibold text-content-primary">リモデル契約</legend>
              <div className="flex gap-4">
                {(['all', 'あり', 'なし'] as const).map((v) => (
                  <label key={v} className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer">
                    <input type="radio" name="remodel" checked={remodel === v} onChange={() => resetPage(setRemodel)(v)} className="w-4 h-4" />
                    {v === 'all' ? 'すべて' : v}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="flex flex-col gap-1">
              <legend className="text-sm font-semibold text-content-primary">権限設定</legend>
              <div className="flex gap-4">
                {([['all', 'すべて'], ['done', '完了'], ['notDone', '未完了']] as const).map(([v, label]) => (
                  <label key={v} className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer">
                    <input type="radio" name="perm" checked={perm === v} onChange={() => resetPage(setPerm)(v)} className="w-4 h-4" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <p className="text-xs text-content-sub pt-1">詳細条件の項目構成は、顧客ワイヤーでも未確定です。開設日・契約更新日の範囲は未実装です。</p>
        </details>
      </section>

      <main className="flex-1 flex flex-col gap-3 px-6 py-4">
        {renewalSoonCount > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 rounded-md border border-sky-200 bg-sky-50 text-sm text-sky-900">
            <span className="text-pretty">
              契約更新日が60日以内の施設が <b className="tabular-nums">{renewalSoonCount}</b> 件あります。自動更新のため、停止依頼が無ければそのまま更新されます。
            </span>
            <label className="ml-auto inline-flex items-center gap-2 min-h-[44px] cursor-pointer">
              <input type="checkbox" checked={onlyRenewal} onChange={(e) => resetPage(setOnlyRenewal)(e.target.checked)} className="w-4 h-4" />
              該当だけを表示
            </label>
          </div>
        )}

        <div className="flex items-center gap-4 text-sm">
          <span className="text-content-primary">
            検索結果 <b className="tabular-nums">{filtered.length.toLocaleString()}</b> 件
          </span>
          {isLoading && <span className="text-content-sub">顧客の施設データを読み込み中です</span>}
          {isSams && <span className="ml-auto text-xs text-content-sub">出力はヘッダーの［エクスポート］から。絞込み後の行がそのまま出ます</span>}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-surface-card rounded-lg">
            <EmptyState
              title="該当する施設がありません"
              description="契約していない施設も探す場合は、契約状況を「すべて」にしてください。"
              actionLabel="絞込を解除"
              onAction={clearFilters}
            />
          </div>
        ) : (
          <div className="bg-surface-card rounded-lg border border-stroke-card overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm border-collapse">
              <thead className="text-xs text-content-sub">
                <tr className="bg-bg-light">
                  <th colSpan={5} className="px-3 py-1 text-left font-semibold border-b border-stroke-card">基本情報</th>
                  <th className="px-3 py-1 text-left font-semibold border-b border-stroke-card">規模</th>
                  <th colSpan={4} className="px-3 py-1 text-left font-semibold border-b border-stroke-card">契約・設定</th>
                  <th className="px-3 py-1 text-left font-semibold border-b border-stroke-card">施設へ入る</th>
                  <th rowSpan={2} className="px-3 py-1 text-center font-semibold border-b border-stroke-card">操作</th>
                </tr>
                <tr className="bg-bg-light">
                  {['医療機関コード', '施設名（略称）', '施設グループ', '都道府県／二次医療圏', '経営主体'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-semibold border-b border-stroke-card whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold border-b border-stroke-card whitespace-nowrap">総病床数</th>
                  {['契約状況', 'リモデル契約', '契約更新日', '権限設定', '代理ログイン'].map((h) => (
                    <th key={h} className="px-3 py-2 text-center font-semibold border-b border-stroke-card whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((f) => {
                  const st = contractStatusOf(f);
                  const permState = permissionStatusOf(adminStateOf(f));
                  const groupNames = groupNamesOf(f);
                  return (
                    <tr
                      key={f.id}
                      onClick={() => openDetail(f)}
                      className={`border-b border-stroke-card ${isSams ? 'cursor-pointer hover:bg-bg-light' : ''}`}
                    >
                      <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                        {isSams ? (
                          <Link
                            href={`/ship-facility-master/detail?id=${encodeURIComponent(f.id)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-content-link hover:underline"
                          >
                            {f.facilityCode || '－'}
                          </Link>
                        ) : (
                          f.facilityCode || '－'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-semibold text-content-primary">{f.facilityName}</span>
                        {f.shortName && <span className="text-content-sub">（{f.shortName}）</span>}
                      </td>
                      <td className="px-3 py-2 text-content-primary">
                        {groupNames.length ? groupNames.map((g) => <div key={g}>{g}</div>) : <span className="text-content-sub">－</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {f.prefecture || '－'}／{f.secondaryMedicalArea || '－'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{f.foundingBody || '－'}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{totalBedsOf(f) || '－'}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${CONTRACT_STATUS_PILL[st]}`}>{st}</span>
                        {st === '停止予定' && f.stopPlanDate && <div className="text-xs text-amber-800 tabular-nums">{f.stopPlanDate} 停止</div>}
                        {st === '停止中' && f.stopDate && <div className="text-xs text-content-sub tabular-nums">{f.stopDate} 停止</div>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {f.remodelContract === 'あり' ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border bg-sky-50 text-sky-800 border-sky-200">あり</span>
                        ) : (
                          <span className="text-content-sub">なし</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums whitespace-nowrap">
                        {toSlashDate(f.contractEndDate) || '－'}
                        {isRenewalSoon(f) && (
                          <AlertTriangle className="inline w-4 h-4 ml-1 text-amber-700" aria-label="契約更新日が60日以内" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            permState.done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {permState.label}
                        </span>
                      </td>
                      <td className="px-3 py-1 text-center">
                        {isSams && st !== '未契約' ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnterTarget(f);
                            }}
                            className="min-h-[44px] px-3 rounded-md border border-stroke-input bg-white text-xs font-semibold hover:bg-bg-light whitespace-nowrap"
                          >
                            この施設で開く
                          </button>
                        ) : (
                          <span className="text-content-sub">－</span>
                        )}
                      </td>
                      <td className="px-3 py-1 text-center">
                        {isSams ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(f);
                            }}
                            className="min-h-[44px] px-3 rounded-md border border-stroke-input bg-white text-xs font-semibold hover:bg-bg-light whitespace-nowrap"
                          >
                            確認
                          </button>
                        ) : (
                          <span className="text-content-sub" title="施設情報・権限設定を開けるのはSAMS管理者だけです">－</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-content-sub">
            <span className="tabular-nums">
              全 {filtered.length.toLocaleString()} 件中 {((currentPage - 1) * PAGE_SIZE + 1).toLocaleString()}〜
              {Math.min(currentPage * PAGE_SIZE, filtered.length).toLocaleString()} 件を表示
            </span>
            {pageCount > 1 && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="min-h-[44px] px-3 rounded-md border border-stroke-input bg-white disabled:opacity-40"
                >
                  前へ
                </button>
                <span className="tabular-nums">
                  {currentPage} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  className="min-h-[44px] px-3 rounded-md border border-stroke-input bg-white disabled:opacity-40"
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <ActionDialog
        isOpen={!!enterTarget}
        title="この施設で開く"
        onClose={() => setEnterTarget(null)}
        actions={[{ label: 'この施設で開く', onClick: enterFacility }]}
      >
        <p>
          <b>{enterTarget?.facilityName}</b> の施設コンテキストに入ります。
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>ここから先の画面は、この施設のデータだけを対象にします</li>
          <li>画面上部に「{enterTarget?.facilityName} として操作中」のバナーが出ます</li>
          <li>施設への出入りは監査ログに記録されます</li>
        </ul>
        <DialogNote>個別部署・個別業者・個別ユーザーへは、この中のメニューから移動します。</DialogNote>
      </ActionDialog>

      <footer className="py-3 text-center text-xs text-content-sub">&copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.</footer>
    </div>
  );
}
