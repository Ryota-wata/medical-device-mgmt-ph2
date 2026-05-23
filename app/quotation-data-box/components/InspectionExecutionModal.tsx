'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InspectionTask, InspectionMenu } from '@/lib/types';
import { Asset } from '@/lib/types/asset';
import { useInspectionStore } from '@/lib/stores';

interface InspectionExecutionModalProps {
  isOpen: boolean;
  // 定期点検モード: task必須
  mode?: 'periodic' | 'daily';
  task?: InspectionTask | null;
  menu?: InspectionMenu | null;
  // 日常点検モード: asset必須
  asset?: Asset | null;
  onClose: () => void;
  onComplete: (result: InspectionResult) => void;
}

export interface InspectionResult {
  taskId?: string;
  assetQrCode?: string;
  inspectorName: string;
  inspectionDate: string;
  inspectionType: '日常点検' | '定期点検';
  usageTiming: '使用前' | '使用中' | '使用後';
  menuId?: string;
  menuName?: string;
  itemResults: InspectionItemResult[];
  remarks: string;
  overallResult: '合格' | '再点検' | '修理申請';
}

// REQ-103: 評価項目の入力形式 3 パターン（定例0413 確定: マルバツ二択 / 単位付き数値 / フリーテキスト）
interface InspectionItemResult {
  itemName: string;
  content: string;
  result: '○' | '×' | string;  // 合否は ○/× で記録（定例0413 で合格/不合格 → マルバツに変更）
  unit?: string;
  evaluationType?: '合否' | '単位' | 'フリー入力';
}

const DEFAULT_ITEMS: InspectionItemResult[] = [
  { itemName: '清掃', content: '本体の清掃', result: '', evaluationType: '合否' },
  { itemName: '外装点検', content: 'ACインレット', result: '', evaluationType: '合否' },
  { itemName: '外装点検', content: 'スライダー', result: '', evaluationType: '合否' },
  { itemName: '性能点検', content: '閉塞圧測定', result: '', unit: 'kPa', evaluationType: '単位' },
  { itemName: '性能点検', content: '流量測定', result: '', unit: 'ml', evaluationType: '単位' },
];

export function InspectionExecutionModal({
  isOpen,
  mode = 'periodic',
  task,
  menu,
  asset,
  onClose,
  onComplete,
}: InspectionExecutionModalProps) {
  const router = useRouter();
  const { menus } = useInspectionStore();

  const [inspectorName, setInspectorName] = useState('');
  const [usageTiming, setUsageTiming] = useState<'使用前' | '使用中' | '使用後'>('使用前');
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');
  const [itemResults, setItemResults] = useState<InspectionItemResult[]>(DEFAULT_ITEMS);
  const [remarks, setRemarks] = useState('');

  // 日常点検モード: 品目に該当する日常点検メニューを取得
  const availableDailyMenus = useMemo(() => {
    if (mode !== 'daily' || !asset) return [];
    return menus.filter(
      (m) => m.menuType === '日常点検' && m.item === asset.item
    );
  }, [menus, asset, mode]);

  // タイミングでフィルタ
  const filteredMenus = useMemo(() => {
    return availableDailyMenus.filter((m) => m.dailyTiming === usageTiming);
  }, [availableDailyMenus, usageTiming]);

  // 選択中のメニュー
  const selectedMenu = useMemo(() => {
    if (mode === 'periodic') return menu;
    return menus.find((m) => m.id === selectedMenuId) || null;
  }, [mode, menu, menus, selectedMenuId]);

  // メニュー変更時に点検項目を更新
  useEffect(() => {
    if (selectedMenu && selectedMenu.inspectionItems.length > 0) {
      setItemResults(
        selectedMenu.inspectionItems.map((item) => ({
          itemName: item.itemName,
          content: item.content,
          result: '',
          unit: item.evaluationType === '単位' ? item.unitValue : undefined,
          evaluationType: item.evaluationType,
        }))
      );
    } else {
      setItemResults(DEFAULT_ITEMS);
    }
  }, [selectedMenu]);

  // タイミング変更時にメニュー選択をリセット
  useEffect(() => {
    if (mode === 'daily') {
      setSelectedMenuId('');
    }
  }, [usageTiming, mode]);

  const handleItemResultChange = (index: number, value: string) => {
    setItemResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], result: value };
      return newResults;
    });
  };

  const handleComplete = (overallResult: '合格' | '再点検' | '修理申請') => {
    if (!inspectorName) {
      alert('実施者名を入力してください');
      return;
    }
    if (mode === 'daily' && !selectedMenuId) {
      alert('点検メニューを選択してください');
      return;
    }

    const result: InspectionResult = {
      taskId: task?.id,
      assetQrCode: mode === 'daily' ? asset?.qrCode : task?.assetId,
      inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionType: mode === 'daily' ? '日常点検' : '定期点検',
      usageTiming,
      menuId: selectedMenu?.id,
      menuName: selectedMenu?.name,
      itemResults,
      remarks,
      overallResult,
    };

    // 親コンポーネントに結果を通知
    onComplete(result);

    // sessionStorageに結果を保存して結果画面に遷移
    const resultData = {
      source: mode,
      taskId: task?.id,
      qrCode: mode === 'daily' ? asset?.qrCode || '' : task?.assetId || '',
      largeClass: mode === 'daily' ? asset?.largeClass || '' : task?.largeClass || '',
      mediumClass: mode === 'daily' ? asset?.mediumClass || '' : task?.mediumClass || '',
      item: mode === 'daily' ? asset?.item || '' : task?.assetName || '',
      maker: mode === 'daily' ? asset?.maker || '' : task?.maker || '',
      model: mode === 'daily' ? asset?.model || '' : task?.model || '',
      inspectionType: mode === 'daily' ? '日常点検' : '定期点検',
      usageTiming: mode === 'daily' ? usageTiming : undefined,
      menuName: selectedMenu?.name || (task?.assetName + ' 定期点検①'),
      inspectorName,
      inspectionDate: new Date().toISOString().split('T')[0],
      itemResults,
      remarks,
      overallResult,
    };

    sessionStorage.setItem('inspectionResult', JSON.stringify(resultData));

    // モーダルを閉じてから遷移
    handleClose();
    router.push('/inspection-result');
  };

  const handleClose = () => {
    setInspectorName('');
    setUsageTiming('使用前');
    setSelectedMenuId('');
    setItemResults(DEFAULT_ITEMS);
    setRemarks('');
    onClose();
  };

  // 表示判定
  const shouldShow = isOpen && (mode === 'periodic' ? !!task : !!asset);
  if (!shouldShow) return null;

  // 表示用データ
  const qrCode = mode === 'periodic' ? task?.assetId : asset?.qrCode;
  const largeClass = mode === 'periodic' ? task?.largeClass : asset?.largeClass;
  const mediumClass = mode === 'periodic' ? task?.mediumClass : asset?.mediumClass;
  const itemName = mode === 'periodic' ? task?.assetName : asset?.item;
  const maker = mode === 'periodic' ? task?.maker : asset?.maker;
  const model = mode === 'periodic' ? task?.model : asset?.model;

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>
            {mode === 'daily' ? '日常点検の実施' : '点検の実施'}
          </div>

          {/* 基本情報 */}
          <div style={styles.infoRow}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>QRコード</span>
              <span style={{ ...styles.infoValue, fontVariantNumeric: 'tabular-nums' }}>{qrCode}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>実施者名</span>
              <input
                type="text"
                style={styles.input}
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="氏名を入力"
              />
            </div>
            <div style={styles.dateDisplay}>{today}</div>
          </div>

          {/* 機器情報 */}
          <div style={styles.infoRow}>
            <div style={styles.infoItem}>
              <span style={styles.infoValue}>{largeClass}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoValue}>{mediumClass}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoValue}>{itemName}/{maker}/{model}</span>
            </div>
          </div>

          {/* 点検種別（日常点検モードでは固定表示） */}
          <div style={styles.infoRow}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>点検種別</span>
              <span style={{ ...styles.infoValue, color: '#008C1D' }}>
                {mode === 'daily' ? '日常点検' : '定期点検'}
              </span>
            </div>
          </div>

          {/* 点検タイミング（日常点検モードのみ） */}
          {mode === 'daily' && (
            <div style={styles.infoRow}>
              <span style={{ ...styles.infoLabel, marginRight: '8px', alignSelf: 'center' }}>点検タイミング</span>
              <div style={styles.tabGroup}>
                {(['使用前', '使用中', '使用後'] as const).map((timing) => (
                  <label key={timing} style={usageTiming === timing ? styles.tabActive : styles.tab}>
                    <input
                      type="radio"
                      name="usageTiming"
                      value={timing}
                      checked={usageTiming === timing}
                      onChange={() => setUsageTiming(timing)}
                      style={{ display: 'none' }}
                    />
                    {timing}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 点検メニュー選択（日常点検モード）または表示（定期点検モード） */}
          <div style={styles.infoRow}>
            <div style={{ ...styles.infoItem, flex: 1 }}>
              <span style={styles.infoLabel}>点検メニュー</span>
              {mode === 'daily' ? (
                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  style={styles.select}
                >
                  <option value="">選択してください</option>
                  {filteredMenus.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <span style={styles.infoValue}>
                  {menu?.name || (task?.assetName + ' 定期点検①')}
                </span>
              )}
            </div>
          </div>

          {/* 日常点検モードでメニューがない場合の警告 */}
          {mode === 'daily' && filteredMenus.length === 0 && (
            <div style={styles.warning}>
              この品目の「{usageTiming}」点検メニューが登録されていません
            </div>
          )}
        </div>

        <div style={styles.body}>
          <div style={styles.notice}>
            点検対象機器、点検メニューにまちがいがないか確認して点検を開始してください
          </div>

          {/* 点検項目テーブル */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>項目</th>
                <th style={styles.th}>点検内容</th>
                <th style={styles.th}>評価</th>
              </tr>
            </thead>
            <tbody>
              {itemResults.map((item, index) => (
                <tr key={index}>
                  <td style={styles.td}>{item.itemName}</td>
                  <td style={styles.td}>{item.content}</td>
                  <td style={styles.td}>
                    {/* REQ-103: 評価項目の入力形式を 3 パターンで切替（定例0413 確定）*/}
                    {item.evaluationType === '単位' ? (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          style={styles.numericInput}
                          value={item.result}
                          onChange={(e) => handleItemResultChange(index, e.target.value)}
                        />
                        <span style={styles.unit}>{item.unit}</span>
                      </div>
                    ) : item.evaluationType === 'フリー入力' ? (
                      <input
                        type="text"
                        style={{ ...styles.numericInput, width: '200px' }}
                        value={item.result}
                        onChange={(e) => handleItemResultChange(index, e.target.value)}
                        placeholder="自由記述"
                      />
                    ) : (
                      // 合否（マルバツ） — デフォルト
                      <div style={styles.resultButtonGroup}>
                        <button
                          style={item.result === '○' ? styles.resultButtonActive : styles.resultButton}
                          onClick={() => handleItemResultChange(index, '○')}
                        >
                          ○
                        </button>
                        <button
                          style={item.result === '×' ? styles.resultButtonNg : styles.resultButton}
                          onClick={() => handleItemResultChange(index, '×')}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 備考 */}
          <div style={styles.remarksSection}>
            <div style={styles.remarksLabel}>備考（交換部品等）</div>
            <input
              type="text"
              style={styles.remarksInput}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="備考を入力"
            />
          </div>
        </div>

        <div style={styles.footer}>
          <div style={styles.footerLabel}>総合評価</div>
          <div style={styles.footerButtons}>
            <button style={styles.passButton} onClick={() => handleComplete('合格')}>
              合格（異常なし）
            </button>
            <button style={styles.reinspectButton} onClick={() => handleComplete('再点検')}>
              再点検
            </button>
            <button style={styles.repairButton} onClick={() => handleComplete('修理申請')}>
              修理申請
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    padding: '16px',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #E1E1E1',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#4A4A4A',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap' as const,
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FAFAFA',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  infoLabel: {
    color: '#8A8A8A',
    fontSize: '12px',
  },
  infoValue: {
    color: '#4A4A4A',
    fontWeight: 500,
  },
  input: {
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    width: '120px',
  },
  select: {
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '14px',
    minWidth: '200px',
    backgroundColor: 'white',
  },
  dateDisplay: {
    backgroundColor: '#EBF5EE',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#008C1D',
  },
  tabGroup: {
    display: 'flex',
    gap: '4px',
  },
  tab: {
    padding: '6px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tabActive: {
    padding: '6px 12px',
    border: '1px solid #008C1D',
    borderRadius: '4px',
    backgroundColor: '#EBF5EE',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#008C1D',
  },
  warning: {
    backgroundColor: '#FDF1E5',
    border: '1px solid #4A4A4A',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    color: '#4A4A4A',
    marginTop: '8px',
  },
  body: {
    padding: '16px',
  },
  notice: {
    backgroundColor: '#FDF1E5',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#4A4A4A',
    marginBottom: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '13px',
    marginBottom: '16px',
  },
  th: {
    backgroundColor: '#EBF5EE',
    padding: '10px 12px',
    textAlign: 'left' as const,
    fontWeight: 500,
    color: '#4A4A4A',
    borderBottom: '1px solid #E1E1E1',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #E1E1E1',
    verticalAlign: 'middle' as const,
  },
  resultButtonGroup: {
    display: 'flex',
    gap: '4px',
  },
  resultButton: {
    padding: '6px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    minWidth: '44px',
    minHeight: '32px',
  },
  resultButtonActive: {
    padding: '6px 12px',
    border: '1px solid #008C1D',
    borderRadius: '4px',
    backgroundColor: '#EBF5EE',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#008C1D',
    minWidth: '44px',
    minHeight: '32px',
  },
  resultButtonNg: {
    padding: '6px 12px',
    border: '1px solid #DA0000',
    borderRadius: '4px',
    backgroundColor: '#FDF1E5',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#DA0000',
    minWidth: '44px',
    minHeight: '32px',
  },
  numericInput: {
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '13px',
    width: '60px',
    textAlign: 'right' as const,
  },
  unit: {
    fontSize: '12px',
    color: '#8A8A8A',
    marginLeft: '4px',
  },
  remarksSection: {
    marginBottom: '16px',
  },
  remarksLabel: {
    fontSize: '13px',
    color: '#8A8A8A',
    marginBottom: '4px',
  },
  remarksInput: {
    width: '100%',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #E1E1E1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '8px',
  },
  footerLabel: {
    fontSize: '13px',
    color: '#8A8A8A',
  },
  footerButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  passButton: {
    padding: '12px 24px',
    backgroundColor: '#008C1D',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    minHeight: '44px',
  },
  reinspectButton: {
    padding: '12px 16px',
    backgroundColor: '#4A4A4A',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  },
  repairButton: {
    padding: '12px 16px',
    backgroundColor: '#DA0000',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    minHeight: '44px',
  },
};
