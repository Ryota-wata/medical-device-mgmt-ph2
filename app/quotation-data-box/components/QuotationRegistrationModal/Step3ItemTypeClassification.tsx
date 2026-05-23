import React, { useState, useMemo } from 'react';
import { OCRResult, QuotationItemType, OCRResultItem } from '@/lib/types/quotation';

// 登録区分の表示名マッピング
const ITEM_TYPE_LABELS: Record<QuotationItemType, string> = {
  'A_表紙明細': 'A_表紙明細',
  'B_明細代表': 'B_明細代表',
  'C_個体管理品目': 'C_個体管理品目',
  'D_付属品': 'D_付属品・消耗品',
  'E_その他役務': 'E_その他役務',
  'F_値引き': 'F_値引き',
};

// 登録区分の詳細説明
const ITEM_TYPE_DESCRIPTIONS: Record<QuotationItemType, string> = {
  'A_表紙明細': '見積書の表紙に記載される明細（通常は総額のみ）',
  'B_明細代表': '複数品目をまとめた代表明細',
  'C_個体管理品目': 'QRラベル発行・除却が可能な個体管理対象品目',
  'D_付属品': '本体に付属する部品・消耗品',
  'E_その他役務': '工事・設置費・接続費・交通費など',
  'F_値引き': '値引き明細',
};

// 登録区分の色設定
const ITEM_TYPE_COLORS: Record<QuotationItemType, { bg: string; text: string; border: string }> = {
  'A_表紙明細': { bg: '#EBF5EE', text: '#4A4A4A', border: '#087CB6' },
  'B_明細代表': { bg: '#FAFAFA', text: '#4A4A4A', border: '#8A8A8A' },
  'C_個体管理品目': { bg: '#EBF5EE', text: '#146E2E', border: '#008C1D' },
  'D_付属品': { bg: '#FDF1E5', text: '#4A4A4A', border: '#FDF1E5' },
  'E_その他役務': { bg: '#FDF1E5', text: '#4A4A4A', border: '#FDF1E5' },
  'F_値引き': { bg: '#FDF1E5', text: '#DA0000', border: '#FDF1E5' },
};

interface Step3ItemTypeClassificationProps {
  ocrResult: OCRResult;
  onOcrResultChange: (result: OCRResult) => void;
  onBack: () => void;
  onNext: () => void;
}

// 編集可能なアイテム
interface EditableClassification {
  index: number;
  originalItemType: QuotationItemType;
  currentItemType: QuotationItemType;
  isModified: boolean;
}

export const Step3ItemTypeClassification: React.FC<Step3ItemTypeClassificationProps> = ({
  ocrResult,
  onOcrResultChange,
  onBack,
  onNext,
}) => {
  // 登録区分の状態管理
  const [classifications, setClassifications] = useState<EditableClassification[]>(
    ocrResult.items.map((item, index) => ({
      index,
      originalItemType: item.itemType,
      currentItemType: item.itemType,
      isModified: false,
    }))
  );

  // 統計情報
  const stats = useMemo(() => {
    const result: Record<QuotationItemType, number> = {
      'A_表紙明細': 0,
      'B_明細代表': 0,
      'C_個体管理品目': 0,
      'D_付属品': 0,
      'E_その他役務': 0,
      'F_値引き': 0,
    };
    classifications.forEach(c => {
      result[c.currentItemType]++;
    });
    return result;
  }, [classifications]);

  // 登録区分変更
  const handleItemTypeChange = (index: number, newType: QuotationItemType) => {
    setClassifications(prev => prev.map(c =>
      c.index === index
        ? { ...c, currentItemType: newType, isModified: newType !== c.originalItemType }
        : c
    ));
  };

  // 一括設定
  const handleBulkChange = (type: QuotationItemType) => {
    setClassifications(prev => prev.map(c => ({
      ...c,
      currentItemType: type,
      isModified: type !== c.originalItemType,
    })));
  };

  // 次へ（OCRResultを更新してから遷移）
  const handleNext = () => {
    const updatedItems = ocrResult.items.map((item, index) => ({
      ...item,
      itemType: classifications[index].currentItemType,
    }));
    onOcrResultChange({ ...ocrResult, items: updatedItems });
    onNext();
  };

  // 個体管理品目の件数
  const individualItemCount = stats['C_個体管理品目'];

  return (
    <div>
      {/* 説明 */}
      <div style={{ marginBottom: '16px', padding: '14px', background: '#EBF5EE', borderRadius: '6px', border: '1px solid #087CB6' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '8px' }}>
          ① 登録区分をチェック・修正してください
        </div>
        <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.6 }}>
          ※ QRラベルを発行・除却が可能な単位にて登録を行います<br />
          ※ C_個体管理品目の稼働の為の項目は一体として資産登録が前提です
        </div>
      </div>

      {/* 統計情報 */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(Object.keys(ITEM_TYPE_LABELS) as QuotationItemType[]).map(type => {
          const colors = ITEM_TYPE_COLORS[type];
          const count = stats[type];
          return (
            <div
              key={type}
              style={{
                padding: '6px 12px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                fontSize: '11px',
                color: colors.text,
                fontWeight: 'bold',
              }}
            >
              {ITEM_TYPE_LABELS[type]}: {count}件
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div style={{ marginBottom: '16px', padding: '10px', background: '#FAFAFA', borderRadius: '4px', fontSize: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#555' }}>■ 登録区分について</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
          {(Object.keys(ITEM_TYPE_DESCRIPTIONS) as QuotationItemType[]).map(type => (
            <div key={type} style={{ display: 'flex', gap: '8px' }}>
              <span style={{
                display: 'inline-block',
                padding: '2px 6px',
                background: ITEM_TYPE_COLORS[type].bg,
                color: ITEM_TYPE_COLORS[type].text,
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 'bold',
                minWidth: '100px',
              }}>
                {ITEM_TYPE_LABELS[type].split('_')[0]}
              </span>
              <span style={{ color: '#8A8A8A' }}>{ITEM_TYPE_DESCRIPTIONS[type]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 明細テーブル */}
      <div style={{ marginBottom: '16px', border: '1px solid #E1E1E1', borderRadius: '6px', overflow: 'hidden' }}>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#FAFAFA', zIndex: 2 }}>
              <tr>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '40px' }}>No</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', minWidth: '150px' }}>品名</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', width: '100px' }}>メーカー</th>
                <th style={{ padding: '8px', textAlign: 'left', border: '2px solid #E1E1E1', width: '100px' }}>型式</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '50px' }}>数量</th>
                <th style={{ padding: '8px', textAlign: 'right', border: '2px solid #E1E1E1', width: '100px' }}>購入金額</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '100px', background: '#EBF5EE' }}>AI判定</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '2px solid #E1E1E1', width: '150px', background: '#FDF1E5' }}>登録区分</th>
              </tr>
            </thead>
            <tbody>
              {ocrResult.items.map((item, index) => {
                const classification = classifications[index];
                const colors = ITEM_TYPE_COLORS[classification.currentItemType];

                return (
                  <tr key={index} style={{
                    borderBottom: '1px solid #E1E1E1',
                    background: classification.isModified ? '#FAFAFA' : 'transparent',
                  }}>
                    <td style={{ padding: '6px', textAlign: 'center' }}>{item.rowNo || index + 1}</td>
                    <td style={{ padding: '6px', fontWeight: 'bold' }}>{item.itemName}</td>
                    <td style={{ padding: '6px', color: '#555' }}>{item.manufacturer || '-'}</td>
                    <td style={{ padding: '6px', color: '#555' }}>{item.model || '-'}</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>
                      ¥{item.purchasePriceTotal.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        background: ITEM_TYPE_COLORS[classification.originalItemType].bg,
                        color: ITEM_TYPE_COLORS[classification.originalItemType].text,
                        borderRadius: '3px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}>
                        {ITEM_TYPE_LABELS[classification.originalItemType].split('_')[0]}
                      </span>
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <select
                        value={classification.currentItemType}
                        onChange={(e) => handleItemTypeChange(index, e.target.value as QuotationItemType)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '10px',
                          border: `2px solid ${colors.border}`,
                          borderRadius: '4px',
                          background: colors.bg,
                          color: colors.text,
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        {(Object.keys(ITEM_TYPE_LABELS) as QuotationItemType[]).map(type => (
                          <option key={type} value={type}>{ITEM_TYPE_LABELS[type]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 次ステップへの案内 */}
      <div style={{ marginBottom: '16px', padding: '12px', background: '#FAFAFA', borderRadius: '6px', border: '1px solid #8A8A8A' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '4px' }}>
          次のステップ：個体管理品目のAI判定（{individualItemCount}件）
        </div>
        <div style={{ fontSize: '11px', color: '#555' }}>
          C_個体管理品目に分類された明細について、資産Masterとの紐付けを行います
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
          onClick={handleNext}
          style={{
            padding: '10px 24px',
            background: '#4A4A4A',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          次へ（個体管理品目AI判定）
        </button>
      </div>
    </div>
  );
};
