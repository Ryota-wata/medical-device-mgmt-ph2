'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMaintenanceContractStore } from '@/lib/stores';
import { ContractReviewModal } from './ContractReviewModal';
import { EmptyState } from '@/components/ui/EmptyState';

// 契約種別
type ContractType = '保守契約' | '定期点検' | 'スポット契約' | '借用契約' | 'その他';

// 進行ステップ
type MaintenanceStep = 1 | 2 | 3 | 4 | 'completed';

// 保守契約データ型（契約グループ単位）
interface MaintenanceContract {
  id: string;
  applicationNo: string;
  contractGroupName: string;
  contractType: ContractType;
  contractTypeNote: string;
  contractDate: string;
  contractStartDate: string;
  contractEndDate: string;
  contractAmount: number;
  annualAmount: number;
  contractorName: string;
  contractorPerson: string;
  contractorPhone: string;
  warrantyEndDate: string;
  comment: string;
  currentStep: MaintenanceStep;
  reviewStartDate?: string;
}

// 個体管理品目データ型
interface ContractGroupAsset {
  id: number;
  managementDept: string;
  installDept: string;
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  // 点検情報（編集可能）
  inspectionGroupName: string;
  inspectionType: string;
  inspectionCycle: string;
  warrantyStart: string;
  warrantyEnd: string;
  partsExemption: boolean;
  exemptionAmount: string;
  onCall: boolean;
  remote: boolean;
  legalInspection: boolean;
  legalInspectionBasis: string;
  comment: string;
}

// ステータス表示の算出結果
interface StatusDisplay {
  label: string;
  color: string;
  fontWeight?: string;
  sortValue: number;
}

// ソート状態
type SortDirection = 'asc' | 'desc' | null;

interface MaintenanceContractsTabProps {
  isMobile?: boolean;
}

// ステータス算出ロジック
const calcStatus = (contract: MaintenanceContract): StatusDisplay => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (contract.warrantyEndDate) {
    const warrantyEnd = new Date(contract.warrantyEndDate);
    warrantyEnd.setHours(0, 0, 0, 0);
    const diffMs = warrantyEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: '保証期限切れ', color: '#DA0000', fontWeight: 'bold', sortValue: diffDays };
    }

    const diffMonths = Math.ceil(diffDays / 30);
    if (diffMonths <= 6) {
      return {
        label: `保証期間終了 ${diffMonths}ヶ月前`,
        color: diffMonths <= 2 ? '#DA0000' : '#4A4A4A',
        fontWeight: diffMonths <= 2 ? 'bold' : 'normal',
        sortValue: diffDays,
      };
    }
  }

  if (contract.contractEndDate) {
    const contractEnd = new Date(contract.contractEndDate);
    contractEnd.setHours(0, 0, 0, 0);
    const diffMs = contractEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);

    if (diffMonths <= 6) {
      return {
        label: `契約更新 ${diffMonths}ヶ月前`,
        color: diffMonths <= 2 ? '#DA0000' : '#4A4A4A',
        fontWeight: diffMonths <= 2 ? 'bold' : 'normal',
        sortValue: diffDays,
      };
    }
  }

  return { label: '-', color: '#8A8A8A', sortValue: 9999 };
};

// 期限表示
const calcDeadlineDisplay = (contract: MaintenanceContract): { label: string; color: string } => {
  const status = calcStatus(contract);
  if (status.label === '-') return { label: '-', color: '#8A8A8A' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let nearestDays = 9999;

  if (contract.warrantyEndDate) {
    const d = new Date(contract.warrantyEndDate);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (Math.abs(diff) < Math.abs(nearestDays)) nearestDays = diff;
  }
  if (contract.contractEndDate) {
    const d = new Date(contract.contractEndDate);
    d.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < nearestDays) nearestDays = diff;
  }

  if (nearestDays < 0) {
    return { label: `${Math.abs(nearestDays)}日超過`, color: '#DA0000' };
  }
  return { label: `${nearestDays}日前`, color: nearestDays <= 30 ? '#DA0000' : '#4A4A4A' };
};

// モック契約データ
const MOCK_CONTRACTS: MaintenanceContract[] = [
  {
    id: '1',
    applicationNo: 'MC-2026-001',
    contractGroupName: 'CT装置保守契約',
    contractType: '保守契約',
    contractTypeNote: 'フルメンテナンス',
    contractDate: '2025-04-01',
    contractStartDate: '2025-04-01',
    contractEndDate: '2026-03-31',
    contractAmount: 3500000,
    annualAmount: 3500000,
    contractorName: 'シーメンスヘルスケア',
    contractorPerson: '田中太郎',
    contractorPhone: '03-1234-5678',
    warrantyEndDate: '2026-05-15',
    comment: '',
    currentStep: 1,
  },
  {
    id: '2',
    applicationNo: 'MC-2026-002',
    contractGroupName: '超音波診断装置 定期点検',
    contractType: '定期点検',
    contractTypeNote: '年2回実施',
    contractDate: '2025-06-01',
    contractStartDate: '2025-06-01',
    contractEndDate: '2027-05-31',
    contractAmount: 960000,
    annualAmount: 480000,
    contractorName: 'GEヘルスケアジャパン',
    contractorPerson: '佐藤花子',
    contractorPhone: '03-9876-5432',
    warrantyEndDate: '2026-04-30',
    comment: '次回点検: 2026年4月',
    currentStep: 2,
  },
  {
    id: '3',
    applicationNo: 'MC-2026-003',
    contractGroupName: '電気手術器 スポット',
    contractType: 'スポット契約',
    contractTypeNote: '',
    contractDate: '2026-01-15',
    contractStartDate: '2026-01-15',
    contractEndDate: '2026-07-14',
    contractAmount: 500000,
    annualAmount: 1000000,
    contractorName: 'オリンパスメディカルサービス',
    contractorPerson: '鈴木一郎',
    contractorPhone: '03-5555-1234',
    warrantyEndDate: '2025-12-31',
    comment: '',
    currentStep: 3,
  },
  {
    id: '4',
    applicationNo: 'MC-2026-004',
    contractGroupName: '透析装置保守契約2024',
    contractType: '保守契約',
    contractTypeNote: 'パーツ保証付',
    contractDate: '2024-04-01',
    contractStartDate: '2024-04-01',
    contractEndDate: '2026-03-31',
    contractAmount: 1200000,
    annualAmount: 600000,
    contractorName: '日機装',
    contractorPerson: '高橋次郎',
    contractorPhone: '03-3333-4444',
    warrantyEndDate: '2026-03-31',
    comment: '契約更新要検討',
    currentStep: 4,
  },
  {
    id: '5',
    applicationNo: 'MC-2026-005',
    contractGroupName: 'MRI装置 借用契約',
    contractType: '借用契約',
    contractTypeNote: 'デモ機借用',
    contractDate: '2026-02-01',
    contractStartDate: '2026-02-01',
    contractEndDate: '2026-08-31',
    contractAmount: 0,
    annualAmount: 0,
    contractorName: 'フィリップスジャパン',
    contractorPerson: '中村三郎',
    contractorPhone: '03-2222-3333',
    warrantyEndDate: '2027-01-31',
    comment: '',
    currentStep: 'completed',
  },
  {
    id: '6',
    applicationNo: 'MC-2026-006',
    contractGroupName: 'エレベーター保守',
    contractType: 'その他',
    contractTypeNote: '建物設備',
    contractDate: '2025-04-01',
    contractStartDate: '2025-04-01',
    contractEndDate: '2028-03-31',
    contractAmount: 1440000,
    annualAmount: 480000,
    contractorName: '三菱電機ビルソリューションズ',
    contractorPerson: '加藤四郎',
    contractorPhone: '03-6666-7777',
    warrantyEndDate: '2028-03-31',
    comment: '',
    currentStep: 1,
  },
];

// 契約グループごとの個体管理品目モックデータ
const MOCK_GROUP_ASSETS: Record<string, ContractGroupAsset[]> = {
  '1': [
    { id: 1, managementDept: '臨床工学部', installDept: '放射線科', qrLabel: 'QR-2025-0101', itemName: 'CT装置', maker: 'シーメンス', model: 'SOMATOM go.Top', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
  ],
  '2': [
    { id: 2, managementDept: '臨床工学部', installDept: '外科', qrLabel: 'QR-2025-0001', itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ E10', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
    { id: 3, managementDept: '臨床工学部', installDept: 'ICU', qrLabel: 'QR-2025-0016', itemName: '超音波診断装置', maker: 'GEヘルスケア', model: 'LOGIQ E10', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
  ],
  '3': [
    { id: 4, managementDept: '臨床工学部', installDept: '手術室', qrLabel: 'QR-2025-0030', itemName: '電気手術器', maker: 'オリンパス', model: 'ESG-400', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
    { id: 5, managementDept: '臨床工学部', installDept: '手術室', qrLabel: 'QR-2025-0031', itemName: '電気手術器', maker: 'オリンパス', model: 'ESG-400', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
  ],
  '4': [
    { id: 6, managementDept: '臨床工学部', installDept: '透析室', qrLabel: 'QR-2025-0050', itemName: '透析装置', maker: '日機装', model: 'DBG-03', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2024/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
    { id: 7, managementDept: '臨床工学部', installDept: '透析室', qrLabel: 'QR-2025-0051', itemName: '透析装置', maker: '日機装', model: 'DBG-03', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2024/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
    { id: 8, managementDept: '臨床工学部', installDept: '透析室', qrLabel: 'QR-2025-0052', itemName: '透析装置', maker: '日機装', model: 'DBG-03', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2024/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
  ],
  '5': [
    { id: 9, managementDept: '臨床工学部', installDept: '放射線科', qrLabel: 'QR-2025-0070', itemName: 'MRI装置', maker: 'フィリップス', model: 'Ingenia Ambition', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2026/02/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: false, legalInspectionBasis: '', comment: '' },
  ],
  '6': [
    { id: 10, managementDept: '施設管理部', installDept: '本館', qrLabel: 'QR-2025-0090', itemName: 'エレベーター', maker: '三菱電機', model: 'NEXIEZ-MR', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: true, legalInspectionBasis: '資産M', comment: '' },
    { id: 11, managementDept: '施設管理部', installDept: '別館', qrLabel: 'QR-2025-0091', itemName: 'エレベーター', maker: '三菱電機', model: 'NEXIEZ-MR', inspectionGroupName: '', inspectionType: '', inspectionCycle: '', warrantyStart: '2025/04/01', warrantyEnd: '', partsExemption: false, exemptionAmount: '', onCall: false, remote: false, legalInspection: true, legalInspectionBasis: '資産M', comment: '' },
  ],
};

// テーブルスタイル (Figma 580:32040 border token #E1E1E1 統一)
const thGroupStyle: React.CSSProperties = {
  padding: '8px 6px',
  border: '1px solid #E1E1E1',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
};

const thSubStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid #E1E1E1',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid #E1E1E1',
  whiteSpace: 'nowrap',
  fontSize: '13px',
};

// === 契約グループ詳細モーダル ===
const ContractGroupDetailModal = ({
  isOpen,
  onClose,
  contract,
  assets,
  onAssetsUpdate,
}: {
  isOpen: boolean;
  onClose: () => void;
  contract: MaintenanceContract;
  assets: ContractGroupAsset[];
  onAssetsUpdate: (assets: ContractGroupAsset[]) => void;
}) => {
  const [localAssets, setLocalAssets] = useState<ContractGroupAsset[]>(assets);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  // assets が変わったら同期
  React.useEffect(() => {
    setLocalAssets(assets);
  }, [assets]);

  if (!isOpen) return null;

  const updateAsset = (assetId: number, updates: Partial<ContractGroupAsset>) => {
    setLocalAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updates } : a));
  };

  const handleSaveRow = (assetId: number) => {
    setEditingId(null);
    setNewAssetIds(prev => { const next = new Set(prev); next.delete(assetId); return next; });
  };

  // 新規追加した資産IDを追跡（キャンセル時に行削除するため）
  const [newAssetIds, setNewAssetIds] = useState<Set<number>>(new Set());

  const handleCancelEdit = (assetId: number) => {
    if (newAssetIds.has(assetId)) {
      // 新規追加行はキャンセルで行ごと削除
      setLocalAssets(prev => prev.filter(a => a.id !== assetId));
      setNewAssetIds(prev => { const next = new Set(prev); next.delete(assetId); return next; });
    }
    setEditingId(null);
  };

  // 資産追加
  const handleAddAsset = () => {
    const maxId = localAssets.length > 0 ? Math.max(...localAssets.map(a => a.id)) : 0;
    const newAsset: ContractGroupAsset = {
      id: maxId + 1,
      managementDept: '',
      installDept: '',
      qrLabel: '',
      itemName: '',
      maker: '',
      model: '',
      inspectionGroupName: '',
      inspectionType: '',
      inspectionCycle: '',
      warrantyStart: '',
      warrantyEnd: '',
      partsExemption: false,
      exemptionAmount: '',
      onCall: false,
      remote: false,
      legalInspection: false,
      legalInspectionBasis: '',
      comment: '',
    };
    setLocalAssets(prev => [...prev, newAsset]);
    setNewAssetIds(prev => new Set(prev).add(newAsset.id));
    setEditingId(newAsset.id);
  };

  const handleRegister = () => {
    onAssetsUpdate(localAssets);
    alert('点検管理リストに登録しました。');
    onClose();
  };

  // モーダル内テーブルスタイル
  const mThGroup: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #aaa',
    fontWeight: 600,
    fontSize: '11px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    verticalAlign: 'middle',
  };
  const mThSub: React.CSSProperties = {
    padding: '5px 6px',
    border: '1px solid #bbb',
    fontWeight: 600,
    fontSize: '11px',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };
  const mTd: React.CSSProperties = {
    padding: '6px 8px',
    border: '1px solid #E1E1E1',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };
  const cellInput: React.CSSProperties = {
    padding: '3px 6px',
    border: '1px solid #E1E1E1',
    borderRadius: '3px',
    fontSize: '11px',
    boxSizing: 'border-box' as const,
  };

  // ○/× 表示
  const boolDisplay = (val: boolean) => (
    <span style={{ color: val ? '#008C1D' : '#8A8A8A', fontWeight: val ? 'bold' : 'normal' }}>
      {val ? '○' : '×'}
    </span>
  );

  // 点検情報の10列を表示モード or 編集モードで描画
  const renderInspectionCells = (asset: ContractGroupAsset) => {
    const isEditing = editingId === asset.id;

    if (isEditing) {
      return (
        <>
          <td style={mTd}>
            <input type="text" value={asset.inspectionGroupName} onChange={(e) => updateAsset(asset.id, { inspectionGroupName: e.target.value })} placeholder={contract.contractGroupName || '-'} style={{ ...cellInput, width: '120px' }} />
          </td>
          <td style={mTd}>
            <select value={asset.inspectionType} onChange={(e) => updateAsset(asset.id, { inspectionType: e.target.value })} style={{ ...cellInput, width: '110px' }}>
              <option value="">-</option>
              <option value="院内点検">院内点検</option>
              <option value="メーカー点検">メーカー点検</option>
              <option value="スポット点検">スポット点検</option>
            </select>
          </td>
          <td style={mTd}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <input type="number" min="0" max="120" value={asset.inspectionCycle} onChange={(e) => updateAsset(asset.id, { inspectionCycle: e.target.value })} placeholder="-" style={{ ...cellInput, width: '45px', textAlign: 'right' }} />
              <span style={{ fontSize: '10px', color: '#8A8A8A' }}>ヶ月</span>
            </div>
          </td>
          <td style={mTd}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <input type="date" value={asset.warrantyStart ? asset.warrantyStart.replace(/\//g, '-') : ''} onChange={(e) => updateAsset(asset.id, { warrantyStart: e.target.value })} style={{ ...cellInput, width: '120px', fontSize: '10px' }} />
              <span style={{ fontSize: '10px' }}>〜</span>
              <input type="date" value={asset.warrantyEnd ? asset.warrantyEnd.replace(/\//g, '-') : ''} onChange={(e) => updateAsset(asset.id, { warrantyEnd: e.target.value })} style={{ ...cellInput, width: '120px', fontSize: '10px' }} />
            </div>
          </td>
          <td style={{ ...mTd, textAlign: 'center' }}>
            <select value={asset.partsExemption ? '有' : '無'} onChange={(e) => updateAsset(asset.id, { partsExemption: e.target.value === '有' })} style={{ ...cellInput, width: '50px' }}>
              <option value="無">無</option>
              <option value="有">有</option>
            </select>
          </td>
          <td style={mTd}>
            <input type="text" value={asset.exemptionAmount} onChange={(e) => updateAsset(asset.id, { exemptionAmount: e.target.value })} placeholder="-" style={{ ...cellInput, width: '80px' }} />
          </td>
          <td style={{ ...mTd, textAlign: 'center', cursor: 'pointer' }} onClick={() => updateAsset(asset.id, { onCall: !asset.onCall })}>
            {boolDisplay(asset.onCall)}
          </td>
          <td style={{ ...mTd, textAlign: 'center', cursor: 'pointer' }} onClick={() => updateAsset(asset.id, { remote: !asset.remote })}>
            {boolDisplay(asset.remote)}
          </td>
          <td style={mTd}>
            <input type="text" value={asset.comment} onChange={(e) => updateAsset(asset.id, { comment: e.target.value })} placeholder="-" style={{ ...cellInput, width: '100px' }} />
          </td>
        </>
      );
    }

    // 表示モード
    return (
      <>
        <td style={mTd}>{asset.inspectionGroupName || '-'}</td>
        <td style={mTd}>{asset.inspectionType || '-'}</td>
        <td style={mTd}>{asset.inspectionCycle ? `${asset.inspectionCycle}ヶ月` : '-'}</td>
        <td style={mTd}>
          {asset.warrantyStart || asset.warrantyEnd
            ? `${asset.warrantyStart || ''}〜${asset.warrantyEnd || ''}`
            : '-'}
        </td>
        <td style={{ ...mTd, textAlign: 'center' }}>{asset.partsExemption ? '有' : '-'}</td>
        <td style={mTd}>{asset.exemptionAmount || '-'}</td>
        <td style={{ ...mTd, textAlign: 'center' }}>{boolDisplay(asset.onCall)}</td>
        <td style={{ ...mTd, textAlign: 'center' }}>{boolDisplay(asset.remote)}</td>
        <td style={mTd}>{asset.comment || '-'}</td>
      </>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '95%',
        maxWidth: '1400px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* ヘッダー */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E1E1E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#4A4A4A' }}>
              契約グループ詳細: {contract.contractGroupName || '未設定'}
            </h3>
            <button
              onClick={handleAddAsset}
              style={{
                padding: '6px 14px',
                background: '#4A4A4A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              資産を追加
            </button>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#8A8A8A',
              padding: '4px 8px',
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* テーブルコンテンツ */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              {/* グループヘッダー行 */}
              <tr>
                <th colSpan={2} style={{ ...mThGroup, background: '#E1E1E1', color: '#4A4A4A' }}>部署情報</th>
                <th colSpan={4} style={{ ...mThGroup, background: '#E1E1E1', color: '#4A4A4A' }}>商品情報</th>
                <th colSpan={10} style={{ ...mThGroup, background: '#FAFAFA', color: '#4A4A4A' }}>点検情報</th>
                <th rowSpan={2} style={{ ...mThGroup, background: '#E1E1E1', color: '#4A4A4A' }}>操作</th>
              </tr>
              {/* サブカラムヘッダー行 */}
              <tr>
                {/* 部署情報 */}
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>管理部署</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>設置部署</th>
                {/* 商品情報 */}
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>QRラベル</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>品目</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>メーカー</th>
                <th style={{ ...mThSub, background: '#E1E1E1', color: '#4A4A4A' }}>型式</th>
                {/* 点検情報 */}
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>点検グループ名</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>点検種別</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>点検周期</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>保証期間</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>部品免責</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>免責金額</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>オンコール</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>リモート</th>
                <th style={{ ...mThSub, background: '#FDF1E5', color: '#4A4A4A' }}>コメント</th>
              </tr>
            </thead>
            <tbody>
              {localAssets.map((asset, idx) => {
                const isEditing = editingId === asset.id;
                const isNewAsset = !asset.qrLabel && !asset.itemName;
                return (
                <tr key={asset.id} style={{ background: isEditing ? '#FAFAFA' : idx % 2 === 0 ? 'white' : '#FAFAFA' }}>
                  {/* 部署情報（新規追加時は編集可能） */}
                  {isEditing && isNewAsset ? (
                    <>
                      <td style={mTd}><input type="text" value={asset.managementDept} onChange={(e) => updateAsset(asset.id, { managementDept: e.target.value })} placeholder="管理部署" style={{ ...cellInput, width: '90px' }} /></td>
                      <td style={mTd}><input type="text" value={asset.installDept} onChange={(e) => updateAsset(asset.id, { installDept: e.target.value })} placeholder="設置部署" style={{ ...cellInput, width: '90px' }} /></td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.managementDept || '-'}</td>
                      <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.installDept || '-'}</td>
                    </>
                  )}
                  {/* 商品情報（新規追加時は編集可能） */}
                  {isEditing && isNewAsset ? (
                    <>
                      <td style={mTd}><input type="text" value={asset.qrLabel} onChange={(e) => updateAsset(asset.id, { qrLabel: e.target.value })} placeholder="QRラベル" style={{ ...cellInput, width: '120px', fontFamily: 'monospace' }} /></td>
                      <td style={mTd}><input type="text" value={asset.itemName} onChange={(e) => updateAsset(asset.id, { itemName: e.target.value })} placeholder="品目" style={{ ...cellInput, width: '140px' }} /></td>
                      <td style={mTd}><input type="text" value={asset.maker} onChange={(e) => updateAsset(asset.id, { maker: e.target.value })} placeholder="メーカー" style={{ ...cellInput, width: '100px' }} /></td>
                      <td style={mTd}><input type="text" value={asset.model} onChange={(e) => updateAsset(asset.id, { model: e.target.value })} placeholder="型式" style={{ ...cellInput, width: '100px' }} /></td>
                    </>
                  ) : (
                    <>
                      <td style={{ ...mTd, background: '#FAFAFA', fontFamily: 'monospace', fontWeight: 600, color: '#087CB6' }}>{asset.qrLabel || '-'}</td>
                      <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.itemName || '-'}</td>
                      <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.maker || '-'}</td>
                      <td style={{ ...mTd, background: '#FAFAFA' }}>{asset.model || '-'}</td>
                    </>
                  )}
                  {/* 点検情報（表示 or 編集） */}
                  {renderInspectionCells(asset)}
                  {/* 操作 */}
                  <td style={{ ...mTd, textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleSaveRow(asset.id)}
                          style={{
                            padding: '4px 10px',
                            background: '#008C1D',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: 'bold',
                          }}
                        >
                          保存
                        </button>
                        <button
                          onClick={() => handleCancelEdit(asset.id)}
                          style={{
                            padding: '4px 10px',
                            background: '#8A8A8A',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(asset.id)}
                        style={{
                          padding: '4px 10px',
                          background: '#087CB6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '11px',
                        }}
                      >
                        編集
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #E1E1E1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <button
            onClick={() => setShowReviewModal(true)}
            style={{
              padding: '10px 20px',
              background: '#DA0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            契約内容見直し
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRegister}
              style={{
                padding: '10px 20px',
                background: '#008C1D',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              点検管理リストに登録
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#8A8A8A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 契約内容見直しモーダル */}
      <ContractReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        contract={{
          id: contract.id,
          contractGroupName: contract.contractGroupName,
          managementDepartment: '',
          installationDepartment: '',
          maintenanceType: contract.contractType,
          acceptanceDate: '',
          contractStartDate: contract.contractStartDate,
          contractEndDate: contract.contractEndDate,
          contractorName: contract.contractorName,
          contractorPerson: contract.contractorPerson,
          contractorEmail: '',
          contractorPhone: contract.contractorPhone,
          contractAmount: contract.contractAmount,
          status: '',
          warrantyEndDate: contract.warrantyEndDate,
          deadlineDays: null,
          comment: contract.comment,
          category: '',
          largeClass: '',
          mediumClass: '',
          item: '',
          maker: '',
          hasRemoteMaintenance: false,
          assets: localAssets.map(a => ({
            qrLabel: a.qrLabel,
            managementDepartment: a.managementDept,
            installationDepartment: a.installDept,
            item: a.itemName,
            maker: a.maker,
            model: a.model,
            maintenanceType: a.inspectionType || '',
            acceptanceDate: '',
            contractStartDate: a.warrantyStart,
            contractEndDate: a.warrantyEnd,
            inspectionCountPerYear: a.inspectionCycle ? Math.round(12 / Number(a.inspectionCycle)) : 0,
            partsExemption: a.partsExemption ? '有' : '無',
            onCall: a.onCall,
            hasRemote: a.remote,
            comment: a.comment,
          })),
        }}
        onSubmit={(contractId, result) => {
          alert(`契約「${contract.contractGroupName}」の見直しを登録しました\n除外資産: ${result.removedAssetQrLabels.length}件\n見直し後金額: ¥${result.newContractAmount.toLocaleString()}`);
          setShowReviewModal(false);
        }}
      />
    </div>
  );
};

export const MaintenanceContractsTab: React.FC<MaintenanceContractsTabProps> = () => {
  const router = useRouter();
  const { contracts: storeContracts, updateContract: storeUpdateContract, contractAssets: storeContractAssets, setContractAssets: storeSetContractAssets } = useMaintenanceContractStore();
  const [contracts, setContracts] = useState<MaintenanceContract[]>([]);

  // ストアのデータをローカルstateに同期
  React.useEffect(() => {
    setContracts(storeContracts as MaintenanceContract[]);
  }, [storeContracts]);

  // フリーコメント編集用
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<MaintenanceContract | null>(null);
  const [editComment, setEditComment] = useState('');

  // 契約グループ詳細モーダル
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailContract, setDetailContract] = useState<MaintenanceContract | null>(null);
  const mergedAssets = useMemo(() => ({ ...MOCK_GROUP_ASSETS, ...storeContractAssets }), [storeContractAssets]);
  const [groupAssets, setGroupAssets] = useState<Record<string, ContractGroupAsset[]>>(mergedAssets);

  React.useEffect(() => {
    setGroupAssets({ ...MOCK_GROUP_ASSETS, ...storeContractAssets });
  }, [storeContractAssets]);

  // ソート状態
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ソート適用
  const sortedContracts = useMemo(() => {
    if (!sortDirection) return contracts;
    const sorted = [...contracts];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    sorted.sort((a, b) => {
      const statusA = calcStatus(a);
      const statusB = calcStatus(b);
      return (statusA.sortValue - statusB.sortValue) * multiplier;
    });
    return sorted;
  }, [contracts, sortDirection]);

  // ソートトグル
  const handleSortToggle = () => {
    setSortDirection(prev => {
      if (prev === null) return 'asc';
      if (prev === 'asc') return 'desc';
      return null;
    });
  };

  const getSortArrow = () => {
    const upColor = sortDirection === 'asc' ? '#DA0000' : '#aaa';
    const downColor = sortDirection === 'desc' ? '#DA0000' : '#aaa';
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: '4px', lineHeight: 1, fontSize: '9px', verticalAlign: 'middle' }}>
        <span style={{ color: upColor }}>&#9650;</span>
        <span style={{ color: downColor, marginTop: '-2px' }}>&#9660;</span>
      </span>
    );
  };

  // フリーコメント
  const openCommentModal = (contract: MaintenanceContract) => {
    setSelectedContract(contract);
    setEditComment(contract.comment);
    setShowCommentModal(true);
  };

  const handleSaveComment = () => {
    if (!selectedContract) return;
    setContracts(prev => prev.map(c =>
      c.id === selectedContract.id ? { ...c, comment: editComment } : c
    ));
    setShowCommentModal(false);
    setSelectedContract(null);
  };

  // 契約グループ詳細モーダル
  const handleRowDoubleClick = (contract: MaintenanceContract) => {
    setDetailContract(contract);
    setShowDetailModal(true);
  };

  const handleAssetsUpdate = (updatedAssets: ContractGroupAsset[]) => {
    if (!detailContract) return;
    setGroupAssets(prev => ({ ...prev, [detailContract.id]: updatedAssets }));
  };

  // 金額フォーマット
  const formatAmount = (amount: number) => {
    if (amount === 0) return '-';
    return amount.toLocaleString();
  };

  // 契約種別バッジ色 (Figma 580:32040 label/* tokens)
  const getContractTypeBadge = (type: ContractType) => {
    const colors: Record<ContractType, string> = {
      '保守契約': '#008C1D',      // primary light (緑)
      '定期点検': '#4E9440',      // label/仮登録 (緑)
      'スポット契約': '#F7A367',  // label/使用中 (橙)
      '借用契約': '#087CB6',      // label/依頼済 (青)
      'その他': '#8A8A8A',         // Sub (灰)
    };
    return (
      <span style={{
        padding: '3px 10px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 'bold',
        background: colors[type] || '#8A8A8A',
        color: 'white',
        whiteSpace: 'nowrap',
      }}>
        {type}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 情報バー */}
      <div style={{
        padding: '12px 16px',
        background: '#FAFAFA',
        borderBottom: '1px solid #E1E1E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', color: '#4A4A4A' }}>
          <strong>{sortedContracts.length}件</strong>表示
        </span>
      </div>

      {/* テーブル */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            {/* グループヘッダー (Figma: 統一されたグレー背景、色帯なし) */}
            <tr style={{ background: '#F1F1F1', color: '#4A4A4A' }}>
              <th colSpan={8} style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約情報</th>
              <th colSpan={3} style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}>業者情報</th>
              <th
                rowSpan={2}
                style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}
              >
                契約検討開始
              </th>
              <th colSpan={2} style={{ ...thGroupStyle, textAlign: 'center', background: '#F1F1F1', color: '#4A4A4A', borderColor: '#E1E1E1' }}>操作</th>
            </tr>
            {/* サブカラムヘッダー */}
            <tr style={{ background: '#4A4A4A', color: 'white' }}>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>申請No.</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約グループ名</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約種別</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>種別備考</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約日</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約期間</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約金額</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>単年度金額</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>契約業者</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>担当者</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>連絡先</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>登録</th>
              <th style={{ ...thSubStyle, background: '#FAFAFA', color: '#4A4A4A', borderColor: '#E1E1E1' }}>フリーコメント</th>
            </tr>
          </thead>
          <tbody>
            {sortedContracts.map((contract, index) => {
              return (
                <tr
                  key={contract.id}
                  style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', verticalAlign: 'top', cursor: 'pointer' }}
                  onDoubleClick={() => handleRowDoubleClick(contract)}
                >
                  <td style={{ ...tdStyle, fontFamily: 'monospace', fontWeight: 600 }}>{contract.applicationNo}</td>
                  <td style={tdStyle}>{contract.contractGroupName}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>{getContractTypeBadge(contract.contractType)}</td>
                  <td style={{ ...tdStyle, fontSize: '11px', color: '#555' }}>{contract.contractTypeNote || '-'}</td>
                  <td style={tdStyle} className="tabular-nums border border-stroke-input">{contract.contractDate}</td>
                  <td style={{ ...tdStyle, fontSize: '11px' }} className="tabular-nums border border-stroke-input">
                    {contract.contractStartDate && contract.contractEndDate
                      ? `${contract.contractStartDate}～${contract.contractEndDate}`
                      : '-'
                    }
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="tabular-nums border border-stroke-input">{formatAmount(contract.contractAmount)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="tabular-nums border border-stroke-input">{formatAmount(contract.annualAmount)}</td>
                  <td style={tdStyle}>{contract.contractorName || '-'}</td>
                  <td style={tdStyle}>{contract.contractorPerson || '-'}</td>
                  <td style={{ ...tdStyle, fontSize: '12px' }} className="tabular-nums border border-stroke-input">{contract.contractorPhone || '-'}</td>
                  <td style={tdStyle}>
                    {(() => {
                      const status = calcStatus(contract);
                      return (
                        <span style={{ color: status.color, fontWeight: status.fontWeight || 'normal' }}>
                          {status.label}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {(() => {
                      const stepConfig: Record<number, { label: string; color: string }> = {
                        1: { label: '見積依頼', color: '#4A4A4A' },
                        2: { label: '見積登録', color: '#4A4A4A' },
                        3: { label: '契約登録', color: '#087CB6' },
                        4: { label: '完了登録', color: '#008C1D' },
                      };
                      if (contract.currentStep === 'completed') {
                        return <span style={{ color: '#8A8A8A', fontSize: '12px' }}>完了</span>;
                      }
                      const cfg = stepConfig[contract.currentStep];
                      return (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/maintenance-quote-registration?id=${contract.id}&step=${contract.currentStep}`); }}
                          style={{
                            padding: '6px 12px',
                            background: cfg.color,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })()}
                  </td>
                  <td style={{ ...tdStyle, fontSize: '11px', color: contract.comment ? '#4A4A4A' : '#bbb' }}>
                    {contract.comment || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedContracts.length === 0 && (
          <EmptyState
            title="該当する保守契約がありません"
            description="検索条件を変更するか、フィルターを見直してください"
          />
        )}
      </div>

      {/* フリーコメントモーダル */}
      {showCommentModal && selectedContract && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', borderRadius: 8, width: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E1E1E1' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#4A4A4A' }}>フリーコメント編集</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#8A8A8A' }}>
                {selectedContract.applicationNo} - {selectedContract.contractGroupName}
              </p>
            </div>
            <div style={{ padding: '20px' }}>
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="コメントを入力..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '10px',
                  fontSize: '13px',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #E1E1E1', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => { setShowCommentModal(false); setSelectedContract(null); }}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #E1E1E1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveComment}
                style={{ padding: '8px 16px', background: '#087CB6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 契約グループ詳細モーダル */}
      {detailContract && (
        <ContractGroupDetailModal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setDetailContract(null); }}
          contract={detailContract}
          assets={groupAssets[detailContract.id] || []}
          onAssetsUpdate={handleAssetsUpdate}
        />
      )}
    </div>
  );
};
