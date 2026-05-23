'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { InspectionCertType } from '@/lib/types/order';
import { InspectionCertPreviewModal } from '@/components/modals/InspectionCertPreviewModal';

/** 検収書の発行: 内部値 → 表示ラベル */
const CERT_TYPE_LABELS: Record<InspectionCertType, string> = {
  '本体のみ': '資産登録単位',
  '付属品含む': '附属品を含む',
};

function RfqGroupIdReader({ onRead }: { onRead: (id: number | null) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null);
  }, [rfqGroupIdParam, onRead]);
  return null;
}

export default function InspectionRegistrationPage() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { getOrderGroupByRfqGroupId, getOrderItemsByGroupId, updateOrderGroup } = useOrderStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const handleRfqGroupIdRead = useCallback((id: number | null) => setRfqGroupId(id), []);

  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCertType, setInspectionCertType] = useState<InspectionCertType>('本体のみ');
  const [itemDeliveryDates, setItemDeliveryDates] = useState<Record<number, string>>({});

  const [inspectionDateError, setInspectionDateError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registrationComplete, setRegistrationComplete] = useState<{
    itemCount: number;
    totalAmount: number;
    orderGroupId: number;
    inspectionDate: string;
    inspectionCertType: InspectionCertType;
  } | null>(null);
  const [showCertPreview, setShowCertPreview] = useState(false);

  const rfqGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return rfqGroups.find(g => g.id === rfqGroupId);
  }, [rfqGroupId, rfqGroups]);

  const orderGroup = useMemo(() => {
    if (!rfqGroupId) return undefined;
    return getOrderGroupByRfqGroupId(rfqGroupId);
  }, [rfqGroupId, getOrderGroupByRfqGroupId]);

  const orderItems = useMemo(() => {
    if (!orderGroup) return [];
    return getOrderItemsByGroupId(orderGroup.id);
  }, [orderGroup, getOrderItemsByGroupId]);

  const totalAmount = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [orderItems]);

  const handleSubmitInspection = () => {
    if (!rfqGroup || !orderGroup) return;
    if (!inspectionDate) {
      setInspectionDateError('検収日を設定してください');
      return;
    }
    setInspectionDateError('');
    setIsSubmitting(true);

    updateOrderGroup(orderGroup.id, {
      inspectionDate,
      inspectionCertType,
    });
    updateRfqGroup(rfqGroupId!, {
      status: '検収済',
      inspectionDate,
    });

    setRegistrationComplete({
      itemCount: orderItems.length,
      totalAmount,
      orderGroupId: orderGroup.id,
      inspectionDate,
      inspectionCertType,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={handleRfqGroupIdRead} />
      </Suspense>

      <Header
        title={registrationComplete ? '納品検収日登録完了' : '納品日登録（検収準備）'}
        hideMenu={true}
        showBackButton={false}
      />

      <div className="flex-1 overflow-auto p-6">
        {registrationComplete ? (
          <CompletionView
            itemCount={registrationComplete.itemCount}
            inspectionDate={registrationComplete.inspectionDate}
            onCertOutput={() => setShowCertPreview(true)}
            onQrIssue={() => router.push('/qr-issue?from=inspection')}
            onBack={() => router.push('/quotation-data-box')}
          />
        ) : !rfqGroup || !orderGroup ? (
          <NotFoundView onBack={() => router.push('/quotation-data-box')} />
        ) : (
          <div className="flex flex-col gap-6">
            <InfoBanner>
              検収日を入力し「納品検収日を登録」を押してください。
            </InfoBanner>

            <BasicInfoCard
              rfqNo={rfqGroup.rfqNo}
              groupName={rfqGroup.groupName}
              vendorName={orderGroup.vendorName}
              applicant={orderGroup.applicant}
              deadline={rfqGroup.deadline}
            />

            <InspectionForm
              inspectionDate={inspectionDate}
              inspectionDateError={inspectionDateError}
              onInspectionDateChange={(v) => {
                setInspectionDate(v);
                if (v) setInspectionDateError('');
              }}
              inspectionCertType={inspectionCertType}
              onInspectionCertTypeChange={setInspectionCertType}
            />

            <OrderItemsTable
              orderItems={orderItems}
              itemDeliveryDates={itemDeliveryDates}
              onChangeDeliveryDate={(id, v) =>
                setItemDeliveryDates(prev => ({ ...prev, [id]: v }))
              }
            />

            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                onClick={() => router.push('/quotation-data-box')}
                className="h-12 min-w-[180px] px-6 rounded-lg bg-[#d6d6d6] text-content-primary text-base font-normal cursor-pointer transition-colors hover:bg-stroke-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content-sub"
              >
                戻る
              </button>
              <button
                onClick={handleSubmitInspection}
                disabled={isSubmitting}
                className="h-12 min-w-[200px] px-6 rounded-lg bg-surface-card border border-cta-primary text-cta-primary-dark text-base font-medium cursor-pointer transition-colors hover:bg-surface-select disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
              >
                {isSubmitting ? '登録中...' : '納品検収日を登録'}
              </button>
            </div>
          </div>
        )}
      </div>

      {registrationComplete && (
        <InspectionCertPreviewModal
          isOpen={showCertPreview}
          onClose={() => setShowCertPreview(false)}
          orderGroupId={registrationComplete.orderGroupId}
          inspectionCertType={registrationComplete.inspectionCertType}
        />
      )}
    </div>
  );
}

// ============================================================
// Sub views
// ============================================================
function CompletionView({
  itemCount,
  inspectionDate,
  onCertOutput,
  onQrIssue,
  onBack,
}: {
  itemCount: number;
  inspectionDate: string;
  onCertOutput: () => void;
  onQrIssue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[560px] mx-auto mt-10 text-center">
      <div className="bg-surface-card border border-stroke-card rounded-2xl p-8">
        <div className="mb-4 flex justify-center text-cta-primary"><Check size={48} strokeWidth={2.5} aria-hidden /></div>
        <h2 className="text-lg font-bold text-content-primary mb-2 text-balance">
          納品検収日を登録しました
        </h2>
        <p className="text-sm text-content-sub mb-6 text-pretty tabular-nums">
          {itemCount}品目
          <br />
          検収日: {inspectionDate}
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onCertOutput}
            className="h-12 w-[260px] px-6 rounded-lg bg-cta-primary text-white text-base font-medium cursor-pointer transition-colors hover:bg-cta-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
          >
            検収書をExcel出力する
          </button>
          <button
            onClick={onQrIssue}
            className="h-12 w-[260px] px-6 rounded-lg bg-surface-card border border-cta-primary text-cta-primary-dark text-base font-medium cursor-pointer transition-colors hover:bg-surface-select focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
          >
            QRラベルを発行する
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
          対象の発注データが見つかりません
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
  applicant,
  deadline,
}: {
  rfqNo: string;
  groupName: string;
  vendorName?: string;
  applicant?: string;
  deadline?: string;
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
          <InfoCell label="申請者" value={applicant || '---'} />
        </InfoRow>
        <InfoRow last>
          <InfoCell label="納品日" value={deadline || '---'} wide numeric />
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
  wide,
  numeric,
}: {
  label: string;
  value: string;
  wide?: boolean;
  numeric?: boolean;
}) {
  return (
    <div className={`flex items-stretch ${wide ? 'w-full' : 'flex-1 min-w-0'}`}>
      <div className="w-[200px] shrink-0 flex items-center justify-center px-4 py-4 bg-stroke-card border-r border-stroke-input">
        <p className="text-base text-content-primary whitespace-nowrap">{label}</p>
      </div>
      <div className={`flex-1 min-w-0 flex items-center px-4 py-4 ${wide ? '' : 'border-r border-stroke-input last:border-r-0'}`}>
        <p className={`min-w-0 truncate text-base text-content-primary ${numeric ? 'tabular-nums' : ''}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Inspection form
// ============================================================
function InspectionForm({
  inspectionDate,
  inspectionDateError,
  onInspectionDateChange,
  inspectionCertType,
  onInspectionCertTypeChange,
}: {
  inspectionDate: string;
  inspectionDateError: string;
  onInspectionDateChange: (value: string) => void;
  inspectionCertType: InspectionCertType;
  onInspectionCertTypeChange: (value: InspectionCertType) => void;
}) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4">
      <div className="border border-stroke-input">
        {/* 検収日 */}
        <div className="flex w-full border-b border-stroke-input">
          <div className="w-[200px] shrink-0 flex items-center justify-center px-4 py-4 bg-stroke-card border-r border-stroke-input">
            <p className="text-base text-content-primary whitespace-nowrap">
              検収日 <span className="text-content-alert">*</span>
            </p>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center px-4 py-4 gap-1">
            <input
              type="date"
              value={inspectionDate}
              onChange={(e) => onInspectionDateChange(e.target.value)}
              className={`w-[180px] h-[42px] px-3 rounded-lg bg-surface-card border text-base text-content-primary tabular-nums focus:outline-none focus:border-cta-primary transition-colors ${
                inspectionDateError ? 'border-content-alert' : 'border-stroke-input'
              }`}
            />
            {inspectionDateError && (
              <p className="text-xs text-content-alert">{inspectionDateError}</p>
            )}
          </div>
        </div>
        {/* 検収書の発行 */}
        <div className="flex w-full">
          <div className="w-[200px] shrink-0 flex items-center justify-center px-4 py-4 bg-stroke-card border-r border-stroke-input">
            <p className="text-base text-content-primary whitespace-nowrap">検収書の発行</p>
          </div>
          <div className="flex-1 min-w-0 flex items-center px-4 py-4 gap-8">
            {(['本体のみ', '付属品含む'] as InspectionCertType[]).map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 text-base text-content-primary cursor-pointer select-none"
              >
                <input
                  type="radio"
                  name="inspectionCertType"
                  checked={inspectionCertType === type}
                  onChange={() => onInspectionCertTypeChange(type)}
                  className="w-4 h-4 cursor-pointer accent-cta-primary"
                />
                {CERT_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Order items table
// ============================================================
type OrderItemLite = {
  id: number;
  itemName: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
};

function OrderItemsTable({
  orderItems,
  itemDeliveryDates,
  onChangeDeliveryDate,
}: {
  orderItems: OrderItemLite[];
  itemDeliveryDates: Record<number, string>;
  onChangeDeliveryDate: (id: number, value: string) => void;
}) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4">
      <h2 className="text-base font-semibold text-content-primary mb-3">発注明細</h2>
      <div className="border border-stroke-input overflow-x-auto">
        <table className="w-full border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-stroke-card border-b border-stroke-input text-left">
              <th className="w-[56px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input text-center">No.</th>
              <th className="w-[130px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">部門</th>
              <th className="w-[130px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">部署</th>
              <th className="w-[130px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">室名</th>
              <th className="w-[280px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">品名</th>
              <th className="w-[260px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">メーカー</th>
              <th className="w-[180px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input">型式</th>
              <th className="w-[80px] px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input text-right">数量</th>
              <th className="w-[200px] px-4 py-2 text-sm font-normal text-content-primary bg-surface-screen border-r border-stroke-input">納品日</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, idx) => (
              <tr key={item.id} className="border-b border-stroke-input h-[58px]">
                <td className="px-4 py-2 text-base text-content-primary border-r border-stroke-input text-center tabular-nums">{idx + 1}</td>
                <td className="px-4 py-2 text-sm text-content-sub border-r border-stroke-input">---</td>
                <td className="px-4 py-2 text-sm text-content-sub border-r border-stroke-input">---</td>
                <td className="px-4 py-2 text-sm text-content-sub border-r border-stroke-input">---</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input truncate max-w-[280px]">{item.itemName}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input truncate">{item.manufacturer || '---'}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input">{item.model || '---'}</td>
                <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input text-right tabular-nums font-semibold">{item.quantity}</td>
                <td className="px-4 py-2 align-middle">
                  <input
                    type="date"
                    value={itemDeliveryDates[item.id] || ''}
                    onChange={(e) => onChangeDeliveryDate(item.id, e.target.value)}
                    className="w-full h-[42px] px-3 rounded-lg bg-surface-card border border-stroke-input text-base text-content-primary tabular-nums focus:outline-none focus:border-cta-primary transition-colors"
                  />
                </td>
              </tr>
            ))}
            {orderItems.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-content-sub">
                  <p className="text-sm font-semibold text-content-primary mb-2 text-balance">発注明細がありません</p>
                  <p className="text-xs text-pretty">発注登録を完了すると、明細が自動的に表示されます。</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
