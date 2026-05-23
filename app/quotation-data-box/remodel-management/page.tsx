'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, Monitor, Smartphone, X } from 'lucide-react';
import { useRfqGroupStore } from '@/lib/stores/rfqGroupStore';
import { useEditListStore } from '@/lib/stores/editListStore';
import { RfqGroupStatus } from '@/lib/types';
import { Header } from '@/components/layouts/Header';
import { RfqGroupsTab } from '../components/RfqGroupsTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function RemodelManagementContent() {
  const router = useRouter();
  const { rfqGroups, updateRfqGroup } = useRfqGroupStore();
  const { editLists } = useEditListStore();

  const [selectedEditListId, setSelectedEditListId] = useState<string>('');

  const [rfqStatusFilter, setRfqStatusFilter] = useState<RfqGroupStatus | ''>('');
  const filteredRfqGroups = useMemo(() => {
    if (!rfqStatusFilter) return rfqGroups;
    return rfqGroups.filter(g => g.status === rfqStatusFilter);
  }, [rfqGroups, rfqStatusFilter]);

  const handleNavigateToRfqProcess = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/rfq-process?rfqGroupId=${rfqGroupId}`);
  };
  const handleStartOrderRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/order-registration?rfqGroupId=${rfqGroupId}`);
  };
  const handleStartInspectionRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/inspection-registration?rfqGroupId=${rfqGroupId}`);
  };

  const [showModeSelection, setShowModeSelection] = useState(false);
  const [pendingRfqGroupId, setPendingRfqGroupId] = useState<number | null>(null);

  const handleStartAssetProvisionalRegistration = (rfqGroupId: number) => {
    setPendingRfqGroupId(rfqGroupId);
    setShowModeSelection(true);
  };

  const handleStartAssetRegistration = (rfqGroupId: number) => {
    router.push(`/quotation-data-box/asset-registration?rfqGroupId=${rfqGroupId}`);
  };

  const handleModeSelected = (mode: 'mobile' | 'pc') => {
    if (pendingRfqGroupId !== null) {
      router.push(`/quotation-data-box/asset-provisional-registration?rfqGroupId=${pendingRfqGroupId}&mode=${mode}`);
    }
    setShowModeSelection(false);
    setPendingRfqGroupId(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const handleApprove = (rfqGroupId: number) => {
    const group = rfqGroups.find(g => g.id === rfqGroupId);
    if (!group) return;
    if (group.status === '廃棄承認待ち') {
      updateRfqGroup(rfqGroupId, { status: '廃棄承認済み', approvalDate: today });
    } else if (group.status === '移動承認待ち') {
      updateRfqGroup(rfqGroupId, { status: '移動承認済み', approvalDate: today });
    }
  };
  const handleReject = (rfqGroupId: number) => {
    updateRfqGroup(rfqGroupId, { status: '申請を見送る', rejectionDate: today });
  };
  const handleCompleteDisposal = (rfqGroupId: number) => {
    updateRfqGroup(rfqGroupId, { status: '廃棄完了', completionDate: today });
  };
  const handleCompleteTransfer = (rfqGroupId: number) => {
    updateRfqGroup(rfqGroupId, { status: '移動完了', completionDate: today });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        centerContent={
          <div className="flex items-center gap-3">
            <div className="bg-content-alert px-4 py-1.5 rounded-md flex items-center gap-2">
              <span className="text-xs text-white font-bold">編集リスト:</span>
              <select
                value={selectedEditListId}
                onChange={(e) => setSelectedEditListId(e.target.value)}
                className="px-2 py-1 text-xs border-0 rounded-sm bg-surface-card min-w-[180px] focus:outline-none"
              >
                <option value="">選択してください</option>
                {editLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (selectedEditListId) {
                  router.push(`/remodel-application?listId=${selectedEditListId}`);
                } else {
                  router.push('/remodel-application');
                }
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-surface-card text-content-primary border border-stroke-input rounded-md cursor-pointer text-xs font-semibold whitespace-nowrap transition-colors hover:bg-surface-screen"
            >
              編集リスト
              <ArrowRight className="w-3.5 h-3.5" aria-hidden />
            </button>
            <button
              onClick={() => {
                if (selectedEditListId) {
                  router.push(`/quotation-data-box/remodel-dashboard?editListId=${selectedEditListId}`);
                } else {
                  router.push('/quotation-data-box/remodel-dashboard');
                }
              }}
              className="px-3.5 py-1.5 bg-cta-primary text-white border border-cta-primary rounded-md cursor-pointer text-xs font-semibold whitespace-nowrap transition-colors hover:bg-cta-primary-dark hover:border-cta-primary-dark"
            >
              ダッシュボード
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          <SubTabNavigation activeTab="remodelManagement" />

          <div className="bg-surface-card px-4 py-3 border-b border-stroke-input flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs text-content-primary">見積区分</label>
              <select className="px-2 py-1 text-xs border border-stroke-input rounded-sm bg-surface-card focus:outline-none focus:border-cta-primary">
                <option value="">すべて</option>
                <option value="purchase">購入</option>
                <option value="lease">リース</option>
                <option value="installment">割賦</option>
                <option value="rental">レンタル</option>
                <option value="trial">試用</option>
                <option value="borrow">借用</option>
                <option value="repair">修理</option>
                <option value="maintenance">保守</option>
                <option value="inspection">点検</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-content-primary">見積フェーズ</label>
              <select className="px-2 py-1 text-xs border border-stroke-input rounded-sm bg-surface-card focus:outline-none focus:border-cta-primary">
                <option value="">すべて</option>
                <option value="listPrice">定価</option>
                <option value="estimate">概算</option>
                <option value="final">最終原本登録用</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-content-primary">ステータス</label>
              <select
                value={rfqStatusFilter}
                onChange={(e) => setRfqStatusFilter(e.target.value as RfqGroupStatus | '')}
                className="px-2 py-1 text-xs border border-stroke-input rounded-sm bg-surface-card focus:outline-none focus:border-cta-primary"
              >
                <option value="">すべて</option>
                <option value="見積依頼">見積依頼</option>
                <option value="見積依頼済">見積依頼済</option>
                <option value="見積DB登録済">見積DB登録済</option>
                <option value="見積登録依頼中">見積登録依頼中</option>
                <option value="発注用見積依頼済">発注用見積依頼済</option>
                <option value="発注見積登録済">発注見積登録済</option>
                <option value="発注済">発注済</option>
                <option value="納期確定">納期確定</option>
                <option value="検収済">検収済</option>
                <option value="完了">完了</option>
                <option value="申請を見送る">申請を見送る</option>
                <option value="廃棄承認待ち">廃棄承認待ち</option>
                <option value="廃棄承認済み">廃棄承認済み</option>
                <option value="廃棄完了">廃棄完了</option>
                <option value="移動承認待ち">移動承認待ち</option>
                <option value="移動承認済み">移動承認済み</option>
                <option value="移動完了">移動完了</option>
              </select>
            </div>
          </div>

          <div className="flex-1 bg-surface-card overflow-auto">
            <RfqGroupsTab
              rfqGroups={filteredRfqGroups}
              onSendRfq={handleNavigateToRfqProcess}
              onRegisterQuotation={handleNavigateToRfqProcess}
              onRegisterOrder={handleStartOrderRegistration}
              onRegisterInspection={handleStartInspectionRegistration}
              onRegisterAssetProvisional={handleStartAssetProvisionalRegistration}
              onRegisterAsset={handleStartAssetRegistration}
              onUpdateDeadline={(id, field, value) => updateRfqGroup(id, { [field]: value })}
              onApprove={handleApprove}
              onReject={handleReject}
              onCompleteDisposal={handleCompleteDisposal}
              onCompleteTransfer={handleCompleteTransfer}
            />
          </div>
        </div>
      </div>

      {/* 資産仮登録モード選択ダイアログ (Figma 342:56859 準拠) */}
      {showModeSelection && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50">
          <div className="bg-surface-card rounded-xl p-6 max-w-[520px] w-[90%] shadow-2xl relative">
            <button
              onClick={() => { setShowModeSelection(false); setPendingRfqGroupId(null); }}
              aria-label="閉じる"
              className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-md text-content-primary hover:bg-stroke-card bg-transparent border-0"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-content-primary mb-2 text-balance">資産仮登録の入力方法を選択</h2>
            <p className="text-xs text-content-sub mb-5">登録作業の状況に応じて入力方法を選んでください。</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleModeSelected('mobile')}
                className="flex items-center gap-4 p-4 border border-stroke-input rounded-lg bg-surface-card cursor-pointer text-left transition-colors hover:border-cta-primary-dark"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-select flex items-center justify-center shrink-0 text-cta-primary-dark">
                  <Smartphone className="w-5 h-5" aria-hidden />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-content-primary mb-1">モバイル（現場作業）</p>
                  <p className="text-xs text-content-sub leading-relaxed">
                    現場でQRラベル貼付・写真撮影・シリアルNo.入力を行います。<br />
                    1品目ずつ登録する操作フローです。
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-content-sub" aria-hidden />
              </button>

              <button
                onClick={() => handleModeSelected('pc')}
                className="flex items-center gap-4 p-4 border border-stroke-input rounded-lg bg-surface-card cursor-pointer text-left transition-colors hover:border-cta-primary-dark"
              >
                <div className="w-10 h-10 rounded-lg bg-stroke-card flex items-center justify-center shrink-0 text-content-primary">
                  <Monitor className="w-5 h-5" aria-hidden />
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-content-primary mb-1">PC（手書き検収書から手入力）</p>
                  <p className="text-xs text-content-sub leading-relaxed">
                    手書き検収書の内容をテーブル形式で一括入力します。<br />
                    全品目を一覧しながら効率的に登録できます。
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-content-sub" aria-hidden />
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => { setShowModeSelection(false); setPendingRfqGroupId(null); }}
                className="bg-transparent border-0 text-sm text-cta-primary-dark underline cursor-pointer px-3 py-1"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RemodelManagementPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-content-sub">読み込み中...</div>}>
      <RemodelManagementContent />
    </Suspense>
  );
}
