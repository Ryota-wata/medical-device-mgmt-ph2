'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useMasterStore, useEditListStore } from '@/lib/stores';
import { generateMockAssets } from '@/lib/data/generateMockAssets';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
import { AppHeader, type AppHeaderNavItem } from '@/components/layouts/AppHeader';
import { ApplicationStatusModal } from '@/components/modals/ApplicationStatusModal';

export default function MainPage() {
  const router = useRouter();
  const { user, logout, selectedFacility } = useAuthStore();
  useMasterStore();
  const { editLists, addEditList, deleteEditList } = useEditListStore();
  const { isMobile, isTablet } = useResponsive();
  const { showToast } = useToast();
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isHospitalMasterModalOpen, setIsHospitalMasterModalOpen] = useState(false);
  const [isLendingMenuModalOpen, setIsLendingMenuModalOpen] = useState(false);
  const [isApplicationStatusModalOpen, setIsApplicationStatusModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // 編集リスト関連のstate
  const [editListMode, setEditListMode] = useState<'select' | 'create'>('select');
  const [newEditListName, setNewEditListName] = useState('');

  // 削除確認ダイアログ用のstate
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetList, setDeleteTargetList] = useState<{ id: string; name: string } | null>(null);

  // モーダル表示中のbodyスクロールロック
  const isAnyModalOpen = isListModalOpen || isMasterModalOpen || isEditListModalOpen || isHospitalMasterModalOpen || isLendingMenuModalOpen || isApplicationStatusModalOpen || isLogoutConfirmOpen || deleteConfirmOpen;
  useBodyScrollLock(isAnyModalOpen);

  // 権限フック
  const {
    isAdmin,
    isShipUser,
    isHospitalUser,
    isFacilityAdmin,
    isMainButtonVisible,
    canAccess,
  } = usePermissions();



  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const executeLogout = () => {
    setIsLogoutConfirmOpen(false);
    logout();
    router.push('/login');
  };

  const handleQRRead = () => {
    showToast('QR読取機能（開発中）', 'info');
  };

  const handleEditListManagement = () => {
    setIsEditListModalOpen(true);
    setEditListMode('select');
    setIsMobileMenuOpen(false);
  };

  const closeEditListModal = () => {
    setIsEditListModalOpen(false);
    setEditListMode('select');
    setNewEditListName('');
  };

  const handleCreateEditList = () => {
    if (!newEditListName.trim()) {
      showToast('編集リスト名を入力してください', 'warning');
      return;
    }
    if (!selectedFacility) {
      showToast('施設が選択されていません', 'warning');
      return;
    }

    const baseAssets = generateMockAssets([selectedFacility]);
    addEditList({
      name: newEditListName.trim(),
      facilities: [selectedFacility],
      baseAssets,
    });

    showToast(`編集リスト「${newEditListName.trim()}」を作成しました`, 'success');
    closeEditListModal();
  };

  const handleSelectEditList = (listId: string) => {
    const params = new URLSearchParams({
      listId: listId,
    });
    router.push(`/remodel-application?${params.toString()}`);
    closeEditListModal();
  };

  const handleQuotationManagement = () => {
    setIsMobileMenuOpen(false);
    router.push('/quotation-data-box');
  };

  const showMasterModal = () => {
    setIsMobileMenuOpen(false);
    setIsMasterModalOpen(true);
  };

  const closeMasterModal = () => {
    setIsMasterModalOpen(false);
  };

  const showListModal = () => {
    setIsListModalOpen(true);
  };

  const closeListModal = () => {
    setIsListModalOpen(false);
  };

  const handleMenuSelect = (menuName: string) => {
    closeListModal();

    switch (menuName) {
      case 'QRコード発行':
        router.push('/qr-issue');
        break;
      case '現有品調査':
        router.push('/offline-prep');
        break;
      case '現有品調査内容修正':
        router.push('/registration-edit');
        break;
      case '資産台帳取込':
        router.push('/asset-import');
        break;
      case 'データ突合':
        router.push('/data-matching');
        break;
    }
  };

  const handleQRIssueFromModal = () => {
    setIsMobileMenuOpen(false);
    router.push('/qr-issue');
  };

  const handleAssetBrowseAndApplication = () => {
    router.push('/asset-search-result');
  };

  const handleMaintenanceInspection = () => {
    router.push('/inspection-prep');
  };

  const handleLendingManagement = () => {
    setIsLendingMenuModalOpen(true);
  };

  const handleRepairApplication = () => {
    router.push('/repair-request');
  };

  const handleAssetListForHospital = () => {
    router.push('/asset-search-result');
  };

  const handleAvailableDevices = () => {
    setIsLendingMenuModalOpen(false);
    router.push('/lending-available');
  };

  const handleLendingCheckout = () => {
    setIsLendingMenuModalOpen(false);
    router.push('/lending-checkout');
  };

  const handleApplicationStatus = () => {
    setIsApplicationStatusModalOpen(true);
  };

  const handleEditAnalysis = () => {
    router.push('/quotation-data-box/remodel-management');
  };

  const handleDeleteEditList = (list: { id: string; name: string }) => {
    setDeleteTargetList(list);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteEditList = () => {
    if (deleteTargetList) {
      deleteEditList(deleteTargetList.id);
      showToast(`「${deleteTargetList.name}」を削除しました`, 'success');
      setDeleteTargetList(null);
    }
  };

  // ヘッダーナビアイテムの構築（AppHeader用、visible で権限フィルタ）
  const headerNavItems: AppHeaderNavItem[] = useMemo(() => {
    return [
      { key: 'qr', label: 'QR読取', icon: 'qr', onClick: handleQRRead, visible: isShipUser },
      { key: 'editList', label: '編集・分析', icon: 'list', onClick: handleEditListManagement, visible: isMainButtonVisible('edit_list') },
      { key: 'taskMgmt', label: 'タスク管理', icon: 'clipboard', onClick: handleQuotationManagement, visible: canAccess('normal_purchase') },
      { key: 'quotation', label: '見積管理', icon: 'clipboard', onClick: () => router.push('/quotation-management'), visible: isMainButtonVisible('quotation_management') },
      { key: 'qrIssue', label: 'QRコード発行', icon: 'qr', onClick: handleQRIssueFromModal, visible: isHospitalUser && canAccess('qr_issue') },
      { key: 'master', label: 'マスタ管理', icon: 'user', onClick: isShipUser ? showMasterModal : () => { setIsMobileMenuOpen(false); setIsHospitalMasterModalOpen(true); }, visible: isMainButtonVisible('master_management') },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShipUser, isHospitalUser, isAdmin, canAccess, isMainButtonVisible]);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen p-5 font-figma">
      <div className="max-w-[1400px] mx-auto bg-surface-card rounded-lg shadow-lg w-full flex flex-col">
        {/* 共通ヘッダー（AppHeader: ロゴ + システム名 + ナビ + ユーザーメニュー） */}
        <div className="rounded-t-lg overflow-visible">
          <AppHeader navItems={headerNavItems} />
        </div>

        {/* メニューセクション */}
        <div className={`bg-surface-card ${isMobile ? 'px-4 py-5' : isTablet ? 'px-5 py-6' : 'px-8 py-10'}`}>
          <div className={`max-w-[1000px] mx-auto ${
            isMobile
              ? 'flex flex-col gap-3'
              : isTablet
                ? 'grid grid-cols-3 gap-3'
                : 'flex flex-wrap justify-center gap-3'
          }`}>
            {/* 資産リスト（全ロール） */}
            {isMainButtonVisible('asset_list') && (
              <button
                onClick={isHospitalUser ? handleAssetListForHospital : handleAssetBrowseAndApplication}
                className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
                }`}
              >
                {isHospitalUser ? '資産リスト（各種申請）' : '資産閲覧・申請'}
              </button>
            )}

            {/* 点検 */}
            {isMainButtonVisible('maintenance_inspection') && (
              <button
                onClick={handleMaintenanceInspection}
                className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
                }`}
              >
                点検
              </button>
            )}

            {/* 貸出・返却 */}
            {isMainButtonVisible('lending_management') && (
              <button
                onClick={isHospitalUser ? () => setIsLendingMenuModalOpen(true) : handleLendingManagement}
                className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
                }`}
              >
                貸出・返却
              </button>
            )}

            {/* 編集・分析 */}
            <button
              onClick={handleEditAnalysis}
              className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
              }`}
            >
              編集・分析
            </button>

            {/* 棚卸し */}
            {isMainButtonVisible('inventory') && (
              <button
                onClick={() => router.push('/inventory')}
                className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
                }`}
              >
                棚卸し
              </button>
            )}

            {/* 修理申請 */}
            {isMainButtonVisible('repair_request') && (
              <button
                onClick={handleRepairApplication}
                className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
                }`}
              >
                修理申請
              </button>
            )}

            {/* 申請ステータス（病院側のみ） */}
            {isHospitalUser && (
              <button
                onClick={handleApplicationStatus}
                className={`bg-surface-card border border-cta-primary rounded-lg font-normal text-cta-primary-dark cursor-pointer transition-all hover:bg-cta-primary hover:text-white hover:shadow-md ${
                  isMobile ? 'px-4 py-4 text-sm' : 'px-6 py-3.5 text-base'
                }`}
              >
                申請ステータス
              </button>
            )}
          </div>
        </div>

        {/* ダッシュボードボディ（次スコープ用） */}
        <div className="px-5 py-10 min-h-[300px] flex items-center justify-center flex-1">
          <div className="text-center text-content-sub text-base p-10 bg-surface-card border-2 border-dashed border-stroke-input rounded-lg max-w-[600px] mx-auto">
            <p className="text-pretty">※ ダッシュボード機能は次スコープで実装予定です</p>
          </div>
        </div>

        {/* フッター */}
        <footer className="text-center text-[10px] font-light text-content-sub py-4 border-t border-stroke-card leading-[1.3]">
          &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
        </footer>
      </div>

      {/* 個体管理リスト作成モーダル */}
      {isListModalOpen && (
        <div
          onClick={closeListModal}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-lg w-[90%] max-w-[500px] shadow-xl overflow-hidden"
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-5 border-b border-stroke-card flex justify-between items-center">
              <h2 className="m-0 text-lg font-semibold text-content-primary text-balance">個体管理リスト作成</h2>
              <button
                onClick={closeListModal}
                className="size-8 flex items-center justify-center rounded-full text-content-sub hover:bg-surface-disabled hover:text-content-primary transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* 施設選択 */}
            <div className="px-6 pt-5">
              <label className="block text-sm font-medium text-content-sub mb-2">施設選択</label>
              {selectedFacility && (
                <div className="px-4 py-2.5 bg-surface-screen border border-stroke-card rounded-md text-sm text-content-primary">
                  {selectedFacility}
                </div>
              )}
            </div>

            {/* メニューボタン */}
            <div className="p-6">
              <div className="flex flex-col gap-3">
                {['ラベル発行', '現有品調査', '現有品調査内容修正', '資産台帳取込', 'データ突合'].map((label) => {
                  const menuMap: Record<string, string> = {
                    'ラベル発行': 'QRコード発行',
                    '現有品調査': '現有品調査',
                    '現有品調査内容修正': '現有品調査内容修正',
                    '資産台帳取込': '資産台帳取込',
                    'データ突合': 'データ突合',
                  };
                  return (
                    <button
                      key={label}
                      onClick={() => handleMenuSelect(menuMap[label])}
                      className="px-4 py-3 bg-surface-card border border-stroke-input rounded-lg text-sm font-medium text-content-primary cursor-pointer transition-all hover:border-cta-primary hover:bg-[#EBF5EE]"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* マスタ管理モーダル */}
      {isMasterModalOpen && (
        <div
          onClick={closeMasterModal}
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-lg w-full max-w-[460px] max-h-[80vh] flex flex-col shadow-xl"
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-5 border-b border-stroke-card flex justify-between items-center shrink-0">
              <h2 className="m-0 text-lg font-semibold text-content-primary text-balance">マスタ管理</h2>
              <button
                onClick={closeMasterModal}
                className="size-8 flex items-center justify-center rounded-full text-content-sub hover:bg-surface-disabled hover:text-content-primary transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* モーダルコンテンツ */}
            <div className="px-6 pt-4 pb-6 overflow-y-auto overscroll-contain">
              <p className="text-sm text-content-sub mb-4 text-pretty">マスタ管理と各種リスト管理を行えます</p>
              <div className="flex flex-col gap-2">
                {/* SHIP施設マスタ */}
                {canAccess('facility_master_list') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/ship-facility-master'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    SHIP施設マスタ
                  </button>
                )}

                {/* SHIP資産マスタ */}
                {canAccess('asset_master_list') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/ship-asset-master'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    SHIP資産マスタ
                  </button>
                )}

                {/* 共通部署マスタ */}
                {canAccess('asset_master_list') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/ship-department-master'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    共通部署マスタ
                  </button>
                )}

                {/* ユーザー管理 */}
                {isMainButtonVisible('user_management') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/user-management'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    ユーザー管理
                  </button>
                )}

                {/* 個別施設マスタ → サブメニュー展開 */}
                {canAccess('hospital_dept_master_edit') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/hospital-facility-master'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    個別施設マスタ
                  </button>
                )}

                {/* 個体管理リスト作成 → サブメニュー展開 */}
                {canAccess('existing_survey') && (
                  <button
                    onClick={() => { closeMasterModal(); showListModal(); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center relative transition-all hover:bg-cta-primary hover:text-white"
                  >
                    個体管理リスト作成
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4 absolute right-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )}

                {/* 業者マスタ */}
                {canAccess('vendor_master_edit') && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/vendor-master'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    業者マスタ
                  </button>
                )}

                {/* 権限管理（system_admin のみ） */}
                {isAdmin && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/permission-management'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    権限管理
                  </button>
                )}

                {/* 施設グループ管理（system_admin のみ） */}
                {isAdmin && (
                  <button
                    onClick={() => { closeMasterModal(); router.push('/facility-group-management'); }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    施設グループ管理
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 編集リストモーダル */}
      {isEditListModalOpen && (
        <div
          onClick={closeEditListModal}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-lg w-[90%] max-w-[600px] shadow-xl overflow-visible flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="px-5 py-4 border-b border-stroke-card flex justify-between items-center">
              <h2 className="m-0 text-lg font-semibold text-content-primary text-balance">編集リスト</h2>
              <button
                onClick={closeEditListModal}
                className="size-8 flex items-center justify-center rounded-full text-content-sub hover:bg-surface-disabled hover:text-content-primary transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* タブ切り替え */}
            <div className="flex border-b border-stroke-card">
              <button
                onClick={() => setEditListMode('select')}
                className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-0 ${
                  editListMode === 'select'
                    ? 'bg-surface-card text-[#008C1D] border-b-2 border-b-[#008C1D]'
                    : 'bg-surface-screen text-content-sub hover:text-content-primary'
                }`}
              >
                作成済みリスト
              </button>
              <button
                onClick={() => setEditListMode('create')}
                className={`flex-1 py-3 text-sm font-semibold transition-all cursor-pointer border-0 ${
                  editListMode === 'create'
                    ? 'bg-surface-card text-[#008C1D] border-b-2 border-b-[#008C1D]'
                    : 'bg-surface-screen text-content-sub hover:text-content-primary'
                }`}
              >
                新規リスト作成
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-visible">
              {editListMode === 'select' ? (
                <div>
                  {editLists.length === 0 ? (
                    <p className="text-center text-content-sub p-5 text-pretty">
                      作成済みの編集リストがありません
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {editLists.map((list) => (
                        <div key={list.id} className="flex items-stretch gap-2">
                          <button
                            onClick={() => handleSelectEditList(list.id)}
                            className="flex-1 p-4 bg-surface-card border border-stroke-input rounded-lg cursor-pointer text-left transition-all hover:border-cta-primary hover:bg-[#EBF5EE]"
                          >
                            <div className="font-semibold text-sm text-content-primary mb-1">
                              {list.name}
                            </div>
                            <div className="text-xs text-content-sub">
                              施設: {list.facilities.join(', ')}
                            </div>
                            <div className="text-xs text-content-sub mt-1 tabular-nums">
                              作成日: {new Date(list.createdAt).toLocaleDateString('ja-JP')}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEditList({ id: list.id, name: list.name });
                            }}
                            className="px-3 py-2 bg-surface-card border border-stroke-input rounded-lg cursor-pointer text-[#DA0000] text-xs font-medium flex items-center justify-center transition-all hover:bg-red-50 hover:border-[#DA0000]"
                            title="削除"
                          >
                            削除
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mb-5">
                    <label className="block mb-2 text-sm font-medium text-content-primary">
                      編集リスト名称
                    </label>
                    <input
                      type="text"
                      value={newEditListName}
                      onChange={(e) => setNewEditListName(e.target.value)}
                      placeholder="例: 2025年度リモデル計画"
                      className="w-full p-3 border border-stroke-input rounded-lg text-sm focus:outline-none focus:border-cta-primary focus:ring-1 focus:ring-[#008C1D]"
                    />
                  </div>

                  {selectedFacility && (
                    <div className="mb-5">
                      <label className="block mb-2 text-sm font-medium text-content-primary">
                        取り込む原本データ（施設）を選択
                      </label>
                      <select className="w-full p-3 border border-stroke-input rounded-lg text-sm bg-surface-card focus:outline-none focus:border-cta-primary">
                        <option>{selectedFacility}</option>
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleCreateEditList}
                    disabled={!newEditListName.trim()}
                    className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors ${
                      newEditListName.trim()
                        ? 'bg-cta-primary text-white cursor-pointer hover:bg-[#008C1D]'
                        : 'bg-[#E1E1E1] text-content-sub cursor-not-allowed'
                    }`}
                  >
                    作成
                  </button>

                  <button
                    onClick={closeEditListModal}
                    className="w-full mt-2 py-2.5 text-sm font-medium text-[#DA0000] hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 病院ユーザー用マスタ管理モーダル */}
      {isHospitalMasterModalOpen && (
        <div
          onClick={() => setIsHospitalMasterModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-lg w-[90%] max-w-[460px] max-h-[90vh] shadow-xl flex flex-col"
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-5 border-b border-stroke-card flex justify-between items-center shrink-0">
              <h2 className="m-0 text-lg font-semibold text-content-primary text-balance">マスタ管理</h2>
              <button
                onClick={() => setIsHospitalMasterModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full text-content-sub hover:bg-surface-disabled hover:text-content-primary transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* モーダルボディ */}
            <div className="p-6 overflow-y-auto overscroll-contain">
              <p className="text-sm text-content-sub mb-4 text-pretty">マスタ管理と各種リスト管理を行えます</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsHospitalMasterModalOpen(false);
                    router.push('/hospital-facility-master');
                  }}
                  className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                >
                  個別部署マスタ
                </button>

                {isMainButtonVisible('user_management') && (
                  <button
                    onClick={() => {
                      setIsHospitalMasterModalOpen(false);
                      router.push('/user-management');
                    }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    ユーザー管理
                  </button>
                )}

                {isFacilityAdmin && (
                  <button
                    onClick={() => {
                      setIsHospitalMasterModalOpen(false);
                      router.push('/user-permission-management');
                    }}
                    className="px-4 py-3 bg-surface-card border border-cta-primary rounded-lg text-sm font-medium text-content-primary cursor-pointer flex items-center justify-center transition-all hover:bg-cta-primary hover:text-white"
                  >
                    ユーザー権限管理
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 貸出メニューモーダル */}
      {isLendingMenuModalOpen && (
        <div
          onClick={() => setIsLendingMenuModalOpen(false)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-card rounded-lg w-[90%] max-w-[400px] shadow-xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-stroke-card flex justify-between items-center shrink-0">
              <h2 className="m-0 text-lg font-semibold text-content-primary text-balance">貸出メニュー</h2>
              <button
                onClick={() => setIsLendingMenuModalOpen(false)}
                className="size-8 flex items-center justify-center rounded-full text-content-sub hover:bg-surface-disabled hover:text-content-primary transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="閉じる"
              >
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleAvailableDevices}
                  className="px-4 py-3 bg-surface-card border border-stroke-input rounded-lg cursor-pointer text-sm font-medium text-content-primary transition-all hover:border-cta-primary hover:bg-[#EBF5EE]"
                >
                  貸出可能機器閲覧
                </button>
                <button
                  onClick={handleLendingCheckout}
                  className="px-4 py-3 bg-surface-card border border-stroke-input rounded-lg cursor-pointer text-sm font-medium text-content-primary transition-all hover:border-cta-primary hover:bg-[#EBF5EE]"
                >
                  貸出・返却
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 申請ステータスモーダル (スライド72準拠: カード + 5ステップ進捗バー) */}
      <ApplicationStatusModal
        isOpen={isApplicationStatusModalOpen}
        onClose={() => setIsApplicationStatusModalOpen(false)}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setDeleteTargetList(null);
        }}
        onConfirm={confirmDeleteEditList}
        title="編集リストの削除"
        message={deleteTargetList ? `「${deleteTargetList.name}」を削除しますか？この操作は取り消せません。` : ''}
        confirmLabel="削除"
        cancelLabel="キャンセル"
        variant="danger"
      />

      {/* ログアウト確認ダイアログ */}
      <ConfirmDialog
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={executeLogout}
        title="ログアウト"
        message="ログアウトしますか？"
        confirmLabel="ログアウト"
        cancelLabel="キャンセル"
      />
    </div>
  );
}
