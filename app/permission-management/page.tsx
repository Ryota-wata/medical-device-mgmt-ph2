'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore, useFacilityFeatureStore } from '@/lib/stores';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import {
  PERMISSION_UNITS,
  PERMISSION_CATEGORY_ORDER,
  getPermissionUnitsByCategory,
  PermissionUnit,
} from '@/lib/data/permission-units';

type PendingChanges = Record<string, boolean>;

export default function PermissionManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { facilities } = useMasterStore();
  const { setSetting, getSetting, copyFromFacility } = useFacilityFeatureStore();
  const { showToast } = useToast();

  const [selectedFacilityState, setSelectedFacility] = useState<string>('');
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySourceFacility, setCopySourceFacility] = useState('');
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);
  const [pendingFacility, setPendingFacility] = useState<string | null>(null);

  const pendingCount = Object.keys(pendingChanges).length;
  const hasPendingChanges = pendingCount > 0;

  const facilityOptions = useMemo(
    () => facilities.map((f) => f.facilityName),
    [facilities]
  );

  /** 未選択時は施設マスタの先頭を自動選択（state には反映せず derived のみ） */
  const selectedFacility = selectedFacilityState || facilityOptions[0] || '';

  useEffect(() => {
    if (!hasPendingChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasPendingChanges]);

  if (user?.role !== 'system_admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-card p-6">
        <div className="text-center">
          <p className="text-base font-semibold text-content-alert mb-2">アクセス権限がありません</p>
          <p className="text-sm text-content-sub mb-4">この画面はシステム管理者のみ利用できます</p>
          <button
            onClick={() => router.push('/main')}
            className="px-4 py-2 bg-content-sub text-white rounded text-sm hover:bg-content-primary transition-colors"
          >
            メイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  const getDisplayEnabled = (unitId: string): boolean => {
    if (unitId in pendingChanges) return pendingChanges[unitId];
    return getSetting(selectedFacility, unitId);
  };

  const isPending = (unitId: string): boolean => unitId in pendingChanges;

  const handleToggle = (unit: PermissionUnit) => {
    if (!selectedFacility) return;
    const currentDisplay = getDisplayEnabled(unit.id);
    const savedValue = getSetting(selectedFacility, unit.id);
    const newValue = !currentDisplay;

    setPendingChanges((prev) => {
      const next = { ...prev };
      if (newValue === savedValue) {
        delete next[unit.id];
      } else {
        next[unit.id] = newValue;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedFacility) return;
    for (const [unitId, enabled] of Object.entries(pendingChanges)) {
      setSetting(selectedFacility, unitId, enabled);
    }
    setPendingChanges({});
    showToast(`${selectedFacility} の権限設定を保存しました`, 'success');
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const handleFacilityChange = (newFacility: string) => {
    if (hasPendingChanges) {
      setPendingFacility(newFacility);
      return;
    }
    setPendingChanges({});
    setSelectedFacility(newFacility);
  };

  const confirmFacilitySwitch = () => {
    if (!pendingFacility) return;
    setPendingChanges({});
    setSelectedFacility(pendingFacility);
    setPendingFacility(null);
  };

  const cancelFacilitySwitch = () => setPendingFacility(null);

  const handleHomeClick = () => {
    if (hasPendingChanges) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  const handleOpenCopy = () => {
    setCopySourceFacility('');
    setShowCopyDialog(true);
  };

  const handleRequestCopy = () => {
    if (!copySourceFacility || copySourceFacility === selectedFacility) {
      setShowCopyDialog(false);
      return;
    }
    setShowCopyConfirm(true);
  };

  const handleConfirmCopy = () => {
    copyFromFacility(copySourceFacility, selectedFacility);
    setPendingChanges({});
    setShowCopyConfirm(false);
    setShowCopyDialog(false);
    const sourceName = copySourceFacility;
    setCopySourceFacility('');
    showToast(`${sourceName} の設定を ${selectedFacility} にコピーしました`, 'success');
  };

  const grouped = getPermissionUnitsByCategory();
  const visibleCategories = PERMISSION_CATEGORY_ORDER.filter((c) => grouped[c] && grouped[c].length > 0);
  const totalCount = PERMISSION_UNITS.length;

  return (
    <div className="h-dvh flex flex-col bg-surface-screen">
      <header className="bg-surface-card border-b border-stroke-input px-5 py-4 flex justify-between items-center flex-wrap gap-3 z-20">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-cta-primary text-white rounded text-xs font-bold tracking-wider">SHIP</span>
          <h1 className="text-base font-bold text-content-primary m-0">権限管理</h1>
          <span className="px-2 py-0.5 bg-stroke-card text-content-sub rounded text-xs">{totalCount}件</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCopy}
            disabled={!selectedFacility}
            className="px-4 py-2 bg-surface-card text-cta-primary border border-cta-primary rounded text-sm font-semibold hover:bg-surface-select transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            一括コピー
          </button>
          <button
            onClick={handleHomeClick}
            className="px-4 py-2 bg-content-sub text-white border-0 rounded text-sm font-semibold hover:bg-content-primary transition-colors"
          >
            メイン画面に戻る
          </button>
        </div>
      </header>

      <div className="max-w-[1100px] mx-auto w-full px-5 py-6 pb-24 flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
        <div className="bg-surface-card border border-stroke-input rounded-md p-4 mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5 min-w-[260px]">
              <label className="text-xs font-semibold text-content-primary">対象施設</label>
              <SearchableSelect
                options={facilityOptions}
                value={selectedFacility}
                onChange={handleFacilityChange}
                placeholder="施設を選択..."
              />
            </div>
            <p className="text-xs text-content-sub flex-1 min-w-[200px] text-pretty">
              施設に対して機能ごとの ON/OFF を設定します。OFF の機能は当該施設で利用できなくなります（画面はアクセス不可、ボタン/カラム/モーダル は画面に表示されません）。
            </p>
          </div>
        </div>

        <div className="bg-surface-card border border-stroke-input rounded-md overflow-auto flex-1" style={{ minHeight: 0 }}>
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-surface-screen">
              <tr className="border-b border-stroke-input">
                <th className="text-left font-semibold text-content-sub py-3 px-4 whitespace-nowrap">機能</th>
                <th className="text-left font-semibold text-content-sub py-3 px-4">切替内容</th>
                <th className="text-center font-semibold text-content-sub py-3 px-4 w-[100px]">ON/OFF</th>
              </tr>
            </thead>
            <tbody>
              {visibleCategories.map((category) => {
                const units = grouped[category];
                return (
                  <React.Fragment key={category}>
                    <tr className="bg-stroke-card border-b border-stroke-input">
                      <td colSpan={3} className="py-2 px-4 text-xs font-semibold text-content-primary tracking-wide">
                        {category}
                      </td>
                    </tr>
                    {units.map((unit) => {
                      const enabled = getDisplayEnabled(unit.id);
                      const changed = isPending(unit.id);
                      return (
                        <tr
                          key={unit.id}
                          className={`border-b border-stroke-card last:border-b-0 ${
                            changed ? 'bg-surface-select' : !enabled ? 'bg-stroke-card' : 'hover:bg-surface-screen'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-content-primary align-top whitespace-nowrap">
                            <div>{unit.displayName}</div>
                            {changed && (
                              <span className="inline-block mt-1 text-xs text-content-alert font-medium">変更あり</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-xs text-content-primary align-top text-pretty leading-relaxed">
                            {unit.switchContent}
                          </td>
                          <td className="py-2.5 px-4 text-center align-top">
                            <button
                              onClick={() => handleToggle(unit)}
                              aria-label={`${unit.displayName} を${enabled ? 'OFF' : 'ON'}にする`}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                enabled ? 'bg-cta-primary' : 'bg-surface-disabled'
                              }`}
                            >
                              <span
                                className={`inline-block size-4 transform rounded-full bg-surface-card shadow transition-transform ${
                                  enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {hasPendingChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-content-primary text-white px-5 py-3 shadow-lg z-30">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4">
            <p className="text-sm m-0">
              {selectedFacility} : 未保存の変更が {pendingCount} 件あります
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDiscard}
                className="px-4 py-2 bg-content-primary text-white border-0 rounded text-sm font-semibold hover:bg-content-primary transition-colors"
              >
                変更を破棄
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-cta-primary text-white border-0 rounded text-sm font-semibold hover:bg-cta-primary-dark transition-colors"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {showCopyDialog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
          onClick={() => setShowCopyDialog(false)}
          role="presentation"
        >
          <div
            className="bg-surface-card rounded-md w-[90%] max-w-[460px] p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-dialog-title"
          >
            <h2 id="copy-dialog-title" className="text-base font-bold text-content-primary m-0 mb-3">
              他施設の設定を一括コピー
            </h2>
            <p className="text-sm text-content-primary mb-4 text-pretty">
              コピー元の施設を選択してください。
            </p>
            <SearchableSelect
              options={facilityOptions.filter((f) => f !== selectedFacility)}
              value={copySourceFacility}
              onChange={(v) => setCopySourceFacility(v)}
              placeholder="コピー元施設を選択..."
            />
            <div className="mt-4 px-3 py-2.5 bg-surface-select border border-cta-primary rounded text-xs text-cta-primary-dark">
              <strong>注意:</strong> {selectedFacility} の現在の設定はすべて上書きされ、元に戻すことはできません。
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCopyDialog(false)}
                className="px-4 py-2 bg-surface-card text-content-primary border border-stroke-input rounded text-sm font-semibold hover:bg-surface-screen transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleRequestCopy}
                disabled={!copySourceFacility}
                className="px-4 py-2 bg-cta-primary text-white border-0 rounded text-sm font-semibold hover:bg-cta-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showCopyConfirm}
        onClose={() => setShowCopyConfirm(false)}
        onConfirm={handleConfirmCopy}
        title="設定を上書きします"
        message={`${selectedFacility} の現在の設定をすべて削除し、${copySourceFacility || '選択施設'} の設定で置き換えます。この操作は取り消せません。実行しますか？`}
        confirmLabel="上書きしてコピー"
        cancelLabel="キャンセル"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={pendingFacility !== null}
        onClose={cancelFacilitySwitch}
        onConfirm={confirmFacilitySwitch}
        title="施設を切替"
        message="未保存の変更が破棄されます。施設を切替えますか？"
        confirmLabel="破棄して切替"
        cancelLabel="入力を続ける"
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="未保存の変更が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="入力を続ける"
        variant="warning"
      />
    </div>
  );
}
