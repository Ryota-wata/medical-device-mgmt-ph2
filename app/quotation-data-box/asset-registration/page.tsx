'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { useIndividualStore } from '@/lib/stores/individualStore';

/** SearchParams 読み取り */
function RfqGroupIdReader({ onRead }: { onRead: (id: number | null) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null);
  }, [rfqGroupIdParam, onRead]);
  return null;
}

export default function AssetRegistrationPage() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { getOrderGroupByRfqGroupId, getOrderItemsByGroupId } = useOrderStore();
  const { individuals } = useIndividualStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const handleRfqGroupIdRead = useCallback((id: number | null) => setRfqGroupId(id), []);

  const [fixedAssetNos, setFixedAssetNos] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registrationComplete, setRegistrationComplete] = useState<{
    groupName: string;
    itemCount: number;
  } | null>(null);

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

  const getIndividualForItem = useCallback((orderItemId: number) => {
    return individuals.find(ind => ind.orderItemId === orderItemId);
  }, [individuals]);

  const handleRegister = () => {
    if (!rfqGroup || !orderGroup || !rfqGroupId) return;
    setIsSubmitting(true);
    updateRfqGroup(rfqGroupId, { status: '完了' });
    setRegistrationComplete({
      groupName: rfqGroup.groupName,
      itemCount: orderItems.length,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Suspense fallback={null}>
        <RfqGroupIdReader onRead={handleRfqGroupIdRead} />
      </Suspense>

      <Header
        title={registrationComplete ? '資産登録完了' : '資産登録'}
        hideMenu={true}
        showBackButton={false}
      />

      <div className="flex-1 overflow-auto p-6">
        {registrationComplete ? (
          <CompletionView
            groupName={registrationComplete.groupName}
            itemCount={registrationComplete.itemCount}
            onBack={() => router.push('/quotation-data-box')}
          />
        ) : !rfqGroup || !orderGroup ? (
          <NotFoundView onBack={() => router.push('/quotation-data-box')} />
        ) : (
          <div className="flex flex-col gap-6">
            <BasicInfoCard
              rfqNo={rfqGroup.rfqNo}
              groupName={rfqGroup.groupName}
              vendorName={orderGroup.vendorName}
              personInCharge={rfqGroup.personInCharge}
              orderType={orderGroup.orderType}
              quoteDate={rfqGroup.createdDate}
              orderDate={orderGroup.orderDate}
              deliveryDate={orderGroup.deliveryDate}
              inspectionDate={orderGroup.inspectionDate}
              totalAmount={totalAmount}
              inHouseSettlementNo={orderGroup.inHouseSettlementNo}
            />

            <DetailTableCard
              totalAmount={totalAmount}
              orderItems={orderItems}
              getIndividualForItem={getIndividualForItem}
              fixedAssetNos={fixedAssetNos}
              onChangeFixedAssetNo={(id, v) =>
                setFixedAssetNos(prev => ({ ...prev, [id]: v }))
              }
            />

            <div className="flex justify-between items-center gap-3 pt-2">
              <button
                onClick={() => router.push('/quotation-data-box')}
                className="h-12 min-w-[180px] px-6 rounded-lg bg-[#d6d6d6] text-content-primary text-base font-normal cursor-pointer transition-colors hover:bg-stroke-input focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content-sub"
              >
                戻る
              </button>
              <button
                onClick={handleRegister}
                disabled={isSubmitting}
                className="h-12 min-w-[200px] px-6 rounded-lg bg-surface-card border border-cta-primary text-cta-primary-dark text-base font-medium cursor-pointer transition-colors hover:bg-surface-select disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
              >
                {isSubmitting ? '登録中...' : '原本リストへ登録'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Completion view
// ============================================================
function CompletionView({
  groupName,
  itemCount,
  onBack,
}: {
  groupName: string;
  itemCount: number;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[560px] mx-auto mt-10 text-center">
      <div className="bg-surface-card border border-stroke-card rounded-2xl p-8">
        <div className="mb-4 flex justify-center text-cta-primary"><Check size={48} strokeWidth={2.5} aria-hidden /></div>
        <h2 className="text-lg font-bold text-content-primary mb-2 text-balance">
          原本リストへ登録しました
        </h2>
        <p className="text-sm text-content-sub mb-6 text-pretty">
          {groupName}（{itemCount}品目）
        </p>
        <button
          onClick={onBack}
          className="h-12 px-6 rounded-lg bg-surface-card border border-cta-primary text-cta-primary-dark text-base font-medium cursor-pointer transition-colors hover:bg-surface-select min-w-[240px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
        >
          一覧画面に戻る
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Not found view
// ============================================================
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

// ============================================================
// Basic info card
// ============================================================
type BasicInfoCardProps = {
  rfqNo: string;
  groupName: string;
  vendorName: string;
  personInCharge?: string;
  orderType: string;
  quoteDate?: string;
  orderDate?: string;
  deliveryDate?: string;
  inspectionDate?: string;
  totalAmount: number;
  inHouseSettlementNo?: string;
};

function BasicInfoCard(p: BasicInfoCardProps) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4">
      <div className="border border-stroke-input">
        <InfoRow>
          <InfoCell label="見積依頼No." value={p.rfqNo} />
          <InfoCell label="見積G名称" value={p.groupName} />
        </InfoRow>
        <InfoRow>
          <InfoCell label="発注先" value={p.vendorName} />
          <InfoCell label="担当" value={p.personInCharge || '---'} />
        </InfoRow>
        <InfoRow>
          <InfoCell label="発注形態" value={p.orderType} />
          <InfoCell label="見積日付" value={p.quoteDate || '---'} numeric />
        </InfoRow>
        <InfoRow>
          <InfoCell label="発注日" value={p.orderDate || '---'} numeric />
          <InfoCell label="納品日" value={p.deliveryDate || '---'} numeric />
        </InfoRow>
        <InfoRow>
          <InfoCell label="検収日" value={p.inspectionDate || '---'} numeric />
          <InfoCell
            label="合計金額"
            value={`¥${p.totalAmount.toLocaleString()}`}
            labelBold
            valueBold
            valueLarge
            numeric
          />
        </InfoRow>
        <InfoRow last>
          <InfoCell
            label="院内決済No."
            value={p.inHouseSettlementNo || '---'}
            wide
            numeric
            valueMuted={!p.inHouseSettlementNo}
          />
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

type InfoCellProps = {
  label: string;
  value: string;
  labelBold?: boolean;
  valueBold?: boolean;
  valueLarge?: boolean;
  valueMuted?: boolean;
  numeric?: boolean;
  wide?: boolean;
};

function InfoCell(p: InfoCellProps) {
  return (
    <div className={`flex items-stretch ${p.wide ? 'w-full' : 'flex-1 min-w-0'}`}>
      <div className="w-[200px] shrink-0 flex items-center justify-center px-4 py-4 bg-stroke-card border-r border-stroke-input">
        <p className={`text-base text-content-primary whitespace-nowrap ${p.labelBold ? 'font-semibold' : 'font-normal'}`}>
          {p.label}
        </p>
      </div>
      <div className={`flex-1 min-w-0 flex items-center px-4 py-4 ${p.wide ? '' : 'border-r border-stroke-input last:border-r-0'}`}>
        <p
          className={`min-w-0 truncate ${p.valueLarge ? 'text-lg' : 'text-base'} ${p.valueBold ? 'font-semibold' : 'font-normal'} ${p.valueMuted ? 'text-content-sub' : 'text-content-primary'} ${p.numeric ? 'tabular-nums' : ''}`}
        >
          {p.value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Detail table card
// ============================================================
type OrderItemLite = {
  id: number;
  itemName: string;
  manufacturer: string;
  model: string;
  totalPrice: number;
};

type IndividualLite = {
  qrCode?: string;
  location?: { floor?: string; department?: string; section?: string };
} | undefined;

type DetailTableCardProps = {
  totalAmount: number;
  orderItems: OrderItemLite[];
  getIndividualForItem: (orderItemId: number) => IndividualLite;
  fixedAssetNos: Record<number, string>;
  onChangeFixedAssetNo: (id: number, value: string) => void;
};

const COL = {
  no: 'w-[56px]',
  qr: 'w-[150px]',
  floor: 'w-[60px]',
  dept: 'w-[200px]',
  section: 'w-[200px]',
  room: 'w-[130px]',
  item: 'w-[180px]',
  maker: 'w-[180px]',
  model: 'w-[140px]',
  amount: 'w-[150px]',
  account: 'w-[150px]',
  fixedAsset: 'w-[220px]',
} as const;

function DetailTableCard({
  totalAmount,
  orderItems,
  getIndividualForItem,
  fixedAssetNos,
  onChangeFixedAssetNo,
}: DetailTableCardProps) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4 flex flex-col gap-4">
      {/* タイトル行 + 合計 */}
      <div className="border border-stroke-input flex">
        <div className="bg-surface-select px-4 py-4 flex items-center">
          <p className="text-base text-content-primary whitespace-nowrap">明細に対する基本情報</p>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-end px-4 py-4 gap-2">
          <p className="text-content-primary leading-tight">
            <span className="text-base font-semibold">合計金額</span>
            <span className="text-xs font-semibold">（税抜）</span>
          </p>
          <div className="bg-surface-card border border-stroke-input rounded-lg h-[42px] flex items-center px-3 min-w-[180px]">
            <p className="flex-1 text-lg font-semibold text-content-alert tabular-nums text-right">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 明細テーブル */}
      <div className="border border-stroke-input overflow-x-auto">
        <table className="w-full border-collapse min-w-[1640px]">
          <thead>
            {/* グループ行 */}
            <tr className="bg-stroke-card border-b border-stroke-input text-left">
              <th className="px-4 py-2 text-sm font-semibold text-content-primary border-r border-stroke-input" colSpan={11}>
                商品分類
              </th>
              <th className="px-4 py-2 text-sm font-semibold text-content-primary bg-[#FAFAFA]">
                入力項目
              </th>
            </tr>
            {/* 個別ヘッダー */}
            <tr className="bg-stroke-card border-b border-stroke-input text-left">
              <th className={`${COL.no} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input text-center`}>No.</th>
              <th className={`${COL.qr} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>QRコード</th>
              <th className={`${COL.floor} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>階</th>
              <th className={`${COL.dept} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>部門</th>
              <th className={`${COL.section} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>部署</th>
              <th className={`${COL.room} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>室名</th>
              <th className={`${COL.item} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>品目</th>
              <th className={`${COL.maker} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>メーカー名</th>
              <th className={`${COL.model} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>型式</th>
              <th className={`${COL.amount} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input text-right`}>案分金額（税別）</th>
              <th className={`${COL.account} px-4 py-2 text-sm font-normal text-content-primary border-r border-stroke-input`}>仮勘定科目</th>
              <th className={`${COL.fixedAsset} px-4 py-2 text-sm font-normal text-content-primary bg-[#FAFAFA]`}>固定資産番号</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, index) => {
              const ind = getIndividualForItem(item.id);
              return (
                <tr key={item.id} className="border-b border-stroke-input h-[58px]">
                  <td className="px-4 py-2 text-base text-content-primary border-r border-stroke-input text-center tabular-nums">{index + 1}</td>
                  <Cell muted={!ind?.qrCode}>{ind?.qrCode || '---'}</Cell>
                  <Cell muted={!ind?.location?.floor}>{ind?.location?.floor || '---'}</Cell>
                  <Cell muted={!ind?.location?.department}>{ind?.location?.department || '---'}</Cell>
                  <Cell muted={!ind?.location?.section}>{ind?.location?.section || '---'}</Cell>
                  <Cell muted>---</Cell>
                  <Cell>{item.itemName}</Cell>
                  <Cell>{item.manufacturer}</Cell>
                  <Cell>{item.model}</Cell>
                  <td className="px-4 py-2 text-sm text-content-primary border-r border-stroke-input text-right tabular-nums font-semibold">
                    ¥{item.totalPrice.toLocaleString()}
                  </td>
                  <Cell muted>---</Cell>
                  <td className="px-4 py-2 align-middle">
                    <input
                      type="text"
                      value={fixedAssetNos[item.id] || ''}
                      onChange={(e) => onChangeFixedAssetNo(item.id, e.target.value)}
                      placeholder="入力してください"
                      className="w-full h-[42px] px-3 rounded-lg bg-surface-card border border-stroke-input text-base text-content-primary placeholder:text-content-placeholder focus:border-cta-primary focus:outline-none transition-colors"
                    />
                  </td>
                </tr>
              );
            })}
            {orderItems.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-content-sub">
                  <p className="text-sm font-semibold text-content-primary mb-2 text-balance">明細がありません</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Cell({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td className={`px-4 py-2 text-sm border-r border-stroke-input truncate ${muted ? 'text-content-sub' : 'text-content-primary'}`}>
      {children}
    </td>
  );
}
