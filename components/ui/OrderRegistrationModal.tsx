'use client';

import React, { useState } from 'react';

/**
 * 発注登録モーダル（REQ-069 / REQ-082）
 *
 * 修理 / 廃棄 / 保守契約 の見積登録 UI で、発注登録用見積の登録後に表示する。
 * 「印刷」または「mail送信」を選択して確定すると、発注No が自動配番されて onConfirm に渡る。
 */
export interface OrderRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderNo: string, deliveryMethod: '印刷' | 'mail送信') => void;
  /** 配番に使う prefix（例: 'PO-REPAIR' / 'PO-DISPOSAL' / 'PO-MAINT'）*/
  orderNoPrefix?: string;
}

/** 発注No を自動配番する（mock 用：日付 + 連番） */
const generateOrderNo = (prefix: string): string => {
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `${prefix}-${ymd}-${seq}`;
};

export const OrderRegistrationModal: React.FC<OrderRegistrationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderNoPrefix = 'PO',
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<'印刷' | 'mail送信'>('mail送信');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const orderNo = generateOrderNo(orderNoPrefix);
    onConfirm(orderNo, deliveryMethod);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '24px',
          width: '420px',
          maxWidth: '90vw',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#4A4A4A' }}>
          発注登録
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4A4A4A' }}>
          発注書の送付方法を選択してください。確定すると発注No,が自動配番されます。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="orderDeliveryMethod"
              checked={deliveryMethod === '印刷'}
              onChange={() => setDeliveryMethod('印刷')}
            />
            印刷
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="radio"
              name="orderDeliveryMethod"
              checked={deliveryMethod === 'mail送信'}
              onChange={() => setDeliveryMethod('mail送信')}
            />
            mail送信
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#E1E1E1',
              color: '#4A4A4A',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '8px 16px',
              background: '#087CB6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            確定（発注No 配番）
          </button>
        </div>
      </div>
    </div>
  );
};
