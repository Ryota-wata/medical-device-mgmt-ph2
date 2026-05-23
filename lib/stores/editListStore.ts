import { create } from 'zustand';
import { EditList, EditListItem, CreateEditListInput, Asset } from '@/lib/types';
import { PurchaseApplication } from '@/lib/types/purchaseApplication';
import { generateMockAssets } from '@/lib/data/generateMockAssets';
import { customerEditListItems } from '@/lib/data/customer/edit-list';

// 顧客サンプルデータをAsset型に変換
// 見積DB Linkデモ用: 顧客サンプルの rfqNo はプレースホルダ（"QT●●-●●●●●"）なので
// 各見積依頼に少数（2-3件）だけrfqNoを割当て、残りは空にする
// 明細側の方がレコード数が多いケースが多いので編集リスト側は少なく抑える
const DEMO_RFQ_ASSIGNMENTS: { rfqNo: string; rfqGroupName: string; count: number }[] = [
  { rfqNo: 'RFQ-20250110-0001', rfqGroupName: '2025年度放射線科機器更新', count: 2 },
  { rfqNo: 'RFQ-20250113-0003', rfqGroupName: '2025年度検査科・手術室機器更新', count: 3 },
  { rfqNo: 'QT26-00001', rfqGroupName: '耳鼻科ユニット 一式', count: 2 },
];
const isPlaceholderRfq = (s?: string) => !s || s.includes('●');
// インデックス → 割当（先頭から各RFQに count 件ずつ割当て、それ以降は空）
const getDemoAssignment = (i: number): { rfqNo: string; rfqGroupName: string } => {
  let cursor = 0;
  for (const a of DEMO_RFQ_ASSIGNMENTS) {
    if (i < cursor + a.count) return { rfqNo: a.rfqNo, rfqGroupName: a.rfqGroupName };
    cursor += a.count;
  }
  return { rfqNo: '', rfqGroupName: '' };
};

const customerBaseAssets: Asset[] = customerEditListItems.map((item, i) => ({
  qrCode: item.qrCode || '',
  no: i + 1,
  facility: 'サンプル病院',
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
  commonDivision: item.commonDivision || '',
  commonDepartment: item.commonDepartment || '',
  roomCategory1: item.roomCategory1 || '',
  roomCategory2: item.roomCategory2 || '',
  divisionId: item.divisionId || '',
  departmentId: item.departmentId || '',
  roomId: item.roomId || '',
  currentBuilding: item.currentBuilding || '',
  currentFloor: item.currentFloor || '',
  currentDivision: item.currentDivision || '',
  currentDepartment: item.currentDepartment || '',
  currentRoom: item.currentRoom || '',
  newBuilding: item.newBuilding || '',
  newFloor: item.newFloor || '',
  newDivision: item.newDivision || '',
  newDepartment: item.newDepartment || '',
  newRoom: item.newRoom || '',
  serialNo: item.serialNo || '',
  fixedAssetNo: item.fixedAssetNo || '',
  meNo: item.meNo || '',
  assetMasterId: item.assetMasterId || '',
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
  applicationType: item.applicationType || '',
  fiscalYear: item.fiscalYear || '',
  priority: item.priority || '',
  systemConnection: item.systemConnection || '',
  systemTarget: item.systemTarget || '',
  wish1Manufacturer: item.wish1Manufacturer || '',
  wish1Model: item.wish1Model || '',
  wish2Manufacturer: item.wish2Manufacturer || '',
  wish2Model: item.wish2Model || '',
  wish3Manufacturer: item.wish3Manufacturer || '',
  wish3Model: item.wish3Model || '',
  rfqNo: isPlaceholderRfq(item.rfqNo) ? getDemoAssignment(i).rfqNo : item.rfqNo,
  rfqGroupName: isPlaceholderRfq(item.rfqNo) ? getDemoAssignment(i).rfqGroupName : (item.rfqGroupName || ''),
  quotationPhase: item.quotationPhase || '',
  quotationDate: item.quotationDate || '',
  accountCategory: item.accountCategory || '',
  listPriceUnit: item.listPriceUnit || 0,
  listPriceTotal: item.listPriceTotal || 0,
  quotationPriceUnit: item.quotationPriceUnit || 0,
  quotationPriceExTax: item.quotationPriceExTax || 0,
  quotationPriceInTax: item.quotationPriceInTax || 0,
}));

interface EditListState {
  editLists: EditList[];
  addEditList: (input: CreateEditListInput) => EditList;
  updateEditList: (id: string, data: Partial<EditList>) => void;
  deleteEditList: (id: string) => void;
  getEditListById: (id: string) => EditList | undefined;
  addItemsFromApplications: (editListId: string, applications: PurchaseApplication[]) => number;
  updateRfqInfo: (editListId: string, selectedNos: Set<number>, rfqNo: string, rfqGroupName: string) => void;
  updateBaseAsset: (editListId: string, assetNo: number, patch: Record<string, unknown>) => void;
  addBaseAssets: (editListId: string, newAssets: import('@/lib/types').Asset[], afterNo?: number) => void;
  removeBaseAsset: (editListId: string, assetNo: number) => void;
  removeItem: (editListId: string, itemIndex: number) => void;
  reorderBaseAssets: (editListId: string, assetNo: number, direction: 'up' | 'down') => void;
  reorderItems: (editListId: string, itemIndex: number, direction: 'up' | 'down') => void;
  getItemsByEditListId: (editListId: string) => EditListItem[];
  getTotalItemCount: (editListId: string) => number;
}

// デモ用 リモデル編集リスト（DataLinkで品目+数量一致を確認できるようにする）
// 見積DB側の QT26-00001 グループの「耳鼻咽喉科ユニット / 第一医科 / きららEFUS01 ×4台」と一致させる
const demoRemodelAssets: Asset[] = Array.from({ length: 4 }).map((_, i) => ({
  no: i + 1,
  qrCode: `QR-DEMO-${String(i + 1).padStart(3, '0')}`,
  facility: 'サンプル病院',
  building: '本館',
  floor: i < 2 ? '3F' : '4F',
  department: '耳鼻咽喉科',
  section: '外来',
  category: '01 医療機器',
  largeClass: '20 各科特有機器',
  mediumClass: '01 診察関連',
  item: '耳鼻咽喉科ユニット',
  name: '耳鼻咽喉科ユニット',
  itemName: '耳鼻咽喉科ユニット',
  manufacturer: '第一医科',
  maker: '第一医科',
  model: 'きららEFUS01',
  quantity: 1,
  unit: '式',
  width: '', depth: '', height: '',
  roomName: i < 2 ? `診察室${i + 1}` : `処置室${i - 1}`,
  // 新設置場所（ヒアリング由来）
  newBuilding: '東棟',
  newFloor: i < 2 ? '3F' : '4F',
  newDivision: '耳鼻咽喉科',
  newDepartment: '外来',
  newRoom: i < 2 ? `新診察室${i + 1}` : `新処置室${i - 1}`,
  // リモデル方針
  purchaseCategory: '新規' as const,
  // 見積依頼グループ
  rfqNo: 'QT26-00001',
  rfqGroupName: '耳鼻科ユニット 一式（デモ）',
  // その他
  itemType: 'C_個体管理品目',
  applicationType: '新規購入',
  fiscalYear: '2026',
  priority: '中',
  systemConnection: '不要',
  systemTarget: '',
  managementDept: '耳鼻咽喉科',
  deviceType: '医療機器',
  assetGroupName: '',
  purpose: '外来診察',
  remarks: '',
  wish1Manufacturer: '第一医科',
  wish1Model: 'きららEFUS01',
  wish2Manufacturer: '',
  wish2Model: '',
  wish3Manufacturer: '',
  wish3Model: '',
  quotationPhase: '概算見積',
  quotationDate: 'yyyy/mm/dd',
  accountCategory: '医療機器',
  listPriceUnit: 3300000,
  listPriceTotal: 3300000,
  quotationPriceUnit: 1650000,
  quotationPriceExTax: 1650000,
  quotationPriceInTax: 1815000,
  serialNo: '', fixedAssetNo: '', meNo: '',
  assetMasterId: '',
  parentItem: '',
  commonDivision: '耳鼻咽喉科',
  commonDepartment: '外来',
  roomCategory1: '01 診察関連',
  roomCategory2: '',
  divisionId: '', departmentId: '', roomId: '',
  currentBuilding: '本館',
  currentFloor: i < 2 ? '3F' : '4F',
  currentDivision: '耳鼻咽喉科',
  currentDepartment: '外来',
  currentRoom: i < 2 ? `診察室${i + 1}` : `処置室${i - 1}`,
}));

// サンプルデータ（顧客Excelから変換した原本資産を設定）
const sampleEditLists: EditList[] = [
  {
    id: 'edit-list-001',
    name: 'サンプル病院 編集分析リスト（リモデル）',
    facilities: ['サンプル病院'],
    baseAssets: customerBaseAssets,
    items: [],
    mode: 'remodel',
    remodelProjectId: 'remodel-001',
    createdAt: '2025-01-10T10:00:00',
    updatedAt: '2025-01-10T10:00:00',
  },
  {
    id: 'edit-list-002',
    name: 'サンプル病院 編集分析リスト（通常）',
    facilities: ['サンプル病院'],
    // 通常リストもリモデルと同じ原本資産を複製して使う（顧客サンプル）
    baseAssets: customerBaseAssets,
    items: [],
    mode: 'normal',
    createdAt: '2025-02-01T10:00:00',
    updatedAt: '2025-02-01T10:00:00',
  },
  {
    id: 'edit-list-demo',
    name: 'デモ用 リモデル編集リスト（DataLinkマッチ確認用）',
    facilities: ['サンプル病院'],
    baseAssets: demoRemodelAssets,
    items: [],
    mode: 'remodel',
    remodelProjectId: 'remodel-demo',
    createdAt: '2026-05-01T10:00:00',
    updatedAt: '2026-05-01T10:00:00',
  },
];

export const useEditListStore = create<EditListState>((set, get) => ({
  editLists: sampleEditLists,

  addEditList: (input: CreateEditListInput) => {
    const now = new Date().toISOString();
    const newEditList: EditList = {
      id: `edit-list-${Date.now()}`,
      name: input.name,
      facilities: input.facilities,
      baseAssets: [...input.baseAssets],  // 原本資産を複製
      items: [],
      mode: input.mode || 'normal',
      remodelProjectId: input.remodelProjectId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      editLists: [...state.editLists, newEditList],
    }));

    return newEditList;
  },

  updateEditList: (id: string, data: Partial<EditList>) => {
    set((state) => ({
      editLists: state.editLists.map((list) =>
        list.id === id
          ? { ...list, ...data, updatedAt: new Date().toISOString() }
          : list
      ),
    }));
  },

  deleteEditList: (id: string) => {
    set((state) => ({
      editLists: state.editLists.filter((list) => list.id !== id),
    }));
  },

  getEditListById: (id: string) => {
    return get().editLists.find((list) => list.id === id);
  },

  // 申請から要望機器をアイテムとして追加
  addItemsFromApplications: (editListId: string, applications: PurchaseApplication[]) => {
    const now = new Date().toISOString();
    let addedCount = 0;

    set((state) => {
      const updatedLists = state.editLists.map((list) => {
        if (list.id !== editListId) return list;

        const newItems: EditListItem[] = [];

        applications.forEach((app) => {
          app.assets.forEach((asset, index) => {
            newItems.push({
              id: `item-${Date.now()}-${app.id}-${index}`,
              applicationId: app.id,
              applicationNo: app.applicationNo,
              applicationType: app.applicationType,
              applicationReason: app.applicationReason,
              applicantName: app.applicantName,
              applicantDepartment: app.applicantDepartment,
              applicationDate: app.applicationDate,
              assetId: asset.assetId,
              qrCode: asset.qrCode,
              name: asset.name,
              maker: asset.maker,
              model: asset.model,
              category: asset.category,
              largeClass: asset.largeClass,
              mediumClass: asset.mediumClass,
              item: asset.item,
              quantity: asset.quantity,
              unit: asset.unit,
              facility: app.facility,
              building: app.building,
              floor: app.floor,
              department: app.department,
              section: app.section,
              roomName: app.roomName,
              desiredDeliveryDate: app.desiredDeliveryDate,
              priority: app.priority,
              usagePurpose: app.usagePurpose,
              caseCount: app.caseCount,
              comment: app.comment,
              attachedFiles: app.attachedFiles,
              currentConnectionStatus: app.currentConnectionStatus,
              currentConnectionDestination: app.currentConnectionDestination,
              requestConnectionStatus: app.requestConnectionStatus,
              requestConnectionDestination: app.requestConnectionDestination,
              status: 'pending',
              addedAt: now,
            });
          });
        });

        addedCount = newItems.length;

        return {
          ...list,
          items: [...list.items, ...newItems],
          updatedAt: now,
        };
      });

      return { editLists: updatedLists };
    });

    return addedCount;
  },

  updateRfqInfo: (editListId: string, selectedNos: Set<number>, rfqNo: string, rfqGroupName: string) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;

        // baseAssets の更新（asset.no で照合）
        const updatedBaseAssets = list.baseAssets.map((asset) => {
          if (selectedNos.has(asset.no)) {
            return { ...asset, rfqNo, rfqGroupName };
          }
          return asset;
        });

        // items の更新（90000 + index で照合）
        const updatedItems = list.items.map((item, index) => {
          if (selectedNos.has(90000 + index)) {
            return { ...item, rfqNo, rfqGroupId: rfqNo, status: 'rfq_assigned' as const };
          }
          return item;
        });

        return {
          ...list,
          baseAssets: updatedBaseAssets,
          items: updatedItems,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  updateBaseAsset: (editListId: string, assetNo: number, patch: Record<string, unknown>) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        return {
          ...list,
          baseAssets: list.baseAssets.map((asset) =>
            asset.no === assetNo ? { ...asset, ...patch } : asset
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  addBaseAssets: (editListId: string, newAssets: import('@/lib/types').Asset[], afterNo?: number) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        let updated: import('@/lib/types').Asset[];
        if (afterNo != null) {
          const idx = list.baseAssets.findIndex(a => a.no === afterNo);
          if (idx >= 0) {
            updated = [...list.baseAssets.slice(0, idx + 1), ...newAssets, ...list.baseAssets.slice(idx + 1)];
          } else {
            updated = [...list.baseAssets, ...newAssets];
          }
        } else {
          updated = [...list.baseAssets, ...newAssets];
        }
        return {
          ...list,
          baseAssets: updated,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  removeBaseAsset: (editListId: string, assetNo: number) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        return {
          ...list,
          baseAssets: list.baseAssets.filter((a) => a.no !== assetNo),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  removeItem: (editListId: string, itemIndex: number) => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        return {
          ...list,
          items: list.items.filter((_, idx) => idx !== itemIndex),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  reorderBaseAssets: (editListId: string, assetNo: number, direction: 'up' | 'down') => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        const idx = list.baseAssets.findIndex((a) => a.no === assetNo);
        if (idx < 0) return list;
        const swapWith = direction === 'up' ? idx - 1 : idx + 1;
        if (swapWith < 0 || swapWith >= list.baseAssets.length) return list;
        const next = [...list.baseAssets];
        [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
        return {
          ...list,
          baseAssets: next,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  reorderItems: (editListId: string, itemIndex: number, direction: 'up' | 'down') => {
    set((state) => ({
      editLists: state.editLists.map((list) => {
        if (list.id !== editListId) return list;
        const swapWith = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
        if (itemIndex < 0 || itemIndex >= list.items.length) return list;
        if (swapWith < 0 || swapWith >= list.items.length) return list;
        const next = [...list.items];
        [next[itemIndex], next[swapWith]] = [next[swapWith], next[itemIndex]];
        return {
          ...list,
          items: next,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  getItemsByEditListId: (editListId: string) => {
    const list = get().editLists.find((l) => l.id === editListId);
    return list?.items || [];
  },

  getTotalItemCount: (editListId: string) => {
    const list = get().editLists.find((l) => l.id === editListId);
    return list?.items.length || 0;
  },
}));
