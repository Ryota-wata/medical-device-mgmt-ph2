'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { ChevronLeft, QrCode, Camera, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Header } from '@/components/layouts/Header';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useOrderStore } from '@/lib/stores/orderStore';
import { useIndividualStore } from '@/lib/stores/individualStore';
import { useApplicationStore } from '@/lib/stores/applicationStore';
import { useMasterStore } from '@/lib/stores';
import { OrderItem } from '@/lib/types';

// ============================================================
// Types
// ============================================================
type ViewState = 'list' | 'form';

interface FormData {
  serialNumber: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  width: string;
  depth: string;
  height: string;
  remarks: string;
  labelApplied: boolean;
  photoTaken: boolean;
  qrCode: string;
  largeClass: string;
  mediumClass: string;
  itemClass: string;
}

const EMPTY_FORM: FormData = {
  serialNumber: '', building: '', floor: '', department: '', section: '',
  width: '', depth: '', height: '', remarks: '',
  labelApplied: false, photoTaken: false, qrCode: '',
  largeClass: '', mediumClass: '', itemClass: '',
};

interface RowEditData {
  assetMasterId: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  itemClass: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
  qrCode: string;
  serialNumber: string;
  photoFileName: string;
}

function ParamsReader({ onRead }: { onRead: (rfqGroupId: number | null, mode: string) => void }) {
  const searchParams = useSearchParams();
  const rfqGroupIdParam = searchParams.get('rfqGroupId');
  const modeParam = searchParams.get('mode') || 'mobile';
  React.useEffect(() => {
    onRead(rfqGroupIdParam ? Number(rfqGroupIdParam) : null, modeParam);
  }, [rfqGroupIdParam, modeParam, onRead]);
  return null;
}

// ============================================================
// Main page
// ============================================================
export default function AssetProvisionalRegistrationPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { getRfqGroupById, updateRfqGroup } = useRfqGroupStore();
  const { getOrderGroupByRfqGroupId, getOrderItemsByGroupId } = useOrderStore();
  const { addIndividual } = useIndividualStore();
  const { getApplicationsByRfqNo } = useApplicationStore();
  const { assets: assetMasters } = useMasterStore();

  const [rfqGroupId, setRfqGroupId] = useState<number | null>(null);
  const [mode, setMode] = useState<string>('mobile');
  const handleParamsRead = useCallback((id: number | null, m: string) => {
    setRfqGroupId(id);
    setMode(m);
  }, []);

  const isMobileMode = mode === 'mobile';

  const [viewState, setViewState] = useState<ViewState>('list');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [registeredItemIds, setRegisteredItemIds] = useState<number[]>([]);
  const [registrationComplete, setRegistrationComplete] = useState<{
    groupName: string;
    itemCount: number;
    inspectionDate: string;
  } | null>(null);

  const [rowEditMap, setRowEditMap] = useState<Record<number, RowEditData>>({});

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel?: string;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showDialog = useCallback((opts: {
    title: string; message: string; onConfirm: () => void; confirmLabel?: string;
  }) => {
    setConfirmDialog({ isOpen: true, ...opts });
  }, []);

  const closeDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  const rfqGroup = useMemo(() => rfqGroupId ? getRfqGroupById(rfqGroupId) : undefined, [rfqGroupId, getRfqGroupById]);
  const orderGroup = useMemo(() => rfqGroupId ? getOrderGroupByRfqGroupId(rfqGroupId) : undefined, [rfqGroupId, getOrderGroupByRfqGroupId]);
  const orderItems = useMemo(() => orderGroup ? getOrderItemsByGroupId(orderGroup.id) : [], [orderGroup, getOrderItemsByGroupId]);

  const totalItems = orderItems.length;
  const registeredCount = registeredItemIds.length;
  const progressPercent = totalItems > 0 ? Math.round((registeredCount / totalItems) * 100) : 0;
  const allRegistered = totalItems > 0 && registeredCount === totalItems;

  const totalAmount = useMemo(() => orderItems.reduce((sum, item) => sum + item.totalPrice, 0), [orderItems]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return orderItems.find(item => item.id === selectedItemId) || null;
  }, [selectedItemId, orderItems]);

  const getAssetMasterMatch = useCallback((item: OrderItem) => {
    return assetMasters.find(m => m.item === item.itemName || m.model === item.model);
  }, [assetMasters]);

  const rfqApplications = useMemo(() => {
    if (!rfqGroup) return [];
    return getApplicationsByRfqNo(rfqGroup.rfqNo);
  }, [rfqGroup, getApplicationsByRfqNo]);

  const getApplicationLocationMatch = useCallback((item: OrderItem) => {
    const direct = rfqApplications.find(app =>
      app.asset.name === item.itemName || app.asset.model === item.model
    );
    if (direct) return direct;

    if (item.registrationType === '付属品' && item.quotationItemId != null) {
      const parentItem = orderItems.find(i =>
        i.quotationItemId === item.quotationItemId && i.registrationType === '本体'
      );
      if (parentItem) {
        return rfqApplications.find(app =>
          app.asset.name === parentItem.itemName || app.asset.model === parentItem.model
        );
      }
    }
    return rfqApplications.length > 0 ? rfqApplications[0] : undefined;
  }, [rfqApplications, orderItems]);

  const largeClassOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.largeClass).filter(Boolean))), [assetMasters]);
  const mediumClassOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.mediumClass).filter(Boolean))), [assetMasters]);
  const itemOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.item).filter(Boolean))), [assetMasters]);

  React.useEffect(() => {
    if (orderItems.length > 0 && Object.keys(rowEditMap).length === 0) {
      const newMap: Record<number, RowEditData> = {};
      orderItems.forEach(item => {
        const match = getAssetMasterMatch(item);
        const appMatch = getApplicationLocationMatch(item);
        newMap[item.id] = {
          assetMasterId: match?.id?.toString() || '',
          category: match?.category || '',
          largeClass: match?.largeClass || '',
          mediumClass: match?.mediumClass || '',
          itemClass: match?.item || '',
          floor: appMatch?.facility?.floor || '',
          department: appMatch?.facility?.department || '',
          section: appMatch?.facility?.section || '',
          roomName: appMatch?.roomName || '',
          qrCode: '',
          serialNumber: '',
          photoFileName: '',
        };
      });
      setRowEditMap(newMap);
    }
  }, [orderItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const purchaseDate = orderGroup?.inspectionDate || orderGroup?.deliveryDate || '';

  // === Handlers ===
  const handleBack = useCallback(() => {
    if (isMobileMode && viewState === 'form') {
      setViewState('list');
      setSelectedItemId(null);
    } else {
      router.push('/quotation-data-box');
    }
  }, [isMobileMode, viewState, router]);

  const handleSelectItem = useCallback((itemId: number) => {
    const item = orderItems.find(i => i.id === itemId);
    if (!item) return;
    const match = getAssetMasterMatch(item);
    const appMatch = getApplicationLocationMatch(item);
    setFormData({
      ...EMPTY_FORM,
      qrCode: '',
      largeClass: match?.largeClass || '',
      mediumClass: match?.mediumClass || '',
      itemClass: match?.item || '',
      building: appMatch?.facility?.building || '',
      floor: appMatch?.facility?.floor || '',
      department: appMatch?.facility?.department || '',
      section: appMatch?.facility?.section || '',
    });
    setSelectedItemId(itemId);
    setViewState('form');
  }, [orderItems, getAssetMasterMatch, getApplicationLocationMatch]);

  const handleFieldChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleQRScan = useCallback(() => {
    alert('QRコードを読み取りました（モック）');
  }, []);

  const handlePhotoCapture = useCallback(() => {
    if (isMobileMode && viewState === 'form') {
      setFormData(prev => ({ ...prev, photoTaken: true }));
    }
    alert('写真を撮影しました（モック）');
  }, [isMobileMode, viewState]);

  const handleRegisterItem = useCallback(() => {
    if (!selectedItem || !orderGroup) return;
    setIsSubmitting(true);
    setTimeout(() => {
      addIndividual({
        qrCode: formData.qrCode,
        assetName: selectedItem.itemName,
        model: selectedItem.model,
        location: { building: formData.building, floor: formData.floor, department: formData.department, section: formData.section },
        registrationDate: new Date().toISOString().split('T')[0],
        applicationNo: rfqGroup?.rfqNo || '',
        applicationType: '新規申請',
        status: '使用中',
        vendor: orderGroup.vendorName,
        serialNumber: formData.serialNumber,
        acquisitionCost: selectedItem.totalPrice,
        orderItemId: selectedItem.id,
        orderGroupId: orderGroup.id,
        largeClass: formData.largeClass,
        mediumClass: formData.mediumClass,
        itemClass: formData.itemClass,
        width: formData.width ? parseInt(formData.width, 10) : undefined,
        depth: formData.depth ? parseInt(formData.depth, 10) : undefined,
        height: formData.height ? parseInt(formData.height, 10) : undefined,
        photoTaken: formData.photoTaken,
        labelApplied: formData.labelApplied,
        remarks: formData.remarks,
      });
      setRegisteredItemIds(prev => [...prev, selectedItem.id]);
      setIsSubmitting(false);
      setViewState('list');
      setSelectedItemId(null);
    }, 400);
  }, [selectedItem, orderGroup, rfqGroup, formData, addIndividual]);

  const handlePcCellChange = useCallback((itemId: number, field: keyof RowEditData, value: string) => {
    setRowEditMap(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  }, []);

  const handlePcRegisterAll = useCallback(() => {
    if (!orderGroup || !rfqGroup || !rfqGroupId) return;
    showDialog({
      title: '検収登録確認',
      message: `全${totalItems}件の検収登録を実行し、ステータスを「検収登録済」に更新します。`,
      confirmLabel: '検収登録する',
      onConfirm: () => {
        orderItems.forEach(item => {
          const rowData = rowEditMap[item.id];
          if (!rowData) return;
          addIndividual({
            qrCode: rowData.qrCode,
            assetName: item.itemName,
            model: item.model,
            location: { building: '', floor: rowData.floor, department: rowData.department, section: rowData.section },
            registrationDate: new Date().toISOString().split('T')[0],
            applicationNo: rfqGroup.rfqNo || '',
            applicationType: '新規申請',
            status: '使用中',
            vendor: orderGroup.vendorName,
            serialNumber: rowData.serialNumber,
            acquisitionCost: item.totalPrice,
            orderItemId: item.id,
            orderGroupId: orderGroup.id,
            largeClass: rowData.largeClass,
            mediumClass: rowData.mediumClass,
            itemClass: rowData.itemClass,
          });
        });
        updateRfqGroup(rfqGroupId, { status: '検収済' });
        setRegistrationComplete({
          groupName: rfqGroup.groupName,
          itemCount: totalItems,
          inspectionDate: orderGroup.inspectionDate || orderGroup.deliveryDate || '-',
        });
      },
    });
  }, [orderGroup, rfqGroup, rfqGroupId, orderItems, totalItems, rowEditMap, addIndividual, updateRfqGroup, showDialog]);

  const handleCompleteAll = useCallback(() => {
    if (!rfqGroupId || !allRegistered || !rfqGroup || !orderGroup) return;
    showDialog({
      title: '検収登録完了確認',
      message: `全${totalItems}件の検収登録を完了します。ステータスを「検収済」に更新します。`,
      confirmLabel: '登録を完了する',
      onConfirm: () => {
        updateRfqGroup(rfqGroupId, { status: '検収済' });
        setRegistrationComplete({
          groupName: rfqGroup.groupName,
          itemCount: totalItems,
          inspectionDate: orderGroup.inspectionDate || orderGroup.deliveryDate || '-',
        });
      },
    });
  }, [rfqGroupId, allRegistered, totalItems, rfqGroup, orderGroup, updateRfqGroup, showDialog]);

  // ============================================================
  // PC mode
  // ============================================================
  if (!isMobileMode) {
    return (
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <Suspense fallback={null}>
          <ParamsReader onRead={handleParamsRead} />
        </Suspense>

        <Header
          title={registrationComplete ? '検収登録完了' : '検収登録'}
          hideMenu={true}
          showBackButton={false}
        />

        <div className="flex-1 overflow-auto p-6">
          {registrationComplete ? (
            <PcCompletionView
              groupName={registrationComplete.groupName}
              itemCount={registrationComplete.itemCount}
              inspectionDate={registrationComplete.inspectionDate}
              onBack={() => router.push('/quotation-data-box')}
            />
          ) : !rfqGroup || !orderGroup || orderItems.length === 0 ? (
            <PcNotFoundView onBack={() => router.push('/quotation-data-box')} />
          ) : (
            <div className="flex flex-col gap-6">
              <PcBasicInfoCard
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
                leaseStartDate={orderGroup.leaseStartDate}
                leaseYears={orderGroup.leaseYears}
              />

              <PcDetailTableCard
                totalAmount={totalAmount}
                orderItems={orderItems}
                rowEditMap={rowEditMap}
                onCellChange={handlePcCellChange}
              />

              <div className="flex justify-end items-center pt-2 gap-3">
                <button
                  onClick={() => router.push('/quotation-data-box')}
                  className="h-12 min-w-[120px] px-6 rounded-lg bg-surface-card border border-stroke-input text-content-primary text-base font-medium cursor-pointer transition-colors hover:bg-surface-screen focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-content-sub"
                >
                  戻る
                </button>
                <button
                  onClick={handlePcRegisterAll}
                  className="h-12 min-w-[180px] px-6 rounded-lg bg-cta-primary text-white text-base font-semibold cursor-pointer transition-colors hover:bg-cta-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta-primary"
                >
                  確定する
                </button>
              </div>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeDialog}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
        />
      </div>
    );
  }

  // ============================================================
  // Mobile mode
  // ============================================================
  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Suspense fallback={null}>
        <ParamsReader onRead={handleParamsRead} />
      </Suspense>

      {/* Sticky Header (Figma 342:58973: 白背景 + 黒文字) */}
      <div className="sticky top-0 z-[100] bg-surface-card border-b border-stroke-input text-content-primary px-4 py-3 md:px-6 md:py-4 flex justify-center items-center">
        <h1 className="text-base md:text-lg font-semibold m-0 text-balance">
          {registrationComplete ? '検収登録完了' : '検収登録'}
        </h1>
      </div>

      <main className="flex-1 overflow-y-auto px-3 py-4 pb-32 md:px-5 md:py-6">
        {registrationComplete ? (
          <MobileCompletionView
            groupName={registrationComplete.groupName}
            itemCount={registrationComplete.itemCount}
            inspectionDate={registrationComplete.inspectionDate}
            isMobile={isMobile}
            onBack={() => router.push('/quotation-data-box')}
          />
        ) : !rfqGroup || !orderGroup || orderItems.length === 0 ? (
          <MobileNotFoundView onBack={() => router.push('/quotation-data-box')} />
        ) : viewState === 'form' && selectedItem ? (
          <MobileForm
            isMobile={isMobile}
            selectedItem={selectedItem}
            formData={formData}
            purchaseDate={purchaseDate}
            largeClassOptions={largeClassOptions}
            mediumClassOptions={mediumClassOptions}
            itemOptions={itemOptions}
            onChange={handleFieldChange}
          />
        ) : (
          <MobileList
            isMobile={isMobile}
            rfqNo={rfqGroup.rfqNo}
            groupName={rfqGroup.groupName}
            vendorName={orderGroup.vendorName}
            inspectionDate={orderGroup.inspectionDate || orderGroup.deliveryDate || '-'}
            registeredCount={registeredCount}
            totalItems={totalItems}
            progressPercent={progressPercent}
            orderItems={orderItems}
            registeredItemIds={registeredItemIds}
            onSelectItem={handleSelectItem}
          />
        )}
      </main>

      {/* Fixed Footer */}
      {!registrationComplete && rfqGroup && orderGroup && (
        <footer className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-stroke-input px-2 py-2 md:px-3 md:py-2.5 flex justify-around flex-wrap shadow-[0_-2px_4px_rgba(0,0,0,0.1)] z-[100]">
          <FooterButton onClick={handleBack} icon={<ChevronLeft size={22} aria-hidden />} label="戻る" variant="default" isMobile={isMobile} />
          <FooterButton onClick={handleQRScan} icon={<QrCode size={22} aria-hidden />} label="QR読取" variant="default" isMobile={isMobile} />
          <FooterButton onClick={handlePhotoCapture} icon={<Camera size={22} aria-hidden />} label="写真撮影" variant="default" isMobile={isMobile} />
          {viewState === 'form' ? (
            <FooterButton
              onClick={handleRegisterItem}
              disabled={isSubmitting}
              icon={<Check size={22} aria-hidden />}
              label={isSubmitting ? '登録中...' : '商品登録'}
              variant="primary"
              isMobile={isMobile}
            />
          ) : allRegistered ? (
            <FooterButton onClick={handleCompleteAll} icon={<Check size={22} aria-hidden />} label="登録完了" variant="primary" isMobile={isMobile} />
          ) : (
            <FooterButton onClick={() => {}} disabled icon={<Check size={22} aria-hidden />} label="商品登録" variant="disabled" isMobile={isMobile} />
          )}
        </footer>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
      />
    </div>
  );
}

// ============================================================
// PC sub views
// ============================================================
function PcCompletionView({
  groupName,
  itemCount,
  inspectionDate,
  onBack,
}: {
  groupName: string;
  itemCount: number;
  inspectionDate: string;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[560px] mx-auto mt-10 text-center">
      <div className="bg-surface-card border border-stroke-card rounded-2xl p-8">
        <div className="mb-4 flex justify-center text-cta-primary"><Check size={48} strokeWidth={2.5} aria-hidden /></div>
        <h2 className="text-lg font-bold text-content-primary mb-2 text-balance">
          検収登録が完了しました
        </h2>
        <p className="text-sm text-content-sub mb-6 text-pretty tabular-nums">
          {groupName}（{itemCount}品目 / 検収日: {inspectionDate}）
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

function PcNotFoundView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[480px] mx-auto mt-10 text-center">
      <div className="bg-surface-card border border-stroke-card rounded-2xl p-8">
        <p className="text-sm font-bold text-content-primary mb-2">対象の発注データが見つかりません</p>
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

type PcBasicInfoCardProps = {
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
  leaseStartDate?: string;
  leaseYears?: number;
};

function PcBasicInfoCard(p: PcBasicInfoCardProps) {
  const isLease = p.orderType?.includes('リース');
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4">
      <div className="border border-stroke-input">
        <PcInfoRow>
          <PcInfoCell label="見積依頼No." value={p.rfqNo} />
          <PcInfoCell label="見積依頼G名称" value={p.groupName} />
        </PcInfoRow>
        <PcInfoRow>
          <PcInfoCell label="発注先" value={p.vendorName} />
          <PcInfoCell label="担当" value={p.personInCharge || '---'} />
        </PcInfoRow>
        <PcInfoRow>
          <PcInfoCell label="発注形態" value={p.orderType} />
          <PcInfoCell label="見積日付" value={p.quoteDate || '---'} numeric />
        </PcInfoRow>
        <PcInfoRow>
          <PcInfoCell label="発注日" value={p.orderDate || '---'} numeric />
          <PcInfoCell label="納品日" value={p.deliveryDate || '---'} numeric />
        </PcInfoRow>
        <PcInfoRow last={!isLease}>
          <PcInfoCell label="検収日" value={p.inspectionDate || '---'} numeric />
          <PcInfoCell label="合計金額" value={`¥${p.totalAmount.toLocaleString()}`} labelBold valueBold valueLarge numeric />
        </PcInfoRow>
        {isLease && (
          <PcInfoRow last>
            <PcInfoCell label="リース開始日" value={p.leaseStartDate || '---'} numeric />
            <PcInfoCell label="リース年数" value={p.leaseYears ? `${p.leaseYears}年` : '---'} numeric />
          </PcInfoRow>
        )}
      </div>
    </section>
  );
}

function PcInfoRow({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex w-full ${last ? '' : 'border-b border-stroke-input'}`}>
      {children}
    </div>
  );
}

function PcInfoCell({
  label,
  value,
  labelBold,
  valueBold,
  valueLarge,
  numeric,
}: {
  label: string;
  value: string;
  labelBold?: boolean;
  valueBold?: boolean;
  valueLarge?: boolean;
  numeric?: boolean;
}) {
  return (
    <div className="flex items-stretch flex-1 min-w-0">
      <div className="w-[200px] shrink-0 flex items-center justify-center px-4 py-4 bg-stroke-card border-r border-stroke-input">
        <p className={`text-base text-content-primary whitespace-nowrap ${labelBold ? 'font-semibold' : 'font-normal'}`}>
          {label}
        </p>
      </div>
      <div className="flex-1 min-w-0 flex items-center px-4 py-4 border-r border-stroke-input last:border-r-0">
        <p
          className={`min-w-0 truncate ${valueLarge ? 'text-lg' : 'text-base'} ${valueBold ? 'font-semibold' : 'font-normal'} text-content-primary ${numeric ? 'tabular-nums' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// PC detail table
// ============================================================
function PcDetailTableCard({
  totalAmount,
  orderItems,
  rowEditMap,
  onCellChange,
}: {
  totalAmount: number;
  orderItems: OrderItem[];
  rowEditMap: Record<number, RowEditData>;
  onCellChange: (itemId: number, field: keyof RowEditData, value: string) => void;
}) {
  return (
    <section className="bg-surface-card border border-stroke-card rounded-2xl p-4 flex flex-col gap-3">
      <div className="border border-stroke-input flex">
        <div className="bg-surface-select px-4 py-4 flex items-center gap-3">
          <p className="text-base text-content-primary whitespace-nowrap">明細に対する基本情報</p>
          <span className="text-xs text-content-sub whitespace-nowrap">【黄列 = 入力項目】</span>
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-end px-4 py-4 gap-2">
          <p className="text-content-primary leading-tight">
            <span className="text-base font-semibold">合計金額</span>
            <span className="text-xs font-semibold">（税別）</span>
          </p>
          <div className="bg-surface-card border border-stroke-input rounded-lg h-[42px] flex items-center px-3 min-w-[180px]">
            <p className="flex-1 text-lg font-semibold text-content-alert tabular-nums text-right">
              ¥{totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border border-stroke-input overflow-x-auto">
        <table className="w-full border-collapse min-w-[1600px]">
          <thead>
            <tr className="bg-stroke-card border-b border-stroke-input text-left">
              <th className="px-3 py-2 text-sm font-semibold text-content-primary border-r border-stroke-input text-center" rowSpan={2}>No.</th>
              <th className="px-3 py-2 text-sm font-semibold text-content-primary border-r border-stroke-input" colSpan={7}>商品分類</th>
              <th className="px-3 py-2 text-sm font-semibold text-cta-primary-dark bg-[#FAFAFA]" colSpan={7}>入力項目</th>
            </tr>
            <tr className="bg-stroke-card border-b border-stroke-input text-left">
              <th className="w-[120px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">資産MasterID</th>
              <th className="w-[100px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">category</th>
              <th className="w-[110px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">大分類</th>
              <th className="w-[110px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">中分類</th>
              <th className="w-[180px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">品名</th>
              <th className="w-[140px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">メーカー名</th>
              <th className="w-[120px] px-3 py-2 text-xs font-normal text-content-primary border-r border-stroke-input">型式</th>
              <th className="w-[80px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA] border-r border-stroke-input">階</th>
              <th className="w-[140px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA] border-r border-stroke-input">部門</th>
              <th className="w-[130px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA] border-r border-stroke-input">部署</th>
              <th className="w-[130px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA] border-r border-stroke-input">室名</th>
              <th className="w-[160px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA] border-r border-stroke-input">QRコード</th>
              <th className="w-[140px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA] border-r border-stroke-input">シリアルNo.</th>
              <th className="w-[140px] px-3 py-2 text-xs font-normal text-cta-primary-dark bg-[#FAFAFA]">写真撮影</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((item, index) => {
              const r = rowEditMap[item.id];
              if (!r) return null;
              return (
                <tr key={item.id} className="border-b border-stroke-input h-[58px]">
                  <td className="px-3 py-2 text-base text-content-primary border-r border-stroke-input text-center tabular-nums font-semibold">{index + 1}</td>
                  <td className="px-3 py-2 text-xs text-content-sub border-r border-stroke-input font-mono">{r.assetMasterId || '---'}</td>
                  <td className="px-3 py-2 text-xs text-content-primary border-r border-stroke-input">{r.category || '---'}</td>
                  <td className="px-3 py-2 text-xs text-content-primary border-r border-stroke-input">{r.largeClass || '---'}</td>
                  <td className="px-3 py-2 text-xs text-content-primary border-r border-stroke-input">{r.mediumClass || '---'}</td>
                  <td className="px-3 py-2 text-sm text-content-primary border-r border-stroke-input truncate max-w-[180px] font-medium">{item.itemName}</td>
                  <td className="px-3 py-2 text-sm text-content-primary border-r border-stroke-input truncate">{item.manufacturer}</td>
                  <td className="px-3 py-2 text-xs text-content-primary border-r border-stroke-input font-mono">{item.model}</td>
                  <PcEditCell>
                    <input
                      type="text"
                      value={r.floor}
                      onChange={(e) => onCellChange(item.id, 'floor', e.target.value)}
                      placeholder="階"
                      className={pcCellInputCls}
                    />
                  </PcEditCell>
                  <PcEditCell>
                    <input
                      type="text"
                      value={r.department}
                      onChange={(e) => onCellChange(item.id, 'department', e.target.value)}
                      placeholder="部門"
                      className={pcCellInputCls}
                    />
                  </PcEditCell>
                  <PcEditCell>
                    <input
                      type="text"
                      value={r.section}
                      onChange={(e) => onCellChange(item.id, 'section', e.target.value)}
                      placeholder="部署"
                      className={pcCellInputCls}
                    />
                  </PcEditCell>
                  <PcEditCell>
                    <input
                      type="text"
                      value={r.roomName}
                      onChange={(e) => onCellChange(item.id, 'roomName', e.target.value)}
                      placeholder="室名"
                      className={pcCellInputCls}
                    />
                  </PcEditCell>
                  <PcEditCell>
                    <input
                      type="text"
                      value={r.qrCode}
                      onChange={(e) => onCellChange(item.id, 'qrCode', e.target.value)}
                      placeholder="QRコード"
                      className={`${pcCellInputCls} font-mono`}
                    />
                  </PcEditCell>
                  <PcEditCell>
                    <input
                      type="text"
                      value={r.serialNumber}
                      onChange={(e) => onCellChange(item.id, 'serialNumber', e.target.value)}
                      placeholder="入力"
                      className={pcCellInputCls}
                    />
                  </PcEditCell>
                  <td className="px-3 py-2 align-middle bg-[#FAFAFA]">
                    {r.photoFileName ? (
                      <span className="text-xs text-cta-primary font-medium">{r.photoFileName}</span>
                    ) : (
                      <label className="inline-flex items-center gap-1 px-2 py-1 bg-[#FAFAFA] border border-stroke-input rounded-md cursor-pointer text-xs text-cta-primary-dark whitespace-nowrap hover:bg-surface-select transition-colors">
                        <span>📷 アップロード</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onCellChange(item.id, 'photoFileName', file.name);
                          }}
                        />
                      </label>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const pcCellInputCls =
  'w-full h-[34px] px-2 rounded-md bg-surface-card border border-stroke-input text-xs text-content-primary placeholder:text-content-placeholder focus:outline-none focus:border-cta-primary transition-colors';

function PcEditCell({ children }: { children: React.ReactNode }) {
  return <td className="px-2 py-2 align-middle bg-[#FAFAFA] border-r border-stroke-input">{children}</td>;
}

// ============================================================
// Mobile sub views
// ============================================================
function MobileCompletionView({
  groupName,
  itemCount,
  inspectionDate,
  isMobile,
  onBack,
}: {
  groupName: string;
  itemCount: number;
  inspectionDate: string;
  isMobile: boolean;
  onBack: () => void;
}) {
  return (
    <div className="max-w-[500px] mx-auto mt-10">
      <div className={`bg-surface-card rounded-2xl shadow-md text-center ${isMobile ? 'p-6' : 'p-8'}`}>
        <div className="w-16 h-16 rounded-full bg-surface-select flex items-center justify-center mx-auto mb-4 text-cta-primary">
          <Check size={32} strokeWidth={2.5} aria-hidden />
        </div>
        <h2 className="text-lg font-semibold text-content-primary mb-2 text-balance">
          検収登録が完了しました
        </h2>
        <p className="text-sm text-content-sub mb-6 text-pretty tabular-nums">
          {groupName}<br />
          {itemCount}品目 / 検収日: {inspectionDate}
        </p>
        <button
          onClick={onBack}
          className="h-12 px-6 rounded-lg bg-content-primary text-white text-base font-semibold cursor-pointer w-[240px] hover:bg-content-primary/90 transition-colors"
        >
          一覧画面に戻る
        </button>
      </div>
    </div>
  );
}

function MobileNotFoundView({ onBack }: { onBack: () => void }) {
  return (
    <div className="max-w-[480px] mx-auto mt-10 text-center">
      <div className="bg-surface-card rounded-2xl shadow-md p-8">
        <p className="text-sm font-semibold text-content-primary mb-2">対象の発注データが見つかりません</p>
        <p className="text-xs text-content-sub mb-4 text-pretty">
          URLのパラメータが正しいか確認するか、一覧画面から対象を選択してください。
        </p>
        <button
          onClick={onBack}
          className="h-10 px-6 rounded-lg bg-content-primary text-white text-sm font-semibold cursor-pointer hover:bg-content-primary/90 transition-colors"
        >
          一覧画面に戻る
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Mobile form
// ============================================================
function MobileForm({
  isMobile,
  selectedItem,
  formData,
  purchaseDate,
  largeClassOptions,
  mediumClassOptions,
  itemOptions,
  onChange,
}: {
  isMobile: boolean;
  selectedItem: OrderItem;
  formData: FormData;
  purchaseDate: string;
  largeClassOptions: string[];
  mediumClassOptions: string[];
  itemOptions: string[];
  onChange: (field: keyof FormData, value: string | boolean) => void;
}) {
  const gridCols = isMobile ? 'grid-cols-1' : 'grid-cols-3';
  const grid2 = isMobile ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <>
      <MobileCard isMobile={isMobile}>
        <p className="text-sm font-semibold text-content-primary mb-3">QRコード</p>
        <input
          type="text"
          value={formData.qrCode}
          onChange={(e) => onChange('qrCode', e.target.value)}
          placeholder="QRコードを入力してください"
          className="w-full h-12 px-3 rounded-lg border border-stroke-input bg-surface-card text-base text-content-primary font-mono tabular-nums focus:outline-none focus:border-cta-primary transition-colors"
        />
      </MobileCard>

      <GreenDivider />

      <MobileCard isMobile={isMobile}>
        <p className="text-sm font-semibold text-content-primary mb-3">
          {selectedItem.itemName}
          <span className="text-xs font-normal text-content-sub ml-2">
            {selectedItem.model} / {selectedItem.registrationType}
          </span>
        </p>

        <div className={`grid ${gridCols} gap-4 mb-4`}>
          <ReadOnlyField label="品目名" value={selectedItem.itemName} />
          <ReadOnlyField label="メーカー" value={selectedItem.manufacturer} />
          <ReadOnlyField label="型式" value={selectedItem.model} />
        </div>

        <div className={`grid ${gridCols} gap-4 mb-4`}>
          <div>
            <FieldLabel>シリアルNo.</FieldLabel>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => onChange('serialNumber', e.target.value)}
              placeholder="シリアルNo.を入力"
              className={mobileInputCls}
            />
          </div>
          <ReadOnlyField label="購入年月日" value={purchaseDate || '---'} numeric />
          <ReadOnlyField label="取得金額" value={`¥${selectedItem.totalPrice.toLocaleString()}`} numeric />
        </div>

        <p className="text-xs text-content-sub italic">
          ※ 資産番号・備品番号は本登録時に配番されます
        </p>
      </MobileCard>

      <MobileCard isMobile={isMobile}>
        <p className="text-sm font-semibold text-content-primary mb-3">写真</p>
        <div
          className={`border-2 border-dashed border-stroke-input rounded-2xl p-10 text-center ${formData.photoTaken ? 'bg-surface-select' : 'bg-surface-screen'}`}
        >
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm text-content-sub">
            {formData.photoTaken ? '写真撮影済み' : '写真を撮影してください'}
          </p>
        </div>
      </MobileCard>

      <GreenDivider />

      <MobileCard isMobile={isMobile}>
        <h3 className="text-base font-semibold text-content-primary mb-4">分類情報</h3>
        <div className={`grid ${gridCols} gap-4`}>
          <SearchableSelect label="大分類" value={formData.largeClass} onChange={(v) => onChange('largeClass', v)} options={['', ...largeClassOptions]} placeholder="選択してください" isMobile={isMobile} />
          <SearchableSelect label="中分類" value={formData.mediumClass} onChange={(v) => onChange('mediumClass', v)} options={['', ...mediumClassOptions]} placeholder="選択してください" isMobile={isMobile} />
          <SearchableSelect label="品目" value={formData.itemClass} onChange={(v) => onChange('itemClass', v)} options={['', ...itemOptions]} placeholder="選択してください" isMobile={isMobile} />
        </div>
      </MobileCard>

      <MobileCard isMobile={isMobile}>
        <h3 className="text-base font-semibold text-content-primary mb-4">設置場所</h3>
        <div className={`grid ${grid2} gap-4`}>
          <FieldInput label="棟" value={formData.building} onChange={(v) => onChange('building', v)} placeholder="例: 本館" />
          <FieldInput label="階" value={formData.floor} onChange={(v) => onChange('floor', v)} placeholder="例: 3F" />
          <FieldInput label="部門" value={formData.department} onChange={(v) => onChange('department', v)} placeholder="例: 内視鏡センター" />
          <FieldInput label="部署" value={formData.section} onChange={(v) => onChange('section', v)} placeholder="例: 検査室1" />
        </div>
      </MobileCard>

      <MobileCard isMobile={isMobile}>
        <h3 className="text-base font-semibold text-content-primary mb-4">サイズ情報</h3>
        <div className={`grid ${gridCols} gap-4`}>
          <FieldInput label="W (幅)" value={formData.width} onChange={(v) => onChange('width', v)} placeholder="0" type="number" numeric />
          <FieldInput label="D (奥行)" value={formData.depth} onChange={(v) => onChange('depth', v)} placeholder="0" type="number" numeric />
          <FieldInput label="H (高さ)" value={formData.height} onChange={(v) => onChange('height', v)} placeholder="0" type="number" numeric />
        </div>
        <p className="text-xs text-content-sub mt-2">単位: mm</p>
      </MobileCard>

      <MobileCard isMobile={isMobile}>
        <FieldLabel>備考</FieldLabel>
        <textarea
          value={formData.remarks}
          onChange={(e) => onChange('remarks', e.target.value)}
          placeholder="備考を入力してください"
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-stroke-input bg-surface-card text-sm text-content-primary resize-y font-sans focus:outline-none focus:border-cta-primary transition-colors"
        />
      </MobileCard>
    </>
  );
}

const mobileInputCls =
  'w-full h-12 px-3 rounded-lg border border-stroke-input bg-surface-card text-sm text-content-primary focus:outline-none focus:border-cta-primary transition-colors box-border';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-content-sub mb-1">{children}</label>;
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  numeric?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${mobileInputCls} ${numeric ? 'tabular-nums' : ''}`}
      />
    </div>
  );
}

function ReadOnlyField({ label, value, numeric }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className={`px-3 py-2.5 rounded-lg border border-stroke-input bg-surface-screen text-sm text-content-primary ${numeric ? 'tabular-nums' : ''}`}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// Mobile list
// ============================================================
function MobileList({
  isMobile,
  rfqNo,
  groupName,
  vendorName,
  inspectionDate,
  registeredCount,
  totalItems,
  progressPercent,
  orderItems,
  registeredItemIds,
  onSelectItem,
}: {
  isMobile: boolean;
  rfqNo: string;
  groupName: string;
  vendorName: string;
  inspectionDate: string;
  registeredCount: number;
  totalItems: number;
  progressPercent: number;
  orderItems: OrderItem[];
  registeredItemIds: number[];
  onSelectItem: (id: number) => void;
}) {
  return (
    <>
      <MobileCard isMobile={isMobile}>
        <p className="text-sm font-semibold text-content-primary mb-3">基本情報</p>
        <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-[120px_1fr]'}`}>
          <MobileInfoRow label="見積依頼No." value={rfqNo} />
          <MobileInfoRow label="見積G名称" value={groupName} />
          <MobileInfoRow label="発注先" value={vendorName} />
          <MobileInfoRow label="検収日" value={inspectionDate} />
        </div>
      </MobileCard>

      <MobileCard isMobile={isMobile}>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-content-primary">
            登録済: <span className="tabular-nums">{registeredCount} / {totalItems} 件</span>
          </p>
          <p className="text-xs text-content-sub tabular-nums">{progressPercent}%</p>
        </div>
        <div className="h-1.5 bg-stroke-input rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${progressPercent === 100 ? 'bg-cta-primary' : 'bg-content-primary'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </MobileCard>

      <GreenDivider />

      <MobileCard isMobile={isMobile} noPadding>
        <div className={`border-b border-stroke-card ${isMobile ? 'px-4 py-3' : 'px-5 py-4'}`}>
          <p className="text-sm font-semibold text-content-primary">個体管理品目一覧</p>
        </div>
        {orderItems.map((item) => {
          const isRegistered = registeredItemIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => !isRegistered && onSelectItem(item.id)}
              disabled={isRegistered}
              className={`flex items-center gap-3 w-full text-left border-b border-stroke-card min-h-[60px] transition-colors ${isMobile ? 'px-4 py-3.5' : 'px-5 py-4'} ${isRegistered ? 'bg-surface-select cursor-default' : 'bg-surface-card cursor-pointer hover:bg-stroke-card'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-base font-bold ${isRegistered ? 'bg-surface-select text-cta-primary' : 'bg-stroke-card text-content-sub'}`}>
                {isRegistered ? '✓' : ''}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isRegistered ? 'text-content-sub' : 'text-content-primary'}`}>
                  {item.itemName}
                </p>
                <p className="text-xs text-content-sub mt-0.5">
                  {item.model} / {item.registrationType}
                </p>
              </div>
              {!isRegistered && <span className="text-content-sub text-lg shrink-0">›</span>}
            </button>
          );
        })}
      </MobileCard>
    </>
  );
}

// ============================================================
// Shared sub components
// ============================================================
function MobileCard({
  children,
  isMobile,
  noPadding,
}: {
  children: React.ReactNode;
  isMobile: boolean;
  noPadding?: boolean;
}) {
  const padding = noPadding ? '' : isMobile ? 'p-4' : 'p-5';
  return (
    <div className={`bg-surface-card rounded-2xl shadow-sm mb-4 ${padding}`}>
      {children}
    </div>
  );
}

function GreenDivider() {
  return null;
}

function MobileInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <p className="text-xs text-content-sub font-semibold py-1">{label}</p>
      <p className="text-sm text-content-primary py-1 tabular-nums">{value || '---'}</p>
    </>
  );
}

type FooterVariant = 'default' | 'primary' | 'alert' | 'disabled';

function FooterButton({
  onClick,
  icon,
  label,
  variant,
  isMobile,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant: FooterVariant;
  isMobile: boolean;
  disabled?: boolean;
}) {
  const iconColorClass: Record<FooterVariant, string> = {
    default: 'text-content-sub',
    primary: 'text-cta-primary',
    alert: 'text-content-alert',
    disabled: 'text-content-disabled',
  };
  const textClass: Record<FooterVariant, string> = {
    default: 'text-content-sub',
    primary: 'text-cta-primary',
    alert: 'text-content-alert',
    disabled: 'text-content-disabled',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 bg-transparent border-0 rounded-lg transition-colors ${isMobile ? 'p-1 min-w-[60px]' : 'p-2 min-w-[70px]'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-stroke-card'}`}
    >
      <span className={`flex items-center justify-center ${iconColorClass[variant]}`}>
        {icon}
      </span>
      <span className={`text-xs ${textClass[variant]}`}>{label}</span>
    </button>
  );
}
