'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useEditListStore } from '@/lib/stores/editListStore';
import { usePermissions } from '@/lib/hooks';
import { Header } from '@/components/layouts/Header';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { QuotationsTab } from '../quotation-data-box/components/QuotationsTab';

type QuotationTabType = 'remodel' | 'purchase';

// 金額フォーマット
const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString()}`;
};

function QuotationManagementContent() {
  const { rfqGroups } = useRfqGroupStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { editLists } = useEditListStore();
  const { role } = usePermissions();

  // consultant はリモデルのみ、office系は購入のみ
  const canViewRemodel = role === 'admin' || role === 'consultant' || role === 'sales';
  const canViewPurchase = role === 'admin' || role === 'office_admin' || role === 'office_staff' || role === 'sales';

  const defaultTab: QuotationTabType = canViewRemodel ? 'remodel' : 'purchase';
  const [activeTab, setActiveTab] = useState<QuotationTabType>(defaultTab);

  // フィルターstate
  const [selectedEditListId, setSelectedEditListId] = useState<string>('');
  const [selectedRfqGroupId, setSelectedRfqGroupId] = useState<string>('');

  // タブ切り替え時にフィルターをリセット
  const handleTabChange = (tab: QuotationTabType) => {
    setActiveTab(tab);
    setSelectedEditListId('');
    setSelectedRfqGroupId('');
  };

  // 編集リスト変更時：見積依頼グループをリセット
  const handleEditListChange = (editListId: string) => {
    setSelectedEditListId(editListId);
    setSelectedRfqGroupId('');
  };

  // 編集リストに紐づく見積依頼グループ
  const availableRfqGroups = useMemo(() => {
    if (!selectedEditListId) return rfqGroups;
    return rfqGroups.filter(g => g.editListId === selectedEditListId);
  }, [rfqGroups, selectedEditListId]);

  // フィルター後の見積明細
  const filteredItems = useMemo(() => {
    // 対象のrfqGroupIdsを決定
    let targetRfqGroupIds: Set<number>;

    if (selectedRfqGroupId) {
      // 特定の見積依頼グループが選択されている
      targetRfqGroupIds = new Set([Number(selectedRfqGroupId)]);
    } else if (selectedEditListId) {
      // 編集リストが選択されている → 紐づくRfqGroupすべて
      targetRfqGroupIds = new Set(availableRfqGroups.map(g => g.id));
    } else {
      // フィルターなし → 全件
      return quotationItems;
    }

    return quotationItems.filter(item => {
      const group = quotationGroups.find(g => g.id === item.quotationGroupId);
      if (!group) return false;
      if (group.rfqGroupId === undefined) return false;
      return targetRfqGroupIds.has(group.rfqGroupId);
    });
  }, [quotationItems, quotationGroups, selectedEditListId, selectedRfqGroupId, availableRfqGroups]);

  // 合計金額
  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, item) => sum + (item.allocListPriceTotal || 0), 0);
  }, [filteredItems]);

  // タブ定義
  const tabs = useMemo(() => {
    const items: { key: QuotationTabType; label: string; activeBg: string }[] = [];
    if (canViewRemodel) {
      items.push({ key: 'remodel', label: 'リモデル見積明細', activeBg: 'bg-content-alert' });
    }
    if (canViewPurchase) {
      items.push({ key: 'purchase', label: '購入見積明細', activeBg: 'bg-cta-primary' });
    }
    return items;
  }, [canViewRemodel, canViewPurchase]);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      <Header
        title="見積管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        {/* タブ */}
        <div className="bg-surface-card border-b-2 border-stroke-input flex rounded-t">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-2.5 border-0 cursor-pointer text-[13px] rounded-t transition-colors ${
                activeTab === tab.key
                  ? `${tab.activeBg} text-white font-bold`
                  : 'bg-transparent text-content-primary font-normal hover:bg-stroke-card'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 絞り込みエリア (点検管理と同じ FilterItem 形式) */}
        <div className="bg-surface-card border-b border-stroke-input px-5 py-3 flex items-end gap-3 flex-wrap">
          <div className="flex flex-col gap-1 min-w-[180px] max-w-[220px]">
            <label className="text-[12px] font-medium text-content-sub">
              編集リスト
            </label>
            <SearchableSelect
              value={editLists.find((l) => l.id === selectedEditListId)?.name || ''}
              onChange={(label) => {
                const found = editLists.find((l) => l.name === label);
                handleEditListChange(found?.id || '');
              }}
              options={editLists.map((list) => list.name)}
              placeholder="すべて"
            />
          </div>

          <div className="flex flex-col gap-1 min-w-[260px] max-w-[340px]">
            <label className="text-[12px] font-medium text-content-sub">
              見積依頼グループ
            </label>
            <SearchableSelect
              value={(() => {
                const g = availableRfqGroups.find((g) => String(g.id) === selectedRfqGroupId);
                return g ? `${g.rfqNo} - ${g.groupName}` : '';
              })()}
              onChange={(label) => {
                const found = availableRfqGroups.find((g) => `${g.rfqNo} - ${g.groupName}` === label);
                setSelectedRfqGroupId(found ? String(found.id) : '');
              }}
              options={availableRfqGroups.map((g) => `${g.rfqNo} - ${g.groupName}`)}
              placeholder="すべて"
            />
          </div>

          <div className="ml-auto flex gap-4 items-center text-[13px] pb-1">
            <span className="text-content-primary">
              表示: <strong className="text-cta-primary-dark tabular-nums">{filteredItems.length}</strong>件
            </span>
            <span className="text-content-primary">
              合計金額: <strong className="text-content-alert tabular-nums">{formatCurrency(totalAmount)}</strong>
            </span>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 bg-surface-card overflow-auto">
          <QuotationsTab items={filteredItems} />
        </div>
      </div>
    </div>
  );
}

export default function QuotationManagementPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-content-sub">読み込み中...</div>}>
      <QuotationManagementContent />
    </Suspense>
  );
}
