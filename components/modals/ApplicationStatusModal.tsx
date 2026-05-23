'use client';

import React, { useMemo } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAuthStore, useApplicationStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { useRepairRequestStore } from '@/lib/stores/repairRequestStore';

interface ApplicationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Detail {
  label: string;
  value: string;
  /** リンク表示 (QRラベル等) */
  link?: boolean;
  /** 重要日 (引き取り日 = 赤、お届け日 = 緑) */
  emphasisColor?: 'alert' | 'success';
}

interface UnifiedCard {
  id: string;
  applicationNo: string;
  applicationType: string;
  applicationDate: string;
  steps: string[];
  currentStepIndex: number;
  /** 受付済かどうか (まだ受付前なら step=0 だがアクティブにしない) */
  isCanceled?: boolean;
  details: Detail[];
  notice?: string;
}

// ──────────────────────────────────────────
// ステップ定義 (申請種別ごと)
// ──────────────────────────────────────────
const STEP_DEFS: Record<string, { steps: string[]; statusMap: Record<string, number> }> = {
  // 修理申請
  '修理申請': {
    steps: ['受付', '依頼済', '引取済', '修理中', '完了'],
    statusMap: { '受付': 0, '依頼済': 1, '引取済': 2, '修理中': 3, '完了': 4 },
  },
  // 購入 (新規/更新/増設 共通)
  '購入': {
    steps: ['申請中', '編集中', '見積中', '発注済', '完了'],
    statusMap: {
      '申請中': 0,
      '却下': 0,
      '編集中': 1,
      '見積中': 2,
      '発注済': 3,
      '納品済': 3,
      '検収済': 4,
      '完了': 4,
    },
  },
  // 移動申請
  '移動申請': {
    steps: ['申請中', '承認済', '見積中', '実施中', '完了'],
    statusMap: {
      '承認待ち': 0,
      '申請中': 0,
      '承認済み': 1,
      '見積依頼中': 2,
      '見積中': 2,
      '発注済': 3,
      '実施中': 3,
      '完了': 4,
    },
  },
  // 廃棄申請
  '廃棄申請': {
    steps: ['申請中', '承認済', '見積依頼', '業者決定', '完了'],
    statusMap: {
      '承認待ち': 0,
      '申請中': 0,
      '承認済み': 1,
      '見積依頼中': 2,
      '見積中': 2,
      '発注済': 3,
      '業者決定': 3,
      '完了': 4,
    },
  },
};

function resolveStep(applicationType: string, status: string): { steps: string[]; index: number } {
  // 購入系は applicationType を共通キーへ変換
  const key = ['新規申請', '更新申請', '増設申請'].includes(applicationType)
    ? '購入'
    : applicationType;
  const def = STEP_DEFS[key];
  if (!def) {
    return { steps: ['受付', '進行中', '完了'], index: 0 };
  }
  const idx = def.statusMap[status] ?? 0;
  return { steps: def.steps, index: idx };
}

// ──────────────────────────────────────────
// メインコンポーネント
// ──────────────────────────────────────────
export function ApplicationStatusModal({ isOpen, onClose }: ApplicationStatusModalProps) {
  const { isMobile, isTablet } = useResponsive();
  const { user } = useAuthStore();
  const { applications: purchaseApps } = usePurchaseApplicationStore();
  const { applications: generalApps } = useApplicationStore();
  const { requests: repairRequests } = useRepairRequestStore();

  const userDepartment = user?.department || '';

  const cards = useMemo((): UnifiedCard[] => {
    const result: UnifiedCard[] = [];

    // 修理申請
    repairRequests
      .filter((req) => req.applicantDepartment === userDepartment)
      .forEach((req) => {
        const { steps, index } = resolveStep('修理申請', req.status);
        const details: Detail[] = [
          { label: '修理依頼No.', value: req.requestNo },
          { label: '依頼日', value: req.requestDate },
          { label: '申請部署', value: req.applicantDepartment },
          { label: '申請者', value: req.applicantName },
          { label: 'QRラベル', value: req.qrLabel, link: true },
          { label: '品目', value: req.itemName },
          { label: 'メーカー', value: req.maker },
          { label: '型式', value: req.model },
          { label: 'シリアルNo.', value: req.serialNo },
          { label: '設置場所', value: `${req.installDepartment} / ${req.roomName}` },
          { label: '受付担当部署', value: req.receptionDepartment },
          { label: '担当者', value: req.receptionPerson },
          { label: '連絡先', value: req.receptionContact },
        ];
        if (req.pickupDate) {
          details.push({ label: '引き取り日', value: req.pickupDate, emphasisColor: 'alert' });
        }
        if (req.deliveryDate) {
          details.push({ label: 'お届け日', value: req.deliveryDate, emphasisColor: 'success' });
        }
        const notice = req.alternativeDevice && req.alternativeReturnDate
          ? `代替え機は ${req.alternativeReturnDate} に返却してください。`
          : undefined;
        result.push({
          id: `rep-${req.id}`,
          applicationNo: req.requestNo,
          applicationType: '修理申請',
          applicationDate: req.requestDate,
          steps,
          currentStepIndex: index,
          details,
          notice,
        });
      });

    // 購入 (新規/更新/増設)
    purchaseApps
      .filter((app) => app.applicantDepartment === userDepartment)
      .forEach((app) => {
        const { steps, index } = resolveStep(app.applicationType, app.status);
        const asset = app.assets[0];
        const details: Detail[] = [
          { label: '申請No.', value: app.applicationNo },
          { label: '申請日', value: app.applicationDate },
          { label: '申請種別', value: app.applicationType },
          { label: '申請部署', value: app.applicantDepartment },
          { label: '申請者', value: app.applicantName },
        ];
        if (asset?.qrCode) details.push({ label: 'QRラベル', value: asset.qrCode, link: true });
        if (asset?.name) details.push({ label: '品目', value: asset.name });
        if (asset?.maker) details.push({ label: 'メーカー', value: asset.maker });
        if (asset?.model) details.push({ label: '型式', value: asset.model });
        if (asset?.quantity) details.push({ label: '数量', value: `${asset.quantity} ${asset.unit}` });
        details.push({ label: '設置場所', value: `${app.department} / ${app.section} / ${app.roomName}` });
        if (app.desiredDeliveryDate) {
          details.push({ label: '希望納期', value: app.desiredDeliveryDate, emphasisColor: 'alert' });
        }
        if (app.status === '却下') {
          result.push({
            id: `pa-${app.id}`,
            applicationNo: app.applicationNo,
            applicationType: app.applicationType,
            applicationDate: app.applicationDate,
            steps,
            currentStepIndex: -1,
            isCanceled: true,
            details,
            notice: 'この申請は却下されました。',
          });
        } else {
          result.push({
            id: `pa-${app.id}`,
            applicationNo: app.applicationNo,
            applicationType: app.applicationType,
            applicationDate: app.applicationDate,
            steps,
            currentStepIndex: index,
            details,
          });
        }
      });

    // 移動・廃棄
    generalApps
      .filter((app) =>
        (app.applicationType === '移動申請' || app.applicationType === '廃棄申請') &&
        app.facility.department === userDepartment
      )
      .forEach((app) => {
        const { steps, index } = resolveStep(app.applicationType, app.status);
        const details: Detail[] = [
          { label: '申請No.', value: app.applicationNo },
          { label: '申請日', value: app.applicationDate },
          { label: '申請種別', value: app.applicationType },
          { label: '申請部署', value: app.facility.department },
          { label: '設置場所', value: `${app.facility.section} / ${app.roomName}` },
          { label: '品目', value: app.asset.name },
          { label: '型式', value: app.asset.model },
          { label: '数量', value: `${app.quantity} ${app.unit}` },
        ];
        if (app.applicationType === '移動申請' && app.transferDestination) {
          const dst = app.transferDestination;
          details.push({
            label: '移動先',
            value: `${dst.department} / ${dst.section} / ${dst.roomName}`,
          });
        }
        if (app.vendor) details.push({ label: '業者', value: app.vendor });
        if (app.applicationReason) details.push({ label: '申請理由', value: app.applicationReason });
        result.push({
          id: `gen-${app.id}`,
          applicationNo: app.applicationNo,
          applicationType: app.applicationType,
          applicationDate: app.applicationDate,
          steps,
          currentStepIndex: index,
          details,
        });
      });

    // 申請日降順
    return result.sort(
      (a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime(),
    );
  }, [repairRequests, purchaseApps, generalApps, userDepartment]);

  if (!isOpen) return null;

  // ──────────────────────────────────────────
  // ステップバー描画
  // ──────────────────────────────────────────
  const renderStepBar = (steps: string[], currentIndex: number, canceled?: boolean) => {
    return (
      <div className={`flex items-center justify-between ${isMobile ? 'px-2 py-3 gap-0' : 'px-6 py-4'}`}>
        {steps.map((label, i) => {
          const isDone = !canceled && i <= currentIndex;
          const isCurrent = !canceled && i === currentIndex;
          const dotColor = isDone ? '#008C1D' : '#FFFFFF';
          const dotBorder = isDone ? '#008C1D' : '#D6D6D6';
          const lineColor = !canceled && i < currentIndex ? '#008C1D' : '#D6D6D6';
          const labelColor = isDone ? '#4A4A4A' : '#8A8A8A';
          const labelWeight = isCurrent ? 700 : isDone ? 600 : 500;
          return (
            <React.Fragment key={`${label}-${i}`}>
              <div className="flex flex-col items-center gap-1 shrink-0 min-w-0">
                <div
                  className="rounded-full"
                  style={{
                    width: isMobile ? 12 : 14,
                    height: isMobile ? 12 : 14,
                    background: dotColor,
                    border: `2px solid ${dotBorder}`,
                  }}
                />
                <span
                  style={{
                    fontSize: isMobile ? 10 : 12,
                    color: labelColor,
                    fontWeight: labelWeight,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 mx-1"
                  style={{
                    height: 2,
                    background: lineColor,
                    marginBottom: isMobile ? 14 : 16,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] ${
        isMobile ? 'p-2' : 'p-4'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-surface-card rounded-lg shadow-xl w-full flex flex-col ${
          isMobile ? 'max-h-[95vh] max-w-full' : isTablet ? 'max-h-[90vh] max-w-[760px]' : 'max-h-[90vh] max-w-[900px]'
        }`}
      >
        {/* ヘッダー */}
        <div
          className={`flex items-center justify-between bg-surface-card border-b border-stroke-input rounded-t-lg ${
            isMobile ? 'px-4 py-3' : 'px-6 py-4'
          }`}
        >
          <h2 className={`font-bold text-content-primary text-balance ${isMobile ? 'text-base' : 'text-lg'}`}>
            申請ステータス
          </h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-content-sub hover:bg-stroke-card hover:text-content-primary transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 申請部署情報バー */}
        <div
          className={`flex items-center gap-3 bg-surface-screen border-b border-stroke-input ${
            isMobile ? 'px-4 py-2.5' : 'px-6 py-3'
          }`}
        >
          <span className={`text-content-sub ${isMobile ? 'text-xs' : 'text-sm'}`}>申請部署</span>
          <span className={`font-semibold text-content-primary ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {userDepartment || '-'}
          </span>
          <span className={`ml-auto text-content-sub tabular-nums ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {cards.length}件
          </span>
        </div>

        {/* 申請カード一覧 */}
        <div className={`flex-1 overflow-y-auto overscroll-contain ${isMobile ? 'p-3' : 'p-5'} bg-surface-screen`}>
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-content-sub">
              <p className={isMobile ? 'text-sm' : 'text-base'}>申請履歴がありません</p>
              <p className={`mt-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                資産リスト画面から各種申請を行ってください
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-surface-card rounded-lg border border-stroke-input overflow-hidden"
                >
                  {/* 申請種別 + 申請No. ラベル */}
                  <div
                    className={`flex items-center justify-between bg-surface-screen border-b border-stroke-input ${
                      isMobile ? 'px-3 py-2' : 'px-4 py-2.5'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                        isMobile ? 'text-[10px]' : 'text-xs'
                      } bg-stroke-card text-content-primary`}
                    >
                      {card.applicationType}
                    </span>
                    <span
                      className={`font-mono text-content-sub tabular-nums ${
                        isMobile ? 'text-[11px]' : 'text-xs'
                      }`}
                    >
                      {card.applicationNo}
                    </span>
                  </div>

                  {/* ステップバー */}
                  {renderStepBar(card.steps, card.currentStepIndex, card.isCanceled)}

                  {/* 詳細グリッド */}
                  <div
                    className={`grid border-t border-stroke-input ${
                      isMobile ? 'grid-cols-1' : 'grid-cols-2'
                    }`}
                  >
                    {card.details.map((d, idx) => (
                      <div
                        key={`${card.id}-${idx}`}
                        className="grid grid-cols-[110px_1fr] border-b border-stroke-input last:border-b-0"
                      >
                        <div
                          className={`bg-surface-screen border-r border-stroke-input flex items-center text-content-sub font-medium ${
                            isMobile ? 'px-3 py-2 text-xs' : 'px-3 py-2.5 text-[13px]'
                          }`}
                        >
                          {d.label}
                        </div>
                        <div
                          className={`flex items-center font-medium ${
                            isMobile ? 'px-3 py-2 text-xs' : 'px-3 py-2.5 text-[13px]'
                          }`}
                          style={{
                            color: d.emphasisColor === 'alert'
                              ? '#DA0000'
                              : d.emphasisColor === 'success'
                              ? '#008C1D'
                              : d.link
                              ? '#087CB6'
                              : '#4A4A4A',
                            fontWeight: d.emphasisColor || d.link ? 600 : 500,
                          }}
                        >
                          {d.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 注意書きバナー */}
                  {card.notice && (
                    <div
                      className={`flex items-start gap-2 border-t border-stroke-input ${
                        isMobile ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-[13px]'
                      }`}
                      style={{
                        background: '#FDF1E5',
                        color: '#4A4A4A',
                      }}
                    >
                      <AlertCircle size={16} style={{ color: '#DA0000', flexShrink: 0, marginTop: 2 }} />
                      <span>{card.notice}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div
          className={`flex items-center justify-end border-t border-stroke-input bg-surface-card rounded-b-lg ${
            isMobile ? 'px-4 py-3' : 'px-6 py-4'
          }`}
        >
          <button
            onClick={onClose}
            className={`bg-surface-card text-content-primary border border-stroke-input rounded-md font-semibold cursor-pointer hover:bg-surface-screen transition-colors ${
              isMobile ? 'px-4 py-2 text-sm' : 'px-5 py-2.5 text-sm'
            }`}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
