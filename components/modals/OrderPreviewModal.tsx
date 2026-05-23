'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { useOrderStore } from '@/lib/stores/orderStore';

/** プレビュー用の明細データ */
interface PreviewItem {
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** プレビュー用のグループデータ（登録前に渡す） */
export interface OrderPreviewData {
  orderNo: string;
  orderDate: string;
  vendorName: string;
  applicant: string;
  applicantEmail: string;
  orderType: string;
  deliveryDate?: string;
  paymentClosingDate?: string;
  paymentDate?: string;
  paymentMethod?: string;
  paymentSiteDays?: number;
  leaseStartDate?: string;
  leaseEndDate?: string;
  comment?: string;
  totalAmount: number;
  items: PreviewItem[];
}

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 登録済みデータを表示する場合 */
  orderGroupId?: number;
  /** 登録前プレビューデータ */
  previewData?: OrderPreviewData;
  /** 登録前プレビュー時: 「登録して出力」押下時のコールバック */
  onRegister?: () => void;
}

/** カラートークン（page.tsx と統一） */
const COLORS = {
  primary: '#4A4A4A',
  primaryDark: '#146E2E',
  textPrimary: '#4A4A4A',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',
  textOnColor: '#ffffff',
  border: '#E1E1E1',
  borderLight: '#E1E1E1',
  white: '#ffffff',
  accent: '#4A4A4A',
  accentText: '#4A4A4A',
} as const;

const PRINT_STYLE_ID = 'order-preview-print-style';

export const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({
  isOpen,
  onClose,
  orderGroupId,
  previewData,
  onRegister,
}) => {
  const { getOrderGroupById, getOrderItemsByGroupId } = useOrderStore();

  // プレビューモード判定
  const isPreviewMode = !!previewData;

  // 表示データの解決
  const storeGroup = orderGroupId ? getOrderGroupById(orderGroupId) : undefined;
  const storeItems = orderGroupId ? getOrderItemsByGroupId(orderGroupId) : [];

  // ストアデータをプレビュー形式に変換
  const displayGroup: OrderPreviewData | undefined = isPreviewMode
    ? previewData
    : storeGroup
      ? {
          orderNo: storeGroup.orderNo,
          orderDate: storeGroup.orderDate,
          vendorName: storeGroup.vendorName,
          applicant: storeGroup.applicant,
          applicantEmail: storeGroup.applicantEmail,
          orderType: storeGroup.orderType,
          deliveryDate: storeGroup.deliveryDate,
          paymentClosingDate: storeGroup.paymentDueDate,
          paymentMethod: storeGroup.paymentMethod,
          paymentSiteDays: storeGroup.paymentSiteDays,
          leaseStartDate: storeGroup.leaseStartDate,
          leaseEndDate: storeGroup.leaseEndDate,
          comment: storeGroup.comment,
          totalAmount: storeGroup.totalAmount,
          items: [],
        }
      : undefined;

  const displayItems: PreviewItem[] = isPreviewMode
    ? previewData.items
    : storeItems.map((item) => ({
        itemName: item.itemName,
        manufacturer: item.manufacturer,
        model: item.model,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

  const handlePrint = () => {
    let styleEl = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = PRINT_STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @media print {
        body > *:not([data-order-preview-root]) {
          display: none !important;
        }
        [data-order-preview-root] {
          position: fixed !important;
          inset: 0 !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
          background: white !important;
          padding: 0 !important;
        }
        [data-order-preview-backdrop] {
          background: white !important;
        }
        [data-order-preview-modal-frame] {
          box-shadow: none !important;
          max-height: none !important;
          overflow: visible !important;
          border-radius: 0 !important;
        }
        [data-order-preview-header],
        [data-order-preview-footer] {
          display: none !important;
        }
        [data-order-preview-document] {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 20mm !important;
          max-width: none !important;
        }
      }
    `;
    window.print();
  };

  if (!displayGroup) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      {/* モーダルヘッダー */}
      <div
        data-order-preview-header=""
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: COLORS.textPrimary,
            textWrap: 'balance',
          }}
        >
          発注書プレビュー
        </h3>
        <button
          onClick={onClose}
          aria-label="閉じる"
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: COLORS.textMuted,
            fontSize: '20px',
            borderRadius: '4px',
          }}
        >
          &#x2715;
        </button>
      </div>

      {/* 発注書ドキュメント本体 */}
      <div
        data-order-preview-document=""
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.borderLight}`,
          borderRadius: '4px',
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {/* タイトル */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            color: COLORS.textPrimary,
            letterSpacing: '0.5em',
            marginBottom: '32px',
            textWrap: 'balance',
          }}
        >
          発 注 書
        </h1>

        {/* 発注No・発注日 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '24px',
            marginBottom: '24px',
            fontSize: '14px',
            color: COLORS.textSecondary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span>発注No: {displayGroup.orderNo}</span>
          <span>発注日: {displayGroup.orderDate}</span>
        </div>

        {/* 宛先 */}
        <div style={{ marginBottom: '24px' }}>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: COLORS.textPrimary,
              borderBottom: `2px solid ${COLORS.textPrimary}`,
              paddingBottom: '4px',
              display: 'inline-block',
            }}
          >
            {displayGroup.vendorName || '-'}{' '}
            <span style={{ fontWeight: 400, fontSize: '14px' }}>御中</span>
          </p>
        </div>

        {/* 発注者情報 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '32px',
          }}
        >
          <div style={{ fontSize: '14px', color: COLORS.textSecondary, textAlign: 'right' }}>
            <p style={{ marginBottom: '4px' }}>
              <span style={{ color: COLORS.textMuted, marginRight: '8px' }}>発注者:</span>
              {displayGroup.applicant || '-'}
            </p>
            <p>
              <span style={{ color: COLORS.textMuted, marginRight: '8px' }}>連絡先:</span>
              {displayGroup.applicantEmail || '-'}
            </p>
          </div>
        </div>

        {/* 明細テーブル */}
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            marginBottom: '16px',
          }}
        >
          <thead>
            <tr style={{ background: COLORS.primary, color: COLORS.textOnColor }}>
              <th style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', border: `1px solid ${COLORS.primaryDark}`, width: '40px' }}>No</th>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', border: `1px solid ${COLORS.primaryDark}` }}>品名</th>
              <th style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold', border: `1px solid ${COLORS.primaryDark}`, whiteSpace: 'nowrap' }}>メーカー / 型式</th>
              <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', border: `1px solid ${COLORS.primaryDark}`, width: '50px' }}>数量</th>
              <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', border: `1px solid ${COLORS.primaryDark}`, width: '110px', whiteSpace: 'nowrap' }}>単価（税込）</th>
              <th style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', border: `1px solid ${COLORS.primaryDark}`, width: '120px', whiteSpace: 'nowrap' }}>金額（税込）</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td style={{ padding: '8px', textAlign: 'center', border: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</td>
                <td style={{ padding: '8px', border: `1px solid ${COLORS.borderLight}` }}>{item.itemName}</td>
                <td style={{ padding: '8px', border: `1px solid ${COLORS.borderLight}`, fontSize: '12px', color: COLORS.textSecondary }}>
                  {item.manufacturer}{item.model ? ` / ${item.model}` : ''}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', border: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                <td style={{ padding: '8px', textAlign: 'right', border: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>¥{item.unitPrice.toLocaleString()}</td>
                <td style={{ padding: '8px', textAlign: 'right', border: `1px solid ${COLORS.borderLight}`, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>¥{item.totalPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 合計金額 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
          <div
            style={{
              borderTop: `2px solid ${COLORS.textPrimary}`,
              borderBottom: `2px solid ${COLORS.textPrimary}`,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: COLORS.textPrimary }}>合計金額（税込）</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: COLORS.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
              ¥{displayGroup.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 条件欄 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', maxWidth: '480px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, width: '120px', borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap' }}>納期</td>
              <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{displayGroup.deliveryDate || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap' }}>発注形態</td>
              <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}` }}>{displayGroup.orderType}</td>
            </tr>
            {displayGroup.paymentClosingDate && (
              <tr>
                <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap' }}>支払条件</td>
                <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>
                  {displayGroup.paymentClosingDate} 締め {displayGroup.paymentDate || ''} 支払
                </td>
              </tr>
            )}
            {displayGroup.paymentMethod && (
              <tr>
                <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap' }}>支払方法</td>
                <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}` }}>{displayGroup.paymentMethod}</td>
              </tr>
            )}
            {displayGroup.paymentSiteDays && (
              <tr>
                <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap' }}>支払期日</td>
                <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{displayGroup.paymentSiteDays}日サイト</td>
              </tr>
            )}
            {displayGroup.leaseStartDate && (
              <tr>
                <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap' }}>リース期間</td>
                <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>
                  {displayGroup.leaseStartDate} 〜 {displayGroup.leaseEndDate || ''}
                </td>
              </tr>
            )}
            {displayGroup.comment && (
              <tr>
                <td style={{ padding: '6px 12px', fontWeight: 'bold', color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'nowrap', verticalAlign: 'top' }}>コメント</td>
                <td style={{ padding: '6px 12px', color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}`, whiteSpace: 'pre-wrap' }}>{displayGroup.comment}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* フッターボタン */}
      <div
        data-order-preview-footer=""
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        {isPreviewMode ? (
          <>
            <button
              onClick={onRegister}
              style={{
                padding: '12px 24px',
                background: COLORS.accent,
                color: COLORS.accentText,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                minHeight: '44px',
              }}
            >
              登録して出力
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: COLORS.white,
                color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                minHeight: '44px',
              }}
            >
              発注の登録に戻る
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handlePrint}
              style={{
                padding: '12px 24px',
                background: COLORS.primary,
                color: COLORS.textOnColor,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                minHeight: '44px',
              }}
            >
              印刷する
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                background: COLORS.white,
                color: COLORS.textMuted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                minHeight: '44px',
              }}
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};
