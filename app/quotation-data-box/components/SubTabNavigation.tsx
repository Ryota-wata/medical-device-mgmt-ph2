'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/lib/hooks';

export type SubTabType = 'remodelManagement' | 'purchaseManagement' | 'transferDisposalManagement' | 'repairRequests' | 'makerMaintenance' | 'inHouseInspection' | 'lendingManagement';

export const SUB_TABS: { key: SubTabType; label: string; path: string }[] = [
  { key: 'remodelManagement', label: 'リモデル管理', path: '/quotation-data-box/remodel-management' },
  { key: 'purchaseManagement', label: '購入管理', path: '/quotation-data-box/purchase-management' },
  { key: 'transferDisposalManagement', label: '移動・廃棄管理', path: '/quotation-data-box/transfer-management' },
  { key: 'repairRequests', label: '修理管理', path: '/quotation-data-box/repair-requests' },
  { key: 'makerMaintenance', label: '保守契約管理', path: '/quotation-data-box/maintenance-contracts' },
  { key: 'inHouseInspection', label: '点検管理', path: '/quotation-data-box/inspection-requests' },
  { key: 'lendingManagement', label: '貸出管理', path: '/quotation-data-box/lending-management' },
];

// ロール別の非表示タブ
const ROLE_HIDDEN_TABS: Record<string, SubTabType[]> = {
  consultant: ['purchaseManagement'],
  office_admin: ['remodelManagement'],
  office_staff: ['remodelManagement'],
};

interface SubTabNavigationProps {
  activeTab: SubTabType;
}

export function SubTabNavigation({ activeTab }: SubTabNavigationProps) {
  const router = useRouter();
  const { role } = usePermissions();

  // ロールに応じて表示するタブをフィルタリング
  const visibleTabs = useMemo(() => {
    const hiddenTabs = role ? ROLE_HIDDEN_TABS[role] || [] : [];
    return SUB_TABS.filter(tab => !hiddenTabs.includes(tab.key));
  }, [role]);

  return (
    <div style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E1E1E1',
      display: 'flex',
      flexWrap: 'wrap',
    }}>
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.path)}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid #008C1D' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#146E2E' : '#4A4A4A',
              transition: 'all 0.15s ease',
              marginBottom: -1,
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.background = '#FAFAFA';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.background = 'transparent';
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
