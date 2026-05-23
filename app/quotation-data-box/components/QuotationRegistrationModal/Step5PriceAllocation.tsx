import React, { useState, useMemo } from 'react';
import { OCRResult, QuotationItemType, ConfirmedStateMap, AccountingCategory } from '@/lib/types/quotation';

// 登録区分の表示名マッピング
const ITEM_TYPE_LABELS: Record<QuotationItemType, string> = {
  'A_表紙明細': 'A',
  'B_明細代表': 'B',
  'C_個体管理品目': 'C',
  'D_付属品': 'D',
  'E_その他役務': 'E',
  'F_値引き': 'F',
};

// 登録区分の色設定
const ITEM_TYPE_COLORS: Record<QuotationItemType, { bg: string; text: string }> = {
  'A_表紙明細': { bg: '#EBF5EE', text: '#4A4A4A' },
  'B_明細代表': { bg: '#FAFAFA', text: '#4A4A4A' },
  'C_個体管理品目': { bg: '#EBF5EE', text: '#146E2E' },
  'D_付属品': { bg: '#FDF1E5', text: '#4A4A4A' },
  'E_その他役務': { bg: '#FDF1E5', text: '#4A4A4A' },
  'F_値引き': { bg: '#FDF1E5', text: '#DA0000' },
};

// 会計区分の選択肢
const ACCOUNTING_CATEGORY_OPTIONS: AccountingCategory[] = ['資本的支出', '経費', '前払費用'];

interface Step5PriceAllocationProps {
  ocrResult: OCRResult;
  confirmedState: ConfirmedStateMap;
  onSubmit: () => void;
  onBack: () => void;
}

// 案分用のアイテムデータ
interface AllocationItem {
  index: number;
  itemType: QuotationItemType;
  itemName: string;
  manufacturer: string;
  model: string;
  originalQuantity: number;
  originalPrice: number;
  allocatedQuantity: number;
  allocatedPrice: number;
  accountingCategory: AccountingCategory | '';
  parentIndex: number | null; // 親アイテムのインデックス
}

export const Step5PriceAllocation: React.FC<Step5PriceAllocationProps> = ({
  ocrResult,
  confirmedState,
  onSubmit,
  onBack,
}) => {
  // 案分データの初期化
  const [allocations, setAllocations] = useState<AllocationItem[]>(() => {
    return ocrResult.items.map((item, index) => ({
      index,
      itemType: item.itemType,
      itemName: item.itemName,
      manufacturer: item.manufacturer,
      model: item.model,
      originalQuantity: item.quantity,
      originalPrice: item.purchasePriceTotal,
      // C_個体管理品目は数量1、それ以外は原本数量
      allocatedQuantity: item.itemType === 'C_個体管理品目' ? 1 : item.quantity,
      allocatedPrice: item.purchasePriceTotal,
      accountingCategory: '',
      parentIndex: null,
    }));
  });

  // C_個体管理品目のリスト（親候補）
  const parentCandidates = useMemo(() => {
    return allocations.filter(a => a.itemType === 'C_個体管理品目');
  }, [allocations]);

  // 合計金額
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + a.allocatedPrice, 0);
  }, [allocations]);

  const originalTotal = ocrResult.totalAmount;

  // 差額
  const difference = totalAllocated - originalTotal;

  // 値変更ハンドラ
  const handleChange = (index: number, field: keyof AllocationItem, value: number | string | null) => {
    setAllocations(prev => prev.map(a =>
      a.index === index ? { ...a, [field]: value } : a
    ));
  };

  // 自動案分（均等割り）
  const handleAutoAllocate = () => {
    const individualItems = allocations.filter(a => a.itemType === 'C_個体管理品目');
    if (individualItems.length === 0) return;

    const perItemPrice = Math.floor(originalTotal / individualItems.length);
    const remainder = originalTotal - (perItemPrice * individualItems.length);

    setAllocations(prev => prev.map((a, idx) => {
      if (a.itemType === 'C_個体管理品目') {
        const itemIdx = individualItems.findIndex(i => i.index === a.index);
        return {
          ...a,
          allocatedPrice: perItemPrice + (itemIdx === 0 ? remainder : 0),
        };
      }
      return { ...a, allocatedPrice: 0 };
    }));
  };

  return (
    <div>
      {/* 説明 */}
      <div style={{ marginBottom: '16px', padding: '14px', background: '#EBF5EE', borderRadius: '6px', border: '1px solid #008C1D' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#146E2E', marginBottom: '8px' }}>
          個体登録及び金額案分
        </div>
        <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
          ・個体管理品目に価格を案分登録してください<br />
          ・本体は数量を1にて登録されます（C_個体管理品目）<br />
          ・会計計上区分（資本的支出／経費／前払費用）を選択してください
        </div>
      </div>

      {/* 金額サマリ */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          padding: '8px 16px',
          background: '#EBF5EE',
          border: '1px solid #087CB6',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          <strong>見積総額:</strong> ¥{originalTotal.toLocaleString()}
        </div>
        <div style={{
          padding: '8px 16px',
          background: '#FDF1E5',
          border: '1px solid #FDF1E5',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          <strong>案分合計:</strong> ¥{totalAllocated.toLocaleString()}
        </div>
        <div style={{
          padding: '8px 16px',
          background: difference === 0 ? '#EBF5EE' : '#FDF1E5',
          border: `1px solid ${difference === 0 ? '#008C1D' : '#FDF1E5'}`,
          borderRadius: '4px',
          fontSize: '13px',
          fontWeight: 'bold',
          color: difference === 0 ? '#146E2E' : '#DA0000',
        }}>
          差額: ¥{difference.toLocaleString()}
          {difference === 0 && ' ✓'}
        </div>
        <button
          onClick={handleAutoAllocate}
          style={{
            padding: '8px 16px',
            background: '#4A4A4A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          均等案分
        </button>
      </div>

      {/* 明細テーブル */}
      <div style={{ marginBottom: '16px', border: '1px solid #E1E1E1', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 2 }}>
              <tr>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '50px' }}>区分</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', minWidth: '150px' }}>品名</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '50px' }}>原数量</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '2px solid #E1E1E1', width: '100px' }}>原価格</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '60px', background: '#FDF1E5' }}>案分数量</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '2px solid #E1E1E1', width: '120px', background: '#FDF1E5' }}>案分金額</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '120px', background: '#EBF5EE' }}>会計区分</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '120px' }}>親品目</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((item) => {
                const colors = ITEM_TYPE_COLORS[item.itemType];
                const isIndividual = item.itemType === 'C_個体管理品目';

                return (
                  <tr key={item.index} style={{
                    borderBottom: '1px solid #E1E1E1',
                    background: isIndividual ? '#FAFAFA' : 'transparent',
                  }}>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: colors.bg,
                        color: colors.text,
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}>
                        {ITEM_TYPE_LABELS[item.itemType]}
                      </span>
                    </td>
                    <td style={{ padding: '6px', fontWeight: isIndividual ? 'bold' : 'normal' }}>{item.itemName}</td>
                    <td style={{ padding: '6px', textAlign: 'center', color: '#8A8A8A' }}>{item.originalQuantity}</td>
                    <td style={{ padding: '6px', textAlign: 'right', color: '#8A8A8A' }}>¥{item.originalPrice.toLocaleString()}</td>
                    <td style={{ padding: '6px', textAlign: 'center', background: '#FAFAFA' }}>
                      <input
                        type="number"
                        value={item.allocatedQuantity}
                        onChange={(e) => handleChange(item.index, 'allocatedQuantity', parseInt(e.target.value) || 0)}
                        disabled={isIndividual}
                        style={{
                          width: '50px',
                          padding: '3px',
                          fontSize: '11px',
                          textAlign: 'center',
                          border: '1px solid #E1E1E1',
                          borderRadius: '3px',
                          background: isIndividual ? '#FAFAFA' : 'white',
                        }}
                      />
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', background: '#FAFAFA' }}>
                      <input
                        type="number"
                        value={item.allocatedPrice}
                        onChange={(e) => handleChange(item.index, 'allocatedPrice', parseInt(e.target.value) || 0)}
                        style={{
                          width: '100px',
                          padding: '3px',
                          fontSize: '11px',
                          textAlign: 'right',
                          border: '1px solid #E1E1E1',
                          borderRadius: '3px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', background: '#FAFAFA' }}>
                      <select
                        value={item.accountingCategory}
                        onChange={(e) => handleChange(item.index, 'accountingCategory', e.target.value as AccountingCategory)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '10px',
                          border: '1px solid #E1E1E1',
                          borderRadius: '3px',
                        }}
                      >
                        <option value="">選択...</option>
                        {ACCOUNTING_CATEGORY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      {item.itemType === 'D_付属品' ? (
                        <select
                          value={item.parentIndex ?? ''}
                          onChange={(e) => handleChange(item.index, 'parentIndex', e.target.value ? parseInt(e.target.value) : null)}
                          style={{
                            width: '100%',
                            padding: '4px',
                            fontSize: '10px',
                            border: '1px solid #E1E1E1',
                            borderRadius: '3px',
                          }}
                        >
                          <option value="">なし</option>
                          {parentCandidates.map(p => (
                            <option key={p.index} value={p.index}>
                              {p.itemName.substring(0, 15)}...
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: '#E1E1E1' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 登録後のアクション */}
      <div style={{ marginBottom: '16px', padding: '12px', background: '#FAFAFA', borderRadius: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555', marginBottom: '8px' }}>
          登録後に実行可能なアクション
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 8px', background: '#EBF5EE', borderRadius: '3px', fontSize: '11px' }}>
            テンプレート発行（発注書・検収書）
          </span>
          <span style={{ padding: '4px 8px', background: '#EBF5EE', borderRadius: '3px', fontSize: '11px' }}>
            QRコード発行画面へ遷移
          </span>
          <span style={{ padding: '4px 8px', background: '#FDF1E5', borderRadius: '3px', fontSize: '11px' }}>
            ドキュメント追加登録
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 24px',
            background: '#8A8A8A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          戻る
        </button>
        <button
          onClick={onSubmit}
          disabled={difference !== 0}
          style={{
            padding: '10px 24px',
            background: difference !== 0 ? '#E1E1E1' : '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: difference !== 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          登録確定
        </button>
      </div>
    </div>
  );
};
