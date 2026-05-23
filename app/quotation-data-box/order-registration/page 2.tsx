'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { useAuthStore } from '@/lib/stores/authStore';
import {
  OrderType,
  PaymentTerms,
  InspectionCertType,
  StorageFormat,
} from '@/lib/types/order';

// 内部ステップ
type InternalStep = 1 | 2;

/** 保存形式の内部値 */
type SaveFormatValue = 'electronic' | 'scanner' | 'unspecified';

const SAVE_FORMAT_MAP: Record<SaveFormatValue, StorageFormat> = {
  electronic: '電子取引',
  scanner: 'スキャナ保存',
  unspecified: '未指定',
};

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

/** プログレスバー用ステップ定義（発注処理用） */
const ORDER_PROGRESS_STEPS = [
  { step: 1, label: '見積情報入力' },
  { step: 2, label: 'OCR明細確認' },
  { step: 3, label: '登録区分登録' },
  { step: 4, label: '個体品目AI判定' },
  { step: 5, label: '個体登録/金額按分' },
  { step: 6, label: '発注基本登録' },
];

// 共通テーブルスタイル（#008C1D）
const thStyle: React.CSSProperties = {
  background: '#008C1D',
  color: 'white',
  padding: '10px 12px',
  fontSize: '13px',
  fontWeight: 'bold',
  textAlign: 'left',
  width: '120px',
  border: '1px solid #008C1D',
  whiteSpace: 'nowrap',
};

const thStyleTop: React.CSSProperties = {
  ...thStyle,
  verticalAlign: 'top',
};

const tdStyle: React.CSSProperties = {
  background: 'white',
  padding: '10px 12px',
  border: '1px solid #008C1D',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid #E1E1E1',
  borderRadius: '4px',
  fontSize: '13px',
};

/** SearchParams 読み取り用 */
function RfqGroupIdReader({ onRead }: { onRead: (id: number | null) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null);
  }, [rfqGroupIdParam, onRead]);
  return null;
}

export default function OrderRegistrationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { addOrderGroup, addOrderItems, generateOrderNo } = useOrderStore();

  // URL パラメータからの rfqGroupId
  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);

  // 内部ステップ
  const [internalStep, setInternalStep] = useState<InternalStep>(1);

  // --- Step1 フォーム ---
  const [inspectionCertType, setInspectionCertType] = useState<InspectionCertType>('本体のみ');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [saveFormat, setSaveFormat] = useState<SaveFormatValue>('scanner');
  const [fileName, setFileName] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // --- Step2 フォーム ---
  const [orderType, setOrderType] = useState<OrderType>('購入');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('検収後一括');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [leaseCompany, setLeaseCompany] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseYears, setLeaseYears] = useState('');
  const [itemDeliveryDates, setItemDeliveryDates] = useState<Record<number, string>>({});

  const isLeaseType = orderType === 'リース（ファイナンス）' || orderType === 'リース（オペレーティング）';

  // データ取得
  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return rfqGroups.find(g => g.id === rfqGroupId);
  }, [rfqGroupId, rfqGroups]);

  const targetQuotationItems = useMemo(() => {
    if (!rfqGroup) return [];
    const targetGroups = quotationGroups.filter(qg => qg.rfqGroupId === rfqGroup.id);
    return quotationItems.filter(qi =>
      targetGroups.some(qg => qg.id === qi.quotationGroupId)
    );
  }, [rfqGroup, quotationGroups, quotationItems]);

  const totalAmount = useMemo(() => {
    return targetQuotationItems.reduce((sum, item) => sum + (item.allocTaxTotal || 0), 0);
  }, [targetQuotationItems]);

  // ファイル選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  // Step1 → Step2
  const handleGoToStep2 = () => {
    setInternalStep(2);
  };

  // 登録処理
  const handleSubmitOrder = () => {
    if (!rfqGroup) return;
    if (!deliveryDate) {
      alert('納品日を設定してください');
      return;
    }

    const orderNo = generateOrderNo();
    const today = new Date().toISOString().split('T')[0];

    const orderGroupId = addOrderGroup({
      orderNo,
      rfqGroupId: rfqGroup.id,
      rfqNo: rfqGroup.rfqNo,
      groupName: rfqGroup.groupName,
      vendorName: rfqGroup.vendorName || '',
      applicant: rfqGroup.personInCharge || '',
      applicantEmail: rfqGroup.email || '',
      orderType,
      deliveryDate,
      paymentTerms,
      paymentDueDate,
      inspectionCertType,
      storageFormat: SAVE_FORMAT_MAP[saveFormat],
      leaseCompany: isLeaseType ? leaseCompany : undefined,
      leaseStartDate: isLeaseType ? leaseStartDate : undefined,
      leaseYears: isLeaseType && leaseYears ? Number(leaseYears) : undefined,
      totalAmount,
      orderDate: today,
    });

    const orderItems = targetQuotationItems.map(qi => ({
      orderGroupId,
      quotationItemId: qi.id,
      itemName: qi.itemName || qi.originalItemName,
      manufacturer: qi.manufacturer || qi.originalManufacturer || '',
      model: qi.model || qi.originalModel || '',
      registrationType: '本体' as const,
      quantity: qi.aiQuantity || qi.originalQuantity,
      unitPrice: qi.allocPriceUnit || 0,
      totalPrice: qi.allocTaxTotal || 0,
    }));
    addOrderItems(orderItems);

    updateRfqGroup(rfqGroup.id, {
      status: '発注済',
      deliveryDeadline: deliveryDate,
    });

    alert(`発注登録が完了しました\n発注No: ${orderNo}\n品目数: ${orderItems.length}件`);
    router.push('/quotation-data-box');
  };

  // 一覧へ戻る
  const handleBackToList = () => {
    router.push('/quotation-data-box');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FAFAFA' }}>
      {/* SearchParams読み取り */}
      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={setRfqGroupId} />
      </Suspense>

      {/* ヘッダー */}
      <Header
        title="発注登録"
        stepBadge="STEP 6"
        hideMenu={true}
        showBackButton={false}
      />

      {/* タブ */}
      <div style={{ display: 'flex', gap: '0', background: '#FAFAFA', paddingLeft: '16px', paddingTop: '8px' }}>
        <div
          style={{
            padding: '10px 20px',
            background: '#008C1D',
            color: 'white',
            fontSize: '13px',
            fontWeight: 'bold',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            opacity: 0.7,
          }}
          onClick={() => router.push('/quotation-data-box/registration-confirm')}
        >
          見積登録（購入）
        </div>
        <div
          style={{
            padding: '10px 20px',
            background: '#A35414',
            color: 'white',
            fontSize: '13px',
            fontWeight: 'bold',
            borderRadius: '4px 4px 0 0',
            marginLeft: '2px',
          }}
        >
          発注処理
        </div>
      </div>

      {/* プログレスバー */}
      <StepProgressBar
        currentStep={6}
        steps={ORDER_PROGRESS_STEPS}
        activeColor="#A35414"
      />

      {/* ページ全体スクロール */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {!rfqGroup ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
            対象の見積依頼グループが見つかりません
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* Internal Step 1: 発注登録フォーム（FB2枚目）                    */}
            {/* ============================================================ */}
            {internalStep === 1 && (
              <>
                {/* ヘッダー情報 */}
                <div style={{ display: 'flex', marginBottom: '16px', border: '1px solid #E1E1E1', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px solid #E1E1E1' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>見積依頼No.</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A' }}>{rfqGroup.rfqNo}</div>
                  </div>
                  <div style={{ flex: 2, padding: '10px 14px', borderRight: '1px solid #E1E1E1' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>見積グループ名称</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A' }}>{rfqGroup.groupName}</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px 14px' }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>発注先</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A' }}>{rfqGroup.vendorName || '-'}</div>
                  </div>
                </div>

                {/* フォームテーブル + プレビューボタン */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <table style={{ flex: 1, borderCollapse: 'collapse', border: '1px solid #008C1D' }}>
                    <tbody>
                      {/* 申請者 */}
                      <tr>
                        <th style={thStyle}>申請者</th>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ padding: '6px 12px', background: '#FAFAFA', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px', color: '#4A4A4A' }}>
                              {rfqGroup.email || user?.email || 'user@company.com'}
                            </span>
                            <span style={{ fontSize: '13px', color: '#4A4A4A' }}>
                              {rfqGroup.personInCharge || user?.username || 'user'}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* 検収書の発行 */}
                      <tr>
                        <th style={thStyle}>検収書の発行</th>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                              <input type="radio" name="inspectionCert" checked={inspectionCertType === '本体のみ'} onChange={() => setInspectionCertType('本体のみ')} />
                              本体のみ
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                              <input type="radio" name="inspectionCert" checked={inspectionCertType === '付属品含む'} onChange={() => setInspectionCertType('付属品含む')} />
                              付属品を含む
                            </label>
                          </div>
                        </td>
                      </tr>
                      {/* 納品日 */}
                      <tr>
                        <th style={{ ...thStyle, background: '#A35414', border: '1px solid #A35414' }}>納品日</th>
                        <td style={tdStyle}>
                          <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={inputStyle} />
                        </td>
                      </tr>
                      {/* 添付ファイル */}
                      <tr>
                        <th style={thStyle}>添付ファイル</th>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ padding: '6px 16px', background: '#FAFAFA', border: '1px solid #E1E1E1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              ファイルの選択
                              <input type="file" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                            <span style={{ color: '#666', fontSize: '13px' }}>{fileName || 'ファイルが選択されていません'}</span>
                          </div>
                        </td>
                      </tr>
                      {/* 保存形式 */}
                      <tr>
                        <th style={thStyleTop}>保存形式</th>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(['electronic', 'scanner', 'unspecified'] as SaveFormatValue[]).map((val) => (
                              <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                <input type="radio" name="saveFormat" checked={saveFormat === val} onChange={() => setSaveFormat(val)} />
                                {SAVE_FORMAT_MAP[val]}
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* プレビュー⇒出力 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '160px' }}>
                    <button
                      onClick={() => alert('プレビューを出力します（実装予定）')}
                      style={{ padding: '14px 20px', background: 'white', color: '#4A4A4A', border: '2px solid #4A4A4A', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap' }}
                    >
                      プレビュー⇒出力
                    </button>
                  </div>
                </div>

                {/* フッターボタン */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px' }}>
                  <button onClick={handleBackToList} style={{ padding: '10px 20px', background: '#8A8A8A', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    キャンセル
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => alert('SHIPへ依頼処理（実装予定）')} style={{ padding: '10px 20px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                      SHIPへ依頼
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <label style={{ fontSize: '12px', color: '#555' }}>登録期限:</label>
                      <input type="date" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <button onClick={() => alert('Excel取込処理（実装予定）')} style={{ padding: '10px 20px', background: '#0092E6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    Excel取込
                  </button>
                  <button onClick={handleGoToStep2} style={{ padding: '10px 20px', background: '#A35414', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    登録へ
                  </button>
                </div>
              </>
            )}

            {/* ============================================================ */}
            {/* Internal Step 2: 発注基本登録（FB1枚目）                       */}
            {/* ============================================================ */}
            {internalStep === 2 && (
              <>
                {/* 発注書出力ボタン（右上） */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button
                    onClick={() => alert('発注書テンプレートを出力します（実装予定）')}
                    style={{ padding: '10px 24px', background: '#A35414', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                  >
                    発注書出力
                  </button>
                </div>

                {/* 確認メッセージ */}
                <div style={{
                  padding: '12px 16px',
                  background: '#FDF1E5',
                  border: '1px solid #A66F1B',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: '#A35414',
                  fontWeight: 'bold'
                }}>
                  下記の内容で発注Databaseへ登録を実施します。
                </div>

                {/* 基本情報サマリー（Step1入力値の表示） */}
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
                          <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', border: '1px solid #E1E1E1' }}>検収書</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1' }}>{inspectionCertType}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', border: '1px solid #E1E1E1' }}>保存形式</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1' }}>{SAVE_FORMAT_MAP[saveFormat]}</td>
                          <td style={{ padding: '4px 8px', background: '#FAFAFA', fontWeight: 'bold', border: '1px solid #E1E1E1' }}>納品日</td>
                          <td style={{ padding: '4px 8px', border: '1px solid #E1E1E1' }}>{deliveryDate || '未設定'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 発注基本登録 セクション */}
                <div style={{ border: '2px solid #A35414', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ background: '#A35414', color: 'white', padding: '8px 14px', fontSize: '14px', fontWeight: 'bold' }}>
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

                {/* 管理情報欄 */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 14px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '16px', border: '1px solid #E1E1E1' }}>
                  <span style={{ fontSize: '13px', color: '#555', marginRight: '8px' }}>合計金額（税込）:</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#4A4A4A' }}>
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* 品目テーブル */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  {/* 左注釈 */}
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A4A4A', marginBottom: '6px' }}>■納入期限</div>
                    <div style={{ fontSize: '11px', color: '#DA0000', lineHeight: '1.6' }}>
                      発注時に支払い条件と納期は確定
                    </div>
                  </div>

                  {/* テーブル */}
                  <div style={{ flex: 1, border: '1px solid #E1E1E1', borderRadius: '4px', overflow: 'auto', maxHeight: '320px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#008C1D', color: 'white', position: 'sticky', top: 0 }}>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>No</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>品名</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>メーカー</th>
                          <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>型式</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>数量</th>
                          <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>金額（税込）</th>
                          <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #3d5a80', whiteSpace: 'nowrap', fontWeight: 'bold' }}>個別納品日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {targetQuotationItems.map((item, idx) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
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
                        {targetQuotationItems.length === 0 && (
                          <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#8A8A8A' }}>対象の見積明細がありません</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* フッターボタン */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                  <button
                    onClick={() => setInternalStep(1)}
                    style={{
                      padding: '12px 28px',
                      background: '#8A8A8A',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    ← 一覧画面に戻る
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    style={{
                      padding: '12px 28px',
                      background: '#008C1D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    発注情報Databaseに登録
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
