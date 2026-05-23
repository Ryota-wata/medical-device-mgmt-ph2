'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useOrderStore } from '@/lib/stores/orderStore';
import { InspectionCertType } from '@/lib/types/order';

interface InspectionCertPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderGroupId: number;
  inspectionCertType: InspectionCertType;
}

/** カラートークン */
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
  surfaceHeader: '#FAFAFA',
  accentBlueLight: '#EBF5EE',
  successBg: '#EBF5EE',
  successText: '#008C1D',
} as const;

/** 明細テーブルのヘッダーセルスタイル */
const thCell: React.CSSProperties = {
  padding: '6px 8px',
  fontWeight: 'bold',
  fontSize: '11px',
  textAlign: 'center',
  border: `1px solid ${COLORS.border}`,
  whiteSpace: 'nowrap',
  background: COLORS.surfaceHeader,
  color: COLORS.textPrimary,
};

/** 明細テーブルのデータセルスタイル */
const tdCell: React.CSSProperties = {
  padding: '6px 8px',
  fontSize: '12px',
  border: `1px solid ${COLORS.borderLight}`,
  color: COLORS.textPrimary,
};

export const InspectionCertPreviewModal: React.FC<InspectionCertPreviewModalProps> = ({
  isOpen,
  onClose,
  orderGroupId,
  inspectionCertType,
}) => {
  const { getOrderGroupById, getOrderItemsByGroupId } = useOrderStore();
  const orderGroup = getOrderGroupById(orderGroupId);
  const allItems = getOrderItemsByGroupId(orderGroupId);
  const orderItems = inspectionCertType === '本体のみ'
    ? allItems.filter((item) => item.registrationType === '本体')
    : allItems;
  const [exported, setExported] = useState(false);

  /** モック: 実際のファイル生成は行わず、フィードバックのみ表示 */
  const handleExportExcel = () => {
    setExported(true);
  };

  if (!orderGroup) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      <style>{`
        .cert-btn { transition: filter 150ms ease-out; }
        .cert-btn:hover:not(:disabled) { filter: brightness(0.9); }
        .cert-btn:focus-visible { outline: 2px solid ${COLORS.primary}; outline-offset: 2px; }
        .cert-btn-secondary { transition: background 150ms ease-out; }
        .cert-btn-secondary:hover { background: #E1E1E1 !important; }
        .cert-btn-secondary:focus-visible { outline: 2px solid ${COLORS.border}; outline-offset: 2px; }
      `}</style>

      {/* モーダルヘッダー */}
      <div
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
          検収書プレビュー
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

      {/* 検収書ドキュメント本体（プレビュー） */}
      <div
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.borderLight}`,
          borderRadius: '4px',
          padding: '32px 24px',
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
            marginBottom: '24px',
            textWrap: 'balance',
          }}
        >
          検 収 書
        </h1>

        {/* 基本情報 + 検収日 */}
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: '12px',
            marginBottom: '24px',
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: '4px 10px', fontWeight: 'bold', color: COLORS.textSecondary, whiteSpace: 'nowrap', background: COLORS.surfaceHeader, border: `1px solid ${COLORS.borderLight}` }}>見積依頼No.</td>
              <td style={{ padding: '4px 10px', border: `1px solid ${COLORS.borderLight}`, fontFamily: 'monospace' }}>{orderGroup.rfqNo}</td>
              <td style={{ padding: '4px 10px', fontWeight: 'bold', color: COLORS.textSecondary, whiteSpace: 'nowrap', background: COLORS.surfaceHeader, border: `1px solid ${COLORS.borderLight}` }}>見積G名称</td>
              <td style={{ padding: '4px 10px', border: `1px solid ${COLORS.borderLight}` }}>{orderGroup.groupName}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 10px', fontWeight: 'bold', color: COLORS.textSecondary, whiteSpace: 'nowrap', background: COLORS.surfaceHeader, border: `1px solid ${COLORS.borderLight}` }}>発注先</td>
              <td style={{ padding: '4px 10px', border: `1px solid ${COLORS.borderLight}` }}>{orderGroup.vendorName || '-'}</td>
              <td style={{ padding: '4px 10px', fontWeight: 'bold', color: COLORS.textSecondary, whiteSpace: 'nowrap', background: COLORS.surfaceHeader, border: `1px solid ${COLORS.borderLight}` }}>申請者</td>
              <td style={{ padding: '4px 10px', border: `1px solid ${COLORS.borderLight}` }}>{orderGroup.applicant || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 10px', fontWeight: 'bold', color: COLORS.textSecondary, whiteSpace: 'nowrap', background: COLORS.surfaceHeader, border: `1px solid ${COLORS.borderLight}` }}>納品日</td>
              <td style={{ padding: '4px 10px', border: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.deliveryDate || '-'}</td>
              <td style={{ padding: '4px 10px', fontWeight: 'bold', color: COLORS.textSecondary, whiteSpace: 'nowrap', background: COLORS.surfaceHeader, border: `1px solid ${COLORS.borderLight}` }}>検収日</td>
              <td style={{ padding: '4px 10px', border: `1px solid ${COLORS.borderLight}`, fontVariantNumeric: 'tabular-nums' }}>{orderGroup.inspectionDate || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* 明細テーブル */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '900px',
            }}
          >
            <thead>
              <tr>
                <th style={thCell}>個体管理品目</th>
                <th style={thCell}>メーカー</th>
                <th style={thCell}>型式</th>
                <th style={{ ...thCell, background: COLORS.accentBlueLight }}>登録区分</th>
                <th style={thCell}>数量</th>
                <th style={thCell}>単位</th>
                <th style={thCell}>階</th>
                <th style={thCell}>部門</th>
                <th style={thCell}>部署</th>
                <th style={thCell}>室名</th>
                <th style={thCell}>QRラベル</th>
                <th style={thCell}>シリアルNo.</th>
                <th style={thCell}>写真撮影</th>
                <th style={{ ...thCell, minWidth: '64px' }}>検収印</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{item.itemName}</td>
                  <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{item.manufacturer || '-'}</td>
                  <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{item.model || '-'}</td>
                  <td
                    style={{
                      ...tdCell,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      background: COLORS.accentBlueLight,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.registrationType}
                  </td>
                  <td
                    style={{
                      ...tdCell,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {item.quantity}
                  </td>
                  <td style={{ ...tdCell, textAlign: 'center' }}>台</td>
                  <td style={{ ...tdCell, textAlign: 'center', color: COLORS.textMuted }}>-</td>
                  <td style={{ ...tdCell, color: COLORS.textMuted }}>-</td>
                  <td style={{ ...tdCell, color: COLORS.textMuted }}>-</td>
                  <td style={{ ...tdCell, color: COLORS.textMuted }}>-</td>
                  <td style={{ ...tdCell, textAlign: 'center', color: COLORS.textMuted }}>-</td>
                  <td style={{ ...tdCell, color: COLORS.textMuted }}>-</td>
                  <td style={{ ...tdCell, textAlign: 'center', color: COLORS.textMuted }}>-</td>
                  {/* 検収印セル：空欄 */}
                  <td
                    style={{
                      ...tdCell,
                      minWidth: '64px',
                      height: '40px',
                      background: COLORS.white,
                    }}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* エクスポート完了フィードバック */}
      {exported && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: COLORS.successBg,
            border: `1px solid #EBF5EE`,
            borderRadius: '4px',
            fontSize: '13px',
            color: COLORS.successText,
            textAlign: 'center',
            textWrap: 'pretty',
          }}
        >
          Excelファイルをダウンロードしました。
        </div>
      )}

      {/* フッターボタン */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '16px',
        }}
      >
        <button
          className="cert-btn"
          onClick={handleExportExcel}
          style={{
            padding: '12px 24px',
            background: COLORS.primary,
            color: COLORS.textOnColor,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          Excel出力
        </button>
        <button
          className="cert-btn-secondary"
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
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          閉じる
        </button>
      </div>
    </Modal>
  );
};
