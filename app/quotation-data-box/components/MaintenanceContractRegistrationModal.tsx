'use client';

import { useState, useMemo, useEffect } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useAssetStore } from '@/lib/stores';
import { Asset } from '@/lib/types';

interface MaintenanceContractRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: MaintenanceContractFormData) => void;
  preSelectedAssets?: Asset[];
}

export type ContractType = '保守契約' | '定期点検' | 'スポット契約' | '借用契約' | 'その他';

export interface MaintenanceContractFormData {
  contractGroupName: string;
  contractType: ContractType;
  otherContractName: string;
  reviewStartDate: string;
  comment: string;
  selectedAssets: Asset[];
}

interface AssetSearchFilter {
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
}

export function MaintenanceContractRegistrationModal({
  isOpen,
  onClose,
  onRegister,
  preSelectedAssets,
}: MaintenanceContractRegistrationModalProps) {
  const { assets } = useAssetStore();

  // ステップ管理: 1=資産選択, 2=契約情報入力
  const [step, setStep] = useState<1 | 2>(preSelectedAssets && preSelectedAssets.length > 0 ? 2 : 1);

  // isOpen/preSelectedAssets変更時にステートをリセット
  useEffect(() => {
    if (isOpen) {
      if (preSelectedAssets && preSelectedAssets.length > 0) {
        setStep(2);
        setSelectedAssetIds(new Set(preSelectedAssets.map(a => a.qrCode)));
        setSearchResults(preSelectedAssets);
      } else {
        setStep(1);
      }
    }
  }, [isOpen, preSelectedAssets]);

  // 資産検索
  const [assetSearchFilter, setAssetSearchFilter] = useState<AssetSearchFilter>({
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
  });
  const [searchResults, setSearchResults] = useState<Asset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // 契約情報
  const [contractGroupName, setContractGroupName] = useState('');
  const [contractType, setContractType] = useState<ContractType>('保守契約');
  const [otherContractName, setOtherContractName] = useState('');
  const [reviewStartDate, setReviewStartDate] = useState('');
  const [comment, setComment] = useState('');
  const buildings = useMemo(() => [...new Set(assets.map((a) => a.building))], [assets]);
  const floors = useMemo(() => {
    if (!assetSearchFilter.building) return [...new Set(assets.map((a) => a.floor))];
    return [...new Set(assets.filter((a) => a.building === assetSearchFilter.building).map((a) => a.floor))];
  }, [assets, assetSearchFilter.building]);
  const depts = useMemo(() => {
    let filtered = assets;
    if (assetSearchFilter.building) filtered = filtered.filter((a) => a.building === assetSearchFilter.building);
    if (assetSearchFilter.floor) filtered = filtered.filter((a) => a.floor === assetSearchFilter.floor);
    return [...new Set(filtered.map((a) => a.department))];
  }, [assets, assetSearchFilter.building, assetSearchFilter.floor]);
  const categories = useMemo(() => [...new Set(assets.map((a) => a.category))], [assets]);
  const largeClasses = useMemo(() => [...new Set(assets.map((a) => a.largeClass))], [assets]);
  const mediumClasses = useMemo(() => {
    if (!assetSearchFilter.largeClass) return [...new Set(assets.map((a) => a.mediumClass))];
    return [...new Set(assets.filter((a) => a.largeClass === assetSearchFilter.largeClass).map((a) => a.mediumClass))];
  }, [assets, assetSearchFilter.largeClass]);

  const handleSearch = () => {
    let results = assets;
    if (assetSearchFilter.building) results = results.filter((a) => a.building === assetSearchFilter.building);
    if (assetSearchFilter.floor) results = results.filter((a) => a.floor === assetSearchFilter.floor);
    if (assetSearchFilter.department) results = results.filter((a) => a.department === assetSearchFilter.department);
    if (assetSearchFilter.category) results = results.filter((a) => a.category === assetSearchFilter.category);
    if (assetSearchFilter.largeClass) results = results.filter((a) => a.largeClass === assetSearchFilter.largeClass);
    if (assetSearchFilter.mediumClass) results = results.filter((a) => a.mediumClass === assetSearchFilter.mediumClass);
    setSearchResults(results);
    setSelectedAssetIds(new Set());
    setHasSearched(true);
  };

  const toggleAssetSelection = (qrCode: string) => {
    const newSelected = new Set(selectedAssetIds);
    if (newSelected.has(qrCode)) {
      newSelected.delete(qrCode);
    } else {
      newSelected.add(qrCode);
    }
    setSelectedAssetIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.size === searchResults.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(searchResults.map((a) => a.qrCode)));
    }
  };

  const proceedToStep2 = () => {
    if (selectedAssetIds.size === 0) {
      alert('資産を選択してください');
      return;
    }
    setStep(2);
  };

  const handleRegister = () => {
    if (!contractGroupName) {
      alert('契約グループ名を入力してください');
      return;
    }
    const selectedAssets = searchResults.filter((a) => selectedAssetIds.has(a.qrCode));
    onRegister({
      contractGroupName,
      contractType,
      otherContractName: contractType === 'その他' ? otherContractName : '',
      reviewStartDate,
      comment,
      selectedAssets,
    });
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setAssetSearchFilter({ building: '', floor: '', department: '', section: '', category: '', largeClass: '', mediumClass: '' });
    setSearchResults([]);
    setSelectedAssetIds(new Set());
    setHasSearched(false);
    setContractGroupName('');
    setContractType('保守契約');
    setOtherContractName('');
    setReviewStartDate('');
    setComment('');
    onClose();
  };

  if (!isOpen) return null;

  const styles: Record<string, React.CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    header: {
      padding: '16px 24px',
      borderBottom: '1px solid #E1E1E1',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#4A4A4A',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#8A8A8A',
    },
    body: {
      padding: '24px',
    },
    filterRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      marginBottom: '16px',
    },
    filterItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      minWidth: '120px',
      flex: '1 1 120px',
      maxWidth: '150px',
    },
    filterLabel: {
      fontSize: '12px',
      color: '#8A8A8A',
    },
    buttonRow: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
    },
    searchButton: {
      padding: '8px 16px',
      backgroundColor: '#087CB6',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    tableContainer: {
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      maxHeight: '300px',
      overflow: 'auto',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '13px',
    },
    th: {
      backgroundColor: '#4A4A4A',
      color: 'white',
      padding: '8px 12px',
      textAlign: 'left' as const,
      position: 'sticky' as const,
      top: 0,
    },
    td: {
      padding: '8px 12px',
      borderBottom: '1px solid #E1E1E1',
    },
    footer: {
      padding: '16px 24px',
      borderTop: '1px solid #E1E1E1',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '8px',
    },
    cancelButton: {
      padding: '10px 20px',
      backgroundColor: '#8A8A8A',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    primaryButton: {
      padding: '10px 20px',
      backgroundColor: '#008C1D',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    formRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    formLabel: {
      width: '120px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#4A4A4A',
      whiteSpace: 'nowrap' as const,
    },
    radioGroup: {
      display: 'flex',
      gap: '16px',
    },
    radioLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer',
    },
    input: {
      padding: '8px 12px',
      border: '1px solid #E1E1E1',
      borderRadius: '4px',
      fontSize: '14px',
      width: '300px',
    },
    selectedCount: {
      fontSize: '14px',
      color: '#008C1D',
      fontWeight: 500,
    },
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>
            {step === 1 ? '保守契約管理 - 資産選択' : '保守契約管理 - 登録モーダル'}
          </span>
          <button style={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <div style={styles.body}>
          {step === 1 ? (
            <>
              {/* 資産検索フィルター */}
              <div style={styles.filterRow}>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>棟</label>
                  <SearchableSelect
                    options={buildings}
                    value={assetSearchFilter.building}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, building: v, floor: '', department: '' }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>階</label>
                  <SearchableSelect
                    options={floors}
                    value={assetSearchFilter.floor}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, floor: v, department: '' }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>部署</label>
                  <SearchableSelect
                    options={depts}
                    value={assetSearchFilter.department}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, department: v }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>Category</label>
                  <SearchableSelect
                    options={categories}
                    value={assetSearchFilter.category}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, category: v }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>大分類</label>
                  <SearchableSelect
                    options={largeClasses}
                    value={assetSearchFilter.largeClass}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, largeClass: v, mediumClass: '' }))}
                    placeholder="全て"
                  />
                </div>
                <div style={styles.filterItem}>
                  <label style={styles.filterLabel}>中分類</label>
                  <SearchableSelect
                    options={mediumClasses}
                    value={assetSearchFilter.mediumClass}
                    onChange={(v) => setAssetSearchFilter((p) => ({ ...p, mediumClass: v }))}
                    placeholder="全て"
                  />
                </div>
              </div>

              <div style={styles.buttonRow}>
                <button style={styles.searchButton} onClick={handleSearch}>検索</button>
                {hasSearched && <span style={styles.selectedCount}>{selectedAssetIds.size}件選択中</span>}
              </div>

              {/* 検索結果テーブル */}
              {hasSearched && (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>
                          <input
                            type="checkbox"
                            checked={searchResults.length > 0 && selectedAssetIds.size === searchResults.length}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th style={styles.th}>QRコード</th>
                        <th style={styles.th}>棟</th>
                        <th style={styles.th}>階</th>
                        <th style={styles.th}>部署</th>
                        <th style={styles.th}>大分類</th>
                        <th style={styles.th}>中分類</th>
                        <th style={styles.th}>品目</th>
                        <th style={styles.th}>メーカー</th>
                        <th style={styles.th}>型式</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.length === 0 ? (
                        <tr>
                          <td colSpan={10} style={{ ...styles.td, textAlign: 'center', color: '#8A8A8A' }}>
                            該当する資産がありません
                          </td>
                        </tr>
                      ) : (
                        searchResults.map((asset) => (
                          <tr key={asset.qrCode} style={{ backgroundColor: selectedAssetIds.has(asset.qrCode) ? '#EBF5EE' : 'white' }}>
                            <td style={styles.td}>
                              <input
                                type="checkbox"
                                checked={selectedAssetIds.has(asset.qrCode)}
                                onChange={() => toggleAssetSelection(asset.qrCode)}
                              />
                            </td>
                            <td style={styles.td}>{asset.qrCode}</td>
                            <td style={styles.td}>{asset.building}</td>
                            <td style={styles.td}>{asset.floor}</td>
                            <td style={styles.td}>{asset.department}</td>
                            <td style={styles.td}>{asset.largeClass}</td>
                            <td style={styles.td}>{asset.mediumClass}</td>
                            <td style={styles.td}>{asset.item}</td>
                            <td style={styles.td}>{asset.maker}</td>
                            <td style={styles.td}>{asset.model}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* 契約グループ名 */}
              <div style={styles.formRow}>
                <label style={styles.formLabel}>契約グループ名</label>
                <input
                  type="text"
                  style={{ ...styles.input, flex: 1 }}
                  value={contractGroupName}
                  onChange={(e) => setContractGroupName(e.target.value)}
                  placeholder="例）MRI保守契約 一式"
                />
              </div>

              {/* 契約種別 */}
              <div style={styles.formRow}>
                <label style={styles.formLabel}>契約種別</label>
                <div style={{ ...styles.radioGroup, flexWrap: 'wrap' }}>
                  {(['保守契約', '定期点検', 'スポット契約', '借用契約', 'その他'] as ContractType[]).map((type) => (
                    <label key={type} style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="contractType"
                        checked={contractType === type}
                        onChange={() => setContractType(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              {/* その他の契約名称 */}
              {contractType === 'その他' && (
                <div style={{ ...styles.formRow, paddingLeft: '136px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>その他の契約名称</label>
                  <input
                    type="text"
                    style={{ ...styles.input, flex: 1 }}
                    value={otherContractName}
                    onChange={(e) => setOtherContractName(e.target.value)}
                    placeholder="例）VPP契約"
                  />
                </div>
              )}

              {/* 契約検討開始 */}
              <div>
                <div style={styles.formRow}>
                  <label style={styles.formLabel}>契約検討開始</label>
                  <input
                    type="month"
                    style={{ ...styles.input, flex: 1 }}
                    value={reviewStartDate}
                    onChange={(e) => setReviewStartDate(e.target.value)}
                    placeholder="例）yyyy/mm"
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#8A8A8A', marginTop: '4px', marginLeft: '136px' }}>
                  ※新規導入機器の保証期間終了前など任意で保守等の検討開始時期を登録できます
                </p>
              </div>

              {/* コメント */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={styles.formLabel}>コメント</label>
                <textarea
                  style={{
                    padding: '12px',
                    border: '1px solid #E1E1E1',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="保守契約に関するメモを入力"
                />
              </div>

              {/* 選択中の資産一覧 */}
              <div>
                <label style={styles.formLabel}>対象資産（{selectedAssetIds.size}件）</label>
                <div style={{ ...styles.tableContainer, maxHeight: '180px', marginTop: '8px' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>QRコード</th>
                        <th style={styles.th}>品目</th>
                        <th style={styles.th}>メーカー</th>
                        <th style={styles.th}>型式</th>
                        <th style={styles.th}>部門</th>
                        <th style={styles.th}>部署</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.filter(a => selectedAssetIds.has(a.qrCode)).map((asset, index) => (
                        <tr key={`${asset.qrCode}-${index}`}>
                          <td style={styles.td}>{asset.qrCode}</td>
                          <td style={styles.td}>{asset.item}</td>
                          <td style={styles.td}>{asset.maker}</td>
                          <td style={styles.td}>{asset.model}</td>
                          <td style={styles.td}>{asset.department}</td>
                          <td style={styles.td}>{asset.section}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          {step === 1 ? (
            <>
              <button style={styles.cancelButton} onClick={handleClose}>キャンセル</button>
              <button style={styles.primaryButton} onClick={proceedToStep2}>次へ</button>
            </>
          ) : (
            <>
              <button style={styles.cancelButton} onClick={() => {
                if (preSelectedAssets && preSelectedAssets.length > 0) {
                  handleClose();
                } else {
                  setStep(1);
                }
              }}>戻る</button>
              <button style={styles.primaryButton} onClick={handleRegister}>
                保守管理タスクリストに追加する
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
