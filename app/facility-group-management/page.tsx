'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore, useFacilityGroupStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useToast } from '@/components/ui/Toast';
import type { SharingDataType } from '@/lib/types/facilityGroup';

const SHARING_LABELS: Record<SharingDataType, string> = {
  asset: '資産データ',
  estimate: '見積データ',
  history: 'データ履歴',
};

export default function FacilityGroupManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { facilities } = useMasterStore();
  const {
    groups,
    addGroup,
    deleteGroup,
    updateGroupName,
    addFacilityToGroup,
    removeFacilityFromGroup,
    setSharing,
  } = useFacilityGroupStore();
  const { isMobile } = useResponsive();
  const { showToast } = useToast();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');

  // system_admin のみ
  if (user?.role !== 'system_admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface-screen">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-lg font-semibold text-content-alert text-pretty">アクセス権限がありません</p>
          <p className="mt-2 text-sm text-content-sub text-pretty">この画面はシステム管理者のみ利用できます</p>
          <button
            onClick={() => router.push('/main')}
            className="mt-4 px-4 py-2 bg-content-primary text-white rounded text-sm font-semibold transition-colors hover:bg-content-primary"
          >
            メイン画面へ戻る
          </button>
        </div>
      </div>
    );
  }

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;
  const facilityOptions = facilities.map((f) => f.facilityName);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) {
      showToast('グループ名を入力してください', 'warning');
      return;
    }
    const id = addGroup(newGroupName.trim());
    setNewGroupName('');
    setSelectedGroupId(id);
    showToast(`グループ「${newGroupName.trim()}」を作成しました`, 'success');
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (!window.confirm(`「${group.name}」を削除しますか？この操作は取り消せません。`)) return;
    deleteGroup(groupId);
    if (selectedGroupId === groupId) {
      setSelectedGroupId(null);
    }
    showToast(`「${group.name}」を削除しました`, 'success');
  };

  const handleStartEditName = () => {
    if (!selectedGroup) return;
    setEditNameValue(selectedGroup.name);
    setEditingName(true);
  };

  const handleSaveName = () => {
    if (!selectedGroup || !editNameValue.trim()) return;
    updateGroupName(selectedGroup.id, editNameValue.trim());
    setEditingName(false);
    showToast('グループ名を更新しました', 'success');
  };

  const handleAddFacility = (facilityName: string) => {
    if (!selectedGroup || !facilityName) return;
    addFacilityToGroup(selectedGroup.id, facilityName);
    setFacilitySearchQuery('');
  };

  const handleRemoveFacility = (facilityName: string) => {
    if (!selectedGroup) return;
    removeFacilityFromGroup(selectedGroup.id, facilityName);
  };

  const handleSharingToggle = (dataType: SharingDataType) => {
    if (!selectedGroup) return;
    setSharing(selectedGroup.id, dataType, !selectedGroup.sharing[dataType]);
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      {/* ヘッダー */}
      <header className="bg-content-primary text-white px-5 py-4 flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/main')}
            className="px-3 py-1.5 bg-content-sub text-white border-0 rounded text-sm cursor-pointer transition-colors hover:bg-content-primary"
          >
            ← 戻る
          </button>
          <h1 className="text-lg font-bold m-0 text-balance">施設グループ管理</h1>
        </div>
      </header>

      <div className={`flex-1 ${isMobile ? 'flex flex-col' : 'flex'} gap-4 px-3 py-5 sm:px-5 max-w-[1400px] mx-auto w-full`}>
        {/* 左パネル: グループ一覧 */}
        <div className={`bg-white rounded-lg shadow ${isMobile ? 'w-full' : 'w-[320px] shrink-0'}`}>
          <div className="p-4 border-b border-stroke-input">
            <h2 className="text-base font-semibold text-content-primary mb-3">グループ一覧</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="新規グループ名"
                className="flex-1 px-3 py-2 border border-stroke-input rounded-md text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGroup();
                }}
              />
              <button
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className={`px-4 py-2 border-0 rounded-md text-sm font-semibold transition-colors ${
                  newGroupName.trim()
                    ? 'bg-cta-primary text-white cursor-pointer hover:bg-cta-primary-dark'
                    : 'bg-stroke-card text-content-sub cursor-not-allowed'
                }`}
              >
                追加
              </button>
            </div>
          </div>

          <div className="p-2 max-h-[60vh] overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-center text-sm text-content-sub py-8 text-pretty">
                グループがありません
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                      selectedGroupId === group.id
                        ? 'bg-surface-select border border-cta-primary'
                        : 'hover:bg-surface-screen border border-transparent'
                    }`}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-content-primary truncate">{group.name}</div>
                      <div className="text-xs text-content-sub mt-0.5">{group.facilityIds.length} 施設</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="px-2 py-1 text-xs text-content-alert bg-transparent border border-content-alert rounded cursor-pointer hover:bg-surface-screen transition-colors shrink-0 ml-2"
                      aria-label={`${group.name}を削除`}
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右パネル: 選択グループの詳細 */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {!selectedGroup ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <p className="text-content-sub text-pretty">左パネルからグループを選択してください</p>
            </div>
          ) : (
            <div className="p-6">
              {/* グループ名 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-content-primary mb-2">グループ名</label>
                {editingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="flex-1 max-w-[300px] px-3 py-2 border border-stroke-input rounded-md text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-3 py-2 bg-cta-primary text-white border-0 rounded-md text-sm font-semibold cursor-pointer hover:bg-cta-primary-dark transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="px-3 py-2 bg-content-sub text-white border-0 rounded-md text-sm font-semibold cursor-pointer hover:bg-content-sub transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-content-primary">{selectedGroup.name}</span>
                    <button
                      onClick={handleStartEditName}
                      className="px-2 py-1 text-xs text-content-sub bg-transparent border border-stroke-input rounded cursor-pointer hover:bg-surface-screen transition-colors"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>

              {/* 所属施設 */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-content-primary mb-2">
                  所属施設（{selectedGroup.facilityIds.length}施設）
                </label>
                <div className="mb-3">
                  <SearchableSelect
                    value={facilitySearchQuery}
                    onChange={setFacilitySearchQuery}
                    onSelect={handleAddFacility}
                    options={facilityOptions.filter((f) => !selectedGroup.facilityIds.includes(f))}
                    placeholder="施設名を検索して追加..."
                    isMobile={isMobile}
                  />
                </div>
                {selectedGroup.facilityIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedGroup.facilityIds.map((facilityId) => (
                      <div
                        key={facilityId}
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface-select border border-cta-primary rounded-full text-sm text-cta-primary-dark"
                      >
                        <span>{facilityId}</span>
                        <button
                          onClick={() => handleRemoveFacility(facilityId)}
                          className="text-content-alert bg-transparent border-0 cursor-pointer text-sm leading-none p-0"
                          aria-label={`${facilityId}を削除`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-content-sub text-pretty">施設がまだ追加されていません</p>
                )}
              </div>

              {/* 共有データ種別 */}
              <div>
                <label className="block text-sm font-semibold text-content-primary mb-3">共有データ種別</label>
                <div className="flex flex-col gap-3">
                  {(Object.keys(SHARING_LABELS) as SharingDataType[]).map((dataType) => (
                    <label key={dataType} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroup.sharing[dataType]}
                        onChange={() => handleSharingToggle(dataType)}
                        className="size-5 accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm text-content-primary">{SHARING_LABELS[dataType]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        selectedGroup.sharing[dataType]
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-surface-screen text-content-sub'
                      }`}>
                        {selectedGroup.sharing[dataType] ? '共有ON' : '共有OFF'}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-content-sub mt-3 text-pretty">
                  ONにすると、グループ内の施設間で該当データを閲覧できるようになります
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
