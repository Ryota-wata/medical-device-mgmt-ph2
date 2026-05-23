'use client';

import React, { useState } from 'react';
import { EditList, CreateEditListInput } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';
import { generateMockAssets } from '@/lib/data/generateMockAssets';

interface AddToEditListModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLists: EditList[];
  selectedApplicationIds: string[];
  onAddToExisting: (editListId: string) => void;
  onCreateAndAdd: (input: CreateEditListInput) => void;
}

export function AddToEditListModal({
  isOpen,
  onClose,
  editLists,
  selectedApplicationIds,
  onAddToExisting,
  onCreateAndAdd,
}: AddToEditListModalProps) {
  const { facilities } = useMasterStore();
  const [mode, setMode] = useState<'existing' | 'new'>(editLists.length > 0 ? 'existing' : 'new');
  const [selectedEditListId, setSelectedEditListId] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (mode === 'existing') {
      if (!selectedEditListId) {
        alert('編集リストを選択してください');
        return;
      }
      onAddToExisting(selectedEditListId);
    } else {
      if (!newListName.trim()) {
        alert('編集リスト名を入力してください');
        return;
      }
      if (selectedFacilities.length === 0) {
        alert('対象施設を1つ以上選択してください');
        return;
      }
      // 対象施設の原本資産を生成
      const baseAssets = generateMockAssets(selectedFacilities);
      onCreateAndAdd({
        name: newListName.trim(),
        facilities: selectedFacilities,
        baseAssets,
      });
    }
    onClose();
  };

  const facilityOptions = facilities.map(f => f.facilityName);
  const filteredFacilities = facilityOptions.filter(f =>
    f.toLowerCase().includes(facilitySearchQuery.toLowerCase())
  );

  const handleFacilityToggle = (facilityName: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facilityName)
        ? prev.filter(f => f !== facilityName)
        : [...prev, facilityName]
    );
  };

  const handleSelectAllFacilities = () => {
    if (selectedFacilities.length === facilityOptions.length) {
      setSelectedFacilities([]);
    } else {
      setSelectedFacilities([...facilityOptions]);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            background: '#008C1D',
            color: 'white',
            padding: '16px 24px',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <span>編集リストへ追加</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* ボディ */}
        <div style={{ padding: '24px' }}>
          {/* 編集リストがない場合の警告 */}
          {editLists.length === 0 && (
            <div
              style={{
                background: '#FDF1E5',
                border: '1px solid #4A4A4A',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span style={{ fontSize: '14px', color: '#4A4A4A' }}>
                編集リストがありません。新規作成してください。
              </span>
            </div>
          )}

          {/* モード選択 */}
          {editLists.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '12px' }}>
                追加先を選択してください:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    background: mode === 'existing' ? '#EBF5EE' : 'transparent',
                    border: mode === 'existing' ? '1px solid #008C1D' : '1px solid transparent',
                  }}
                >
                  <input
                    type="radio"
                    checked={mode === 'existing'}
                    onChange={() => setMode('existing')}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#4A4A4A' }}>既存の編集リストに追加</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    background: mode === 'new' ? '#EBF5EE' : 'transparent',
                    border: mode === 'new' ? '1px solid #008C1D' : '1px solid transparent',
                  }}
                >
                  <input
                    type="radio"
                    checked={mode === 'new'}
                    onChange={() => setMode('new')}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#4A4A4A' }}>新規編集リストを作成</span>
                </label>
              </div>
            </div>
          )}

          {/* 既存リスト選択 */}
          {mode === 'existing' && editLists.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  border: '1px solid #E1E1E1',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                {editLists.map((list) => (
                  <label
                    key={list.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #FAFAFA',
                      background: selectedEditListId === list.id ? '#EBF5EE' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="editList"
                      checked={selectedEditListId === list.id}
                      onChange={() => setSelectedEditListId(list.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A4A4A' }}>
                        {list.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8A8A8A' }}>
                        施設: {list.facilities.join(', ')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 新規作成フォーム */}
          {(mode === 'new' || editLists.length === 0) && (
            <div
              style={{
                border: '1px solid #E1E1E1',
                borderRadius: '8px',
                padding: '16px',
                background: '#FAFAFA',
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#4A4A4A',
                    marginBottom: '8px',
                  }}
                >
                  編集リスト名 <span style={{ color: '#DA0000' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="例: 2025年2月_手術部門"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#4A4A4A',
                    marginBottom: '8px',
                  }}
                >
                  対象施設 <span style={{ color: '#DA0000' }}>*</span>
                  <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#8A8A8A', marginLeft: '8px' }}>
                    （複数選択可）
                  </span>
                </label>
                {/* 検索フィールド */}
                <input
                  type="text"
                  value={facilitySearchQuery}
                  onChange={(e) => setFacilitySearchQuery(e.target.value)}
                  placeholder="施設名で検索..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                  }}
                />
                {/* 全選択/全解除 */}
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllFacilities}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#087CB6',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    {selectedFacilities.length === facilityOptions.length ? '全解除' : '全選択'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#8A8A8A' }}>
                    {selectedFacilities.length}件選択中
                  </span>
                </div>
                {/* 施設リスト */}
                <div
                  style={{
                    border: '1px solid #E1E1E1',
                    borderRadius: '6px',
                    maxHeight: '160px',
                    overflow: 'auto',
                    background: 'white',
                  }}
                >
                  {filteredFacilities.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#8A8A8A', fontSize: '13px' }}>
                      該当する施設がありません
                    </div>
                  ) : (
                    filteredFacilities.map((facility) => (
                      <label
                        key={facility}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #FAFAFA',
                          background: selectedFacilities.includes(facility) ? '#EBF5EE' : 'transparent',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFacilities.includes(facility)}
                          onChange={() => handleFacilityToggle(facility)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <span style={{ fontSize: '13px', color: '#4A4A4A' }}>{facility}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 対象申請 */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#FAFAFA', borderRadius: '6px' }}>
            <span style={{ fontSize: '13px', color: '#8A8A8A' }}>
              対象申請: {selectedApplicationIds.length}件
            </span>
          </div>
        </div>

        {/* フッター */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #E1E1E1',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#FAFAFA',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#8A8A8A',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '10px 20px',
              background: '#008C1D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {mode === 'new' || editLists.length === 0 ? '作成して追加' : '追加する'}
          </button>
        </div>
      </div>
    </div>
  );
}
