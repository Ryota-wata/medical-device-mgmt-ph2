'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts';
import { useAssetStore, useMasterStore, useApplicationStore } from '@/lib/stores';
import { Asset, Application } from '@/lib/types';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ColumnSettingsModal } from '@/components/ui/ColumnSettingsModal';
import { TransferApplicationModal } from '@/components/ui/TransferApplicationModal';
import { DisposalApplicationModal } from '@/components/ui/DisposalApplicationModal';
import { PurchaseApplicationModal } from '@/components/ui/PurchaseApplicationModal';
import { UpdateApplicationModal } from '@/components/ui/UpdateApplicationModal';
import { AdditionApplicationModal } from '@/components/ui/AdditionApplicationModal';
import { InspectionRegistrationModal } from '@/app/quotation-data-box/components/InspectionRegistrationModal';
import { MaintenanceContractRegistrationModal } from '@/app/quotation-data-box/components/MaintenanceContractRegistrationModal';
import { LendingRegistrationModal } from '@/app/quotation-data-box/components/LendingRegistrationModal';
import { useMaintenanceContractStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAssetFilter } from '@/lib/hooks/useAssetFilter';
import { useAssetTable } from '@/lib/hooks/useAssetTable';
import { ASSET_COLUMNS, type ColumnDef } from '@/lib/constants/assetColumns';

// 原本リスト用の8グループのみ（契約・リース詳細・財務・耐用年数は編集リスト専用）
const ORIGINAL_LIST_GROUPS = ['basic', 'commonMaster', 'location', 'identity', 'classification', 'specification', 'acquisition', 'other'];
// 施設名は資産選択画面で確定済みのためテーブルから除外
const ALL_COLUMNS = ASSET_COLUMNS.filter(
  col => ORIGINAL_LIST_GROUPS.includes(col.group || '') && col.key !== 'facility'
);

// グループ表示用の定義（彩度を下げて上品に。テキストは #4A4A4A 基調 + アクセント） */
const GROUP_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  basic: { label: '基本情報', bg: '#FAFAFA', color: '#4A4A4A' },
  commonMaster: { label: '共通マスタ', bg: '#EBF5EE', color: '#146E2E' },
  location: { label: '設置情報', bg: '#EBF5EE', color: '#4A4A4A' },
  identity: { label: '識別情報', bg: '#FDF1E5', color: '#4A4A4A' },
  classification: { label: '資産分類', bg: '#FAFAFA', color: '#4A4A4A' },
  specification: { label: '機器仕様', bg: '#EBF5EE', color: '#4A4A4A' },
  acquisition: { label: '取得情報', bg: '#FDF1E5', color: '#DA0000' },
  other: { label: 'その他', bg: '#F1F1F1', color: '#4A4A4A' },
  contract: { label: '契約情報', bg: '#FAFAFA', color: '#4A4A4A' },
  leaseDetail: { label: 'リース詳細', bg: '#FAFAFA', color: '#4A4A4A' },
  financial: { label: '財務情報', bg: '#FAFAFA', color: '#4A4A4A' },
  lifespan: { label: '耐用年数', bg: '#FAFAFA', color: '#4A4A4A' },
  application: { label: '申請内容', bg: '#EBF5EE', color: '#146E2E' },
  applicationDetail: { label: '申請詳細', bg: '#EBF5EE', color: '#146E2E' },
  connection: { label: '接続要望', bg: '#EBF5EE', color: '#146E2E' },
  work: { label: '作業用', bg: '#FDF1E5', color: '#4A4A4A' },
};

export default function AssetSearchResultPage() {
  const router = useRouter();
  const { assets } = useAssetStore();
  const { addApplication } = useApplicationStore();
  const { addContract } = useMaintenanceContractStore();
  const { isMobile } = useResponsive();
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 移動申請モーダル関連の状態
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 廃棄申請モーダル関連の状態
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);

  // 購入申請モーダル関連の状態
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // 更新申請モーダル関連の状態
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // 増設申請モーダル関連の状態
  const [isAdditionModalOpen, setIsAdditionModalOpen] = useState(false);

  // 点検管理登録モーダル関連の状態
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);

  // 保守契約登録モーダル関連の状態
  const [isMaintenanceContractModalOpen, setIsMaintenanceContractModalOpen] = useState(false);

  // 貸出登録モーダル関連の状態
  const [isLendingModalOpen, setIsLendingModalOpen] = useState(false);

  // 原本資産データ（useAssetStore から取得）
  const storeAssets = assets;

  // useAssetFilterフックを使用
  const {
    filters,
    setFilters,
    filteredAssets,
    facilityOptions,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
    itemOptions,
  } = useAssetFilter(storeAssets);

  // useAssetTableフックを使用
  const {
    visibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
  } = useAssetTable(ALL_COLUMNS);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredAssets.map(a => a.no)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (no: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(no)) {
      newSelected.delete(no);
    } else {
      newSelected.add(no);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (asset: Asset) => {
    router.push(`/asset-detail?qrCode=${asset.qrCode}&from=asset-search`);
  };

  // 新規申請ボタンのクリックハンドラー
  const handleNewApplication = () => {
    setIsPurchaseModalOpen(true);
  };

  // 更新申請ボタンのクリックハンドラー
  const handleUpdateApplication = () => {
    if (selectedItems.size === 0) {
      alert('更新申請する資産を選択してください');
      return;
    }
    if (selectedItems.size > 1) {
      alert('更新申請は1台ずつ行ってください。\n資産を1件だけ選択してください。');
      return;
    }
    setIsUpdateModalOpen(true);
  };

  // 増設申請ボタンのクリックハンドラー
  const handleExpandApplication = () => {
    if (selectedItems.size === 0) {
      alert('増設申請する資産を選択してください');
      return;
    }
    if (selectedItems.size > 1) {
      alert('増設申請は1台ずつ行ってください。\n資産を1件だけ選択してください。');
      return;
    }
    setIsAdditionModalOpen(true);
  };

  // ボタンの状態判定
  const isSingleSelected = selectedItems.size === 1;
  const isAnySelected = selectedItems.size > 0;

  // セカンダリボタンスタイル（白背景アクションバー上）
  const getSecondaryBtn = (isEnabled: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    background: '#FFFFFF',
    color: isEnabled ? '#4A4A4A' : '#D6D6D6',
    border: `1px solid ${isEnabled ? '#E1E1E1' : '#EDEDED'}`,
    borderRadius: 6,
    cursor: isEnabled ? 'pointer' : 'not-allowed',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  });
  // プライマリボタンスタイル（強調CTA、新規申請）
  const getPrimaryBtn = (isEnabled: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    background: isEnabled ? '#008C1D' : '#F1F1F1',
    color: isEnabled ? '#FFFFFF' : '#D6D6D6',
    border: 'none',
    borderRadius: 6,
    cursor: isEnabled ? 'pointer' : 'not-allowed',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  });
  // レガシー名残（参照箇所互換用）
  const getButtonStyle = getSecondaryBtn;

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'white' }}>
      {/* 資産一覧専用の軽量ヘッダー（メイン共通ヘッダーは使わない: 検索結果表示でテーブル領域を最大化するため） */}
      <Header
        title="資産リスト"
        resultCount={filteredAssets.length}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onExport={() => alert('Excel/PDF出力')}
        onPrint={() => window.print()}
        onColumnSettings={() => setIsColumnSettingsOpen(true)}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      {/* アクションバー（白基調、プライマリ「新規申請」を強調 + 区切り線でグループ化） */}
      <div style={{ background: '#FFFFFF', padding: '8px 16px', borderBottom: '1px solid #E1E1E1', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* 選択状態バッジ */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: isAnySelected ? '#EBF5EE' : '#F1F1F1',
          color: isAnySelected ? '#146E2E' : '#8A8A8A',
          border: `1px solid ${isAnySelected ? '#008C1D' : '#E1E1E1'}`,
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
        }}>
          選択中: <span className="tabular-nums">{selectedItems.size}</span>件
        </span>

        <div style={{ width: 1, height: 22, background: '#E1E1E1' }} />

        {/* プライマリ: 新規申請 */}
        <button
          style={getPrimaryBtn(!isAnySelected)}
          onClick={() => {
            if (isAnySelected) {
              alert('新規申請は資産を選択せずに行ってください');
              return;
            }
            handleNewApplication();
          }}
          title={!isAnySelected ? '' : '資産の選択を解除してください'}
        >
          + 新規申請
        </button>

        {/* セカンダリ: 単一選択系 */}
        <button style={getSecondaryBtn(isSingleSelected)} onClick={handleUpdateApplication} title={isSingleSelected ? '' : '資産を1件選択してください'}>
          更新申請
        </button>
        <button style={getSecondaryBtn(isSingleSelected)} onClick={handleExpandApplication} title={isSingleSelected ? '' : '資産を1件選択してください'}>
          増設申請
        </button>

        <div style={{ width: 1, height: 22, background: '#E1E1E1' }} />

        {/* セカンダリ: 複数選択可 */}
        <button
          style={getSecondaryBtn(isAnySelected)}
          onClick={() => {
            if (selectedItems.size === 0) { alert('移動申請する資産を選択してください'); return; }
            setIsTransferModalOpen(true);
          }}
        >
          移動申請
        </button>
        <button
          style={getSecondaryBtn(isAnySelected)}
          onClick={() => {
            if (selectedItems.size === 0) { alert('廃棄申請する資産を選択してください'); return; }
            setIsDisposalModalOpen(true);
          }}
        >
          廃棄申請
        </button>

        <div style={{ width: 1, height: 22, background: '#E1E1E1' }} />

        {/* セカンダリ: 登録系 */}
        <button
          style={getSecondaryBtn(isAnySelected)}
          onClick={() => {
            if (selectedItems.size === 0) { alert('点検管理登録する資産を選択してください'); return; }
            setIsInspectionModalOpen(true);
          }}
        >
          点検管理登録
        </button>
        <button
          style={getSecondaryBtn(isAnySelected)}
          onClick={() => {
            if (selectedItems.size === 0) { alert('契約対象の資産登録する資産を選択してください'); return; }
            setIsMaintenanceContractModalOpen(true);
          }}
        >
          契約対象の資産登録
        </button>
        <button
          style={getSecondaryBtn(isAnySelected)}
          onClick={() => {
            if (selectedItems.size === 0) { alert('貸出登録する資産を選択してください'); return; }
            setIsLendingModalOpen(true);
          }}
        >
          貸出登録
        </button>
      </div>

      {/* フィルターエリア（1行レイアウト: 各フィルター + キーワード検索を横並び。テーブルエリア最大化） */}
      <div style={{ background: '#fff', padding: '6px 16px', borderBottom: '1px solid #E1E1E1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
          {/* 施設 */}
          <div style={{ flex: '1 1 110px', minWidth: '110px', position: 'relative', zIndex: 17 }}>
            <SearchableSelect
              value={filters.facility}
              onChange={(val) => setFilters({ facility: val })}
              options={facilityOptions}
              placeholder="施設"
              isMobile={isMobile}
            />
          </div>

          {/* 管理部署 */}
          <div style={{ flex: '1 1 110px', minWidth: '110px', position: 'relative', zIndex: 16 }}>
            <SearchableSelect
              value={filters.department}
              onChange={(val) => setFilters({ department: val })}
              options={departmentOptions}
              placeholder="管理部署"
              isMobile={isMobile}
            />
          </div>

          {/* 設置部門 */}
          <div style={{ flex: '1 1 110px', minWidth: '110px', position: 'relative', zIndex: 15 }}>
            <SearchableSelect
              value={filters.section}
              onChange={(val) => setFilters({ section: val })}
              options={sectionOptions}
              placeholder="設置部門"
              isMobile={isMobile}
            />
          </div>

          {/* category */}
          <div style={{ flex: '1 1 110px', minWidth: '110px', position: 'relative', zIndex: 14 }}>
            <SearchableSelect
              value={filters.category}
              onChange={(val) => setFilters({ category: val })}
              options={categoryOptions}
              placeholder="category"
              isMobile={isMobile}
            />
          </div>

          {/* 大分類 */}
          <div style={{ flex: '1 1 100px', minWidth: '100px', position: 'relative', zIndex: 13 }}>
            <SearchableSelect
              value={filters.largeClass}
              onChange={(val) => setFilters({ largeClass: val })}
              options={largeClassOptions}
              placeholder="大分類"
              isMobile={isMobile}
            />
          </div>

          {/* 中分類 */}
          <div style={{ flex: '1 1 100px', minWidth: '100px', position: 'relative', zIndex: 12 }}>
            <SearchableSelect
              value={filters.mediumClass}
              onChange={(val) => setFilters({ mediumClass: val })}
              options={mediumClassOptions}
              placeholder="中分類"
              isMobile={isMobile}
            />
          </div>

          {/* 品目 */}
          <div style={{ flex: '1 1 100px', minWidth: '100px', position: 'relative', zIndex: 11 }}>
            <SearchableSelect
              value={filters.item}
              onChange={(val) => setFilters({ item: val })}
              options={itemOptions}
              placeholder="品目"
              isMobile={isMobile}
            />
          </div>

          {/* キーワード検索 */}
          <input
            type="text"
            placeholder="キーワード検索"
            value={filters.keyword}
            onChange={(e) => setFilters({ keyword: e.target.value })}
            style={{
              flex: '0 0 160px',
              padding: '8px 12px',
              border: '1px solid #008C1D',
              borderRadius: '4px',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {/* テーブル表示（パディング縮小でテーブル領域を最大化） */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 16px' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
        {currentView === 'list' && (
          <table style={{ borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FAFAFA' }}>
              {/* グループヘッダー行 */}
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    padding: '8px',
                    textAlign: 'center',
                    width: `${columnWidths.checkbox}px`,
                    background: '#F1F1F1',
                    position: 'relative',
                    verticalAlign: 'middle',
                    border: '1px solid #E1E1E1',
                  }}
                >
                  <input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} style={{ accentColor: '#008C1D', cursor: 'pointer' }} />
                  <div
                    onMouseDown={(e) => handleResizeStart(e, 'checkbox')}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      cursor: 'col-resize',
                      background: resizingColumn === 'checkbox' ? '#008C1D' : 'transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = '#E1E1E1';
                    }}
                    onMouseLeave={(e) => {
                      if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                    }}
                  />
                </th>
                {(() => {
                  const visibleCols = ALL_COLUMNS.filter((col) => visibleColumns[col.key]);
                  const groupSpans: { group: string; count: number }[] = [];
                  visibleCols.forEach((col) => {
                    const g = col.group || 'other';
                    if (groupSpans.length > 0 && groupSpans[groupSpans.length - 1].group === g) {
                      groupSpans[groupSpans.length - 1].count++;
                    } else {
                      groupSpans.push({ group: g, count: 1 });
                    }
                  });
                  return groupSpans.map((span, idx) => {
                    const style = GROUP_STYLES[span.group] || { label: span.group, bg: '#F1F1F1', color: '#4A4A4A' };
                    return (
                      <th
                        key={`${span.group}-${idx}`}
                        colSpan={span.count}
                        style={{
                          padding: '5px 8px',
                          textAlign: 'center',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          color: '#4A4A4A',
                          background: '#F1F1F1',
                          border: '1px solid #E1E1E1',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {style.label}
                      </th>
                    );
                  });
                })()}
              </tr>
              {/* カラム名行 */}
              <tr>
                {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => {
                  return (
                  <th
                    key={col.key}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#4A4A4A',
                      width: `${columnWidths[col.key]}px`,
                      position: 'relative',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      background: '#FAFAFA',
                      border: '1px solid #E1E1E1',
                      fontSize: 12,
                    }}
                  >
                    {col.label}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, col.key)}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        cursor: 'col-resize',
                        background: resizingColumn === col.key ? '#008C1D' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = '#E1E1E1';
                      }}
                      onMouseLeave={(e) => {
                        if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                      }}
                    />
                  </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.no}
                  style={{
                    cursor: 'pointer',
                    background: selectedItems.has(asset.no) ? '#EBF5EE' : '#FFFFFF',
                    transition: 'background 0.1s ease',
                    height: '38px',
                  }}
                  onDoubleClick={() => router.push(`/asset-detail?no=${asset.no}&from=asset-search`)}
                  onMouseEnter={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = '#FAFAFA';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedItems.has(asset.no)) {
                      e.currentTarget.style.background = '#FFFFFF';
                    }
                  }}
                >
                  <td
                    style={{ padding: '8px 10px', whiteSpace: 'nowrap', overflow: 'hidden', border: '1px solid #E1E1E1', textAlign: 'center', verticalAlign: 'middle' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(asset.no)}
                      onChange={() => handleSelectItem(asset.no)}
                      style={{ accentColor: '#008C1D', cursor: 'pointer' }}
                    />
                  </td>
                  {ALL_COLUMNS.filter((col) => visibleColumns[col.key]).map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '8px 10px',
                        color: '#4A4A4A',
                        fontSize: 13,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        border: '1px solid #E1E1E1',
                        verticalAlign: 'middle',
                      }}
                    >
                      {getCellValue(asset, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {currentView === 'card' && (
          /* slide36 「カード表示」レイアウト準拠: 4列固定グリッド、写真+機器名+縦情報 */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: '16px',
              alignContent: 'start',
            }}
          >
            {filteredAssets.map((asset) => {
              const isSelected = selectedItems.has(asset.no);
              // 写真プレースホルダー（asset.photos が無い場合は機器名で SVG 生成）
              const photoUrl = asset.photos?.[0] || (() => {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 160" width="220" height="160"><rect width="220" height="160" fill="#EDEDED"/><text x="110" y="85" font-size="14" fill="#8A8A8A" font-family="sans-serif" text-anchor="middle">${asset.item || asset.name || '医療機器'}</text></svg>`;
                return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
              })();
              return (
                <div
                  key={asset.no}
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${isSelected ? '#008C1D' : '#E1E1E1'}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onDoubleClick={() => router.push(`/asset-detail?qrCode=${asset.qrCode}&from=asset-search`)}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* チェックボックス（左上オーバーレイ） */}
                  <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(asset.no)}
                      style={{ position: 'absolute', top: 8, left: 8, accentColor: '#008C1D', cursor: 'pointer', zIndex: 1 }}
                    />
                    {/* 機器写真 */}
                    <img
                      src={photoUrl}
                      alt={asset.name}
                      style={{ width: '100%', height: 150, objectFit: 'contain', background: '#FAFAFA', display: 'block' }}
                    />
                  </div>

                  {/* 機器名バー（slide36 のバー風）+ QRコード */}
                  <div style={{ background: '#FAFAFA', borderTop: '1px solid #E1E1E1', borderBottom: '1px solid #E1E1E1', padding: '6px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {asset.item || asset.name}
                      </span>
                      <span style={{ fontSize: 10, color: '#8A8A8A', fontFamily: 'monospace', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {asset.qrCode || '—'}
                      </span>
                    </div>
                  </div>

                  {/* 縦並び情報（slide36: ラベル+値ペア） */}
                  <div style={{ padding: '8px 10px', fontSize: 11, lineHeight: 1.5 }}>
                    {[
                      { label: '部署', value: `${asset.department || '—'}${asset.section ? '／' + asset.section : ''}` },
                      { label: '場所', value: asset.roomName || '—' },
                      { label: 'メーカー', value: asset.maker || '—' },
                      { label: '型式', value: asset.model || '—' },
                      { label: '備考', value: '—' },
                      { label: '台帳番号', value: asset.assetNo || '—', mono: true },
                    ].map((row, idx, arr) => (
                      <div
                        key={row.label}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '60px 1fr',
                          gap: 6,
                          padding: '4px 0',
                          borderBottom: idx < arr.length - 1 ? '1px solid #E1E1E1' : 'none',
                          alignItems: 'baseline',
                        }}
                      >
                        <span style={{ color: '#8A8A8A', fontSize: 10 }}>{row.label}</span>
                        <span style={{ color: '#4A4A4A', fontFamily: row.mono ? 'monospace' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* カラム設定モーダル */}
      <ColumnSettingsModal
        isOpen={isColumnSettingsOpen}
        onClose={() => setIsColumnSettingsOpen(false)}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onVisibilityChange={toggleColumnVisibility}
        onSelectAll={handleSelectAllColumns}
        onDeselectAll={handleDeselectAllColumns}
      />

      {/* 購入申請モーダル */}
      <PurchaseApplicationModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 移動申請モーダル */}
      <TransferApplicationModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
          setSelectedItems(new Set());
        }}
      />

      {/* 廃棄申請モーダル */}
      <DisposalApplicationModal
        isOpen={isDisposalModalOpen}
        onClose={() => setIsDisposalModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 更新申請モーダル */}
      <UpdateApplicationModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 増設申請モーダル */}
      <AdditionApplicationModal
        isOpen={isAdditionModalOpen}
        onClose={() => setIsAdditionModalOpen(false)}
        assets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
        onSuccess={() => {
          setSelectedItems(new Set());
        }}
      />

      {/* 保守契約登録モーダル */}
      <MaintenanceContractRegistrationModal
        isOpen={isMaintenanceContractModalOpen}
        onClose={() => {
          setIsMaintenanceContractModalOpen(false);
          setSelectedItems(new Set());
        }}
        onRegister={(data) => {
          addContract(data);
          alert(`保守契約「${data.contractGroupName}」を登録しました`);
        }}
        preSelectedAssets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
      />

      {/* 点検管理登録モーダル */}
      <InspectionRegistrationModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedItems(new Set());
        }}
        preSelectedAssets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
      />

      {/* 貸出登録モーダル */}
      <LendingRegistrationModal
        isOpen={isLendingModalOpen}
        onClose={() => {
          setIsLendingModalOpen(false);
          setSelectedItems(new Set());
        }}
        preSelectedAssets={filteredAssets.filter(asset => selectedItems.has(asset.no))}
      />
    </div>
  );
}
