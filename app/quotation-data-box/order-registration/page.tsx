'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { OrderType, PaymentMethod } from '@/lib/types/order';
import { OrderPreviewModal, OrderPreviewData } from '@/components/modals/OrderPreviewModal';

const ORDER_TYPES: OrderType[] = [
  '購入',
  '割賦',
  'リース（オペレーティング）',
  'リース（ファイナンス）',
];

const PAYMENT_METHODS: PaymentMethod[] = ['でんさい', '銀行振込', 'クレジット', '現金'];

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
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { addOrderGroup, addOrderItems, generateOrderNo } = useOrderStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const handleRfqGroupIdRead = useCallback((id: number | null) => setRfqGroupId(id), []);

  const [inHouseSettlementNo, setInHouseSettlementNo] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('購入');
  const [deliveryDeadline, setDeliveryDeadline] = useState('');
  const [paymentClosingDate, setPaymentClosingDate] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [paymentSiteDays, setPaymentSiteDays] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [comment, setComment] = useState('');

  const [deliveryDateError, setDeliveryDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<OrderPreviewData | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState<{
    orderNo: string;
    itemCount: number;
    totalAmount: number;
    orderGroupId: number;
  } | null>(null);
  const [showOrderPreview, setShowOrderPreview] = useState(false);

  const isLeaseType = orderType === 'リース（ファイナンス）' || orderType === 'リース（オペレーティング）';

  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return rfqGroups.find(g => g.id === rfqGroupId);
  }, [rfqGroupId, rfqGroups]);

  const targetQuotationItems = useMemo(() => {
    if (!rfqGroup) return [];
    const targetGroups = quotationGroups.filter(qg =>
      qg.rfqGroupId === rfqGroup.id || qg.rfqNo === rfqGroup.rfqNo
    );
    return quotationItems.filter(qi =>
      targetGroups.some(qg => qg.id === qi.quotationGroupId)
    );
  }, [rfqGroup, quotationGroups, quotationItems]);

  const sampleItems = useMemo(() => [
    { _expandKey: 'sample-1', itemName: '超音波診断装置 EPIQ Elite', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'EPIQ Elite 7500', originalModel: '', allocPriceUnit: 32000000 },
    { _expandKey: 'sample-2', itemName: '超音波プローブ S5-1', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'S5-1 PureWave', originalModel: '', allocPriceUnit: 2200000 },
    { _expandKey: 'sample-3', itemName: '超音波プローブ S5-1', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'S5-1 PureWave', originalModel: '', allocPriceUnit: 2200000 },
    { _expandKey: 'sample-4', itemName: '超音波プローブ C5-1', originalItemName: '', manufacturer: 'フィリップス・ジャパン', originalManufacturer: '', model: 'C5-1 PureWave', originalModel: '', allocPriceUnit: 2200000 },
    { _expandKey: 'sample-5', itemName: '設置・据付工事費', originalItemName: '', manufacturer: '-', originalManufacturer: '', model: '-', originalModel: '', allocPriceUnit: 4000000 },
  ], []);

  const expandedItems = useMemo(() => {
    const storeItems = targetQuotationItems.flatMap(qi => {
      const qty = qi.aiQuantity || qi.originalQuantity || 1;
      return Array.from({ length: qty }, (_, i) => ({ ...qi, _expandKey: `${qi.id}-${i}` }));
    });
    return storeItems.length > 0 ? storeItems : sampleItems;
  }, [targetQuotationItems, sampleItems]);

  const totalAmount = useMemo(() => {
    if (targetQuotationItems.length > 0) {
      return targetQuotationItems.reduce((sum, item) => sum + (item.allocTaxTotal || 0), 0);
    }
    return sampleItems.reduce((sum, item) => sum + (item.allocPriceUnit || 0), 0);
  }, [targetQuotationItems, sampleItems]);

  const handleShowPreview = () => {
    if (!rfqGroup) return;
    if (!deliveryDeadline) {
      setDeliveryDateError('納期を設定してください');
      return;
    }
    setDeliveryDateError('');

    const orderNo = generateOrderNo();
    const today = new Date().toISOString().split('T')[0];
    const previewItems = expandedItems.map((item) => ({
      itemName: (item.itemName || item.originalItemName || '') as string,
      manufacturer: (item.manufacturer || item.originalManufacturer || '-') as string,
      model: (item.model || item.originalModel || '-') as string,
      quantity: 1,
      unitPrice: (item.allocPriceUnit || 0) as number,
      totalPrice: (item.allocPriceUnit || 0) as number,
    }));

    setPreviewData({
      orderNo,
      orderDate: today,
      vendorName: rfqGroup.vendorName || '',
      applicant: rfqGroup.personInCharge || '',
      applicantEmail: rfqGroup.email || '',
      orderType,
      deliveryDate: deliveryDeadline,
      paymentClosingDate: paymentClosingDate || undefined,
      paymentDate: paymentDate || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentSiteDays: paymentSiteDays ? Number(paymentSiteDays) : undefined,
      leaseStartDate: isLeaseType ? leaseStartDate || undefined : undefined,
      leaseEndDate: isLeaseType ? leaseEndDate || undefined : undefined,
      comment: comment || undefined,
      totalAmount,
      items: previewItems,
    });
    setShowPreview(true);
  };

  const handleRegisterFromPreview = () => {
    if (!rfqGroup || !previewData) return;
    setIsSubmitting(true);

    const orderGroupId = addOrderGroup({
      orderNo: previewData.orderNo,
      rfqGroupId: rfqGroup.id,
      rfqNo: rfqGroup.rfqNo,
      groupName: rfqGroup.groupName,
      vendorName: previewData.vendorName,
      applicant: previewData.applicant,
      applicantEmail: previewData.applicantEmail,
      inHouseSettlementNo: inHouseSettlementNo || undefined,
      orderType,
      deliveryDate: deliveryDeadline,
      paymentTerms: 'その他',
      paymentDueDate: paymentClosingDate || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentSiteDays: paymentSiteDays ? Number(paymentSiteDays) : undefined,
      leaseStartDate: isLeaseType ? leaseStartDate || undefined : undefined,
      leaseEndDate: isLeaseType ? leaseEndDate || undefined : undefined,
      comment: comment || undefined,
      inspectionCertType: '本体のみ',
      storageFormat: '未指定',
      totalAmount,
      orderDate: previewData.orderDate,
    });

    const orderItems = targetQuotationItems.length > 0
      ? targetQuotationItems.flatMap(qi => {
          const qty = qi.aiQuantity || qi.originalQuantity || 1;
          const unitPrice = qi.allocPriceUnit || 0;
          const itemBase = {
            orderGroupId,
            quotationItemId: qi.id,
            itemName: qi.itemName || qi.originalItemName,
            manufacturer: qi.manufacturer || qi.originalManufacturer || '',
            model: qi.model || qi.originalModel || '',
            registrationType: '本体' as const,
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice,
          };
          return Array.from({ length: qty }, () => ({ ...itemBase }));
        })
      : previewData.items.map((item) => ({
          orderGroupId,
          quotationItemId: 0,
          itemName: item.itemName,
          manufacturer: item.manufacturer,
          model: item.model,
          registrationType: '本体' as const,
          quantity: 1,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }));
    addOrderItems(orderItems);

    updateRfqGroup(rfqGroup.id, {
      status: '発注済',
      deliveryDeadline: deliveryDeadline,
    });

    setShowPreview(false);
    setRegistrationComplete({
      orderNo: previewData.orderNo,
      itemCount: expandedItems.length,
      totalAmount,
      orderGroupId,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={handleRfqGroupIdRead} />
      </Suspense>

      <Header
        title={registrationComplete ? '発注登録完了' : '発注登録'}
        hideMenu={true}
        showBackButton={false}
      />

      <div className="flex-1 overflow-auto p-6">
        {registrationComplete ? (
          <CompletionView
            orderNo={registrationComplete.orderNo}
            itemCount={registrationComplete.itemCount}
            totalAmount={registrationComplete.totalAmount}
            onPrint={() => setShowOrderPreview(true)}
            onMail={() => alert('mail送付機能は今後実装予定です')}
            onBack={() => router.push('/quotation-data-box')}
          />
        ) : !rfqGroup ? (
          <NotFoundView onBack={() => router.push('/quotation-data-box')} />
        ) : (
          <div className="flex flex-col gap-6">
            <InfoBanner>下記の内容で発注登録を実施します。</InfoBanner>

            <BasicInfoCard
              rfqNo={rfqGroup.rfqNo}
              groupName={rfqGroup.groupName}
              vendorName={rfqGroup.vendorName}
              personInCharge={rfqGroup.personInCharge}
              tel={rfqGroup.tel}
              email={rfqGroup.email}
            />

            <OrderForm
              inHouseSettlementNo={inHouseSettlementNo}
              setInHouseSettlementNo={setInHouseSettlementNo}
              orderType={orderType}
              setOrderType={setOrderType}
              deliveryDeadline={deliveryDeadline}
              setDeliveryDeadline={(v) => {
                setDeliveryDeadline(v);
                if (v) setDeliveryDateError('');
              }}
              deliveryDateError={deliveryDateError}
              isLeaseType={isLeaseType}
              leaseStartDate={leaseStartDate}
              setLeaseStartDate={setLeaseStartDate}
              leaseEndDate={leaseEndDate}
              setLeaseEndDate={setLeaseEndDate}
              paymentClosingDate={paymentClosingDate}
              setPaymentClosingDate={setPaymentClosingDate}
              paymentDate={paymentDate}
              setPaymentDate={setPaymentDate}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              paymentSiteDays={paymentSiteDays}
              setPaymentSiteDays={setPaymentSiteDays}
            />

            <OrderItemsTable
              items={expandedItems}
              totalAmount={totalAmount}
              onBack={() => router.push('/quotation-data-box')}
            />

            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                onClick={() => router.push('/quotation-data-box')}
                className="h-12 min-w-[180px] px-6 rounded-lg bg-[#d6d6d6] text-content-primary text-base font-normal cursor-pointer transition-colors hover:bg-stroke-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content-sub"
              >
                戻る
              </button>
              <button
                onClick={handleShowPreview}
                disabled={isSubmitting}
                className="h-12 min-w-[200px] px-6 rounded-lg bg-surface-card border border-cta-primary text-cta-primary-dark text-base font-medium cursor-pointer transition-colors hover:bg-surface-select disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
              >
                発注書プレビュー
              </button>
            </div>
          </div>
        )}
      </div>

      {previewData && (
        <OrderPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          previewData={previewData}
          onRegister={handleRegisterFromPreview}
        />
      )}
      {registrationComplete && (
        <OrderPreviewModal
          isOpen={showOrderPreview}
          onClose={() => setShowOrderPreview(false)}
          orderGroupId={registrationComplete.orderGroupId}
        />
      )}
    </div>
  );
}

// ============================================================
// Completion view
// ============================================================
function CompletionView({
  orderNo,
  itemCount,
  totalAmount,
  onPrint,
  onMail,
  onBack,
}: {
  orderNo: string;
  itemCount: number;
  totalAmount: number;
  onPrint: () => void;
  onMail: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[560px] mx-auto mt-10 text-center">
      <div className="bg-surface-card border border-stroke-card rounded-2xl p-8">
        <div className="mb-4 flex justify-center text-cta-primary"><Check size={48} strokeWidth={2.5} aria-hidden /></div>
        <h2 className="text-lg font-bold text-content-primary mb-2 text-balance">
          発注を登録しました
        </h2>
        <p className="text-sm text-content-sub mb-6 tabular-nums">
          発注No. {orderNo}（{itemCount}品目 / ¥{totalAmount.toLocaleString()}）
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onPrint}
            className="h-12 w-[260px] px-6 rounded-lg bg-cta-primary text-white text-base font-medium cursor-pointer transition-colors hover:bg-cta-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
          >
            印刷する
          </button>
          <button
            onClick={onMail}
            className="h-12 w-[260px] px-6 rounded-lg bg-surface-card border border-cta-primary text-cta-primary-dark text-base font-medium cursor-pointer transition-colors hover:bg-surface-select focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
          >
            mail送付
          </button>
          <button
            onClick={onBack}
            className="h-12 w-[260px] px-6 text-sm text-content-sub underline cursor-pointer hover:text-content-primary transition-colors bg-transparent border-0"
          >
            一覧画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}

function NotFoundView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[480px] mx-auto mt-10 text-center">
      <div className="bg-surface-card border border-stroke-card rounded-2xl p-8">
        <p className="text-sm font-bold text-content-primary mb-2">
          対象の見積依頼グループが見つかりません
        </p>
        <p className="text-xs text-content-sub mb-6 text-pretty">
          URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。
        </p>
        <button
          onClick={onBack}
          className="h-12 px-6 rounded-lg bg-cta-primary text-white text-base font-medium cursor-pointer transition-colors hover:bg-cta-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
        >
          一覧画面に戻る
        </button>
      </div>
    </div>
  );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 rounded-lg bg-surface-select border border-cta-primary text-sm text-cta-primary-dark text-pretty">
      {children}
    </div>
  );
}

// ============================================================
// Basic info card
// ============================================================
function BasicInfoCard({
  rfqNo,
  groupName,
  vendorName,
  personInCharge,
  tel,
  email,
}: {
  rfqNo: string;
  groupName: string;
  vendorName?: string;
  personInCharge?: string;
  tel?: string;
  email?: string;
}) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4">
      <div className="border border-stroke-input">
        <InfoRow>
          <InfoCell label="見積依頼No." value={rfqNo} />
          <InfoCell label="見積G名称" value={groupName} />
        </InfoRow>
        <InfoRow>
          <InfoCell label="発注先" value={vendorName || '---'} />
          <InfoCell label="担当" value={personInCharge || '---'} />
        </InfoRow>
        <InfoRow last>
          <InfoCell label="連絡先(TEL)" value={tel || '---'} numeric />
          <InfoCell label="mail" value={email || '---'} />
        </InfoRow>
      </div>
    </section>
  );
}

function InfoRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex w-full ${last ? '' : 'border-b border-stroke-input'}`}>
      {children}
    </div>
  );
}

function InfoCell({
  label,
  value,
  numeric,
}: {
  label: string;
  value: string;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-stretch flex-1 min-w-0">
      <div className="w-[200px] shrink-0 flex items-center justify-center px-4 py-4 bg-stroke-card border-r border-stroke-input">
        <p className="text-base text-content-primary whitespace-nowrap">{label}</p>
      </div>
      <div className="flex-1 min-w-0 flex items-center px-4 py-4 border-r border-stroke-input last:border-r-0">
        <p className={`min-w-0 truncate text-base text-content-primary ${numeric ? 'tabular-nums' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Order form
// ============================================================
type OrderFormProps = {
  inHouseSettlementNo: string;
  setInHouseSettlementNo: (v: string) => void;
  orderType: OrderType;
  setOrderType: (v: OrderType) => void;
  deliveryDeadline: string;
  setDeliveryDeadline: (v: string) => void;
  deliveryDateError: string;
  isLeaseType: boolean;
  leaseStartDate: string;
  setLeaseStartDate: (v: string) => void;
  leaseEndDate: string;
  setLeaseEndDate: (v: string) => void;
  paymentClosingDate: string;
  setPaymentClosingDate: (v: string) => void;
  paymentDate: string;
  setPaymentDate: (v: string) => void;
  paymentMethod: PaymentMethod | '';
  setPaymentMethod: (v: PaymentMethod | '') => void;
  paymentSiteDays: string;
  setPaymentSiteDays: (v: string) => void;
};

function OrderForm(p: OrderFormProps) {
  const inputBase =
    'h-[42px] px-3 rounded-lg bg-surface-card border border-stroke-input text-base text-content-primary focus:outline-none focus:border-cta-primary transition-colors';
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-6">
      <h2 className="text-base font-semibold text-content-primary mb-4">発注基本登録</h2>

      <div className="flex flex-col gap-4">
        {/* 1行目 */}
        <div className="flex items-start gap-6 flex-wrap">
          <Field label="院内決済No.">
            <input
              type="text"
              value={p.inHouseSettlementNo}
              onChange={(e) => p.setInHouseSettlementNo(e.target.value)}
              className={`${inputBase} w-[180px]`}
            />
          </Field>
          <Field label="発注形態">
            <select
              value={p.orderType}
              onChange={(e) => p.setOrderType(e.target.value as OrderType)}
              className={`${inputBase} w-[240px]`}
            >
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field
            label={
              <>
                納期 <span className="text-content-alert">*</span>
              </>
            }
            error={p.deliveryDateError}
          >
            <input
              type="date"
              value={p.deliveryDeadline}
              onChange={(e) => p.setDeliveryDeadline(e.target.value)}
              className={`${inputBase} w-[180px] tabular-nums ${p.deliveryDateError ? 'border-content-alert' : ''}`}
            />
          </Field>
        </div>

        {/* リース */}
        {p.isLeaseType ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-stroke-input bg-surface-screen">
            <span className="text-sm font-semibold text-content-primary whitespace-nowrap">リース</span>
            <label className="text-sm text-content-sub whitespace-nowrap">開始日</label>
            <input
              type="date"
              value={p.leaseStartDate}
              onChange={(e) => p.setLeaseStartDate(e.target.value)}
              className={`${inputBase} w-[170px] tabular-nums`}
            />
            <label className="text-sm text-content-sub whitespace-nowrap">終了日</label>
            <input
              type="date"
              value={p.leaseEndDate}
              onChange={(e) => p.setLeaseEndDate(e.target.value)}
              className={`${inputBase} w-[170px] tabular-nums`}
            />
          </div>
        ) : (
          <div className="px-4 py-3 rounded-lg border border-stroke-input bg-stroke-card text-sm text-content-sub">
            リースの場合：開始日・終了日
          </div>
        )}

        {/* 2行目 */}
        <div className="flex items-start gap-6 flex-wrap">
          <Field label="支払条件">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={p.paymentClosingDate}
                onChange={(e) => p.setPaymentClosingDate(e.target.value)}
                className={`${inputBase} w-[170px] tabular-nums`}
              />
              <span className="text-sm text-content-primary">締め</span>
              <input
                type="date"
                value={p.paymentDate}
                onChange={(e) => p.setPaymentDate(e.target.value)}
                className={`${inputBase} w-[170px] tabular-nums`}
              />
              <span className="text-sm text-content-primary">支払</span>
            </div>
          </Field>
          <Field label="支払方法">
            <select
              value={p.paymentMethod}
              onChange={(e) => p.setPaymentMethod(e.target.value as PaymentMethod)}
              className={`${inputBase} w-[160px]`}
            >
              <option value="">選択してください</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="支払期日">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={p.paymentSiteDays}
                onChange={(e) => p.setPaymentSiteDays(e.target.value)}
                className={`${inputBase} w-[80px] text-center tabular-nums`}
              />
              <span className="text-sm text-content-primary">日サイト</span>
            </div>
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-content-primary whitespace-nowrap">
        {label}
      </label>
      <div>{children}</div>
      {error && <p className="text-xs text-content-alert">{error}</p>}
    </div>
  );
}

// ============================================================
// Order items table
// ============================================================
type ExpandedItem = {
  _expandKey: string;
  itemName?: string;
  originalItemName?: string;
  manufacturer?: string;
  originalManufacturer?: string;
  model?: string;
  originalModel?: string;
  allocPriceUnit?: number;
};

function OrderItemsTable({
  items,
  totalAmount,
  onBack,
}: {
  items: ExpandedItem[];
  totalAmount: number;
  onBack: () => void;
}) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4 flex flex-col gap-3">
      {/* タイトル + 合計 */}
      <div className="border border-stroke-input flex">
        <div className="bg-surface-select px-4 py-4 flex items-center">
          <p className="text-base text-content-primary whitespace-nowrap">発注明細（登録済み見積明細より自動取得）</p>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-end px-4 py-4 gap-2">
          <p className="text-content-primary leading-tight">
            <span className="text-base font-semibold">合計金額</span>
            <span className="text-xs font-semibold">（税込）</span>
          </p>
          <div className="bg-surface-card border border-stroke-input rounded-lg h-[42px] flex items-center px-3 min-w-[180px]">
            <p className="flex-1 text-lg font-semibold text-content-alert tabular-nums text-right">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="border border-stroke-input overflow-x-auto">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-stroke-card border-b border-stroke-input text-left">
              <th className="w-[56px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input text-center">No.</th>
              <th className="px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">品名</th>
              <th className="w-[200px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">メーカー</th>
              <th className="w-[160px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">型式</th>
              <th className="w-[80px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input text-right">数量</th>
              <th className="w-[160px] px-4 py-2 text-sm font-normal text-content-primary text-right">金額（税込）</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item._expandKey} className="border-b border-stroke-input h-[58px]">
                <td className="px-4 py-2 text-base text-content-primary border-r border-stroke-input text-center tabular-nums">{idx + 1}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input truncate max-w-[300px]">{item.itemName || item.originalItemName}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input truncate">{item.manufacturer || item.originalManufacturer || '---'}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input truncate">{item.model || item.originalModel || '---'}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input text-right tabular-nums font-semibold">1</td>
                <td className="px-4 py-2 text-sm text-content-primary text-right tabular-nums font-semibold">¥{(item.allocPriceUnit || 0).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-content-sub">
                  <p className="text-sm font-semibold text-content-primary mb-2 text-balance">発注対象の見積明細がありません</p>
                  <p className="text-xs mb-4 text-pretty">見積登録を完了すると、明細が自動的に表示されます。</p>
                  <button
                    onClick={onBack}
                    className="h-10 px-4 rounded-lg bg-cta-primary text-white text-sm font-medium cursor-pointer transition-colors hover:bg-cta-primary-dark"
                  >
                    一覧画面に戻る
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
