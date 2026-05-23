import { create } from 'zustand';
import {
  InspectionMenu,
  InspectionTask,
  InspectionRecord,
  InspectionMenuFormData,
  InspectionTaskFormData,
  InspectionTaskStatus,
} from '@/lib/types/inspection';

// モックデータ: 点検メニュー
const initialMenus: InspectionMenu[] = [
  {
    id: 'MENU001',
    name: '輸液ポンプ 定期点検 1ヶ月',
    largeClass: '検査機器',
    mediumClass: '超音波診断装置',
    item: '輸液ポンプ',
    menuType: '定期点検',
    cycleMonths: 1,
    inspectionItems: [
      { id: 'ITEM001', order: 1, itemName: '外観確認', content: '破損・汚れがないか', inputType: 'フリー入力', evaluationType: '合否' },
      { id: 'ITEM002', order: 2, itemName: '電源確認', content: '正常に起動するか', inputType: '選択', evaluationType: '合否', selectOptions: ['正常', '異常'] },
      { id: 'ITEM003', order: 3, itemName: '動作確認', content: '正常に動作するか', inputType: 'フリー入力', evaluationType: '合否' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'MENU002',
    name: '輸液ポンプ 定期点検 3ヶ月',
    largeClass: '検査機器',
    mediumClass: '超音波診断装置',
    item: '輸液ポンプ',
    menuType: '定期点検',
    cycleMonths: 3,
    inspectionItems: [
      { id: 'ITEM004', order: 1, itemName: '外観確認', content: '破損・汚れがないか', inputType: 'フリー入力', evaluationType: '合否' },
      { id: 'ITEM005', order: 2, itemName: '精度確認', content: '流量精度の確認', inputType: 'フリー入力', evaluationType: 'フリー入力' },
      { id: 'ITEM006', order: 3, itemName: 'アラーム確認', content: '各種アラームの動作確認', inputType: '選択', evaluationType: '合否', selectOptions: ['全て正常', '一部異常', '異常'] },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'MENU003',
    name: '呼吸器A 使用前点検',
    largeClass: '人工呼吸器',
    mediumClass: '集中治療用',
    item: '人工呼吸器',
    menuType: '日常点検',
    dailyTiming: '使用前',
    inspectionItems: [
      { id: 'ITEM007', order: 1, itemName: '電源確認', content: '電源が入るか', inputType: 'フリー入力', evaluationType: '合否' },
      { id: 'ITEM008', order: 2, itemName: '回路確認', content: '回路に破損がないか', inputType: 'フリー入力', evaluationType: '合否' },
      { id: 'ITEM009', order: 3, itemName: '設定確認', content: '設定値が正しいか', inputType: 'フリー入力', evaluationType: '合否' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'MENU004',
    name: '呼吸器A 使用後点検',
    largeClass: '人工呼吸器',
    mediumClass: '集中治療用',
    item: '人工呼吸器',
    menuType: '日常点検',
    dailyTiming: '使用後',
    inspectionItems: [
      { id: 'ITEM010', order: 1, itemName: '清掃確認', content: '本体を清掃したか', inputType: 'フリー入力', evaluationType: '合否' },
      { id: 'ITEM011', order: 2, itemName: '消耗品確認', content: '消耗品の状態確認', inputType: 'フリー入力', evaluationType: 'フリー入力' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// モックデータ: 点検タスク
const initialTasks: InspectionTask[] = [
  {
    id: 'TASK001',
    assetId: 'QR-2025-0001',
    assetName: '超音波診断装置',
    maker: 'テルモ',
    model: 'TE-151',
    largeClass: '検査機器',
    mediumClass: '超音波診断装置',
    managementDepartment: '臨床工学課',
    installedDepartment: '病棟4A',
    purchaseDate: '2025-01-01',
    inspectionType: '院内定期点検',
    periodicMenuIds: ['MENU001', 'MENU002'],
    hasDailyInspection: false,
    dailyMenus: {},
    lendingStatus: '待機中',
    inspectionGroupName: '院内定期点検',
    nextInspectionDate: '2026-02-01',
    lastInspectionDate: '2026-01-01',
    completedCount: 1,
    totalCount: 2,
    status: '点検月',
  },
  {
    id: 'TASK002',
    assetId: 'QR-2025-0002',
    assetName: '循環器関連装置 ガイドワイヤー',
    maker: 'フィリップス',
    model: 'GUIDEWIRE-X',
    largeClass: '画像診断機器',
    mediumClass: 'MRI関連',
    managementDepartment: 'MRI室',
    installedDepartment: 'MRI室',
    purchaseDate: '2024-01-15',
    inspectionType: 'メーカー保守',
    periodicMenuIds: [],
    hasDailyInspection: false,
    dailyMenus: {},
    vendorName: 'フィリップスメンテナンス',
    lendingStatus: '貸出可',
    inspectionGroupName: 'メーカー保守',
    nextInspectionDate: '2025-12-15',
    lastInspectionDate: '2024-12-15',
    completedCount: 0,
    totalCount: 3,
    status: '点検月超過',
  },
  {
    id: 'TASK003',
    assetId: 'QR-2025-0003',
    assetName: '人工呼吸器 V680',
    maker: 'フィリップス',
    model: 'V680',
    largeClass: '人工呼吸器',
    mediumClass: '集中治療用',
    managementDepartment: '臨床工学課',
    installedDepartment: 'ICU',
    purchaseDate: '2024-06-01',
    inspectionType: '院内定期点検',
    periodicMenuIds: ['MENU001'],
    hasDailyInspection: true,
    dailyMenus: {
      before: 'MENU003',
      after: 'MENU004',
    },
    lendingStatus: '使用中',
    inspectionGroupName: '院内定期点検',
    nextInspectionDate: '2026-03-01',
    lastInspectionDate: '2026-02-01',
    completedCount: 2,
    totalCount: 2,
    status: '点検月',
  },
];

// ステータス計算ヘルパー
function calculateStatus(nextInspectionDate: string): InspectionTaskStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDate = new Date(nextInspectionDate);
  nextDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '点検月超過';
  if (diffDays <= 7) return '点検週';
  if (diffDays <= 30) return '点検月';
  const diffMonths = Math.ceil(diffDays / 30);
  return `点検${diffMonths}ヶ月前`;
}

interface InspectionStore {
  // 点検メニュー
  menus: InspectionMenu[];
  addMenu: (data: InspectionMenuFormData) => void;
  updateMenu: (id: string, data: Partial<InspectionMenu>) => void;
  deleteMenu: (id: string) => void;
  getMenuById: (id: string) => InspectionMenu | undefined;
  getMenusByTarget: (largeClass: string, mediumClass: string, item: string) => InspectionMenu[];

  // 点検タスク
  tasks: InspectionTask[];
  addTask: (data: InspectionTaskFormData, assetInfo: Partial<InspectionTask>) => void;
  updateTask: (id: string, data: Partial<InspectionTask>) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => InspectionTask | undefined;
  getTasksByAssetId: (assetId: string) => InspectionTask[];

  // 点検実績
  records: InspectionRecord[];
  addRecord: (record: Omit<InspectionRecord, 'id' | 'createdAt'>) => void;
  getRecordsByTaskId: (taskId: string) => InspectionRecord[];
  getRecordsByAssetId: (assetId: string) => InspectionRecord[];

  // 点検実施
  startInspection: (taskId: string) => void;
  completeInspection: (taskId: string, record: Omit<InspectionRecord, 'id' | 'createdAt'>) => void;
  skipInspection: (taskId: string) => void;

  // 日程調整（メーカー保守用）
  setInspectionDate: (taskId: string, date: string) => void;
}

export const useInspectionStore = create<InspectionStore>((set, get) => ({
  menus: initialMenus,
  tasks: initialTasks,
  records: [],

  // 点検メニュー操作
  addMenu: (data) => {
    const newMenu: InspectionMenu = {
      id: `MENU${Date.now()}`,
      ...data,
      inspectionItems: data.inspectionItems.map((item, index) => ({
        ...item,
        id: `ITEM${Date.now()}_${index}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ menus: [...state.menus, newMenu] }));
  },

  updateMenu: (id, data) => {
    set((state) => ({
      menus: state.menus.map((menu) =>
        menu.id === id
          ? { ...menu, ...data, updatedAt: new Date().toISOString() }
          : menu
      ),
    }));
  },

  deleteMenu: (id) => {
    set((state) => ({
      menus: state.menus.filter((menu) => menu.id !== id),
    }));
  },

  getMenuById: (id) => {
    return get().menus.find((menu) => menu.id === id);
  },

  getMenusByTarget: (largeClass, mediumClass, item) => {
    return get().menus.filter(
      (menu) =>
        menu.largeClass === largeClass &&
        menu.mediumClass === mediumClass &&
        menu.item === item
    );
  },

  // 点検タスク操作
  addTask: (data, assetInfo) => {
    const newTask: InspectionTask = {
      id: `TASK${Date.now()}`,
      assetId: data.assetId,
      assetName: assetInfo.assetName || '',
      maker: assetInfo.maker || '',
      model: assetInfo.model || '',
      largeClass: assetInfo.largeClass || '',
      mediumClass: assetInfo.mediumClass || '',
      managementDepartment: assetInfo.managementDepartment || '',
      installedDepartment: assetInfo.installedDepartment || '',
      purchaseDate: assetInfo.purchaseDate,
      inspectionType: data.inspectionType,
      periodicMenuIds: data.periodicMenuIds,
      hasDailyInspection: data.hasDailyInspection,
      dailyMenus: data.dailyMenus,
      vendorName: data.vendorName,
      lendingStatus: assetInfo.lendingStatus || '待機中',
      inspectionGroupName: assetInfo.inspectionGroupName,
      nextInspectionDate: data.nextInspectionDate,
      completedCount: 0,
      totalCount: data.periodicMenuIds.length || 1,
      status: calculateStatus(data.nextInspectionDate),
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: (id, data) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...data } : task
      ),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  getTaskById: (id) => {
    return get().tasks.find((task) => task.id === id);
  },

  getTasksByAssetId: (assetId) => {
    return get().tasks.filter((task) => task.assetId === assetId);
  },

  // 点検実績操作
  addRecord: (record) => {
    const newRecord: InspectionRecord = {
      ...record,
      id: `RECORD${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ records: [...state.records, newRecord] }));
  },

  getRecordsByTaskId: (taskId) => {
    return get().records.filter((record) => record.taskId === taskId);
  },

  getRecordsByAssetId: (assetId) => {
    return get().records.filter((record) => record.assetId === assetId);
  },

  // 点検実施操作
  startInspection: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: '点検実施中' as InspectionTaskStatus } : task
      ),
    }));
  },

  completeInspection: (taskId, record) => {
    const task = get().getTaskById(taskId);
    if (!task) return;

    // 実績を追加
    get().addRecord(record);

    // 次回点検日を計算（周期に基づく）
    const menu = get().getMenuById(task.periodicMenuIds[0]);
    const cycleMonths = menu?.cycleMonths || 1;
    const nextDate = new Date(record.actualDate);
    nextDate.setMonth(nextDate.getMonth() + cycleMonths);

    // タスクを更新
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: '点検完了' as InspectionTaskStatus,
              lastInspectionDate: record.actualDate,
              nextInspectionDate: nextDate.toISOString().split('T')[0],
              completedCount: t.completedCount + 1,
            }
          : t
      ),
    }));
  },

  skipInspection: (taskId) => {
    // スキップの場合は点検周期に基づき次回予定日を更新
    const task = get().getTaskById(taskId);
    if (!task) return;

    // 点検メニューから周期を取得（デフォルト1ヶ月）
    const menu = task.periodicMenuIds.length > 0
      ? get().getMenuById(task.periodicMenuIds[0])
      : null;
    const cycleMonths = menu?.cycleMonths || 1;

    const nextDate = new Date(task.nextInspectionDate);
    nextDate.setMonth(nextDate.getMonth() + cycleMonths);

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              nextInspectionDate: nextDate.toISOString().split('T')[0],
              status: calculateStatus(nextDate.toISOString().split('T')[0]),
            }
          : t
      ),
    }));
  },

  // 日程調整
  setInspectionDate: (taskId, date) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              nextInspectionDate: date,
              status: calculateStatus(date),
            }
          : task
      ),
    }));
  },
}));
