'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores/masterStore';
import { AssetMaster } from '@/lib/types/master';
import { AssetFormModal } from '@/components/modals/AssetFormModal';
import { exportAssetsToExcel, parseAssetsFromExcel, assignAssetIds, downloadAssetTemplate } from '@/lib/utils/excel-asset-master';
import { ExcelImportPreviewModal } from '@/components/ui/ExcelImportPreviewModal';
import { Header } from '@/components/layouts/Header';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pencil, Trash2, Plus, Download, Upload, MousePointerClick } from 'lucide-react';

const NOW = '2025-01-01T00:00:00Z';

// Excelカラム順の定義（Row 4の順序）
const ASSET_MASTER_COLUMNS: { key: string; label: string }[] = [
  // JMDN分類・一般名称
  { key: 'classificationCode', label: '類別コード' },
  { key: 'jmdnCode', label: 'JMDNコード' },
  { key: 'classificationName', label: '類別名称' },
  { key: 'jmdnSubCategory', label: '中分類名' },
  { key: 'generalName', label: '一般的名称' },
  { key: 'tradeName', label: '販売名' },
  { key: 'manufacturer', label: '製造販売業者等' },
  { key: 'packageInsert', label: '添付文書' },
  // 薬事
  { key: 'pharmaceuticalAffairs', label: '薬事' },
  // SHIP_Master
  { key: 'assetMasterId', label: '資産マスタID' },
  { key: 'category', label: 'カテゴリ' },
  { key: 'largeClass', label: '大分類' },
  { key: 'mediumClass', label: '中分類' },
  { key: 'detailCategory', label: '明細区分' },
  { key: 'item', label: '品目' },
  { key: 'maker', label: 'メーカー' },
  { key: 'model', label: '型式' },
  // 設備情報
  { key: 'drawingNo', label: '図面No.' },
  { key: 'layoutReflection', label: 'レイアウト反映' },
  { key: 'specialEquipment', label: '特殊設備' },
  { key: 'masterStandardDrawing', label: 'Master標準図' },
  { key: 'width', label: '幅(W)' },
  { key: 'depth', label: '奥行(D)' },
  { key: 'height', label: '高さ(H)' },
  { key: 'powerConnection', label: '電源接続' },
  { key: 'powerType', label: '電源種別' },
  { key: 'powerConsumption', label: '消費電力' },
  { key: 'waterSupplySize', label: '給水' },
  { key: 'hotWaterSize', label: '給湯' },
  { key: 'drainageSize', label: '排水' },
  { key: 'exhaustSize', label: '排気サイズ' },
  { key: 'exhaustVolume', label: '排気風量' },
  { key: 'steamSize', label: '蒸気' },
  { key: 'gas', label: 'ガス' },
  { key: 'weight', label: '重量(kg)' },
  { key: 'reinforcement', label: '補強' },
  { key: 'mountAnchor', label: '架台・アンカー' },
  { key: 'floorLowering', label: '床下げ' },
  { key: 'equipmentRemarks', label: '設備備考' },
  // 資産情報
  { key: 'legalServiceLife', label: '耐用年数(法定)' },
  { key: 'serviceLifePeriod', label: '耐用期間' },
  { key: 'endOfService', label: 'EOS:販売終了' },
  { key: 'endOfSupport', label: 'EOS:メンテ終了' },
  { key: 'dedicatedConsumables', label: '専用消耗品' },
  { key: 'catalogDocument', label: 'カタログ' },
  { key: 'operationManual', label: '操作マニュアル' },
  { key: 'otherDocument', label: 'その他PDF' },
  // PMDA提供
  { key: 'pmdaClassNotification', label: 'クラス分類告示' },
  { key: 'pmdaMaintenanceNotification', label: '特定保守告示' },
  { key: 'pmdaInstallNotification', label: '設置管理告示' },
  { key: 'pmdaClassCode', label: '類別コード(PMDA)' },
  { key: 'pmdaClassName', label: '類別名称(PMDA)' },
  { key: 'pmdaSubCategory', label: '中分類名(PMDA)' },
  { key: 'pmdaCode', label: 'コード(PMDA)' },
  { key: 'pmdaGeneralName', label: '一般的名称(PMDA)' },
  { key: 'pmdaGeneralNameDef', label: '一般的名称定義' },
  { key: 'pmdaClassification', label: 'クラス分類' },
  { key: 'pmdaGhtfRule', label: 'GHTFルール' },
  { key: 'pmdaSpecificMaintenance', label: '特定保守' },
  { key: 'pmdaInstallMgmt', label: '設置管理' },
  { key: 'pmdaRepairCategory', label: '修理区分' },
  { key: 'pmdaQms316', label: 'QMS告示316号' },
  { key: 'pmdaOldGeneralNameCode', label: '旧一般的名称コード' },
  { key: 'pmdaOldGeneralName', label: '旧一般的名称' },
  { key: 'pmdaOldClassification', label: '旧クラス分類' },
  { key: 'pmdaOldRepairType', label: '旧修理種別' },
  { key: 'pmdaRevisionCount', label: '改正回数' },
  { key: 'pmdaLastUpdated', label: '最終更新日' },
  // 登録
  { key: 'registrationStatus', label: '登録状況' },
];

function ShipAssetMasterContent() {
  const searchParams = useSearchParams();
  const isSelectMode = searchParams.get('mode') === 'select';
  const { isMobile, isTablet } = useResponsive();
  const { assets, setAssets, addAsset, updateAsset, deleteAsset } = useMasterStore();

  // 顧客の全件資産マスタを遅延ロード（26MB JSONを初期バンドルに含めないため）
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (assets.length < 10000) {
      setIsLoading(true);
      import('@/lib/data/customer/asset-master').then(({ customerAssetMasters }) => {
        const mapped = customerAssetMasters.map((item, i) => ({
          ...item,
          id: item.assetMasterId || `AST-${i}`,
          manufacturer: item.jmdnManufacturer || '',
          packageInsertDocument: item.packageInsert || '',
          specification: '',
          unitPrice: 0,
          depreciationYears: parseInt(item.legalServiceLife || '0', 10) || 0,
          maintenanceCycle: 0,
          status: 'active' as const,
          createdAt: NOW,
          updatedAt: NOW,
        })) as AssetMaster[];
        setAssets(mapped);
        setIsLoading(false);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [filterCategory, setFilterCategory] = useState('');
  const [filterLargeClass, setFilterLargeClass] = useState('');
  const [filterMediumClass, setFilterMediumClass] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterMaker, setFilterMaker] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetMaster | null>(null);
  const [importPreview, setImportPreview] = useState<{ assets: AssetMaster[]; errors: string[] } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // フィルタリング処理
  const DISPLAY_LIMIT = 500;
  const [displayLimit, setDisplayLimit] = useState(DISPLAY_LIMIT);

  const allFilteredAssets = assets.filter((asset) => {
    const matchCategory = !filterCategory || asset.category.toLowerCase().includes(filterCategory.toLowerCase());
    const matchLargeClass = !filterLargeClass || asset.largeClass.toLowerCase().includes(filterLargeClass.toLowerCase());
    const matchMediumClass = !filterMediumClass || asset.mediumClass.toLowerCase().includes(filterMediumClass.toLowerCase());
    const matchItem = !filterItem || asset.item.toLowerCase().includes(filterItem.toLowerCase());
    const matchMaker = !filterMaker || asset.maker.toLowerCase().includes(filterMaker.toLowerCase());
    return matchCategory && matchLargeClass && matchMediumClass && matchItem && matchMaker;
  });
  const filteredAssets = allFilteredAssets.slice(0, displayLimit);

  const handleEdit = (asset: AssetMaster) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('この資産マスタを削除してもよろしいですか?')) {
      deleteAsset(id);
    }
  };

  // 選択モード: 親ウィンドウに資産マスタを送信
  const handleSelect = (asset: AssetMaster) => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'ASSET_MASTER_SELECTED',
        data: {
          category: asset.category,
          majorCategory: asset.largeClass,
          middleCategory: asset.mediumClass,
          assetName: asset.item,
          manufacturer: asset.maker,
          model: asset.model,
        }
      }, window.location.origin);
      window.close();
    }
  };

  const handleNewSubmit = (data: Partial<AssetMaster>) => {
    const newAsset: AssetMaster = {
      id: `A${String(assets.length + 1).padStart(3, '0')}`,
      classificationCode: data.classificationCode || '',
      classificationName: data.classificationName || '',
      jmdnSubCategory: data.jmdnSubCategory || '',
      generalName: data.generalName || '',
      jmdnCode: data.jmdnCode || '',
      tradeName: data.tradeName || '',
      manufacturer: data.manufacturer || '',
      packageInsert: data.packageInsert || '',
      assetMasterId: data.assetMasterId || '',
      category: data.category || '',
      largeClass: data.largeClass || '',
      mediumClass: data.mediumClass || '',
      item: data.item || '',
      maker: data.maker || '',
      model: data.model || '',
      packageInsertDocument: data.packageInsertDocument || '',
      catalogDocument: data.catalogDocument || '',
      otherDocument: data.otherDocument || '',
      specification: '',
      unitPrice: 0,
      depreciationYears: 0,
      maintenanceCycle: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addAsset(newAsset);
  };

  const handleEditSubmit = (data: Partial<AssetMaster>) => {
    if (selectedAsset) {
      updateAsset(selectedAsset.id, data);
    }
  };

  const handleExport = () => {
    exportAssetsToExcel(filteredAssets);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await parseAssetsFromExcel(file);
      setImportPreview(result);
      setShowImportModal(true);
    } catch {
      alert('ファイルの読み込みに失敗しました');
    }
    // input をリセット（同じファイルを再選択できるように）
    e.target.value = '';
  };

  const handleImportAdd = () => {
    if (!importPreview) return;
    const withIds = assignAssetIds(importPreview.assets, assets);
    setAssets([...assets, ...withIds]);
    setShowImportModal(false);
    setImportPreview(null);
  };

  const handleImportReplace = () => {
    if (!importPreview) return;
    const withIds = assignAssetIds(importPreview.assets, []);
    setAssets(withIds);
    setShowImportModal(false);
    setImportPreview(null);
  };

  const handleImportCancel = () => {
    setShowImportModal(false);
    setImportPreview(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FAFAFA' }}>
      {/* 選択モードバナー */}
      {isSelectMode && (
        <div style={{
          background: '#EBF5EE',
          color: '#146E2E',
          padding: '10px 20px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: '14px',
          borderBottom: '1px solid #E1E1E1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <MousePointerClick size={16} aria-hidden />
          資産マスタを選択してください - 行をクリックすると選択されます
          <button
            onClick={() => window.close()}
            style={{
              padding: '6px 12px',
              background: 'white',
              color: '#4A4A4A',
              border: '1px solid #E1E1E1',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            キャンセル
          </button>
        </div>
      )}

      {/* Header */}
      <Header
        title="SHIP資産マスタ"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        backButtonVariant="secondary"
        hideMenu={true}
        hideHomeButton={true}
        resultCount={allFilteredAssets.length}
        showOriginalLabel={false}
      >
        <button
          onClick={handleExport}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-surface-card text-cta-primary-dark border border-cta-primary rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-surface-select transition-colors`}
        >
          <Download size={16} aria-hidden />
          エクスポート
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-surface-card text-cta-primary-dark border border-cta-primary rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-surface-select transition-colors`}
        >
          <Upload size={16} aria-hidden />
          インポート
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <button
          onClick={() => setShowNewModal(true)}
          className={`inline-flex items-center justify-center gap-1.5 h-9 ${isMobile ? 'px-3 text-[13px]' : 'px-4 text-sm'} bg-cta-primary text-white border-0 rounded-md cursor-pointer font-semibold whitespace-nowrap hover:bg-cta-primary-dark transition-colors`}
        >
          <Plus size={16} aria-hidden />
          新規作成
        </button>
      </Header>

      {/* Filter Header */}
      <div style={{
        background: 'white',
        padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '20px 24px',
        borderBottom: '1px solid #E1E1E1',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '12px' : '16px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            Category
          </label>
          <input
            type="text"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="医療機器"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            大分類
          </label>
          <input
            type="text"
            value={filterLargeClass}
            onChange={(e) => setFilterLargeClass(e.target.value)}
            placeholder="大分類で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            中分類
          </label>
          <input
            type="text"
            value={filterMediumClass}
            onChange={(e) => setFilterMediumClass(e.target.value)}
            placeholder="中分類で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            品目
          </label>
          <input
            type="text"
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value)}
            placeholder="品目で検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: isMobile ? '12px' : '13px', fontWeight: 600, marginBottom: '6px', color: '#4A4A4A' }}>
            メーカー
          </label>
          <input
            type="text"
            value={filterMaker}
            onChange={(e) => setFilterMaker(e.target.value)}
            placeholder="メーカーで検索"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : isTablet ? '20px' : '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {isMobile ? (
          // カード表示 (モバイル)
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
            {filteredAssets.map((asset) => (
              <div key={asset.id} style={{
                background: 'white',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #E1E1E1' }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#4A4A4A', marginBottom: '4px' }}>
                    {asset.item}
                  </div>
                  <div style={{ fontSize: '13px', color: '#8A8A8A' }}>
                    {asset.category} / {asset.largeClass}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div><span style={{ color: '#8A8A8A' }}>類別コード:</span> {asset.classificationCode}</div>
                  <div><span style={{ color: '#8A8A8A' }}>類別名称:</span> {asset.classificationName}</div>
                  <div><span style={{ color: '#8A8A8A' }}>一般的名称:</span> {asset.generalName}</div>
                  <div><span style={{ color: '#8A8A8A' }}>JMDNコード:</span> {asset.jmdnCode}</div>
                  <div><span style={{ color: '#8A8A8A' }}>販売名:</span> {asset.tradeName}</div>
                  <div><span style={{ color: '#8A8A8A' }}>製造販売業者等:</span> {asset.manufacturer}</div>
                  <div><span style={{ color: '#8A8A8A' }}>資産マスタID:</span> {asset.assetMasterId}</div>
                  <div><span style={{ color: '#8A8A8A' }}>中分類:</span> {asset.mediumClass}</div>
                  <div><span style={{ color: '#8A8A8A' }}>メーカー:</span> {asset.maker}</div>
                  <div><span style={{ color: '#8A8A8A' }}>型式:</span> {asset.model}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => handleEdit(asset)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'white',
                      color: '#146E2E',
                      border: '1px solid #008C1D',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: 'white',
                      color: '#DA0000',
                      border: '1px solid #DA0000',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // テーブル表示 (PC/タブレット)
          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'auto', flex: 1, minHeight: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  {/* グループヘッダー (Figma パレット内 #F1F1F1 で統一) */}
                  <tr>
                    {([
                      { label: 'JMDN分類・一般名称', span: 8 },
                      { label: '薬事', span: 1 },
                      { label: 'SHIP_Master', span: 8 },
                      { label: '設備情報', span: 22 },
                      { label: '資産情報', span: 8 },
                      { label: 'PMDA提供', span: 21 },
                      { label: '登録', span: 1 },
                      { label: '', span: 1 },
                    ] as const).map((g, i) => (
                      <th key={i} colSpan={g.span} style={{ padding: '6px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#4A4A4A', background: '#F1F1F1', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>{g.label}</th>
                    ))}
                  </tr>
                  {/* カラムヘッダー */}
                  <tr>
                    {ASSET_MASTER_COLUMNS.map(col => (
                      <th key={col.key} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#4A4A4A', background: '#FAFAFA', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>{col.label}</th>
                    ))}
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#4A4A4A', background: '#FAFAFA', border: '1px solid #E1E1E1', whiteSpace: 'nowrap', width: '88px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset, index) => (
                    <tr
                      key={asset.id}
                      onClick={isSelectMode ? () => handleSelect(asset) : undefined}
                      style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', cursor: isSelectMode ? 'pointer' : 'default', height: '34px' }}
                    >
                      {ASSET_MASTER_COLUMNS.map(col => (
                        <td key={col.key} style={{ padding: '6px 8px', fontSize: '11px', color: '#4A4A4A', whiteSpace: 'nowrap', border: '1px solid #E1E1E1', verticalAlign: 'middle' }}>{String((asset as unknown as Record<string, unknown>)[col.key] || '')}</td>
                      ))}
                      <td style={{ padding: '4px 6px', textAlign: 'center', whiteSpace: 'nowrap', border: '1px solid #E1E1E1', verticalAlign: 'middle' }}>
                        {isSelectMode ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSelect(asset); }}
                            style={{ padding: '4px 10px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                          >
                            選択
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEdit(asset)}
                              aria-label={`${asset.item || '資産'} を編集`}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'transparent', color: '#146E2E', border: '1px solid #008C1D', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(asset.id)}
                              aria-label={`${asset.item || '資産'} を削除`}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', background: 'transparent', color: '#DA0000', border: '1px solid #DA0000', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}

        {allFilteredAssets.length > displayLimit && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <button
              onClick={() => setDisplayLimit(prev => prev + DISPLAY_LIMIT)}
              style={{ padding: '10px 24px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              さらに{Math.min(DISPLAY_LIMIT, allFilteredAssets.length - displayLimit)}件を表示（残り{allFilteredAssets.length - displayLimit}件）
            </button>
          </div>
        )}

        {filteredAssets.length === 0 && (
          isLoading ? (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: isMobile ? '40px 20px' : '60px 40px',
              textAlign: 'center',
              color: '#8A8A8A',
              fontSize: isMobile ? '14px' : '16px'
            }}>
              資産マスタを読み込み中...
            </div>
          ) : (
            <div className="bg-surface-card rounded-lg">
              <EmptyState
                title="検索条件に一致する資産マスタがありません"
                description="検索条件を変更するか、フィルターをリセットしてください"
                actionLabel="フィルターをリセット"
                onAction={() => {
                  setFilterCategory('');
                  setFilterLargeClass('');
                  setFilterMediumClass('');
                  setFilterItem('');
                  setFilterMaker('');
                }}
              />
            </div>
          )
        )}
      </main>

      <footer style={{ padding: '12px 0', textAlign: 'center', fontSize: '12px', color: '#8A8A8A' }}>
        &copy;Copyright 2024 SHIP HEALTHCARE HOLDINGS, INC.
      </footer>

      {/* 新規作成モーダル */}
      <AssetFormModal
        isOpen={showNewModal}
        mode="create"
        onClose={() => {
          setShowNewModal(false);
          setSelectedAsset(null);
        }}
        onSubmit={handleNewSubmit}
        isMobile={isMobile}
      />

      {/* 編集モーダル */}
      <AssetFormModal
        isOpen={showEditModal}
        mode="edit"
        asset={selectedAsset || undefined}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAsset(null);
        }}
        onSubmit={handleEditSubmit}
        isMobile={isMobile}
      />

      {/* インポートプレビューモーダル */}
      <ExcelImportPreviewModal
        isOpen={showImportModal && !!importPreview}
        importableCount={importPreview?.assets.length ?? 0}
        errors={importPreview?.errors ?? []}
        onCancel={handleImportCancel}
        onAdd={handleImportAdd}
        onReplace={handleImportReplace}
        onDownloadTemplate={downloadAssetTemplate}
      />
    </div>
  );
}

export default function ShipAssetMasterPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>読み込み中...</div>}>
      <ShipAssetMasterContent />
    </Suspense>
  );
}
