'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Asset } from '@/lib/types';
import { PurchaseApplication } from '@/lib/types/purchaseApplication';
import { useMasterStore, useApplicationStore, useHospitalFacilityStore, useIndividualStore, useEditListStore, useRfqGroupStore, useQuotationStore, useAuthStore } from '@/lib/stores';
import { usePurchaseApplicationStore } from '@/lib/stores/purchaseApplicationStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ColumnSettingsModal } from '@/components/ui/ColumnSettingsModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useAssetFilter } from '@/lib/hooks/useAssetFilter';
import { useAssetTable } from '@/lib/hooks/useAssetTable';
import { useColumnFeatures } from '@/lib/hooks/useColumnFeatures';
import { Header } from '@/components/layouts/Header';
import { REMODEL_COLUMNS, REMODEL_COLUMN_GROUPS, type ColumnDef } from '@/lib/constants/assetColumns';
import { RfqGroupModal } from '@/components/remodel/RfqGroupModal';
import dynamic from 'next/dynamic';
// DataLinkModal は 1100行超 + 大きな依存があるため、初回モーダル表示時まで遅延ロード
const DataLinkModal = dynamic(
  () => import('@/components/remodel/DataLinkModal').then(m => m.DataLinkModal),
  { ssr: false }
);
import { generateMockAssets, BUILDING_LIST } from '@/lib/data/generateMockAssets';
import { customerEditListItems } from '@/lib/data/customer/edit-list';

const ALL_COLUMNS = REMODEL_COLUMNS;

function RemodelApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applications } = useApplicationStore();
  const { getNewLocationByCurrentLocation, facilities: hospitalFacilities, swapToNewLocation } = useHospitalFacilityStore();
  const { individuals, updateIndividual } = useIndividualStore();
  const { getEditListById, addItemsFromApplications, updateRfqInfo, updateBaseAsset, addBaseAssets, removeBaseAsset, removeItem, reorderBaseAssets, reorderItems } = useEditListStore();
  const { addRfqGroup, generateRfqNo, generateDisposalNo, generateTransferNo, rfqGroups } = useRfqGroupStore();
  const { assets: assetMasters, vendors, setAssets } = useMasterStore();

  // 顧客資産マスタの遅延ロード（DataLink紐付けに必要）
  useEffect(() => {
    if (assetMasters.length < 10000) {
      import('@/lib/data/customer/asset-master').then(({ customerAssetMasters }) => {
        const mapped = customerAssetMasters.map((item, i) => ({
          ...item,
          id: item.assetMasterId || `AST-${i}`,
          manufacturer: item.jmdnManufacturer || '',
          packageInsertDocument: item.packageInsert || '',
          specification: '',
          unitPrice: 0,
          depreciationYears: parseInt(item.legalServiceLife || '0', 10) || 0,
          maintenanceCycle: 0,
          status: 'active' as const,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        })) as import('@/lib/types/master').AssetMaster[];
        setAssets(mapped);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { quotationGroups, quotationItems } = useQuotationStore();
  const { applications: purchaseApplications } = usePurchaseApplicationStore();
  const { isMobile } = useResponsive();

  // URLパラメータから編集リストIDを取得
  const listId = searchParams.get('listId') || '';
  const editList = listId ? getEditListById(listId) : null;

  // 編集リストがない場合はauthStoreの選択施設を使用
  const { selectedFacility: authFacility } = useAuthStore();
  const facility = editList ? editList.facilities.join(', ') : (authFacility || '');
  const department = searchParams.get('department') || '';

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentView, setCurrentView] = useState<'list' | 'card'>('list');
  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = useState(false);

  // 編集リストモードかどうか（listIdが指定されていて編集リストが存在する場合）
  const isEditListMode = Boolean(listId && editList);

  // インライン申請実行関連の状態
  const [showApplicationConfirm, setShowApplicationConfirm] = useState(false);
  const [applicationBreakdown, setApplicationBreakdown] = useState<Record<string, number>>({});
  const [applicationErrors, setApplicationErrors] = useState<{ rowNo: number; field: string; message: string }[]>([]);
  const [appliedRows, setAppliedRows] = useState<Set<number>>(new Set());
  const [errorRows, setErrorRows] = useState<Set<number>>(new Set());
  const [applicationFeedback, setApplicationFeedback] = useState<string | null>(null);

  // 見積依頼グループ作成モーダル関連の状態
  const [isRfqGroupModalOpen, setIsRfqGroupModalOpen] = useState(false);
  const [rfqGroupName, setRfqGroupName] = useState('');

  // Data Linkモーダル関連の状態
  const [isDataLinkModalOpen, setIsDataLinkModalOpen] = useState(false);
  const [dataLinkMode, setDataLinkMode] = useState<'copy' | 'quotation'>('copy');

  // 購入区分の確認ダイアログ
  const [showUpdateConfirm, setShowUpdateConfirm] = useState<{ rowNo: number } | null>(null);
  const [showAdditionInput, setShowAdditionInput] = useState<{ rowNo: number; quantity: number } | null>(null);

  // セル編集関連の状態
  const [editingCell, setEditingCell] = useState<{ rowNo: number; colKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ rowNo: number; colKey: string } | null>(null);

  // 資産マスタ選択（インライン新規用）
  interface SelectedAsset {
    asset: Asset;
    quantity: number;
    unit: string;
  }
  const [selectedAssets, setSelectedAssets] = useState<SelectedAsset[]>([]);

  // クローズ確認モーダル
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);

  // インライン新規申請モード（複数行まとめて編集可）
  type InlineNewRow = { id: string; data: Record<string, string> };
  const [isInlineNewMode, setIsInlineNewMode] = useState(false);
  const [inlineNewRows, setInlineNewRows] = useState<InlineNewRow[]>([]);
  const [inlineEditingCell, setInlineEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [inlineEditingValue, setInlineEditingValue] = useState('');
  const inlineNewRowRef = useRef<HTMLTableRowElement>(null);

  // 全体検索（REQ-140④）
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // フリーカラム（REQ-141④）
  type FreeColumn = { key: string; label: string };
  const [freeColumns, setFreeColumns] = useState<FreeColumn[]>([]);
  const [freeColumnValues, setFreeColumnValues] = useState<Record<number, Record<string, string>>>({});
  const [isAddFreeColumnOpen, setIsAddFreeColumnOpen] = useState(false);
  const [freeColumnLabelDraft, setFreeColumnLabelDraft] = useState('');

  // レコード削除確認（REQ-142③）
  const [deleteRowConfirm, setDeleteRowConfirm] = useState<{ no: number; assetName: string } | null>(null);

  // フリーカラム削除確認（REQ-141④）
  const [deleteFreeColumnConfirm, setDeleteFreeColumnConfirm] = useState<{ key: string; label: string } | null>(null);

  // クローズ処理
  const handleCloseProject = () => {
    const facilityMasters = hospitalFacilities.filter(f => f.hospitalName === facility);

    // 個別部署マスタの新居→現状への切り替え
    facilityMasters.forEach(f => {
      if (f.status !== 'completed' && f.newFloor) {
        swapToNewLocation(f.id);
      }
    });

    // 個体管理の設置場所更新
    individuals.forEach(ind => {
      const matchingFacility = facilityMasters.find(f =>
        f.oldFloor === ind.location.floor &&
        f.oldDepartment === ind.location.department
      );
      if (matchingFacility && matchingFacility.newFloor) {
        updateIndividual(ind.id, {
          location: {
            ...ind.location,
            floor: matchingFacility.newFloor,
            department: matchingFacility.newDepartment,
            section: matchingFacility.newSection,
          },
        });
      }
    });

    alert('リモデル管理をクローズしました。\n\n・個別部署マスタの新居が現状に反映されました\n・資産の設置場所が更新されました');
    setShowCloseConfirmModal(false);
  };

  // 対象施設リスト
  const targetFacilities = editList ? editList.facilities : (facility ? [facility] : []);

  // モックデータ（顧客サンプルデータ → 従来モック のフォールバック）
  // 見積DB Linkデモ用: 顧客サンプルの rfqNo はプレースホルダ（"QT●●-●●●●●"）なので
  // 各見積依頼に少数（2-3件）だけrfqNo/groupNameを割当て、残りは空にする
  const DEMO_RFQ_ASSIGNMENTS: { rfqNo: string; rfqGroupName: string; count: number }[] = [
    { rfqNo: 'RFQ-20250110-0001', rfqGroupName: '2025年度放射線科機器更新', count: 2 },
    { rfqNo: 'RFQ-20250113-0003', rfqGroupName: '2025年度検査科・手術室機器更新', count: 3 },
    { rfqNo: 'QT26-00001', rfqGroupName: '耳鼻科ユニット 一式', count: 2 },
  ];
  const getDemoAssignment = (i: number): { rfqNo: string; rfqGroupName: string } => {
    let cursor = 0;
    for (const a of DEMO_RFQ_ASSIGNMENTS) {
      if (i < cursor + a.count) return { rfqNo: a.rfqNo, rfqGroupName: a.rfqGroupName };
      cursor += a.count;
    }
    return { rfqNo: '', rfqGroupName: '' };
  };
  const [mockAssets, setMockAssets] = useState<Asset[]>(() => {
    if (customerEditListItems.length > 0) {
      return customerEditListItems.map((item, i) => ({
        qrCode: item.qrCode || '',
        no: i + 1,
        facility: facility || 'サンプル病院',
        building: item.currentBuilding || '',
        floor: item.currentFloor || '',
        department: item.currentDivision || '',
        section: item.currentDepartment || '',
        category: item.category || '',
        largeClass: item.largeClass || '',
        mediumClass: item.mediumClass || '',
        item: item.itemName || '',
        name: item.itemName || '',
        maker: item.manufacturer || '',
        model: item.model || '',
        quantity: item.quantity || 0,
        width: '', depth: '', height: '',
        roomName: item.currentRoom || '',
        // 共通部署マスタ
        commonDivision: item.commonDivision || '',
        commonDepartment: item.commonDepartment || '',
        roomCategory1: item.roomCategory1 || '',
        roomCategory2: item.roomCategory2 || '',
        // 設置ID
        divisionId: item.divisionId || '',
        departmentId: item.departmentId || '',
        roomId: item.roomId || '',
        // 設置情報（現）
        currentBuilding: item.currentBuilding || '',
        currentFloor: item.currentFloor || '',
        currentDivision: item.currentDivision || '',
        currentDepartment: item.currentDepartment || '',
        currentRoom: item.currentRoom || '',
        // 設置情報（新）
        newBuilding: item.newBuilding || '',
        newFloor: item.newFloor || '',
        newDivision: item.newDivision || '',
        newDepartment: item.newDepartment || '',
        newRoom: item.newRoom || '',
        // 識別情報
        serialNo: item.serialNo || '',
        fixedAssetNo: item.fixedAssetNo || '',
        meNo: item.meNo || '',
        assetMasterId: item.assetMasterId || '',
        // 品目情報
        itemType: item.itemType || '',
        parentItem: item.parentItem || '',
        itemName: item.itemName || '',
        manufacturer: item.manufacturer || '',
        unit: item.unit || '',
        managementDept: item.managementDept || '',
        deviceType: item.deviceType || '',
        assetGroupName: item.assetGroupName || '',
        purpose: item.purpose || '',
        remarks: item.remarks || '',
        // 申請情報
        applicationType: item.applicationType || '',
        fiscalYear: item.fiscalYear || '',
        priority: item.priority || '',
        systemConnection: item.systemConnection || '',
        systemTarget: item.systemTarget || '',
        // 要望情報
        wish1Manufacturer: item.wish1Manufacturer || '',
        wish1Model: item.wish1Model || '',
        wish2Manufacturer: item.wish2Manufacturer || '',
        wish2Model: item.wish2Model || '',
        wish3Manufacturer: item.wish3Manufacturer || '',
        wish3Model: item.wish3Model || '',
        // 見積情報
        // プレースホルダ（"QT●●-●●●●●" 等）の場合はデモ用rfqNoとgroupNameを割当、それ以外は元の値
        rfqNo: (item.rfqNo && !item.rfqNo.includes('●')) ? item.rfqNo : getDemoAssignment(i).rfqNo,
        rfqGroupName: (item.rfqNo && !item.rfqNo.includes('●')) ? (item.rfqGroupName || '') : getDemoAssignment(i).rfqGroupName,
        quotationPhase: item.quotationPhase || '',
        quotationDate: item.quotationDate || '',
        accountCategory: item.accountCategory || '',
        listPriceUnit: item.listPriceUnit || 0,
        listPriceTotal: item.listPriceTotal || 0,
        quotationPriceUnit: item.quotationPriceUnit || 0,
        quotationPriceExTax: item.quotationPriceExTax || 0,
        quotationPriceInTax: item.quotationPriceInTax || 0,
      } as Asset));
    }
    return generateMockAssets(targetFacilities);
  });

  // 表示用データソース：編集リストモード時はbaseAssets + items、従来モードはmockAssets
  const displayAssets: Asset[] = useMemo(() => {
    if (isEditListMode && editList) {
      // 原本資産にsourceType: 'base'を付与
      const baseWithSource: Asset[] = (editList.baseAssets || []).map(asset => ({
        ...asset,
        sourceType: 'base' as const,
      }));

      // 追加された要望機器をAsset型に変換
      const itemsAsAssets: Asset[] = (editList.items || []).map((item, index) => ({
        qrCode: item.qrCode || '',
        no: 90000 + index, // 追加レコード用の仮番号
        facility: item.facility,
        building: item.building,
        floor: item.floor,
        department: item.department,
        section: item.section,
        category: item.category || '',
        largeClass: item.largeClass || '',
        mediumClass: item.mediumClass || '',
        item: item.item || '',
        name: item.name,
        maker: item.maker,
        model: item.model,
        quantity: item.quantity,
        width: '',
        depth: '',
        height: '',
        roomName: item.roomName,
        // 申請関連フィールド
        applicationCategory: item.applicationType,
        applicationNo: item.applicationNo,
        applicationReason: item.applicationReason,
        desiredDeliveryDate: item.desiredDeliveryDate,
        applicantName: item.applicantName,
        applicantDepartment: item.applicantDepartment,
        applicationDate: item.applicationDate,
        priority: item.priority,
        usagePurpose: item.usagePurpose,
        caseCount: item.caseCount,
        comment: item.comment,
        attachedFiles: item.attachedFiles,
        currentConnectionStatus: item.currentConnectionStatus,
        currentConnectionDestination: item.currentConnectionDestination,
        requestConnectionStatus: item.requestConnectionStatus,
        requestConnectionDestination: item.requestConnectionDestination,
        rfqNo: item.rfqNo || '',
        sourceType: 'added' as const,
      }));

      return [...baseWithSource, ...itemsAsAssets];
    }
    return mockAssets;
  }, [isEditListMode, editList, mockAssets]);

  // 個別部署マスタの統計
  const facilityMasterStats = useMemo(() => {
    const facilityMasters = hospitalFacilities.filter(f => f.hospitalName === facility);
    return {
      total: facilityMasters.length,
      completed: facilityMasters.filter(f => f.status === 'completed').length,
    };
  }, [facility, hospitalFacilities]);

  // 資産ベースの進捗統計（原本リストの資産を基準に）
  const assetProgress = useMemo(() => {
    const totalAssets = displayAssets.length;

    // 申請中の資産数（applicationStore + purchaseApplicationStore 両方を参照）
    const inProgressAssets = displayAssets.filter(asset => {
      const hasApplication = applications.some(app =>
        app.asset.name === asset.name &&
        app.asset.model === asset.model
      );
      const hasPurchaseApplication = purchaseApplications.some(app =>
        app.assets.some(a => a.name === asset.name && a.model === asset.model)
      );
      return hasApplication || hasPurchaseApplication;
    }).length;

    // 未申請の資産数
    const notAppliedAssets = totalAssets - inProgressAssets;

    // 執行済み資産数（申請が執行されて削除された資産）
    // ※ 執行完了時に申請が削除されるので、実際の執行済み数は別途管理が必要
    const executedAssets = 0;

    return {
      total: totalAssets,
      notApplied: notAppliedAssets,
      inProgress: inProgressAssets,
      executed: executedAssets,
    };
  }, [displayAssets, applications, purchaseApplications]);

  // 進捗率（申請中 + 執行済み / 全体）
  const progressRate = useMemo(() => {
    if (assetProgress.total === 0) return 0;
    return Math.round(((assetProgress.inProgress + assetProgress.executed) / assetProgress.total) * 100);
  }, [assetProgress]);

  // クローズ可能条件（すべての資産が申請済み、かつ申請中がゼロ）
  const canClose = useMemo(() => {
    return assetProgress.notApplied === 0 && assetProgress.inProgress === 0;
  }, [assetProgress]);

  // useAssetFilterフックを使用
  const {
    filters,
    setFilters,
    filteredAssets,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
  } = useAssetFilter(displayAssets);

  // カラム機能（ソート、フィルター、並び替え）
  const {
    sortConfig,
    handleSort,
    columnFilters,
    openFilterColumn,
    setOpenFilterColumn,
    getColumnUniqueValues,
    toggleColumnFilter,
    clearColumnFilter,
    selectAllColumnFilter,
    draggedColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    orderedColumns,
    finalFilteredAssets,
  } = useColumnFeatures({
    columns: ALL_COLUMNS,
    assets: mockAssets,
    baseFilteredAssets: filteredAssets,
  });

  // 全体検索 (REQ-140④): finalFilteredAssets に対してさらにテキスト検索を適用
  const displayedAssets = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return finalFilteredAssets;
    return finalFilteredAssets.filter((asset) => {
      const fields: (string | number | undefined)[] = [
        asset.name, asset.qrCode, asset.assetNo, asset.maker, asset.model, asset.serialNumber,
        asset.facility, asset.building, asset.floor, asset.department, asset.section,
        asset.category, asset.largeClass, asset.mediumClass, asset.item,
      ];
      const haystack = fields.filter(Boolean).join(' ').toLowerCase();
      const freeVals = Object.values(freeColumnValues[asset.no] || {}).join(' ').toLowerCase();
      return haystack.includes(q) || freeVals.includes(q);
    });
  }, [finalFilteredAssets, globalSearchQuery, freeColumnValues]);

  // useAssetTableフックを使用
  const {
    visibleColumns,
    setVisibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
  } = useAssetTable(ALL_COLUMNS);

  // 通常モード時は処理方針（purchaseCategory）列を非表示にする。リモデル時のみ表示。
  useEffect(() => {
    if (editList?.mode === 'normal') {
      setVisibleColumns(prev => (prev.purchaseCategory === false ? prev : { ...prev, purchaseCategory: false }));
    } else if (editList?.mode === 'remodel') {
      setVisibleColumns(prev => (prev.purchaseCategory === true ? prev : { ...prev, purchaseCategory: true }));
    }
  }, [editList?.mode, setVisibleColumns]);

  // テーブルグループヘッダーのスパン計算
  const groupHeaderSpans = useMemo(() => {
    const visibleCols = orderedColumns.filter(col => visibleColumns[col.key]);
    const spans: { groupId: string; label: string; color: string; colSpan: number }[] = [];
    let currentGroupId = '';
    for (const col of visibleCols) {
      const gid = col.group || '';
      if (gid === currentGroupId && spans.length > 0) {
        spans[spans.length - 1].colSpan++;
      } else {
        const groupDef = REMODEL_COLUMN_GROUPS.find(g => g.id === gid);
        spans.push({
          groupId: gid,
          label: groupDef?.label || gid,
          color: groupDef?.color || '#8A8A8A',
          colSpan: 1,
        });
        currentGroupId = gid;
      }
    }
    return spans;
  }, [orderedColumns, visibleColumns]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(displayedAssets.map(a => a.no)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (no: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(no)) {
      newSelected.delete(no);
    } else {
      newSelected.add(no);
    }
    setSelectedItems(newSelected);
  };

  const handleRowClick = (asset: Asset) => {
    router.push(`/asset-detail?qrCode=${asset.qrCode}&readonly=true&from=remodel`);
  };

  // セル編集開始
  const handleCellDoubleClick = (rowNo: number, colKey: string, currentValue: string) => {
    // 購入区分は常時selectなのでスキップ
    if (colKey === 'purchaseCategory') return;
    // 見積依頼No.カラムの場合はモーダルを開く
    if (colKey === 'rfqNo') {
      // 選択されていない場合は該当行を選択
      if (selectedItems.size === 0 || !selectedItems.has(rowNo)) {
        setSelectedItems(new Set([rowNo]));
      }
      setIsRfqGroupModalOpen(true);
      return;
    }

    setEditingCell({ rowNo, colKey });
    setEditingValue(currentValue);
  };

  // 資産マスターID自動紐付け: item/maker/model から assetMasterId を検索
  const resolveAssetMasterId = (asset: Asset, patchedField: string, patchedValue: string): string | undefined => {
    const currentItem = patchedField === 'item' ? patchedValue : (asset.item || '');
    const currentMaker = patchedField === 'maker' ? patchedValue : (asset.maker || '');
    const currentModel = patchedField === 'model' ? patchedValue : (asset.model || '');

    if (!currentItem && !currentMaker && !currentModel) return undefined;

    // 完全一致（item + maker + model）
    const exact = assetMasters.find(m =>
      m.item === currentItem && m.maker === currentMaker && m.model === currentModel
    );
    if (exact) return exact.assetMasterId;

    // 部分一致（item + maker）
    const partial = assetMasters.find(m =>
      m.item === currentItem && m.maker === currentMaker
    );
    if (partial) return partial.assetMasterId;

    // 部分一致（itemのみ）
    const itemOnly = assetMasters.find(m => m.item === currentItem);
    if (itemOnly) return itemOnly.assetMasterId;

    return undefined;
  };

  // セル編集確定（複数選択時は一括編集）
  const handleCellSave = () => {
    if (!editingCell) return;

    const colKey = editingCell.colKey;
    const patch: Record<string, string> = { [colKey]: editingValue };

    // 資産マスターID自動紐付け（item/maker/model変更時）
    const autoLinkFields = ['item', 'maker', 'model'];
    const shouldAutoLink = autoLinkFields.includes(colKey);

    if (isEditListMode && listId) {
      // 編集リストモード: ストア経由で更新
      const targetNos = (selectedItems.size > 1 && selectedItems.has(editingCell.rowNo))
        ? Array.from(selectedItems)
        : [editingCell.rowNo];

      targetNos.forEach(no => {
        const targetPatch = { ...patch };
        if (shouldAutoLink) {
          const asset = displayAssets.find(a => a.no === no);
          if (asset) {
            const masterId = resolveAssetMasterId(asset, colKey, editingValue);
            if (masterId) {
              targetPatch.assetMasterId = masterId;
            } else {
              targetPatch.assetMasterId = '';
            }
          }
        }
        updateBaseAsset(listId, no, targetPatch);
      });
    } else {
      // 通常モード: ローカルstate更新
      if (selectedItems.size > 1 && selectedItems.has(editingCell.rowNo)) {
        setMockAssets(prev => prev.map(asset => {
          if (!selectedItems.has(asset.no)) return asset;
          const targetPatch = { ...patch };
          if (shouldAutoLink) {
            const masterId = resolveAssetMasterId(asset, colKey, editingValue);
            targetPatch.assetMasterId = masterId || '';
          }
          return { ...asset, ...targetPatch };
        }));
      } else {
        setMockAssets(prev => prev.map(asset => {
          if (asset.no !== editingCell.rowNo) return asset;
          const targetPatch = { ...patch };
          if (shouldAutoLink) {
            const masterId = resolveAssetMasterId(asset, colKey, editingValue);
            targetPatch.assetMasterId = masterId || '';
          }
          return { ...asset, ...targetPatch };
        }));
      }
    }

    setEditingCell(null);
    setEditingValue('');
  };

  // セル編集キャンセル
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Data Link 紐づけ実行ハンドラー
  const handleDataLinkExecute = (updates: Map<number, Partial<Asset>>) => {
    if (updates.size === 0) return;
    setMockAssets(prev => prev.map(asset => {
      const patch = updates.get(asset.no);
      if (patch) {
        return { ...asset, ...patch };
      }
      return asset;
    }));
  };

  // Data Link: 新規行追加ハンドラ
  const handleDataLinkAddNewAssets = (newAssets: Asset[]) => {
    if (newAssets.length === 0) return;
    // 既存の最大Noを取得して連番を振り直す
    const maxNo = Math.max(...displayAssets.map(a => a.no), 0);
    const renumbered = newAssets.map((asset, i) => ({ ...asset, no: maxNo + 1 + i }));
    if (isEditListMode && listId) {
      addBaseAssets(listId, renumbered);
    } else {
      setMockAssets(prev => [...prev, ...renumbered]);
    }
  };

  // Data Link モーダルに渡す選択中レコード
  const dataLinkSelectedAssets = useMemo(() => {
    return finalFilteredAssets.filter(a => selectedItems.has(a.no));
  }, [finalFilteredAssets, selectedItems]);

  // 原本資産（Data Link用）
  const baseAssetsForDataLink = useMemo(() => {
    if (isEditListMode && editList) {
      return editList.baseAssets || [];
    }
    return mockAssets;
  }, [isEditListMode, editList, mockAssets]);

  // 編集可能なカラム
  const editableColumns = ALL_COLUMNS.filter(col =>
    !['purchaseCategory'].includes(col.key)
  );

  // 購入区分変更ハンドラ（常時表示selectから直接呼ばれる）
  const handlePurchaseCategoryChange = (rowNo: number, newCategory: Asset['purchaseCategory']) => {
    if (newCategory === '更新') {
      setShowUpdateConfirm({ rowNo });
      // カラム自動表示: 購入申請情報
      const purchaseCols = ALL_COLUMNS.filter(c => c.group === 'purchaseApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        purchaseCols.forEach(c => { next[c.key] = true; });
        return next;
      });
      return;
    }
    if (newCategory === '増設') {
      setShowAdditionInput({ rowNo, quantity: 1 });
      // カラム自動表示: 購入申請情報
      const purchaseCols = ALL_COLUMNS.filter(c => c.group === 'purchaseApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        purchaseCols.forEach(c => { next[c.key] = true; });
        return next;
      });
      return;
    }
    // 移設・廃棄予定・新規・クリアはそのまま設定
    if (isEditListMode && listId) {
      updateBaseAsset(listId, rowNo, { purchaseCategory: newCategory });
    } else {
      setMockAssets(prev => prev.map(asset =>
        asset.no === rowNo ? { ...asset, purchaseCategory: newCategory } : asset
      ));
    }

    // カラム自動表示
    if (newCategory === '廃棄予定') {
      const disposalCols = ALL_COLUMNS.filter(c => c.group === 'disposalApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        disposalCols.forEach(c => { next[c.key] = true; });
        return next;
      });
    } else if (newCategory === '移設') {
      const transferCols = ALL_COLUMNS.filter(c => c.group === 'transferApplication');
      setVisibleColumns(prev => {
        const next = { ...prev };
        transferCols.forEach(c => { next[c.key] = true; });
        return next;
      });
    }
  };

  // 更新確定ハンドラ（旧→廃棄予定、新レコード生成 → 選択行の直下に挿入）
  const handleUpdateConfirm = () => {
    if (!showUpdateConfirm) return;
    const { rowNo } = showUpdateConfirm;
    const sourceAsset = displayAssets.find(a => a.no === rowNo);
    if (!sourceAsset) return;

    const maxNo = Math.max(...displayAssets.map(a => a.no)) + 1;
    const newAsset: Asset = {
      ...sourceAsset,
      no: maxNo,
      qrCode: '',
      assetNo: '',
      managementNo: '',
      serialNumber: '',
      purchaseCategory: '更新',
      updateSourceNo: rowNo,
      sourceType: 'added',
    };

    if (isEditListMode && listId) {
      updateBaseAsset(listId, rowNo, { purchaseCategory: '廃棄予定' });
      addBaseAssets(listId, [newAsset], rowNo);
    } else {
      setMockAssets(prev => {
        const result: Asset[] = [];
        for (const asset of prev) {
          if (asset.no === rowNo) {
            result.push({ ...asset, purchaseCategory: '廃棄予定' as const });
            result.push(newAsset);
          } else {
            result.push(asset);
          }
        }
        return result;
      });
    }
    setShowUpdateConfirm(null);
  };

  // 増設確定ハンドラ（選択行の直下に挿入）
  const handleAdditionConfirm = () => {
    if (!showAdditionInput) return;
    const { rowNo, quantity } = showAdditionInput;
    const sourceAsset = displayAssets.find(a => a.no === rowNo);
    if (!sourceAsset) return;

    const maxNo = Math.max(...displayAssets.map(a => a.no));
    const newAssets: Asset[] = [];
    for (let i = 0; i < quantity; i++) {
      newAssets.push({
        ...sourceAsset,
        no: maxNo + 1 + i,
        qrCode: '',
        assetNo: '',
        managementNo: '',
        serialNumber: '',
        purchaseCategory: '増設',
        sourceType: 'added',
      });
    }

    if (isEditListMode && listId) {
      addBaseAssets(listId, newAssets, rowNo);
    } else {
      setMockAssets(prev => {
        const result: Asset[] = [];
        for (const asset of prev) {
          result.push(asset);
          if (asset.no === rowNo) {
            result.push(...newAssets);
          }
        }
        return result;
      });
    }
    setShowAdditionInput(null);
  };

  // 廃棄・移設のみの申請対象マッピング
  const disposalTransferCategories: Record<string, { workflowType: 'disposal' | 'transfer'; initialStatus: '廃棄承認待ち' | '移動承認待ち'; label: string }> = {
    '廃棄予定': { workflowType: 'disposal', initialStatus: '廃棄承認待ち', label: '廃棄申請' },
    '移設': { workflowType: 'transfer', initialStatus: '移動承認待ち', label: '移動申請' },
  };

  // インライン申請バリデーション（廃棄・移設のみ対象）
  const validateAssetForApplication = (asset: Asset): { valid: boolean; errors: { field: string; message: string }[] } => {
    const errors: { field: string; message: string }[] = [];
    const cat = asset.purchaseCategory;
    if (!cat) return { valid: false, errors: [{ field: 'purchaseCategory', message: 'リモデル区分が未設定' }] };

    // 購入系（新規・更新・増設）は見積依頼グループで管理するため申請対象外
    if (cat === '新規' || cat === '更新' || cat === '増設') {
      return { valid: false, errors: [{ field: 'purchaseCategory', message: '購入系は見積依頼グループで管理します' }] };
    }

    // 廃棄予定・移設ともに必須なし（移設先情報はカラム上で任意入力）

    return { valid: errors.length === 0, errors };
  };

  // 申請実行前のバリデーション＋確認ダイアログ表示（廃棄・移設のみ）
  const handleApplicationExecute = () => {
    if (selectedItems.size === 0) return;

    const selectedAssetsList = finalFilteredAssets.filter(a => selectedItems.has(a.no));
    const breakdown: Record<string, number> = {};
    const errors: { rowNo: number; field: string; message: string }[] = [];
    const newErrorRows = new Set<number>();
    let skippedPurchase = 0;

    selectedAssetsList.forEach(asset => {
      const cat = asset.purchaseCategory;
      if (!cat) {
        errors.push({ rowNo: asset.no, field: 'purchaseCategory', message: 'リモデル区分が未設定' });
        newErrorRows.add(asset.no);
        return;
      }
      // 購入系はスキップ
      if (cat === '新規' || cat === '更新' || cat === '増設') {
        skippedPurchase++;
        return;
      }
      // 申請済みスキップ
      if (appliedRows.has(asset.no)) return;

      const result = validateAssetForApplication(asset);
      if (result.valid) {
        const mapping = disposalTransferCategories[cat];
        if (mapping) {
          breakdown[mapping.label] = (breakdown[mapping.label] || 0) + 1;
        }
      } else {
        result.errors.forEach(err => errors.push({ rowNo: asset.no, field: err.field, message: err.message }));
        newErrorRows.add(asset.no);
      }
    });

    // 対象がない場合
    if (Object.keys(breakdown).length === 0 && errors.length === 0) {
      if (skippedPurchase > 0) {
        setApplicationFeedback(`購入系（${skippedPurchase}件）は見積依頼グループで管理します。廃棄・移設のレコードを選択してください。`);
        setTimeout(() => setApplicationFeedback(null), 4000);
      }
      return;
    }

    setApplicationBreakdown(breakdown);
    setApplicationErrors(errors);
    setErrorRows(newErrorRows);
    setShowApplicationConfirm(true);
  };

  // 申請作成を実行（廃棄・移設 → rfqGroupStoreにレコード追加）
  const handleApplicationConfirm = () => {
    const selectedAssetsList = finalFilteredAssets.filter(a => selectedItems.has(a.no));
    const today = new Date().toISOString().split('T')[0];
    const newAppliedRows = new Set(appliedRows);
    let successCount = 0;

    selectedAssetsList.forEach(asset => {
      const cat = asset.purchaseCategory;
      if (!cat || appliedRows.has(asset.no) || errorRows.has(asset.no)) return;
      // 購入系はスキップ
      if (cat === '新規' || cat === '更新' || cat === '増設') return;

      const result = validateAssetForApplication(asset);
      if (!result.valid) return;

      const mapping = disposalTransferCategories[cat];
      if (!mapping) return;

      const rfqNo = mapping.workflowType === 'disposal'
        ? generateDisposalNo()
        : generateTransferNo();

      const assetName = asset.item || asset.name;
      const groupName = mapping.workflowType === 'disposal'
        ? `廃棄：${assetName}`
        : `移設：${assetName}（→${asset.transferDepartment || ''}${asset.transferRoomName || ''}）`;

      // rfqGroupStoreに追加
      addRfqGroup({
        rfqNo,
        groupName,
        createdDate: today,
        applicationIds: [String(asset.no)],
        status: mapping.initialStatus,
        editListId: listId || undefined,
        workflowType: mapping.workflowType,
      });

      // baseAssetへの自動書き込み
      const patch: Record<string, unknown> = {};

      if (mapping.workflowType === 'disposal') {
        patch.disposalApplicationNo = rfqNo;
        patch.disposalApplicationDate = today;
      }
      if (mapping.workflowType === 'transfer') {
        patch.transferApplicationNo = rfqNo;
        patch.transferApplicationDate = today;
      }

      if (isEditListMode && listId) {
        updateBaseAsset(listId, asset.no, patch);
      } else {
        setMockAssets(prev => prev.map(a => a.no === asset.no ? { ...a, ...patch } as Asset : a));
      }

      newAppliedRows.add(asset.no);
      successCount++;
    });

    setAppliedRows(newAppliedRows);
    setShowApplicationConfirm(false);
    setApplicationFeedback(`${successCount}件の廃棄・移設申請を作成しました`);
    setTimeout(() => setApplicationFeedback(null), 4000);
  };

  // 資産マスタ別ウィンドウを開く
  const handleOpenAssetMaster = () => {
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED') {
        const assetMasters = event.data.assets as any[];
        const newSelectedAssets = assetMasters.map(assetMaster => ({
          asset: {
            ...assetMaster,
            name: assetMaster.item,
            no: 0,
            qrCode: '',
            facility: '',
            building: '',
            floor: '',
            department: '',
            section: '',
            category: assetMaster.category || '',
            largeClass: assetMaster.largeClass || '',
            mediumClass: assetMaster.mediumClass || '',
            item: assetMaster.item || '',
            maker: assetMaster.maker || '',
            model: assetMaster.model || '',
            quantity: 1,
            width: 0,
            depth: 0,
            height: 0
          } as Asset,
          quantity: 1,
          unit: '台'
        }));
        setSelectedAssets(prev => [...prev, ...newSelectedAssets]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // --- インライン新規申請関連 ---
  const getInitialInlineData = (): Record<string, string> => ({
    // (新)設置情報
    newBuilding: '',
    newFloor: '',
    newDepartment: '',
    newSection: '',
    newRoomName: '',
    // 購入申請情報
    applicationCategory: '新規申請',
    applicationDate: new Date().toISOString().split('T')[0],
    applicationNo: `AP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    desiredDeliveryDate: '',
    priority: '',
    applicationItem: '',
    quantity: '1',
    quantityUnit: '台',
    requestItem1: '',
    requestMaker1: '',
    requestModel1: '',
    requestItem2: '',
    requestMaker2: '',
    requestModel2: '',
    requestItem3: '',
    requestMaker3: '',
    requestModel3: '',
    usagePurpose: '',
    caseCount: '',
    caseCountUnit: '',
    comment: '',
    serialNumber: '',
    currentConnectionStatus: '',
    requestConnectionStatus: '',
  });

  // 新規要望: 1行追加して複数行を同時編集可能にする
  const buildNewInlineRow = (): InlineNewRow => ({
    id: `inline-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    data: getInitialInlineData(),
  });

  // 新規要望ボタン押下: 編集リストに無い資産の購入要望を1行追加
  const handleStartInlineNew = () => {
    const newRow = buildNewInlineRow();
    setIsInlineNewMode(true);
    setSelectedAssets([]);
    setInlineNewRows((prev) => [...prev, newRow]);
    setInlineEditingCell(null);
    setTimeout(() => {
      inlineNewRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // 全新規要望行をまとめて確定
  const handleInlineNewConfirm = () => {
    if (inlineNewRows.length === 0) {
      setIsInlineNewMode(false);
      return;
    }
    const now = new Date().toISOString();
    const newApplications: PurchaseApplication[] = inlineNewRows.map((row, idx) => ({
      id: `pa-inline-${Date.now()}-${idx}`,
      applicationNo: row.data.applicationNo,
      applicationType: '新規申請',
      applicantId: 'inline-user',
      applicantName: '',
      applicantDepartment: row.data.newDepartment,
      applicationDate: row.data.applicationDate,
      status: '編集中',
      assets: [{
        name: row.data.applicationItem,
        maker: row.data.requestMaker1 || '',
        model: row.data.requestModel1 || '',
        category: row.data.category || '',
        largeClass: row.data.largeClass || '',
        mediumClass: row.data.mediumClass || '',
        item: row.data.applicationItem,
        quantity: parseInt(row.data.quantity) || 1,
        unit: row.data.quantityUnit || '台',
      }],
      facility: facility,
      building: row.data.newBuilding,
      floor: row.data.newFloor,
      department: row.data.newDepartment,
      section: row.data.newSection,
      roomName: row.data.newRoomName,
      desiredDeliveryDate: row.data.desiredDeliveryDate,
      priority: row.data.priority,
      usagePurpose: row.data.usagePurpose,
      caseCount: row.data.caseCount,
      comment: row.data.comment,
      currentConnectionStatus: row.data.currentConnectionStatus,
      requestConnectionStatus: row.data.requestConnectionStatus,
      createdAt: now,
      updatedAt: now,
    }));

    if (isEditListMode && listId) {
      addItemsFromApplications(listId, newApplications);
    }

    alert(`新規要望を ${inlineNewRows.length} 件登録しました`);
    setIsInlineNewMode(false);
    setInlineNewRows([]);
    setInlineEditingCell(null);
    setSelectedAssets([]);
  };

  // 全新規要望行をキャンセル
  const handleInlineNewCancel = () => {
    setIsInlineNewMode(false);
    setInlineNewRows([]);
    setInlineEditingCell(null);
    setSelectedAssets([]);
  };

  // 特定の新規要望行を削除
  const handleInlineRowRemove = (rowId: string) => {
    setInlineNewRows((prev) => {
      const next = prev.filter((r) => r.id !== rowId);
      if (next.length === 0) {
        setIsInlineNewMode(false);
        setInlineEditingCell(null);
      }
      return next;
    });
  };

  // インラインセル編集開始
  const handleInlineCellClick = (rowId: string, colKey: string) => {
    const row = inlineNewRows.find((r) => r.id === rowId);
    setInlineEditingCell({ rowId, colKey });
    setInlineEditingValue(row?.data[colKey] || '');
  };

  // インラインセル編集確定
  const handleInlineCellSave = () => {
    if (inlineEditingCell) {
      const { rowId, colKey } = inlineEditingCell;
      setInlineNewRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? { ...r, data: { ...r.data, [colKey]: inlineEditingValue } } : r
        )
      );
      setInlineEditingCell(null);
      setInlineEditingValue('');
    }
  };

  // インラインセル編集キャンセル
  const handleInlineCellCancel = () => {
    setInlineEditingCell(null);
    setInlineEditingValue('');
  };

  // 資産マスタ選択時に最終行データを同期（最後の行が未入力の場合のみ）
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isInlineNewMode && selectedAssets.length > 0 && inlineNewRows.length > 0) {
      const lastAsset = selectedAssets[selectedAssets.length - 1];
      const lastRow = inlineNewRows[inlineNewRows.length - 1];
      // 既に入力されている行を上書きしない（applicationItem が入っていれば編集済とみなす）
      if (lastRow.data.applicationItem) return;
      setInlineNewRows((prev) =>
        prev.map((r) =>
          r.id === lastRow.id
            ? {
                ...r,
                data: {
                  ...r.data,
                  applicationItem: lastAsset.asset.item || lastAsset.asset.name || '',
                  category: lastAsset.asset.category || '',
                  largeClass: lastAsset.asset.largeClass || '',
                  mediumClass: lastAsset.asset.mediumClass || '',
                  requestItem1: lastAsset.asset.item || lastAsset.asset.name || '',
                  requestMaker1: lastAsset.asset.maker || '',
                  requestModel1: lastAsset.asset.model || '',
                },
              }
            : r
        )
      );
    }
  }, [isInlineNewMode, selectedAssets.length, inlineNewRows.length]);

  return (
    <div className="h-dvh flex flex-col overflow-hidden" style={{ background: 'white' }}>
      <Header
        title={editList ? `編集リスト: ${editList.name}` : `リモデル管理 - ${facility} ${department}`}
        resultCount={displayedAssets.length}
        onViewToggle={() => setCurrentView(currentView === 'list' ? 'card' : 'list')}
        onExport={() => alert('Excel/PDF出力')}
        onPrint={() => window.print()}
        onColumnSettings={() => setIsColumnSettingsOpen(true)}
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
        facility={facility}
        department={department}
        targetFacilities={editList?.facilities}
        createdAt={editList?.createdAt}
      />

      {/* モードバナー（リモデル / 通常）コンパクト表示 */}
      {isEditListMode && editList && (
        editList.mode === 'remodel' ? (
          <div className="px-4 py-1.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-[#008C1D] text-white rounded-full text-xs font-semibold whitespace-nowrap">
              リモデル
            </span>
            <span className="text-xs text-[#4A4A4A] flex-1 truncate" title="ヒアリング・5方針振り分け（新規／更新／増設／廃棄／移動）・新設置場所入力を行います">
              ヒアリング・5方針振り分け・新設置場所入力
            </span>
            <button
              onClick={() => router.push(`/quotation-data-box/remodel-dashboard?editListId=${editList.id}`)}
              className="px-3 py-1 bg-[#008C1D] hover:bg-[#146E2E] text-white rounded font-medium text-xs transition-colors border-0 cursor-pointer whitespace-nowrap"
            >
              ダッシュボードへ
            </button>
          </div>
        ) : (
          <div className="px-4 py-1.5 bg-[#F1F1F1] border-b border-[#E1E1E1] flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-[#4A4A4A] text-white rounded-full text-xs font-semibold whitespace-nowrap">
              通常
            </span>
            <span className="text-xs text-[#4A4A4A] flex-1 truncate" title="見積依頼グループを作成して購入管理画面でタスクを進めてください">
              見積依頼グループを作成して購入管理へ
            </span>
          </div>
        )
      )}

      {/* アクションボタンバー（コンパクト） */}
      <div style={{
        background: '#fff',
        padding: '6px 12px',
        borderBottom: '1px solid #E1E1E1',
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => alert('API連携機能（開発中）')}
          style={{
            padding: '8px 16px',
            background: '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#146E2E'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#008C1D'; }}
        >
          API連携
        </button>
        <button
          onClick={() => {
            if (selectedItems.size === 0) {
              alert('紐づけるレコードを選択してください');
              return;
            }
            setDataLinkMode('copy');
            setIsDataLinkModalOpen(true);
          }}
          style={{
            padding: '8px 16px',
            background: '#DA0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#DA0000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#DA0000'; }}
        >
          Data Link
        </button>
        <button
          onClick={() => {
            setDataLinkMode('quotation');
            setIsDataLinkModalOpen(true);
          }}
          style={{
            padding: '8px 16px',
            background: '#DA0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#DA0000'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#DA0000'; }}
        >
          見積DB Link
        </button>

        {/* 見積依頼グループ作成ボタン */}
        <button
          onClick={() => {
            if (selectedItems.size === 0) {
              alert('見積依頼グループに含める資産を選択してください');
              return;
            }
            setIsRfqGroupModalOpen(true);
          }}
          disabled={selectedItems.size === 0}
          style={{
            padding: '8px 16px',
            background: selectedItems.size === 0 ? '#E1E1E1' : '#008C1D',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedItems.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background 0.2s',
          }}
        >
          見積依頼グループ作成（{selectedItems.size}件選択中）
        </button>

        {/* フリーカラム追加ボタン (REQ-141④) */}
        <button
          onClick={() => {
            setFreeColumnLabelDraft('');
            setIsAddFreeColumnOpen(true);
          }}
          style={{
            padding: '8px 16px',
            background: '#fff',
            color: '#8A8A8A',
            border: '1px dashed #8A8A8A',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FAFAFA'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
        >
          + フリーカラム追加{freeColumns.length > 0 ? `（${freeColumns.length}）` : ''}
        </button>

        {/* 廃棄・移設申請ボタン（選択行に廃棄予定 or 移設がある場合のみ活性） */}
        {(() => {
          const dtCount = finalFilteredAssets.filter(a =>
            selectedItems.has(a.no) &&
            (a.purchaseCategory === '廃棄予定' || a.purchaseCategory === '移設') &&
            !appliedRows.has(a.no)
          ).length;
          const disabled = dtCount === 0;
          return (
            <button
              onClick={handleApplicationExecute}
              disabled={disabled}
              style={{
                padding: '8px 16px',
                background: disabled ? '#E1E1E1' : '#4A4A4A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s',
              }}
            >
              廃棄・移設申請{dtCount > 0 ? `（${dtCount}件）` : ''}
            </button>
          );
        })()}

        {/* 新規要望ボタン (REQ-139⑤) — 編集リスト内に無い資産を新たに購入要望として追加。クリックでインライン編集行を追加し、複数まとめて登録できる */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid #E1E1E1' }}>
          <button
            onClick={handleStartInlineNew}
            title="編集リストに無い資産の購入要望を追加します。クリックで編集行が1行追加され、複数行まとめてインライン編集→一括登録できます。"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: '#4A4A4A',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4A4A4A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4A4A4A'; }}
          >
            + 新規要望{isInlineNewMode && inlineNewRows.length > 0 ? `（${inlineNewRows.length}件編集中）` : ''}
          </button>
          {isInlineNewMode && inlineNewRows.length > 0 && (
            <>
              <button
                onClick={handleInlineNewConfirm}
                title="編集中の新規要望をすべて編集リストに登録します"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#008C1D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#146E2E'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#008C1D'; }}
              >
                全て登録（{inlineNewRows.length}件）
              </button>
              <button
                onClick={handleInlineNewCancel}
                title="編集中の新規要望をすべて破棄します"
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: '#fff',
                  color: '#DA0000',
                  border: '1px solid #FDF1E5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                全て破棄
              </button>
            </>
          )}
        </div>

        </div>

        {/* 右側: 選択件数 + タスク管理リンク + 合計表示 */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {selectedItems.size > 0 && (
            <div style={{
              padding: '6px 12px',
              background: '#4A4A4A',
              color: 'white',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              選択: {selectedItems.size}件
            </div>
          )}
          <button
            onClick={() => router.push('/quotation-data-box/remodel-management')}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              color: '#008C1D',
              border: '1px solid #008C1D',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#008C1D'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#008C1D'; }}
          >
            タスク管理 &rarr;
          </button>
          {/* 数量・金額合計を1つのコンパクトな枠に統合 */}
          <div style={{
            padding: '4px 10px',
            background: '#FAFAFA',
            borderRadius: '4px',
            border: '1px solid #E1E1E1',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
          }}>
            <span><span style={{ color: '#8A8A8A' }}>件数</span> <strong style={{ color: '#4A4A4A', fontVariantNumeric: 'tabular-nums' }}>{displayedAssets.length}</strong></span>
            <span style={{ color: '#E1E1E1' }}>|</span>
            <span><span style={{ color: '#8A8A8A' }}>金額</span> <strong style={{ color: '#008C1D', fontVariantNumeric: 'tabular-nums' }}>¥{displayedAssets.reduce((sum, asset) => {
              const amount = asset.rfqAmount;
              if (typeof amount === 'number') return sum + amount;
              if (typeof amount === 'string' && amount) {
                const num = parseInt(amount.replace(/[^0-9]/g, ''), 10);
                return sum + (isNaN(num) ? 0 : num);
              }
              return sum;
            }, 0).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* フィルターヘッダー（コンパクト・全体検索を同列配置） */}
      <div style={{ background: '#FAFAFA', padding: '6px 12px', borderBottom: '1px solid #E1E1E1' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 全体検索 (REQ-140④) */}
          <input
            type="text"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
            placeholder="🔍 全体検索（資産名/型式/メーカー/設置場所/品目分類）"
            style={{
              flex: '2 1 280px',
              minWidth: '220px',
              maxWidth: '380px',
              padding: '4px 10px',
              border: '1px solid #E1E1E1',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none',
              height: '30px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ flex: '1 1 120px', minWidth: '100px', maxWidth: '160px' }}>
            <SearchableSelect
              value={filters.department}
              onChange={(value) => setFilters({...filters, department: value})}
              options={['', ...departmentOptions]}
              placeholder="部門"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '100px', maxWidth: '160px' }}>
            <SearchableSelect
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={['', ...sectionOptions]}
              placeholder="部署"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '100px', maxWidth: '160px' }}>
            <SearchableSelect
              value={filters.category}
              onChange={(value) => setFilters({...filters, category: value})}
              options={['', ...categoryOptions]}
              placeholder="Category"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '100px', maxWidth: '160px' }}>
            <SearchableSelect
              value={filters.largeClass}
              onChange={(value) => setFilters({...filters, largeClass: value})}
              options={['', ...largeClassOptions]}
              placeholder="大分類"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '100px', maxWidth: '160px' }}>
            <SearchableSelect
              value={filters.mediumClass}
              onChange={(value) => setFilters({...filters, mediumClass: value})}
              options={['', ...mediumClassOptions]}
              placeholder="中分類"
              isMobile={isMobile}
            />
          </div>

          <div style={{ flex: '1 1 120px', minWidth: '100px', maxWidth: '160px' }}>
            <SearchableSelect
              value={filters.section}
              onChange={(value) => setFilters({...filters, section: value})}
              options={['', ...sectionOptions]}
              placeholder="管理部署"
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* テーブル表示（最大限の高さを確保） */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '8px 12px' }}>
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {/* 一括適用バナー */}
        {selectedItems.size > 1 && editingCell !== null && selectedItems.has(editingCell.rowNo) && (
          <div style={{
            padding: '8px 16px',
            background: '#EBF5EE',
            border: '1px solid #087CB6',
            borderRadius: '4px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#4A4A4A',
            fontWeight: 600,
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              background: '#4A4A4A',
              color: 'white',
              borderRadius: '50%',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {selectedItems.size}
            </span>
            {selectedItems.size}件のレコードに一括適用されます
          </div>
        )}

        {/* 資産テーブル（編集リストモード・従来モード共通）
            DataLinkモーダル表示中は背後の巨大テーブル（781行×60列超）を非表示にして
            モーダル内操作（行クリック・紐付け）の再レンダーを軽量化する */}
        {currentView === 'list' && (
          <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '13px', display: isDataLinkModalOpen ? 'none' : undefined }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 102 }}>
              {/* グループヘッダー行 */}
              <tr>
                <th
                  rowSpan={2}
                  style={{
                    padding: '4px',
                    textAlign: 'center',
                    width: `${columnWidths.checkbox}px`,
                    minWidth: `${columnWidths.checkbox}px`,
                    position: 'sticky',
                    left: 0,
                    zIndex: 103,
                    background: '#4A4A4A',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    borderRight: '1px solid #4A4A4A',
                    border: '2px solid #E1E1E1',
                  }}
                >
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{ accentColor: '#fff' }}
                  />
                </th>
                {groupHeaderSpans.map((span, i) => (
                  <th
                    key={`${span.groupId}-${i}`}
                    colSpan={span.colSpan}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'white',
                      background: span.color,
                      borderRight: '1px solid rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {span.label}
                  </th>
                ))}
                {/* フリーカラム group header (REQ-141④) */}
                {freeColumns.length > 0 && (
                  <th
                    colSpan={freeColumns.length}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'white',
                      background: '#4A4A4A',
                      borderRight: '1px solid rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.5px',
                    }}
                  >
                    フリーカラム
                  </th>
                )}
                {/* 操作 group header (REQ-142②③) */}
                <th
                  rowSpan={2}
                  style={{
                    padding: '4px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#4A4A4A',
                    background: '#FAFAFA',
                    borderRight: '1px solid #E1E1E1',
                    border: '2px solid #E1E1E1',
                    borderTop: '2px solid #8A8A8A',
                    width: '120px',
                  }}
                >
                  操作
                </th>
              </tr>
              {/* カラムヘッダー行 */}
              <tr>
                {/* checkbox列はrowSpan=2で上行に含まれるため省略 */}
                {orderedColumns.filter((col) => visibleColumns[col.key]).map((col) => {
                  const isSorted = sortConfig?.key === col.key;
                  const hasFilter = columnFilters[col.key]?.length > 0;
                  const uniqueValues = getColumnUniqueValues(col.key);
                  const groupDef = REMODEL_COLUMN_GROUPS.find(g => g.id === col.group);
                  const groupColor = groupDef?.color || '#8A8A8A';

                  return (
                    <th
                      key={col.key}
                      draggable
                      onDragStart={() => handleDragStart(col.key)}
                      onDragOver={(e) => handleDragOver(e, col.key)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: '8px',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        color: '#4A4A4A',
                        width: `${columnWidths[col.key]}px`,
                        position: 'relative',
                        whiteSpace: 'nowrap',
                        overflow: 'visible',
                        background: draggedColumn === col.key ? '#EBF5EE' : '#FAFAFA',
                        zIndex: openFilterColumn === col.key ? 100 : 1,
                        borderRight: '1px solid #E1E1E1',
                        borderBottom: '2px solid #E1E1E1',
                        borderTop: `2px solid ${groupColor}`,
                        cursor: 'grab',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* カラム名とソートボタン */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            onClick={() => handleSort(col.key)}
                            style={{ cursor: 'pointer', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={col.label}
                          >
                            {col.label}
                          </span>
                          <span
                            onClick={() => handleSort(col.key)}
                            style={{ cursor: 'pointer', fontSize: '10px', color: isSorted ? '#008C1D' : '#aaa' }}
                          >
                            {isSorted ? (sortConfig.direction === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
                          </span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFilterColumn(openFilterColumn === col.key ? null : col.key);
                            }}
                            style={{
                              cursor: 'pointer',
                              fontSize: '10px',
                              color: hasFilter ? '#DA0000' : '#aaa',
                              padding: '2px',
                            }}
                          >
                            {'\u25BC'}
                          </span>
                        </div>

                        {/* フィルタードロップダウン */}
                        {openFilterColumn === col.key && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              background: 'white',
                              border: '1px solid #E1E1E1',
                              borderRadius: '4px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              zIndex: 1000,
                              maxHeight: '200px',
                              overflowY: 'auto',
                              minWidth: '150px',
                            }}
                          >
                            <div
                              style={{
                                padding: '8px',
                                borderBottom: '1px solid #E1E1E1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span style={{ fontSize: '11px', fontWeight: 'bold' }}>絞り込み</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => selectAllColumnFilter(col.key, uniqueValues)}
                                  style={{ fontSize: '10px', padding: '2px 6px', background: '#008C1D', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                                >
                                  全選択
                                </button>
                                <button
                                  onClick={() => clearColumnFilter(col.key)}
                                  style={{ fontSize: '10px', padding: '2px 6px', background: '#DA0000', color: 'white', border: 'none', borderRadius: '2px', cursor: 'pointer' }}
                                >
                                  クリア
                                </button>
                              </div>
                            </div>
                            {uniqueValues.map((value) => (
                              <label
                                key={value}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  borderBottom: '1px solid #FAFAFA',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={columnFilters[col.key]?.includes(value) || false}
                                  onChange={() => toggleColumnFilter(col.key, value)}
                                />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {value || '(空)'}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleResizeStart(e, col.key);
                        }}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          cursor: 'col-resize',
                          background: resizingColumn === col.key ? '#008C1D' : 'transparent',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          if (!resizingColumn) e.currentTarget.style.background = '#E1E1E1';
                        }}
                        onMouseLeave={(e) => {
                          if (!resizingColumn) e.currentTarget.style.background = 'transparent';
                        }}
                      />
                    </th>
                  );
                })}
                {/* フリーカラム header (REQ-141④) */}
                {freeColumns.map((fc) => (
                  <th
                    key={`fc-${fc.key}`}
                    style={{
                      padding: '8px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#4A4A4A',
                      whiteSpace: 'nowrap',
                      background: '#FAFAFA',
                      borderRight: '1px solid #E1E1E1',
                      border: '2px solid #E1E1E1',
                      borderTop: '2px solid #4A4A4A',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{fc.label}</span>
                      <button
                        onClick={() => setDeleteFreeColumnConfirm({ key: fc.key, label: fc.label })}
                        title={`フリーカラム「${fc.label}」を削除`}
                        aria-label={`フリーカラム「${fc.label}」を削除`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#8A8A8A',
                          cursor: 'pointer',
                          fontSize: '14px',
                          padding: '0 2px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
                {/* 操作 header は上段で rowSpan={2} で展開済 */}
              </tr>
            </thead>
            <tbody>
              {displayedAssets.map((asset) => {
                // 行ステータスの左ボーダー色
                const getRowBorderColor = () => {
                  if (errorRows.has(asset.no)) return '#DA0000';
                  if (appliedRows.has(asset.no)) return '#008C1D';
                  if (asset.purchaseCategory) return '#4A4A4A';
                  return 'transparent';
                };
                return (
                <tr
                  key={asset.no}
                  style={{ borderLeft: `4px solid ${getRowBorderColor()}` }}
                >
                  <td style={{
                    padding: '12px 8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    position: 'sticky',
                    left: 0,
                    zIndex: 100,
                    background: selectedItems.has(asset.no) ? '#EBF5EE' : 'white',
                    boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    borderRight: '1px solid #E1E1E1',
                    border: '1px solid #E1E1E1',
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(asset.no)}
                      onChange={() => handleSelectItem(asset.no)}
                    />
                  </td>
                  {orderedColumns.filter((col) => visibleColumns[col.key]).map((col) => {
                    const isEditing = editingCell?.rowNo === asset.no && editingCell?.colKey === col.key;
                    const isHovered = hoveredCell?.rowNo === asset.no && hoveredCell?.colKey === col.key;
                    const cellValue = getCellValue(asset, col.key);
                    const isEditable = col.key !== 'purchaseCategory';
                    const isRowSelected = selectedItems.has(asset.no);

                    // 一括編集対象かどうか（他行で編集中 + 自分が選択中）
                    const isBulkEditTarget = editingCell !== null
                      && editingCell.rowNo !== asset.no
                      && selectedItems.size > 1
                      && isRowSelected
                      && selectedItems.has(editingCell.rowNo);

                    // セル背景色の決定
                    const getCellBackground = () => {
                      if (isEditing) return '#FDF1E5';
                      // 一括適用対象行のハイライト
                      if (isBulkEditTarget && editingCell?.colKey === col.key) return '#FAFAFA';
                      if (isHovered && isEditable) {
                        // 選択状態では濃い青、非選択では薄い青
                        return isRowSelected ? '#EBF5EE' : '#EBF5EE';
                      }
                      // 一括適用対象行の通常ハイライト
                      if (isBulkEditTarget) return '#FAFAFA';
                      // デフォルトは行の背景色に合わせる
                      return isRowSelected ? '#EBF5EE' : 'white';
                    };

                    return (
                      <td
                        key={col.key}
                        style={{
                          padding: isEditing ? '4px' : '12px 8px',
                          color: '#4A4A4A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          background: getCellBackground(),
                          cursor: isEditable ? 'pointer' : 'default',
                          transition: 'background 0.15s',
                          position: 'relative',
                          zIndex: 0,
                          borderRight: '1px solid #E1E1E1',
                          border: '1px solid #E1E1E1',
                        }}
                        onMouseEnter={() => isEditable && setHoveredCell({ rowNo: asset.no, colKey: col.key })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onDoubleClick={() => isEditable && handleCellDoubleClick(asset.no, col.key, cellValue)}
                      >
                        {col.key === 'purchaseCategory' ? (
                          (() => {
                            const currentVal = asset.purchaseCategory || '';
                            const categoryColors: Record<string, string> = {
                              '新規': '#008C1D',
                              '更新': '#4A4A4A',
                              '移設': '#008C1D',
                              '増設': '#4A4A4A',
                              '廃棄予定': '#DA0000',
                            };
                            // 新規追加レコード（sourceType === 'added' かつ purchaseCategory === '新規'）はバッジ固定
                            if (currentVal === '新規') {
                              return (
                                <span style={{
                                  padding: '2px 8px',
                                  background: '#008C1D',
                                  color: 'white',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                }}>
                                  新規
                                </span>
                              );
                            }
                            // 既存レコード: プルダウン（新規なし）
                            return (
                              <select
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value as Asset['purchaseCategory'];
                                  handlePurchaseCategoryChange(asset.no, val || undefined);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: '100%',
                                  padding: '4px 2px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  background: currentVal ? categoryColors[currentVal] || '#FAFAFA' : 'transparent',
                                  color: currentVal ? 'white' : '#8A8A8A',
                                  appearance: 'auto',
                                }}
                              >
                                <option value="">-</option>
                                <option value="更新">更新</option>
                                <option value="移設">移設</option>
                                <option value="増設">増設</option>
                                <option value="廃棄予定">廃棄予定</option>
                              </select>
                            );
                          })()
                        ) : isEditing ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave();
                              if (e.key === 'Escape') handleCellCancel();
                            }}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: '2px solid #008C1D',
                              borderRadius: '4px',
                              fontSize: '13px',
                              boxSizing: 'border-box',
                            }}
                          />
                        ) : (
                          cellValue
                        )}
                      </td>
                    );
                  })}
                  {/* フリーカラム cells (REQ-141④) */}
                  {freeColumns.map((fc) => {
                    const val = freeColumnValues[asset.no]?.[fc.key] || '';
                    return (
                      <td
                        key={`fc-${fc.key}-${asset.no}`}
                        style={{
                          padding: '4px 6px',
                          background: selectedItems.has(asset.no) ? '#EBF5EE' : '#FAFAFA',
                          borderRight: '1px solid #E1E1E1',
                          border: '1px solid #E1E1E1',
                        }}
                      >
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const v = e.target.value;
                            setFreeColumnValues((prev) => ({
                              ...prev,
                              [asset.no]: { ...(prev[asset.no] || {}), [fc.key]: v },
                            }));
                          }}
                          placeholder="入力"
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '1px solid #E1E1E1',
                            borderRadius: '3px',
                            fontSize: '13px',
                            background: 'white',
                            boxSizing: 'border-box',
                          }}
                        />
                      </td>
                    );
                  })}
                  {/* 操作セル (REQ-142②③) */}
                  <td
                    style={{
                      padding: '4px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      background: selectedItems.has(asset.no) ? '#EBF5EE' : 'white',
                      borderRight: '1px solid #E1E1E1',
                      border: '1px solid #E1E1E1',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          // 編集リストモード: store経由で editList の baseAssets / items を更新
                          if (isEditListMode && listId) {
                            if (asset.no >= 90000) {
                              reorderItems(listId, asset.no - 90000, 'up');
                            } else {
                              reorderBaseAssets(listId, asset.no, 'up');
                            }
                          } else {
                            setMockAssets((prev) => {
                              const idx = prev.findIndex((a) => a.no === asset.no);
                              if (idx <= 0) return prev;
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return next;
                            });
                          }
                        }}
                        title="上に移動"
                        aria-label={`資産 No.${asset.no} を上に移動`}
                        style={{
                          padding: '8px 10px',
                          background: '#fff',
                          color: '#4A4A4A',
                          border: '1px solid #E1E1E1',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          minHeight: '32px',
                          minWidth: '32px',
                        }}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => {
                          if (isEditListMode && listId) {
                            if (asset.no >= 90000) {
                              reorderItems(listId, asset.no - 90000, 'down');
                            } else {
                              reorderBaseAssets(listId, asset.no, 'down');
                            }
                          } else {
                            setMockAssets((prev) => {
                              const idx = prev.findIndex((a) => a.no === asset.no);
                              if (idx < 0 || idx >= prev.length - 1) return prev;
                              const next = [...prev];
                              [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                              return next;
                            });
                          }
                        }}
                        title="下に移動"
                        aria-label={`資産 No.${asset.no} を下に移動`}
                        style={{
                          padding: '8px 10px',
                          background: '#fff',
                          color: '#4A4A4A',
                          border: '1px solid #E1E1E1',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          minHeight: '32px',
                          minWidth: '32px',
                        }}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setDeleteRowConfirm({ no: asset.no, assetName: asset.name || `No.${asset.no}` })}
                        title="このレコードを削除"
                        aria-label={`資産 No.${asset.no} を削除`}
                        style={{
                          padding: '8px 10px',
                          background: '#fff',
                          color: '#DA0000',
                          border: '1px solid #FDF1E5',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          minHeight: '32px',
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}

              {/* インライン新規行（複数行同時編集対応） */}
              {isInlineNewMode && (() => {
                // 自動設定カラム（編集不可）
                const autoFilledCols = ['applicationCategory', 'applicationDate', 'applicationNo'];
                // ドロップダウンで編集するカラムとそのオプション
                const dropdownCols: Record<string, string[]> = {
                  newBuilding: buildingOptions,
                  newFloor: floorOptions,
                  newDepartment: departmentOptions,
                  newSection: sectionOptions,
                };

                return inlineNewRows.map((row, rowIdx) => (
                  <tr key={row.id} ref={rowIdx === inlineNewRows.length - 1 ? inlineNewRowRef : undefined} style={{ background: '#EBF5EE' }}>
                    {/* ★ アクションセル（行削除のみ） */}
                    <td style={{
                      padding: '6px 4px',
                      position: 'sticky',
                      left: 0,
                      zIndex: 100,
                      background: '#EBF5EE',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                      borderRight: '1px solid #E1E1E1',
                      border: '2px solid #008C1D',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#008C1D', fontSize: '12px', fontWeight: 'bold' }}>新規{rowIdx + 1}</span>
                        <button
                          onClick={() => handleInlineRowRemove(row.id)}
                          title="この新規要望行を削除"
                          aria-label={`新規要望行 ${rowIdx + 1} を削除`}
                          style={{
                            width: '24px', height: '24px',
                            background: '#DA0000', color: 'white',
                            border: 'none', borderRadius: '4px',
                            cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                    {orderedColumns.filter(col => visibleColumns[col.key]).map(col => {
                      const isPurchaseCol = col.group === 'purchaseApplication';
                      const isNewLocationCol = col.group === 'newLocation';
                      const isInlineEditing = inlineEditingCell?.rowId === row.id && inlineEditingCell?.colKey === col.key;
                      const cellValue = row.data[col.key] || '';
                      const isAutoFilled = autoFilledCols.includes(col.key);
                      const isDropdown = col.key in dropdownCols;

                      // 編集可能: (新)設置情報 or 購入申請情報（自動設定以外）
                      const isEditable = (isNewLocationCol || (isPurchaseCol && !isAutoFilled));

                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: isInlineEditing ? '4px' : '8px 8px',
                            background: isInlineEditing ? '#FDF1E5' : isEditable ? '#EBF5EE' : '#EBF5EE',
                            borderTop: 'none',
                            borderLeft: 'none',
                            borderRight: '1px solid #E1E1E1',
                            border: '2px solid #008C1D',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: isEditable ? 'pointer' : 'default',
                            transition: 'background 0.15s',
                          }}
                          onClick={() => isEditable && handleInlineCellClick(row.id, col.key)}
                        >
                          {/* リモデル区分バッジ（新規追加は固定） */}
                          {col.key === 'purchaseCategory' ? (
                            <span style={{
                              padding: '2px 8px',
                              background: '#008C1D',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                            }}>新規</span>

                          /* ドロップダウン編集（設置情報の選択カラム） */
                          ) : isInlineEditing && isDropdown ? (
                            <select
                              value={inlineEditingValue}
                              onChange={(e) => {
                                const v = e.target.value;
                                setInlineNewRows((prev) =>
                                  prev.map((r) => (r.id === row.id ? { ...r, data: { ...r.data, [col.key]: v } } : r))
                                );
                                setInlineEditingCell(null);
                                setInlineEditingValue('');
                              }}
                              onBlur={handleInlineCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') handleInlineCellCancel();
                              }}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '6px 4px',
                                border: '2px solid #008C1D',
                                borderRadius: '4px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="">選択してください</option>
                              {dropdownCols[col.key].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>

                          /* テキスト入力編集 */
                          ) : isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineEditingValue}
                              onChange={(e) => setInlineEditingValue(e.target.value)}
                              onBlur={handleInlineCellSave}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineCellSave();
                                if (e.key === 'Escape') handleInlineCellCancel();
                              }}
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '2px solid #008C1D',
                                borderRadius: '4px',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                              }}
                            />

                          /* 申請品目セル（資産マスタ選択ボタン付き） */
                          ) : col.key === 'applicationItem' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: cellValue ? '#4A4A4A' : '#008C1D',
                                fontStyle: cellValue ? 'normal' : 'italic',
                                fontSize: '13px',
                              }}>
                                {cellValue || '入力 or 選択'}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenAssetMaster(); }}
                                title="資産マスタから選択"
                                style={{
                                  padding: '2px 6px',
                                  background: '#008C1D',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '10px',
                                  fontWeight: 'bold',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                }}
                              >
                                選択
                              </button>
                            </div>

                          /* 通常表示 */
                          ) : (
                            <span style={{
                              color: cellValue ? '#4A4A4A' : (isEditable ? '#008C1D' : '#bbb'),
                              fontStyle: isEditable && !cellValue ? 'italic' : 'normal',
                              fontSize: '13px',
                            }}>
                              {cellValue || (isEditable ? '入力' : '-')}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    {/* フリーカラム cells (新規行は空) */}
                    {freeColumns.map((fc) => (
                      <td
                        key={`fc-new-${fc.key}`}
                        style={{
                          padding: '4px 6px',
                          background: '#EBF5EE',
                          borderRight: '1px solid #E1E1E1',
                          border: '1px solid #E1E1E1',
                        }}
                      >
                        <span style={{ color: '#8A8A8A', fontSize: '12px' }}>-</span>
                      </td>
                    ))}
                    {/* 操作セル（新規行は空） */}
                    <td
                      style={{
                        padding: '4px',
                        textAlign: 'center',
                        background: '#EBF5EE',
                        borderRight: '1px solid #E1E1E1',
                        border: '1px solid #E1E1E1',
                      }}
                    >
                      <span style={{ color: '#8A8A8A', fontSize: '12px' }}>-</span>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        )}

        {currentView === 'card' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {displayedAssets.map((asset) => (
              <div
                key={asset.no}
                style={{
                  background: 'white',
                  border: '1px solid #E1E1E1',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onDoubleClick={() => router.push(`/asset-karte/${asset.no}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.has(asset.no)}
                    onChange={() => handleSelectItem(asset.no)}
                  />
                  <strong style={{ color: '#4A4A4A' }}>No. {asset.no}</strong>
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#4A4A4A' }}>{asset.name}</h3>
                <div style={{ fontSize: '13px', color: '#8A8A8A', lineHeight: '1.6' }}>
                  <div>施設: {asset.facility}</div>
                  <div>場所: {asset.building} {asset.floor}</div>
                  <div>部門: {asset.department}</div>
                  <div>メーカー: {asset.maker}</div>
                  <div>型式: {asset.model}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* 申請実行フィードバック */}
        {applicationFeedback && (
          <div style={{
            padding: '10px 16px',
            background: '#EBF5EE',
            border: '1px solid #EBF5EE',
            color: '#146E2E',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Check size={16} strokeWidth={2.5} aria-hidden />
            {applicationFeedback}
          </div>
        )}
      </div>

      {/* カラム設定モーダル */}
      <ColumnSettingsModal
        isOpen={isColumnSettingsOpen}
        onClose={() => setIsColumnSettingsOpen(false)}
        columns={ALL_COLUMNS}
        visibleColumns={visibleColumns}
        onVisibilityChange={toggleColumnVisibility}
        onSelectAll={handleSelectAllColumns}
        onDeselectAll={handleDeselectAllColumns}
      />

      {/* 申請実行確認ダイアログ */}
      {showApplicationConfirm && (
        <div
          onClick={() => setShowApplicationConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '480px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>廃棄・移設申請の確認</span>
              <button
                onClick={() => setShowApplicationConfirm(false)}
                aria-label="閉じる"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: 0,
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {/* 種別ごとの件数 */}
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#4A4A4A' }}>
                以下の廃棄・移設申請を作成します:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {Object.entries(applicationBreakdown).map(([type, count]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4A4A4A' }}>
                    <span>{type}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{count}件</span>
                  </div>
                ))}
              </div>
              {Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0 && (
                <div style={{ padding: '12px', background: '#FDF1E5', borderRadius: '4px', fontSize: '13px', color: '#4A4A4A', marginBottom: '12px' }}>
                  有効な廃棄・移設対象がありません。リモデル区分を確認してください。
                </div>
              )}
              {applicationErrors.length > 0 && (
                <div style={{ padding: '12px', background: '#FDF1E5', borderRadius: '4px', fontSize: '13px', color: '#DA0000', marginBottom: '12px' }}>
                  バリデーションエラー: {applicationErrors.length}件（スキップされます）
                </div>
              )}
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowApplicationConfirm(false)}
                style={{
                  padding: '8px 20px',
                  background: '#8A8A8A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleApplicationConfirm}
                disabled={Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0}
                style={{
                  padding: '8px 20px',
                  background: Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0 ? '#E1E1E1' : '#4A4A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: Object.values(applicationBreakdown).reduce((a, b) => a + b, 0) === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                申請を作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* クローズ確認モーダル */}
      {showCloseConfirmModal && (
        <div
          onClick={() => setShowCloseConfirmModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* モーダルヘッダー */}
            <div
              style={{
                background: '#4A4A4A',
                color: 'white',
                padding: '20px 24px',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>リモデルクローズ確認</span>
              <button
                onClick={() => setShowCloseConfirmModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                }}
              >
                ×
              </button>
            </div>

            {/* モーダルボディ */}
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#FDF1E5',
                border: '1px solid #4A4A4A',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
              }}>
                <p style={{ margin: 0, color: '#4A4A4A', fontWeight: 'bold', marginBottom: '8px' }}>
                  以下の処理が実行されます:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#4A4A4A', fontSize: '14px' }}>
                  <li>個別部署マスタの「新居」情報が「現状」に反映されます</li>
                  <li>資産の設置場所が新しい場所に更新されます</li>
                  <li>この操作は取り消すことができません</li>
                </ul>
              </div>

              <div style={{
                background: '#EBF5EE',
                border: '1px solid #008C1D',
                borderRadius: '8px',
                padding: '16px',
              }}>
                <p style={{ margin: 0, color: '#146E2E', fontSize: '14px' }}>
                  対象施設: <strong>{facility}</strong>
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#146E2E', fontSize: '14px' }}>
                  個別部署マスタ: <strong>{facilityMasterStats.total}件</strong>
                </p>
              </div>
            </div>

            {/* モーダルフッター */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #E1E1E1',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                background: '#FAFAFA'
              }}
            >
              <button
                onClick={() => setShowCloseConfirmModal(false)}
                style={{
                  padding: '10px 24px',
                  background: '#8A8A8A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleCloseProject}
                style={{
                  padding: '10px 24px',
                  background: '#4A4A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                クローズ実行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 見積依頼グループ作成モーダル */}
      <RfqGroupModal
        isOpen={isRfqGroupModalOpen}
        onClose={() => setIsRfqGroupModalOpen(false)}
        rfqGroupName={rfqGroupName}
        setRfqGroupName={setRfqGroupName}
        selectedCount={selectedItems.size}
        generatedRfqNo={generateRfqNo()}
        onSubmit={() => {
          const rfqNo = generateRfqNo();
          const today = new Date();
          const createdDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          addRfqGroup({
            rfqNo,
            groupName: rfqGroupName.trim(),
            createdDate,
            applicationIds: Array.from(selectedItems).map(String),
            status: '見積依頼',
            editListId: isEditListMode ? listId : undefined,
          });

          if (isEditListMode && listId) {
            // 編集リストモード: editListStore経由でbaseAssets/itemsのrfqNoを更新
            updateRfqInfo(listId, selectedItems, rfqNo, rfqGroupName.trim());
          } else {
            // 通常モード: ローカルstateを更新
            setMockAssets(prev => prev.map(asset => {
              if (selectedItems.has(asset.no)) {
                return {
                  ...asset,
                  rfqNo: rfqNo,
                  rfqGroupName: rfqGroupName.trim(),
                };
              }
              return asset;
            }));
          }

          alert(`見積依頼グループ「${rfqGroupName.trim()}」を作成しました\n\n見積依頼No.: ${rfqNo}\n選択レコード: ${selectedItems.size}件`);
          setIsRfqGroupModalOpen(false);
          setRfqGroupName('');
          setSelectedItems(new Set());
        }}
      />

      {/* フリーカラム追加モーダル (REQ-141④) */}
      {isAddFreeColumnOpen && (
        <div
          onClick={() => setIsAddFreeColumnOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          role="presentation"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-free-col-title"
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '380px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <h2 id="add-free-col-title" style={{ margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: 700, color: '#4A4A4A' }}>
              フリーカラム追加
            </h2>
            <p style={{ margin: 0, marginBottom: '16px', fontSize: '12px', color: '#8A8A8A' }}>
              マスタにない情報を行ごとに記録するための列を追加します。
            </p>
            <input
              type="text"
              value={freeColumnLabelDraft}
              onChange={(e) => setFreeColumnLabelDraft(e.target.value)}
              placeholder="列名（例: 設置担当者メモ）"
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #E1E1E1', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => setIsAddFreeColumnOpen(false)}
                style={{ padding: '8px 16px', background: '#fff', color: '#4A4A4A', border: '1px solid #E1E1E1', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  const label = freeColumnLabelDraft.trim();
                  if (!label) {
                    alert('列名を入力してください');
                    return;
                  }
                  const key = `free_${Date.now()}`;
                  setFreeColumns((prev) => [...prev, { key, label }]);
                  setIsAddFreeColumnOpen(false);
                }}
                disabled={!freeColumnLabelDraft.trim()}
                style={{
                  padding: '8px 16px',
                  background: freeColumnLabelDraft.trim() ? '#008C1D' : '#E1E1E1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: freeColumnLabelDraft.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                追加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フリーカラム削除確認 (REQ-141④) */}
      <ConfirmDialog
        isOpen={deleteFreeColumnConfirm !== null}
        onClose={() => setDeleteFreeColumnConfirm(null)}
        onConfirm={() => {
          if (!deleteFreeColumnConfirm) return;
          const targetKey = deleteFreeColumnConfirm.key;
          setFreeColumns((prev) => prev.filter((c) => c.key !== targetKey));
          setFreeColumnValues((prev) => {
            const next: typeof prev = {};
            for (const no of Object.keys(prev)) {
              const row = { ...prev[Number(no)] };
              delete row[targetKey];
              next[Number(no)] = row;
            }
            return next;
          });
          setDeleteFreeColumnConfirm(null);
        }}
        title="フリーカラムを削除"
        message={deleteFreeColumnConfirm ? `フリーカラム「${deleteFreeColumnConfirm.label}」を削除します。入力済みの値もすべてクリアされ、元に戻すことはできません。` : ''}
        confirmLabel="列を削除"
        cancelLabel="キャンセル"
        variant="danger"
      />

      {/* レコード削除確認 (REQ-142③) */}
      <ConfirmDialog
        isOpen={deleteRowConfirm !== null}
        onClose={() => setDeleteRowConfirm(null)}
        onConfirm={() => {
          if (!deleteRowConfirm) return;
          const targetNo = deleteRowConfirm.no;
          if (isEditListMode && listId) {
            if (targetNo >= 90000) {
              removeItem(listId, targetNo - 90000);
            } else {
              removeBaseAsset(listId, targetNo);
            }
          } else {
            setMockAssets((prev) => prev.filter((a) => a.no !== targetNo));
          }
          setSelectedItems((prev) => {
            const next = new Set(prev);
            next.delete(targetNo);
            return next;
          });
          setFreeColumnValues((prev) => {
            const next = { ...prev };
            delete next[targetNo];
            return next;
          });
          setDeleteRowConfirm(null);
        }}
        title="レコードを削除"
        message={deleteRowConfirm ? `「${deleteRowConfirm.assetName}」を編集リストから削除します。この操作は取り消せません。` : ''}
        confirmLabel="レコードを削除"
        cancelLabel="キャンセル"
        variant="danger"
      />

      {/* Data Link / 見積DB Link モーダル */}
      <DataLinkModal
        isOpen={isDataLinkModalOpen}
        onClose={() => setIsDataLinkModalOpen(false)}
        selectedAssets={dataLinkSelectedAssets}
        baseAssets={baseAssetsForDataLink}
        assetMasters={assetMasters}
        vendors={vendors}
        quotationGroups={quotationGroups}
        quotationItems={quotationItems}
        rfqGroups={rfqGroups}
        onExecute={handleDataLinkExecute}
        onAddNewAssets={handleDataLinkAddNewAssets}
        mode={dataLinkMode}
      />

      {/* 更新確認ダイアログ */}
      {showUpdateConfirm && (
        <div
          onClick={() => setShowUpdateConfirm(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '480px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
              更新レコードの作成確認
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#4A4A4A' }}>
                以下の処理が実行されます:
              </p>
              <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '14px', color: '#555', lineHeight: 1.8 }}>
                <li>現在のレコード → 購入区分が「廃棄予定」に変更</li>
                <li>新しいレコード → 品目・メーカー・型式をコピーして「更新」として追加</li>
              </ul>
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowUpdateConfirm(null)}
                style={{
                  padding: '8px 20px',
                  background: '#8A8A8A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateConfirm}
                style={{
                  padding: '8px 20px',
                  background: '#4A4A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                更新レコードを作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 増設数量入力ダイアログ */}
      {showAdditionInput && (
        <div
          onClick={() => setShowAdditionInput(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: '#4A4A4A',
              color: 'white',
              padding: '16px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}>
              増設数量の入力
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#4A4A4A' }}>
                追加するレコード数を入力してください:
              </p>
              <input
                type="number"
                min="1"
                max="99"
                value={showAdditionInput.quantity}
                onChange={(e) => setShowAdditionInput(prev => prev ? { ...prev, quantity: Math.max(1, Number(e.target.value)) } : null)}
                autoFocus
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  border: '1px solid #E1E1E1',
                  borderRadius: '4px',
                  fontSize: '16px',
                  textAlign: 'center',
                }}
              />
              <span style={{ marginLeft: '8px', fontSize: '14px', color: '#555' }}>件</span>
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid #E1E1E1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}>
              <button
                onClick={() => setShowAdditionInput(null)}
                style={{
                  padding: '8px 20px',
                  background: '#8A8A8A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleAdditionConfirm}
                style={{
                  padding: '8px 20px',
                  background: '#4A4A4A',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                増設レコードを追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RemodelApplicationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <RemodelApplicationContent />
    </Suspense>
  );
}
