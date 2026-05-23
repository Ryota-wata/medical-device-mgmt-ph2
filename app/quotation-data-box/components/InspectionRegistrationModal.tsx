'use client';

import { useState, useMemo, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useInspectionStore, useAssetStore } from '@/lib/stores';
import { Asset } from '@/lib/types';

// 資産検索フィルター
interface AssetSearchFilter {
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
}

interface InspectionRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedAssets?: Asset[];
}

export function InspectionRegistrationModal({
  isOpen,
  onClose,
  preSelectedAssets,
}: InspectionRegistrationModalProps) {
  const { assets } = useAssetStore();
  const { menus, addTask, tasks } = useInspectionStore();

  // preSelectedAssetsがある場合はStep2から開始
  const initialStep = preSelectedAssets && preSelectedAssets.length > 0 ? 'register' : 'search';

  // 画面ステップ（'search' | 'register'）
  const [step, setStep] = useState<'search' | 'register'>(initialStep);

  // 検索フィルター
  const [assetSearchFilter, setAssetSearchFilter] = useState<AssetSearchFilter>({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
  });

  // 検索結果
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // 選択した資産
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>(preSelectedAssets || []);

  // isOpen/preSelectedAssets変更時にステートをリセット
  useEffect(() => {
    if (isOpen) {
      if (preSelectedAssets && preSelectedAssets.length > 0) {
        setStep('register');
        setSelectedAssets(preSelectedAssets);
        setSelectedAssetIds(new Set(preSelectedAssets.map(a => a.qrCode)));
      } else {
        setStep('search');
      }
    }
  }, [isOpen, preSelectedAssets]);

  // 点検種別選択
  const [inspectionTypes, setInspectionTypes] = useState({
    periodic: false,
    daily: false,
    spot: false,
  });

  // メニュー選択
  const [selectedPeriodicMenuId, setSelectedPeriodicMenuId] = useState('');
  const [selectedDailyMenuIds, setSelectedDailyMenuIds] = useState({
    before: '',
    during: '',
    after: '',
  });

  // 点検グループ
  const [inspectionGroupName, setInspectionGroupName] = useState('');
  const [isNewGroup, setIsNewGroup] = useState(false);

  // 既存グループ名の一覧
  const existingGroupNames = useMemo(() => {
    return [...new Set(tasks.map(t => t.inspectionGroupName).filter(Boolean))] as string[];
  }, [tasks]);

  // 点検開始日
  const [startDate, setStartDate] = useState('');

  // 登録済み資産IDリスト
  const registeredAssetIds = useMemo(() => {
    return new Set(tasks.map(t => t.assetId));
  }, [tasks]);

  // マスタからフィルターオプションを生成
  const buildingOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map(a => a.building)));
    return unique.filter(Boolean) as string[];
  }, [assets]);

  const floorOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) {
      filtered = filtered.filter(a => a.building === assetSearchFilter.building);
    }
    const unique = Array.from(new Set(filtered.map(a => a.floor)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.building]);

  const departmentOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) {
      filtered = filtered.filter(a => a.building === assetSearchFilter.building);
    }
    if (assetSearchFilter.floor) {
      filtered = filtered.filter(a => a.floor === assetSearchFilter.floor);
    }
    const unique = Array.from(new Set(filtered.map(a => a.department)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.building, assetSearchFilter.floor]);

  const sectionOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) {
      filtered = filtered.filter(a => a.building === assetSearchFilter.building);
    }
    if (assetSearchFilter.floor) {
      filtered = filtered.filter(a => a.floor === assetSearchFilter.floor);
    }
    if (assetSearchFilter.department) {
      filtered = filtered.filter(a => a.department === assetSearchFilter.department);
    }
    const unique = Array.from(new Set(filtered.map(a => a.section)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.building, assetSearchFilter.floor, assetSearchFilter.department]);

  const categoryOptions = useMemo(() => {
    const unique = Array.from(new Set(assets.map(a => a.category)));
    return unique.filter(Boolean) as string[];
  }, [assets]);

  const largeClassOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.category) {
      filtered = filtered.filter(a => a.category === assetSearchFilter.category);
    }
    const unique = Array.from(new Set(filtered.map(a => a.largeClass)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.category]);

  const mediumClassOptions = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.category) {
      filtered = filtered.filter(a => a.category === assetSearchFilter.category);
    }
    if (assetSearchFilter.largeClass) {
      filtered = filtered.filter(a => a.largeClass === assetSearchFilter.largeClass);
    }
    const unique = Array.from(new Set(filtered.map(a => a.mediumClass)));
    return unique.filter(Boolean) as string[];
  }, [assets, assetSearchFilter.category, assetSearchFilter.largeClass]);

  // 選択した資産に該当する点検メニュー（最初の資産基準）
  const availableMenus = useMemo(() => {
    if (selectedAssets.length === 0) return { periodic: [], daily: [] };
    const firstAsset = selectedAssets[0];

    const matchingMenus = menus.filter(
      (m) =>
        m.largeClass === firstAsset.largeClass &&
        m.mediumClass === firstAsset.mediumClass &&
        m.item === firstAsset.item
    );

    return {
      periodic: matchingMenus.filter((m) => m.menuType === '定期点検'),
      daily: matchingMenus.filter((m) => m.menuType === '日常点検'),
    };
  }, [selectedAssets, menus]);

  // フィルター変更時に依存する下位フィルターをリセット
  const handleBuildingChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      building: value,
      floor: '',
      department: '',
      section: '',
    }));
  };

  const handleFloorChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      floor: value,
      department: '',
      section: '',
    }));
  };

  const handleDepartmentChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      department: value,
      section: '',
    }));
  };

  const handleCategoryChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      category: value,
      largeClass: '',
      mediumClass: '',
    }));
  };

  const handleLargeClassChange = (value: string) => {
    setAssetSearchFilter(prev => ({
      ...prev,
      largeClass: value,
      mediumClass: '',
    }));
  };

  // 資産検索実行（曖昧検索: 部分一致）
  const handleAssetSearch = () => {
    const results = assets.filter(asset => {
      // 既に点検登録済みは除外
      if (registeredAssetIds.has(asset.qrCode)) return false;

      // 曖昧検索（部分一致）
      if (assetSearchFilter.building && !asset.building.includes(assetSearchFilter.building)) return false;
      if (assetSearchFilter.floor && !asset.floor.includes(assetSearchFilter.floor)) return false;
      if (assetSearchFilter.department && !asset.department.includes(assetSearchFilter.department)) return false;
      if (assetSearchFilter.section && !asset.section.includes(assetSearchFilter.section)) return false;
      if (assetSearchFilter.category && !asset.category.includes(assetSearchFilter.category)) return false;
      if (assetSearchFilter.largeClass && !asset.largeClass.includes(assetSearchFilter.largeClass)) return false;
      if (assetSearchFilter.mediumClass && !asset.mediumClass.includes(assetSearchFilter.mediumClass)) return false;
      return true;
    });
    setSearchResults(results);
    setSelectedAssetIds(new Set());
    setHasSearched(true);
  };

  // 資産選択トグル
  const toggleAssetSelection = (qrCode: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(qrCode)) {
      newSelected.delete(qrCode);
    } else {
      newSelected.add(qrCode);
    }
    setSelectedAssetIds(newSelected);
  };

  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedAssetIds.size === searchResults.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(searchResults.map(a => a.qrCode)));
    }
  };

  // 登録画面へ進む
  const proceedToRegister = () => {
    const selected = searchResults.filter(a => selectedAssetIds.has(a.qrCode));
    setSelectedAssets(selected);
    setStep('register');
  };

  // 検索画面に戻る（原本リストから来た場合はモーダルを閉じる）
  const backToSearch = () => {
    if (preSelectedAssets && preSelectedAssets.length > 0) {
      handleClose();
      return;
    }
    setStep('search');
    setInspectionTypes({ periodic: false, daily: false, spot: false });
    setSelectedPeriodicMenuId('');
    setSelectedDailyMenuIds({ before: '', during: '', after: '' });
    setInspectionGroupName('');
    setIsNewGroup(false);
    setStartDate('');
  };

  // 登録処理
  const handleSubmit = () => {
    if (!inspectionTypes.periodic && !inspectionTypes.daily && !inspectionTypes.spot) {
      alert('点検種別を1つ以上選択してください');
      return;
    }

    if (!startDate) {
      alert('点検開始日を入力してください');
      return;
    }

    // 選択した全資産に対してタスク登録
    selectedAssets.forEach(asset => {
      const formData = {
        assetId: asset.qrCode,
        inspectionType: inspectionTypes.spot ? '院内スポット点検' as const : '院内定期点検' as const,
        periodicMenuIds: selectedPeriodicMenuId ? [selectedPeriodicMenuId] : [],
        hasDailyInspection: inspectionTypes.daily,
        dailyMenus: {
          before: selectedDailyMenuIds.before || undefined,
          during: selectedDailyMenuIds.during || undefined,
          after: selectedDailyMenuIds.after || undefined,
        },
        nextInspectionDate: startDate,
      };

      const assetInfo = {
        assetId: asset.qrCode,
        assetName: asset.name,
        maker: asset.maker,
        model: asset.model,
        largeClass: asset.largeClass,
        mediumClass: asset.mediumClass,
        managementDepartment: asset.department || '',
        installedDepartment: asset.section || '',
        purchaseDate: '',
        inspectionGroupName: inspectionGroupName || undefined,
      };

      addTask(formData, assetInfo);
    });

    alert(`${selectedAssets.length}件の資産を点検タスクに登録しました`);
    handleClose();
  };

  // モーダルを閉じる
  const handleClose = () => {
    setStep('search');
    setAssetSearchFilter({ building: '', floor: '', department: '', section: '', category: '', largeClass: '', mediumClass: '' });
    setSearchResults([]);
    setHasSearched(false);
    setSelectedAssetIds(new Set());
    setSelectedAssets([]);
    setInspectionTypes({ periodic: false, daily: false, spot: false });
    setSelectedPeriodicMenuId('');
    setSelectedDailyMenuIds({ before: '', during: '', after: '' });
    setInspectionGroupName('');
    setIsNewGroup(false);
    setStartDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <h3 style={styles.title}>
            {step === 'search' ? '点検管理 登録 - 対象資産を選択' : '点検管理 登録 - 点検設定'}
          </h3>
          <button style={styles.closeButton} onClick={handleClose} aria-label="閉じる">
            ×
          </button>
        </div>

        {step === 'search' ? (
          <>
            {/* 検索フィルター（貸出機器を追加モーダルと同じレイアウト） */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E1E1E1', backgroundColor: '#FAFAFA' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'flex-end' }}>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>棟</label>
                  <SearchableSelect
                    value={assetSearchFilter.building}
                    onChange={(value) => handleBuildingChange(value)}
                    options={buildingOptions}
                    placeholder="すべて"
                    dropdownMinWidth="120px"
                  />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>階</label>
                  <SearchableSelect
                    value={assetSearchFilter.floor}
                    onChange={(value) => handleFloorChange(value)}
                    options={floorOptions}
                    placeholder="すべて"
                    dropdownMinWidth="100px"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>部門</label>
                  <SearchableSelect
                    value={assetSearchFilter.department}
                    onChange={(value) => handleDepartmentChange(value)}
                    options={departmentOptions}
                    placeholder="すべて"
                    dropdownMinWidth="140px"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>部署</label>
                  <SearchableSelect
                    value={assetSearchFilter.section}
                    onChange={(value) => setAssetSearchFilter(prev => ({ ...prev, section: value }))}
                    options={sectionOptions}
                    placeholder="すべて"
                    dropdownMinWidth="140px"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Category</label>
                  <SearchableSelect
                    value={assetSearchFilter.category}
                    onChange={(value) => handleCategoryChange(value)}
                    options={categoryOptions}
                    placeholder="すべて"
                    dropdownMinWidth="140px"
                  />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>大分類</label>
                  <SearchableSelect
                    value={assetSearchFilter.largeClass}
                    onChange={(value) => handleLargeClassChange(value)}
                    options={largeClassOptions}
                    placeholder="すべて"
                    dropdownMinWidth="180px"
                  />
                </div>
                <div style={{ width: '140px' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>中分類</label>
                  <SearchableSelect
                    value={assetSearchFilter.mediumClass}
                    onChange={(value) => setAssetSearchFilter(prev => ({ ...prev, mediumClass: value }))}
                    options={mediumClassOptions}
                    placeholder="すべて"
                    dropdownMinWidth="180px"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleAssetSearch}
                  style={{
                    padding: '8px 24px',
                    backgroundColor: '#087CB6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  検索
                </button>
              </div>
            </div>

            {/* 検索結果 */}
            <div style={styles.resultsSection}>
              {!hasSearched ? (
                <div style={styles.emptyMessage}>
                  検索条件を入力して「検索」ボタンをクリックしてください
                </div>
              ) : searchResults.length === 0 ? (
                <div style={styles.emptyMessage}>
                  該当する資産がありません
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={{ ...styles.th, width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedAssetIds.size === searchResults.length && searchResults.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th style={styles.th}>施設名</th>
                      <th style={styles.th}>QRコード</th>
                      <th style={styles.th}>棟</th>
                      <th style={styles.th}>階</th>
                      <th style={styles.th}>部門</th>
                      <th style={styles.th}>品目名</th>
                      <th style={styles.th}>メーカー</th>
                      <th style={styles.th}>型式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((asset, index) => (
                      <tr
                        key={asset.qrCode}
                        style={{
                          ...styles.tableRow,
                          backgroundColor: selectedAssetIds.has(asset.qrCode) ? '#EBF5EE' : (index % 2 === 0 ? 'white' : '#FAFAFA'),
                        }}
                        onClick={() => toggleAssetSelection(asset.qrCode)}
                      >
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.has(asset.qrCode)}
                            onChange={() => toggleAssetSelection(asset.qrCode)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={styles.td}>{asset.facility}</td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{asset.qrCode}</td>
                        <td style={styles.td}>{asset.building}</td>
                        <td style={styles.td}>{asset.floor}</td>
                        <td style={styles.td}>{asset.department}</td>
                        <td style={styles.td}>{asset.name}</td>
                        <td style={styles.td}>{asset.maker}</td>
                        <td style={styles.td}>{asset.model}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* フッター */}
            <div style={styles.footer}>
              <div style={styles.footerLeft}>
                {searchResults.length > 0 && `${selectedAssetIds.size}件選択中`}
              </div>
              <div style={styles.footerRight}>
                <button style={styles.cancelButton} onClick={handleClose}>
                  キャンセル
                </button>
                <button
                  style={{
                    ...styles.proceedButton,
                    ...(selectedAssetIds.size === 0 ? styles.proceedButtonDisabled : {}),
                  }}
                  onClick={proceedToRegister}
                  disabled={selectedAssetIds.size === 0}
                >
                  選択した資産を点検登録（{selectedAssetIds.size}件）
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 登録画面 */}
            <div style={styles.registerContent}>
              {/* 選択した資産の表示 */}
              <div style={styles.section}>
                <label style={styles.sectionTitle}>選択した資産（{selectedAssets.length}件）</label>
                <div style={styles.selectedAssetsBox}>
                  {selectedAssets.map(asset => (
                    <div key={asset.qrCode} style={styles.selectedAssetItem}>
                      <span style={styles.assetQr}>{asset.qrCode}</span>
                      <span style={styles.assetName}>{asset.name}</span>
                      <span style={styles.assetMeta}>{asset.maker} / {asset.model}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 点検種別選択 */}
              <div style={styles.section}>
                <label style={styles.sectionTitle}>点検種別</label>
                <div style={styles.checkboxGroup}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={inspectionTypes.periodic}
                      onChange={(e) => setInspectionTypes(prev => ({ ...prev, periodic: e.target.checked }))}
                      style={styles.checkbox}
                    />
                    <span>院内定期点検</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={inspectionTypes.daily}
                      onChange={(e) => setInspectionTypes(prev => ({ ...prev, daily: e.target.checked }))}
                      style={styles.checkbox}
                    />
                    <span>日常点検</span>
                  </label>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={inspectionTypes.spot}
                      onChange={(e) => setInspectionTypes(prev => ({ ...prev, spot: e.target.checked }))}
                      style={styles.checkbox}
                    />
                    <span>スポット点検</span>
                  </label>
                </div>
              </div>

              {/* 院内定期点検メニュー選択 */}
              {inspectionTypes.periodic && (
                <div style={styles.menuSection}>
                  <div style={styles.menuHeader}>院内定期点検メニュー</div>
                  <div style={styles.menuContent}>
                    {availableMenus.periodic.length > 0 ? (
                      <select
                        style={styles.select}
                        value={selectedPeriodicMenuId}
                        onChange={(e) => setSelectedPeriodicMenuId(e.target.value)}
                      >
                        <option value="">メニューを選択</option>
                        {availableMenus.periodic.map((menu) => (
                          <option key={menu.id} value={menu.id}>
                            {menu.name}（{menu.cycleMonths}ヶ月周期）
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p style={styles.noMenuHint}>
                        該当する定期点検メニューがありません。先に点検メニューを作成してください。
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 日常点検メニュー選択 */}
              {inspectionTypes.daily && (
                <div style={styles.menuSection}>
                  <div style={styles.menuHeader}>日常点検メニュー</div>
                  <div style={styles.menuContent}>
                    {availableMenus.daily.length > 0 ? (
                      <>
                        <div style={styles.menuRow}>
                          <span style={styles.menuLabel}>使用前</span>
                          <select
                            style={styles.selectSmall}
                            value={selectedDailyMenuIds.before}
                            onChange={(e) => setSelectedDailyMenuIds(prev => ({ ...prev, before: e.target.value }))}
                          >
                            <option value="">-</option>
                            {availableMenus.daily.filter(m => m.dailyTiming === '使用前').map(menu => (
                              <option key={menu.id} value={menu.id}>{menu.name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.menuRow}>
                          <span style={styles.menuLabel}>使用中</span>
                          <select
                            style={styles.selectSmall}
                            value={selectedDailyMenuIds.during}
                            onChange={(e) => setSelectedDailyMenuIds(prev => ({ ...prev, during: e.target.value }))}
                          >
                            <option value="">-</option>
                            {availableMenus.daily.filter(m => m.dailyTiming === '使用中').map(menu => (
                              <option key={menu.id} value={menu.id}>{menu.name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.menuRow}>
                          <span style={styles.menuLabel}>使用後</span>
                          <select
                            style={styles.selectSmall}
                            value={selectedDailyMenuIds.after}
                            onChange={(e) => setSelectedDailyMenuIds(prev => ({ ...prev, after: e.target.value }))}
                          >
                            <option value="">-</option>
                            {availableMenus.daily.filter(m => m.dailyTiming === '使用後').map(menu => (
                              <option key={menu.id} value={menu.id}>{menu.name}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <p style={styles.noMenuHint}>
                        該当する日常点検メニューがありません。先に点検メニューを作成してください。
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 点検グループ */}
              <div style={styles.section}>
                <label style={styles.sectionTitle}>点検グループ</label>
                {!isNewGroup ? (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      style={{ ...styles.select, flex: 1 }}
                      value={inspectionGroupName}
                      onChange={(e) => setInspectionGroupName(e.target.value)}
                    >
                      <option value="">グループを選択</option>
                      {existingGroupNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setIsNewGroup(true); setInspectionGroupName(''); }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '13px',
                        background: '#008C1D',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      新規作成
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      style={{ ...styles.dateInput, flex: 1 }}
                      value={inspectionGroupName}
                      onChange={(e) => setInspectionGroupName(e.target.value)}
                      placeholder="新しいグループ名を入力"
                    />
                    <button
                      type="button"
                      onClick={() => { setIsNewGroup(false); setInspectionGroupName(''); }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '13px',
                        background: '#8A8A8A',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      既存から選択
                    </button>
                  </div>
                )}
              </div>

              {/* 点検開始日 */}
              <div style={styles.section}>
                <label style={styles.sectionTitle}>点検開始日 <span style={styles.required}>*</span></label>
                <input
                  type="date"
                  style={styles.dateInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* フッター */}
            <div style={styles.footer}>
              <div style={styles.footerLeft}>
                <button style={styles.backButton} onClick={backToSearch}>
                  ← 資産選択に戻る
                </button>
              </div>
              <div style={styles.footerRight}>
                <button style={styles.cancelButton} onClick={handleClose}>
                  キャンセル
                </button>
                <button style={styles.submitButton} onClick={handleSubmit}>
                  点検タスクに登録
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '1000px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #E1E1E1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#8A8A8A',
    lineHeight: 1,
  },
  resultsSection: {
    flex: 1,
    overflow: 'auto',
    padding: 0,
  },
  emptyMessage: {
    padding: '40px',
    textAlign: 'center',
    color: '#8A8A8A',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  tableHeaderRow: {
    background: '#FAFAFA',
  },
  th: {
    padding: '10px 8px',
    border: '1px solid #E1E1E1',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    cursor: 'pointer',
  },
  td: {
    padding: '8px',
    border: '1px solid #E1E1E1',
  },
  footer: {
    padding: '16px 20px',
    borderTop: '1px solid #E1E1E1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  footerLeft: {
    fontSize: '13px',
    color: '#8A8A8A',
  },
  footerRight: {
    display: 'flex',
    gap: '12px',
  },
  cancelButton: {
    padding: '8px 20px',
    backgroundColor: '#fff',
    color: '#8A8A8A',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  proceedButton: {
    padding: '8px 20px',
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  proceedButtonDisabled: {
    backgroundColor: '#E1E1E1',
    cursor: 'not-allowed',
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#087CB6',
    border: '1px solid #087CB6',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  submitButton: {
    padding: '8px 24px',
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
  registerContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#4A4A4A',
    marginBottom: '8px',
  },
  required: {
    color: '#DA0000',
  },
  selectedAssetsBox: {
    backgroundColor: 'white',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  selectedAssetItem: {
    padding: '8px 12px',
    borderBottom: '1px solid #E1E1E1',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
  },
  assetQr: {
    color: '#8A8A8A',
    fontFamily: 'monospace',
    minWidth: '80px',
  },
  assetName: {
    fontWeight: 500,
    color: '#4A4A4A',
    flex: 1,
  },
  assetMeta: {
    color: '#8A8A8A',
    fontSize: '12px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4A4A4A',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#087CB6',
  },
  menuSection: {
    marginBottom: '20px',
    border: '1px solid #E1E1E1',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  menuHeader: {
    backgroundColor: '#FAFAFA',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#4A4A4A',
    borderBottom: '1px solid #E1E1E1',
  },
  menuContent: {
    padding: '16px',
    backgroundColor: 'white',
  },
  menuRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
  },
  menuLabel: {
    fontSize: '14px',
    color: '#4A4A4A',
    minWidth: '60px',
  },
  select: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  selectSmall: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white',
    maxWidth: '300px',
  },
  noMenuHint: {
    fontSize: '13px',
    color: '#4A4A4A',
    margin: 0,
  },
  radioGroup: {
    display: 'flex',
    gap: '24px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#4A4A4A',
    cursor: 'pointer',
  },
  radio: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#087CB6',
  },
  dateInput: {
    padding: '10px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
    width: '200px',
  },
};
