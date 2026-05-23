import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { OCRResult, ConfirmedStateMap, ConfirmedAssetInfo, AssetCategory, AccountingCategory } from '@/lib/types/quotation';

// 資産区分の選択肢
const ASSET_CATEGORY_OPTIONS: { value: AssetCategory; label: string }[] = [
  { value: '有形資産_医療用機器備品', label: '医療用機器備品' },
  { value: '有形資産_器具備品', label: '器具備品' },
  { value: '有形資産_建物附属設備', label: '建物附属設備' },
  { value: '無形資産_ソフトウェア', label: 'ソフトウェア' },
  { value: '費用_消耗品経費', label: '消耗品・経費' },
  { value: '長期前払費用_保守費', label: '保守費' },
];

// 会計区分の選択肢
const ACCOUNTING_CATEGORY_OPTIONS: AccountingCategory[] = ['資本的支出', '経費', '前払費用'];

interface Step2OcrResultDisplayProps {
  ocrResult: OCRResult;
  pdfFile: File | null;
  confirmedState: ConfirmedStateMap;
  onConfirmedStateChange: (state: ConfirmedStateMap) => void;
  onOcrResultChange?: (result: OCRResult) => void;
  onBack: () => void;
  onNext: () => void;
}

// 基本情報フォームの型
interface BasicInfoForm {
  quotationDate: string;
  quotationPhase: string;
  vendorName: string;
  manufacturer: string;
  personInCharge: string;
  tel: string;
  email: string;
}

// 明細データの型
interface DetailItem {
  id: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: AssetCategory;
  accountingCategory?: AccountingCategory;
}

export const Step2OcrResultDisplay: React.FC<Step2OcrResultDisplayProps> = ({
  ocrResult,
  pdfFile,
  confirmedState,
  onConfirmedStateChange,
  onOcrResultChange,
  onBack,
  onNext,
}) => {
  // 基本情報フォーム
  const [basicInfo, setBasicInfo] = useState<BasicInfoForm>({
    quotationDate: ocrResult.quotationDate || '',
    quotationPhase: '定価',
    vendorName: ocrResult.vendorName || '',
    manufacturer: '',
    personInCharge: '',
    tel: '',
    email: '',
  });

  // 明細データ
  const [detailItems, setDetailItems] = useState<DetailItem[]>([]);

  // タブ切り替え
  const [activeTab, setActiveTab] = useState<'basic' | 'category'>('basic');

  // 初期化
  useEffect(() => {
    setDetailItems(ocrResult.items.map((item, index) => ({
      id: index + 1,
      itemName: item.itemName,
      manufacturer: item.manufacturer,
      model: item.model,
      quantity: item.quantity,
      unitPrice: item.purchasePriceUnit,
      totalPrice: item.purchasePriceTotal,
      category: item.assetCategory,
      accountingCategory: item.accountingCategory,
    })));
  }, [ocrResult]);

  // PDFプレビュー用のURL生成
  const pdfUrl = useMemo(() => {
    if (pdfFile) {
      return URL.createObjectURL(pdfFile);
    }
    return null;
  }, [pdfFile]);

  // コンポーネントアンマウント時にURLを解放
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // 合計金額計算（税抜）
  const totalAmount = useMemo(() => {
    return detailItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [detailItems]);

  // 基本情報の更新
  const handleBasicInfoChange = (field: keyof BasicInfoForm, value: string) => {
    setBasicInfo(prev => ({ ...prev, [field]: value }));
  };

  // 明細の更新
  const handleDetailChange = (index: number, field: keyof DetailItem, value: string | number | AssetCategory | AccountingCategory | undefined) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // 資産情報紐チェック
  const handleAssetInfoCheck = () => {
    console.log('資産情報紐チェック実行');
  };

  // 入力済みかどうかの判定
  const isFieldFilled = (value: string | undefined): boolean => {
    return !!(value && value.trim() !== '');
  };

  // セルスタイル
  const cellStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #E1E1E1',
    fontSize: '12px',
    verticalAlign: 'middle',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    background: '#4A4A4A',
    color: 'white',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    width: '100px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #E1E1E1',
    borderRadius: '3px',
    fontSize: '12px',
  };

  const statusBadgeStyle = (filled: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold',
    background: filled ? '#008C1D' : '#DA0000',
    color: 'white',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ヘッダー */}
      <div style={{
        background: '#4A4A4A',
        color: 'white',
        padding: '10px 16px',
        marginBottom: '12px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold' }}>見積登録（購入）OCR明細確認</span>
          <span style={{
            background: '#DA0000',
            color: 'white',
            padding: '2px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            STEP 2
          </span>
        </div>
        <div style={{
          background: '#FDF1E5',
          color: '#4A4A4A',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '11px',
        }}>
          フリーでの見積登録と合格基本情報を登録 → 仮登録を通知に送信
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* 左側: 情報入力エリア */}
        <div style={{
          flex: '0 0 55%',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'white',
        }}>
          {/* タブヘッダー */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E1E1E1' }}>
            <button
              onClick={() => setActiveTab('basic')}
              style={{
                padding: '10px 24px',
                background: activeTab === 'basic' ? '#4A4A4A' : '#FAFAFA',
                color: activeTab === 'basic' ? 'white' : '#4A4A4A',
                border: 'none',
                borderRight: '1px solid #E1E1E1',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              基本情報
            </button>
            <button
              onClick={() => setActiveTab('category')}
              style={{
                padding: '10px 24px',
                background: activeTab === 'category' ? '#4A4A4A' : '#FAFAFA',
                color: activeTab === 'category' ? 'white' : '#4A4A4A',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              category
            </button>
            <div style={{ flex: 1 }}></div>
            <button
              onClick={() => setActiveTab('category')}
              style={{
                padding: '10px 24px',
                background: '#FAFAFA',
                color: '#4A4A4A',
                border: 'none',
                borderLeft: '1px solid #E1E1E1',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              OC/詳細情報
            </button>
          </div>

          {/* タブコンテンツ */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {activeTab === 'basic' && (
              <div>
                {/* 基本情報テーブル */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <tbody>
                    {/* 見積日付行 */}
                    <tr>
                      <th style={headerCellStyle}>見積日付</th>
                      <td style={cellStyle}>
                        <input
                          type="text"
                          placeholder="yyyy/mm/dd"
                          value={basicInfo.quotationDate}
                          onChange={(e) => handleBasicInfoChange('quotationDate', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <th style={headerCellStyle}>見積フェーズ</th>
                      <td style={cellStyle}>
                        <select
                          value={basicInfo.quotationPhase}
                          onChange={(e) => handleBasicInfoChange('quotationPhase', e.target.value)}
                          style={inputStyle}
                        >
                          <option value="定価">定価</option>
                          <option value="概算">概算</option>
                          <option value="最終原本登録用">最終原本登録用</option>
                        </select>
                      </td>
                      <td style={{ ...cellStyle, width: '60px', textAlign: 'center' }}>
                        <span style={statusBadgeStyle(isFieldFilled(basicInfo.quotationDate))}>
                          {isFieldFilled(basicInfo.quotationDate) ? '入力済' : '未入力'}
                        </span>
                      </td>
                    </tr>
                    {/* 販売店行 */}
                    <tr>
                      <th style={headerCellStyle}>販売店</th>
                      <td style={cellStyle} colSpan={3}>
                        <input
                          type="text"
                          placeholder="報告会 入力済"
                          value={basicInfo.vendorName}
                          onChange={(e) => handleBasicInfoChange('vendorName', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ ...cellStyle, width: '60px', textAlign: 'center' }}>
                        <span style={statusBadgeStyle(isFieldFilled(basicInfo.vendorName))}>
                          {isFieldFilled(basicInfo.vendorName) ? '入力済' : '未入力'}
                        </span>
                      </td>
                    </tr>
                    {/* メーカー行 */}
                    <tr>
                      <th style={headerCellStyle}>メーカー</th>
                      <td style={cellStyle} colSpan={3}>
                        <input
                          type="text"
                          value={basicInfo.manufacturer}
                          onChange={(e) => handleBasicInfoChange('manufacturer', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ ...cellStyle, width: '60px', textAlign: 'center' }}>
                        <span style={statusBadgeStyle(isFieldFilled(basicInfo.manufacturer))}>
                          {isFieldFilled(basicInfo.manufacturer) ? '入力済' : '未入力'}
                        </span>
                      </td>
                    </tr>
                    {/* 担当行 */}
                    <tr>
                      <th style={headerCellStyle}>担当</th>
                      <td style={cellStyle} colSpan={3}>
                        <input
                          type="text"
                          value={basicInfo.personInCharge}
                          onChange={(e) => handleBasicInfoChange('personInCharge', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ ...cellStyle, width: '60px', textAlign: 'center' }}>
                        <span style={statusBadgeStyle(isFieldFilled(basicInfo.personInCharge))}>
                          {isFieldFilled(basicInfo.personInCharge) ? '入力済' : '未入力'}
                        </span>
                      </td>
                    </tr>
                    {/* 連絡先(TEL)行 */}
                    <tr>
                      <th style={headerCellStyle}>連絡先(TEL)</th>
                      <td style={cellStyle} colSpan={3}>
                        <input
                          type="text"
                          value={basicInfo.tel}
                          onChange={(e) => handleBasicInfoChange('tel', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ ...cellStyle, width: '60px', textAlign: 'center' }}>
                        <span style={statusBadgeStyle(isFieldFilled(basicInfo.tel))}>
                          {isFieldFilled(basicInfo.tel) ? '入力済' : '未入力'}
                        </span>
                      </td>
                    </tr>
                    {/* 連絡先(mail)行 */}
                    <tr>
                      <th style={headerCellStyle}>連絡先(mail)</th>
                      <td style={cellStyle} colSpan={3}>
                        <input
                          type="text"
                          value={basicInfo.email}
                          onChange={(e) => handleBasicInfoChange('email', e.target.value)}
                          style={inputStyle}
                        />
                      </td>
                      <td style={{ ...cellStyle, width: '60px', textAlign: 'center' }}>
                        <span style={statusBadgeStyle(isFieldFilled(basicInfo.email))}>
                          {isFieldFilled(basicInfo.email) ? '入力済' : '未入力'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 資産情報紐チェックボタン */}
                <div style={{ marginBottom: '16px' }}>
                  <button
                    onClick={handleAssetInfoCheck}
                    style={{
                      padding: '8px 20px',
                      background: '#4A4A4A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    資産情報紐チェック
                  </button>
                </div>

                {/* 明細テーブル */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #E1E1E1', borderRadius: '4px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA' }}>
                        <tr>
                          <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>項目</th>
                          <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>金額</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>category</th>
                          <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #E1E1E1', whiteSpace: 'nowrap' }}>会計区分</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailItems.map((item, index) => (
                          <tr key={index} style={{ borderBottom: '1px solid #E1E1E1' }}>
                            <td style={{ padding: '6px 8px' }}>
                              <div style={{ fontWeight: 'bold' }}>{item.itemName}</div>
                              <div style={{ fontSize: '10px', color: '#8A8A8A' }}>{item.manufacturer} {item.model}</div>
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                              ¥{item.totalPrice.toLocaleString()}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <select
                                value={item.category || ''}
                                onChange={(e) => handleDetailChange(index, 'category', e.target.value as AssetCategory)}
                                style={{ width: '100%', padding: '4px', fontSize: '10px', border: '1px solid #E1E1E1', borderRadius: '3px' }}
                              >
                                <option value="">選択...</option>
                                {ASSET_CATEGORY_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <select
                                value={item.accountingCategory || ''}
                                onChange={(e) => handleDetailChange(index, 'accountingCategory', e.target.value as AccountingCategory)}
                                style={{ width: '100%', padding: '4px', fontSize: '10px', border: '1px solid #E1E1E1', borderRadius: '3px' }}
                              >
                                <option value="">選択...</option>
                                {ACCOUNTING_CATEGORY_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 合計金額 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  background: '#FAFAFA',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold' }}>合計金額（税抜）</span>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#4A4A4A' }}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'category' && (
              <div>
                <div style={{ fontSize: '12px', color: '#8A8A8A', padding: '20px', textAlign: 'center' }}>
                  category設定画面
                </div>
              </div>
            )}
          </div>

          {/* 注記 */}
          <div style={{ padding: '12px', borderTop: '1px solid #E1E1E1', background: '#FAFAFA', fontSize: '11px', color: '#8A8A8A', lineHeight: 1.8 }}>
            <div>✓ 読み込んだ見積PDFファイルと相違ないか確認・修正を行って下さい</div>
            <div>✓ 合計値が税抜か税込か確認して下さい</div>
            <div style={{ color: '#DA0000', fontWeight: 'bold' }}>
              ★ 全てのcategory、会計区分を登録して下さい
            </div>
          </div>
        </div>

        {/* 右側: PDFプレビュー */}
        <div style={{
          flex: '0 0 43%',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'white',
        }}>
          {/* PDFプレビュー */}
          <div style={{ flex: 1, position: 'relative' }}>
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#FAFAFA'
                }}
                title="見積書PDF"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FAFAFA',
                color: '#8A8A8A',
                fontSize: '13px',
              }}>
                PDFファイルがありません
              </div>
            )}
          </div>

          {/* 登録ボタン */}
          <div style={{ padding: '12px', borderTop: '1px solid #E1E1E1', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onNext}
              style={{
                padding: '10px 24px',
                background: '#DA0000',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
              }}
            >
              登録BOXへの仮登録へ
            </button>
          </div>
        </div>
      </div>

      {/* フッターボタン */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', marginTop: '16px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            background: '#8A8A8A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          戻る
        </button>
      </div>
    </div>
  );
};
