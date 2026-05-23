import React, { useMemo } from 'react';
import { ReceivedQuotationItem, ReceivedQuotationGroup } from '@/lib/types/quotation';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { EmptyState } from '@/components/ui/EmptyState';

interface QuotationsTabProps {
  items: ReceivedQuotationItem[];
}

const fmtNum = (v?: number) => (v ? v.toLocaleString() : '');
const fmtCur = (v?: number) => (v ? `¥${v.toLocaleString()}` : '');

// 見積DBのカラム定義（AI検証グループ除外）
const QUOTATION_COLUMNS: { key: string; label: string; align?: 'right' | 'center'; fmt?: 'num' | 'cur' }[] = [
  // 見積ヘッダー
  { key: 'receivedQuotationNo', label: '見積依頼No.' },
  { key: 'rfqGroupName', label: '見積グループ名' },
  { key: 'vendorName', label: '業者名' },
  { key: 'vendorContact', label: '担当者名' },
  { key: 'quotationPhase', label: '見積フェーズ' },
  { key: 'quotationDate', label: '見積日付' },
  // STEP② 商品情報
  { key: 'rowNo', label: '明細行No.', align: 'center' },
  { key: 'originalItemName', label: '商品名（見積記載）' },
  { key: 'originalManufacturer', label: 'メーカ名（見積記載）' },
  { key: 'originalModel', label: '規格（見積記載）' },
  { key: 'originalQuantity', label: '数量', align: 'center' },
  // STEP② 価格情報
  { key: 'listPriceUnit', label: '定価単価', align: 'right', fmt: 'num' },
  { key: 'listPriceTotal', label: '定価金額', align: 'right', fmt: 'num' },
  { key: 'purchasePriceUnit', label: '購入単価(税別)', align: 'right', fmt: 'num' },
  { key: 'purchasePriceTotal', label: '購入金額(税別)', align: 'right', fmt: 'num' },
  // STEP③
  { key: 'category', label: 'カテゴリ' },
  { key: 'itemType', label: '明細区分' },
  // STEP④
  { key: 'largeClass', label: '大分類' },
  { key: 'middleClass', label: '中分類' },
  { key: 'itemName', label: '個体管理品目' },
  { key: 'manufacturer', label: 'メーカー' },
  { key: 'model', label: '型式' },
  // STEP⑤
  { key: 'aiQuantity', label: '数量', align: 'center' },
  { key: 'unit', label: '単位', align: 'center' },
  { key: 'allocListPriceTotal', label: '購入金額(税込)', align: 'right', fmt: 'cur' },
];

const GROUP_HEADERS = [
  { label: '見積ヘッダー', span: 6, color: '#F1F1F1' },
  { label: 'STEP② 商品情報', span: 5, color: '#F1F1F1' },
  { label: 'STEP② 価格情報', span: 4, color: '#F1F1F1' },
  { label: 'STEP③', span: 2, color: '#F1F1F1' },
  { label: 'STEP④ 個体管理品目', span: 5, color: '#F1F1F1' },
  { label: 'STEP⑤ 個体登録', span: 3, color: '#F1F1F1' },
];

export const QuotationsTab: React.FC<QuotationsTabProps> = ({ items }) => {
  const { quotationGroups } = useQuotationStore();

  // グループ情報をアイテムにマージ
  const enrichedItems = useMemo(() => {
    return items.map(item => {
      const group = quotationGroups.find(g => g.id === item.quotationGroupId);
      return {
        ...item,
        vendorName: group?.vendorName || '',
        vendorContact: group?.vendorContact || '',
        quotationPhase: group?.phase || '',
        quotationDate: group?.quotationDate || '',
        rfqGroupName: group?.rfqNo ? `${group.rfqNo}` : '',
      };
    });
  }, [items, quotationGroups]);

  return (
    <div style={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 260px)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
          {/* グループヘッダー (Figma 339:54381: 薄灰 + 黒文字) */}
          <tr>
            {GROUP_HEADERS.map((g, i) => (
              <th key={i} colSpan={g.span} style={{
                padding: '4px 6px', textAlign: 'center', fontSize: '10px', fontWeight: 600,
                color: '#4A4A4A', background: g.color,
                border: '1px solid #E1E1E1', whiteSpace: 'nowrap',
              }}>{g.label}</th>
            ))}
          </tr>
          {/* カラムヘッダー */}
          <tr>
            {QUOTATION_COLUMNS.map(col => (
              <th key={col.key} style={{
                padding: '4px 6px', textAlign: col.align || 'left', fontSize: '10px', fontWeight: 600,
                color: '#4A4A4A', background: '#FAFAFA',
                border: '1px solid #E1E1E1', whiteSpace: 'nowrap',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enrichedItems.map((item, index) => (
            <tr key={item.id} style={{ background: index % 2 === 0 ? 'white' : '#FAFAFA', height: '36px' }}>
              {QUOTATION_COLUMNS.map(col => {
                const val = (item as unknown as Record<string, unknown>)[col.key];
                let display = '';
                if (col.fmt === 'cur') display = fmtCur(val as number | undefined);
                else if (col.fmt === 'num') display = fmtNum(val as number | undefined);
                else display = String(val || '');

                return (
                  <td key={col.key} style={{
                    padding: '6px 8px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                    textAlign: col.align || 'left',
                    border: '1px solid #E1E1E1', color: '#4A4A4A', verticalAlign: 'middle',
                  }}>{display}</td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {enrichedItems.length === 0 && (
        <EmptyState
          title="該当する見積明細がありません"
          description="絞り込み条件を変更してください"
        />
      )}
    </div>
  );
};
