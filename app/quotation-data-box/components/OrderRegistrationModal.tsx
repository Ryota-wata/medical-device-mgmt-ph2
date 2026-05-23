'use client';

import React, { useState, useMemo } from 'react';
import { RfqGroup, ReceivedQuotationItem } from '@/lib/types';
import {
  OrderType,
  PaymentTerms,
  InspectionCertType,
  StorageFormat,
} from '@/lib/types/order';

/** 発注形態の選択肢 */
const ORDER_TYPES: OrderType[] = [
  '購入',
  '割賦',
  'リース（ファイナンス）',
  'リース（オペレーティング）',
  'レンタル',
];

/** 支払い条件の選択肢 */
const PAYMENT_TERMS: PaymentTerms[] = [
  '納品時一括',
  '検収後一括',
  '分割払い',
  '月末締め翌月末払い',
  'その他',
];

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #E1E1E1',
  borderRadius: '4px',
  fontSize: '13px',
};

interface OrderRegistrationModalProps {
  show: boolean;
  rfqGroup: RfqGroup;
  quotationItems: ReceivedQuotationItem[];
  onSubmit: (data: {
    orderType: OrderType;
    deliveryDate: string;
    paymentTerms: PaymentTerms;
    paymentDueDate: string;
    inspectionCertType: InspectionCertType;
    storageFormat: StorageFormat;
    leaseCompany?: string;
    leaseStartDate?: string;
    leaseYears?: number;
  }) => void;
  onClose: () => void;
}

export const OrderRegistrationModal: React.FC<OrderRegistrationModalProps> = ({
  show,
  rfqGroup,
  quotationItems,
  onSubmit,
  onClose,
}) => {
  // フォーム
  const [orderType, setOrderType] = useState<OrderType>('購入');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('検収後一括');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [leaseCompany, setLeaseCompany] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseYears, setLeaseYears] = useState('');
  const [itemDeliveryDates, setItemDeliveryDates] = useState<Record<number, string>>({});

  const isLeaseType = orderType === 'リース（ファイナンス）' || orderType === 'リース（オペレーティング）';

  const totalAmount = useMemo(() => {
    return quotationItems.reduce((sum, item) => sum + (item.allocTaxTotal || 0), 0);
  }, [quotationItems]);

  if (!show) return null;

  const handleSubmitOrder = () => {
    if (!deliveryDate) {
      alert('納品日を設定してください');
      return;
    }
    onSubmit({
      orderType,
      deliveryDate,
      paymentTerms,
      paymentDueDate,
      inspectionCertType: '本体のみ',
      storageFormat: 'スキャナ保存',
      leaseCompany: isLeaseType ? leaseCompany : undefined,
      leaseStartDate: isLeaseType ? leaseStartDate : undefined,
      leaseYears: isLeaseType && leaseYears ? Number(leaseYears) : undefined,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '30px',
          width: '1200px',
          maxWidth: '95%',
          maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* タイトル */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#4A4A4A' }}>
            発注登録
          </h2>
          <button
            onClick={() => alert('発注書テンプレートを出力します（実装予定）')}
            style={{ padding: '8px 20px', background: '#4A4A4A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
          >
            発注書出力
          </button>
        </div>

        {/* 基本情報サマリー */}
        <div style={{
          background: 'white',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          <div style={{
            padding: '8px 16px',
            background: '#8A8A8A',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
          }}>
            基本情報
          </div>
          <div style={{ padding: '12px 16px' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', width: '120px', border: '1px solid #E1E1E1' }}>見積依頼No.</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1', width: '150px' }}>{rfqGroup.rfqNo}</td>
                  <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', width: '120px', border: '1px solid #E1E1E1' }}>見積G名称</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1' }}>{rfqGroup.groupName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', border: '1px solid #E1E1E1' }}>発注先</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1' }}>{rfqGroup.vendorName || '-'}</td>
                  <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', border: '1px solid #E1E1E1' }}>担当</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1' }}>{rfqGroup.personInCharge || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 発注基本登録 セクション */}
        <div style={{ border: '2px solid #4A4A4A', borderRadius: '6px', marginBottom: '16px' }}>
          <div style={{ background: '#4A4A4A', color: 'white', padding: '8px 14px', fontSize: '14px', fontWeight: 'bold' }}>
            発注基本登録
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto 1fr', gap: '10px 20px', alignItems: 'center' }}>
              {/* 発注形態 */}
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', whiteSpace: 'nowrap' }}>発注形態</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} style={{ ...inputStyle, minWidth: '200px' }}>
                {ORDER_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>

              {/* 納期 */}
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', whiteSpace: 'nowrap' }}>納期</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={inputStyle} />

              {/* 支払条件 */}
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', whiteSpace: 'nowrap' }}>支払条件</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)} style={{ ...inputStyle, minWidth: '180px' }}>
                  {PAYMENT_TERMS.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
                <label style={{ fontSize: '12px', color: '#555', whiteSpace: 'nowrap' }}>支払期日:</label>
                <input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} style={inputStyle} />
              </div>

              {/* リース会社 */}
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: isLeaseType ? '#4A4A4A' : '#bbb', whiteSpace: 'nowrap' }}>リース会社</label>
              <input type="text" value={leaseCompany} onChange={(e) => setLeaseCompany(e.target.value)} disabled={!isLeaseType} placeholder={isLeaseType ? 'リース会社名' : '-'} style={{ ...inputStyle, color: isLeaseType ? '#4A4A4A' : '#bbb', background: isLeaseType ? 'white' : '#FAFAFA' }} />

              {/* リース開始日 / 年数 */}
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: isLeaseType ? '#4A4A4A' : '#bbb', whiteSpace: 'nowrap' }}>リース開始日</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="month" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} disabled={!isLeaseType} style={{ ...inputStyle, width: '150px', color: isLeaseType ? '#4A4A4A' : '#bbb', background: isLeaseType ? 'white' : '#FAFAFA' }} />
                <label style={{ fontSize: '13px', fontWeight: 'bold', color: isLeaseType ? '#4A4A4A' : '#bbb', whiteSpace: 'nowrap' }}>年数</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="number" value={leaseYears} onChange={(e) => setLeaseYears(e.target.value)} disabled={!isLeaseType} min="1" max="20" style={{ ...inputStyle, width: '60px', textAlign: 'right', color: isLeaseType ? '#4A4A4A' : '#bbb', background: isLeaseType ? 'white' : '#FAFAFA' }} />
                  <span style={{ fontSize: '13px', color: isLeaseType ? '#4A4A4A' : '#bbb' }}>年</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 品目テーブル */}
        <div style={{
          background: 'white',
          border: '1px solid #E1E1E1',
          borderRadius: '4px',
          marginBottom: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#4A4A4A',
            color: 'white',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>発注明細（登録済み見積明細より自動取得）</span>
            <span style={{ fontSize: '12px' }}>
              合計金額（税込）:
              <span style={{ fontWeight: 'bold', fontSize: '16px', marginLeft: '8px' }}>
                ¥{totalAmount.toLocaleString()}
              </span>
            </span>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#4A4A4A', color: 'white', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>No</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>品名</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>メーカー</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>型式</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>数量</th>
                  <th style={{ padding: '8px', textAlign: 'right', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>金額（税込）</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #4A4A4A', whiteSpace: 'nowrap', fontWeight: 'bold' }}>個別納品日</th>
                </tr>
              </thead>
              <tbody>
                {quotationItems.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E1E1E1' }}>
                    <td style={{ padding: '8px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.itemName || item.originalItemName}</td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{item.manufacturer || item.originalManufacturer || '-'}</td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{item.model || item.originalModel || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{item.aiQuantity || item.originalQuantity}</td>
                    <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>¥{(item.allocTaxTotal || 0).toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <input
                        type="date"
                        value={itemDeliveryDates[item.id] || ''}
                        onChange={(e) => setItemDeliveryDates((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        style={{ ...inputStyle, width: '140px', fontSize: '11px', padding: '3px 6px', color: itemDeliveryDates[item.id] ? '#4A4A4A' : '#aaa' }}
                      />
                    </td>
                  </tr>
                ))}
                {quotationItems.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A' }}>対象の見積明細がありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* フッター */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #E1E1E1' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', background: '#8A8A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
            キャンセル
          </button>
          <button onClick={handleSubmitOrder} style={{ padding: '10px 24px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
            登録
          </button>
        </div>
      </div>
    </div>
  );
};
