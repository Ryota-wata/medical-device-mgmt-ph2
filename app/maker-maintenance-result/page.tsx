'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useInspectionStore } from '@/lib/stores';
import { InspectionTask } from '@/lib/types';

interface CostItem {
  id: string;
  costType: string;       // 発生費用（部品交換、作業など）
  description: string;    // 概要
  amount: string;         // 金額
}

interface FormData {
  attachedFile: File | null;
  documentType: '点検報告書' | 'その他';
  customFileName: string;
  inspectionDate: string;
  vendorName: string;
  staffName: string;
  contactInfo: string;
  costItems: CostItem[];
}

export default function MakerMaintenanceResultPage() {
  const router = useRouter();
  const { deleteTask, addRecord } = useInspectionStore();

  const [task, setTask] = useState<InspectionTask | null>(null);
  const [formData, setFormData] = useState<FormData>({
    attachedFile: null,
    documentType: '点検報告書',
    customFileName: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    vendorName: '',
    staffName: '',
    contactInfo: '',
    costItems: [
      { id: '1', costType: '部品交換', description: '', amount: '' },
      { id: '2', costType: '作業', description: '', amount: '' },
    ],
  });

  // パネル幅の状態（左パネルの幅をパーセントで管理）
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // プレビューURL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('makerMaintenanceTask');
    if (stored) {
      const parsed = JSON.parse(stored) as InspectionTask;
      setTask(parsed);
      if (parsed.vendorName) {
        setFormData(prev => ({ ...prev, vendorName: parsed.vendorName || '' }));
      }
    }
  }, []);

  // ドラッグハンドラ
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftPanelWidth(Math.min(70, Math.max(30, newWidth)));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  // ファイル選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, attachedFile: file }));

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  // 入力変更
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 費用項目の変更
  const handleCostItemChange = (id: string, field: keyof CostItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 費用項目の追加
  const handleAddCostItem = () => {
    setFormData(prev => ({
      ...prev,
      costItems: [
        ...prev.costItems,
        { id: `${Date.now()}`, costType: '', description: '', amount: '' },
      ],
    }));
  };

  // 費用項目の削除
  const handleRemoveCostItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      costItems: prev.costItems.filter(item => item.id !== id),
    }));
  };

  // 合計金額計算
  const totalCost = formData.costItems.reduce((sum, item) => {
    return sum + parseInt(item.amount.replace(/,/g, '') || '0', 10);
  }, 0);

  // 登録処理
  const handleSubmit = () => {
    if (!task) return;

    // 費用の集計
    const partsItems = formData.costItems.filter(item => item.costType === '部品交換');
    const laborItems = formData.costItems.filter(item => item.costType === '作業');
    const partsCost = partsItems.reduce((sum, item) => sum + parseInt(item.amount.replace(/,/g, '') || '0', 10), 0);
    const laborCost = laborItems.reduce((sum, item) => sum + parseInt(item.amount.replace(/,/g, '') || '0', 10), 0);
    const partsDetail = partsItems.map(item => item.description).filter(Boolean).join(', ');

    // 点検実績を登録
    addRecord({
      taskId: task.id,
      assetId: task.assetId,
      menuId: '',  // メーカー保守はメニューなし
      plannedDate: task.nextInspectionDate,
      actualDate: formData.inspectionDate,
      result: '合格',
      staffName: formData.staffName,
      vendorName: formData.vendorName,
      documentType: formData.documentType,
      documentUrl: previewUrl || undefined,
      partsCost: partsCost,
      partsDetail: partsDetail,
      laborCost: laborCost,
      totalCost: totalCost,
    });

    // タスクを削除
    deleteTask(task.id);

    sessionStorage.removeItem('makerMaintenanceTask');
    alert('点検記録を登録しました');
    router.push('/quotation-data-box/inspection-requests');
  };

  // 戻る
  const handleBack = () => {
    sessionStorage.removeItem('makerMaintenanceTask');
    router.push('/quotation-data-box/inspection-requests');
  };

  if (!task) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FAFAFA' }}>
        <Header
          title="メーカー保守 点検結果登録"
          hideMenu={true}
          showBackButton={false}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>タスク情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#FAFAFA' }}>
      <Header
        title="メーカー保守 点検結果登録"
        hideMenu={true}
        showBackButton={false}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
        {/* 対象機器情報 */}
        <div style={{
          background: 'white',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '14px',
          fontWeight: 600,
          color: '#4A4A4A',
        }}>
          <span>{task.inspectionGroupName || '保守・点検グループ名'}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{task.assetId}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span>{task.assetName}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span>{task.maker}</span>
          <span style={{ color: '#aaa' }}>|</span>
          <span>{task.model}</span>
        </div>

        {/* メインコンテンツ */}
        <div ref={containerRef} style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
          {/* 左側: 登録エリア */}
          <div style={{
            width: `${leftPanelWidth}%`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            background: 'white',
            border: '1px solid #E1E1E1',
            borderRadius: '4px',
          }}>
            {/* ヘッダー (Figma 597:43893: 白背景 + 黒文字) */}
            <div style={{
              padding: '12px 16px',
              background: 'white',
              color: '#4A4A4A',
              fontSize: '14px',
              fontWeight: 600,
              borderBottom: '1px solid #E1E1E1',
            }}>
              点検結果登録（添付ドキュメントの登録）
            </div>

            {/* フォーム */}
            <div style={{ padding: '20px', flex: 1 }}>
              {/* 添付ファイル / ドキュメント / 点検実施日 (Figma 597:43893: テーブル UI) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '140px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>添付ファイル</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                          id="file-input"
                        />
                        <label
                          htmlFor="file-input"
                          style={{
                            padding: '6px 14px',
                            background: 'white',
                            color: '#146E2E',
                            border: '1px solid #146E2E',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                          }}
                        >
                          ファイルを選択
                        </label>
                        <span style={{ fontSize: '13px', color: '#8A8A8A' }}>
                          {formData.attachedFile ? formData.attachedFile.name : '選択されていません'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '140px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>ドキュメント</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="documentType"
                            value="点検報告書"
                            checked={formData.documentType === '点検報告書'}
                            onChange={(e) => handleInputChange('documentType', e.target.value)}
                          />
                          <span>点検報告書</span>
                        </label>
                        <label style={styles.radioLabel}>
                          <input
                            type="radio"
                            name="documentType"
                            value="その他"
                            checked={formData.documentType === 'その他'}
                            onChange={(e) => handleInputChange('documentType', e.target.value)}
                          />
                          <span>その他</span>
                        </label>
                        {formData.documentType === 'その他' && (
                          <input
                            type="text"
                            value={formData.customFileName}
                            onChange={(e) => handleInputChange('customFileName', e.target.value)}
                            placeholder="ファイル名を入力"
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              width: '200px',
                            }}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '140px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>点検実施日</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                      <input
                        type="date"
                        value={formData.inspectionDate}
                        onChange={(e) => handleInputChange('inspectionDate', e.target.value)}
                        style={{ ...styles.input, width: '200px' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 点検業者 / 担当者 / 連絡先 (Figma 597:43893: テーブル UI) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
                <tbody>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '140px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>点検業者</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => handleInputChange('vendorName', e.target.value)}
                        placeholder="業者名を入力"
                        style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '140px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>担当者</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                      <input
                        type="text"
                        value={formData.staffName}
                        onChange={(e) => handleInputChange('staffName', e.target.value)}
                        placeholder="担当者名を入力"
                        style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th style={{ padding: '10px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', textAlign: 'left', width: '140px', fontWeight: 600, color: '#4A4A4A', whiteSpace: 'nowrap' }}>連絡先</th>
                    <td style={{ padding: '10px 12px', border: '1px solid #E1E1E1' }}>
                      <input
                        type="text"
                        value={formData.contactInfo}
                        onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                        placeholder="電話番号・メール等"
                        style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* 発生費用セクション */}
              <div style={{
                border: '1px solid #E1E1E1',
                borderRadius: '4px',
                marginBottom: '20px',
                overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#FAFAFA',
                  borderBottom: '1px solid #E1E1E1',
                }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#4A4A4A' }}>
                    発生費用
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCostItem}
                    style={{
                      padding: '4px 12px',
                      background: 'white',
                      color: '#146E2E',
                      border: '1px solid #146E2E',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    + 行追加
                  </button>
                </div>

                {/* 費用テーブル */}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F1F1F1' }}>
                      <th style={styles.th}>発生費用</th>
                      <th style={styles.th}>概要</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'right' }}>金額</th>
                      <th style={{ ...styles.th, width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.costItems.map((item) => (
                      <tr key={item.id}>
                        <td style={styles.td}>
                          <input
                            type="text"
                            value={item.costType}
                            onChange={(e) => handleCostItemChange(item.id, 'costType', e.target.value)}
                            placeholder="例: 部品交換"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleCostItemChange(item.id, 'description', e.target.value)}
                            placeholder="概要を入力"
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="text"
                              value={item.amount}
                              onChange={(e) => handleCostItemChange(item.id, 'amount', e.target.value)}
                              placeholder="0"
                              style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #E1E1E1',
                                borderRadius: '4px',
                                fontSize: '13px',
                                textAlign: 'right',
                                fontVariantNumeric: 'tabular-nums',
                                boxSizing: 'border-box',
                              }}
                            />
                            <span style={{ fontSize: '12px', color: '#8A8A8A' }}>円</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveCostItem(item.id)}
                            style={{
                              background: 'transparent',
                              color: '#8A8A8A',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            aria-label="行を削除"
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.costItems.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#8A8A8A' }}>
                          費用項目がありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#FAFAFA' }}>
                      <td colSpan={2} style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                        合計
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#4A4A4A',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {totalCost.toLocaleString()} 円
                        </span>
                      </td>
                      <td style={styles.td}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* ドラッグハンドル */}
          <div
            onMouseDown={handleDragStart}
            style={{
              width: '8px',
              cursor: 'col-resize',
              background: '#E1E1E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: '4px',
              height: '40px',
              background: '#E1E1E1',
              borderRadius: '2px',
            }} />
          </div>

          {/* 右側: プレビューエリア */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #E1E1E1',
            borderRadius: '4px',
            overflow: 'hidden',
            background: 'white',
          }}>
            {/* プレビューヘッダー (Figma 597:43893: 白背景 + 黒文字) */}
            <div style={{
              padding: '12px 16px',
              background: 'white',
              color: '#4A4A4A',
              fontSize: '14px',
              fontWeight: 600,
              borderBottom: '1px solid #E1E1E1',
            }}>
              ドキュメントプレビュー
            </div>

            {/* プレビュー本体 */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FAFAFA',
              overflow: 'auto',
            }}>
              {previewUrl ? (
                formData.attachedFile?.type === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF Preview"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                )
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#8A8A8A',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <p style={{ fontSize: '14px' }}>ファイルを選択するとプレビューが表示されます</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* フッターボタン */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
          marginTop: '16px',
        }}>
          <button
            onClick={handleBack}
            style={{
              padding: '12px 28px',
              background: 'white',
              color: '#4A4A4A',
              border: '1px solid #E1E1E1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 28px',
              background: '#008C1D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            点検記録を登録
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4A4A4A',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E1E1E1',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4A4A4A',
    borderBottom: '1px solid #E1E1E1',
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid #E1E1E1',
    verticalAlign: 'middle',
  },
};
