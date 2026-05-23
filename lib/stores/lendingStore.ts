import { create } from 'zustand';

export type LendingStatus = '待機中' | '貸出可' | '貸出中' | '使用中' | '使用済' | '返却済' | '使用不可';
export type PeriodicInspectionStatus = '01点検週' | '02点検月' | '03点検●ヶ月前' | '04点検月超過' | null;

export interface LendingDevice {
  id: number;
  qrCode: string;
  itemName: string;
  maker: string;
  model: string;
  status: LendingStatus;
  installedDepartment: string;
  lendingDate: string | null;
  overdueDays: number;
  dailyInspectionMenu: string | null;
  dailyInspectionDate: string | null;
  periodicInspectionStatus: PeriodicInspectionStatus;
  lendingCount: number;
  lendingGroupName: string;
  lendingTypeName: string;
  alertDays: number;
  freeComment: string;
}

const initialDevices: LendingDevice[] = [
  { id: 1, qrCode: 'QR-001', itemName: '人工呼吸器', maker: 'フクダ電子', model: 'FV-500', status: '貸出中', installedDepartment: 'ICU', lendingDate: '2026-01-15', overdueDays: 45, dailyInspectionMenu: '人工呼吸器 使用前後点検', dailyInspectionDate: '2026-02-15', periodicInspectionStatus: '02点検月', lendingCount: 8, lendingGroupName: 'ME機器貸出A', lendingTypeName: '短期貸出', alertDays: 7, freeComment: '' },
  { id: 2, qrCode: 'QR-002', itemName: '輸液ポンプ', maker: 'テルモ', model: 'TE-171', status: '使用中', installedDepartment: '3階東病棟', lendingDate: '2026-02-20', overdueDays: 0, dailyInspectionMenu: '輸液ポンプ 使用前後点検', dailyInspectionDate: '2026-02-19', periodicInspectionStatus: '01点検週', lendingCount: 12, lendingGroupName: 'ME機器貸出A', lendingTypeName: '短期貸出', alertDays: 3, freeComment: '長期貸出申請中' },
  { id: 3, qrCode: 'QR-003', itemName: 'シリンジポンプ', maker: 'テルモ', model: 'TE-SS700', status: '貸出可', installedDepartment: 'ME室', lendingDate: null, overdueDays: 0, dailyInspectionMenu: 'シリンジポンプ 使用前後点検', dailyInspectionDate: '2026-03-10', periodicInspectionStatus: '01点検週', lendingCount: 5, lendingGroupName: 'ME機器貸出A', lendingTypeName: '短期貸出', alertDays: 3, freeComment: '' },
  { id: 4, qrCode: 'QR-004', itemName: '除細動器', maker: '日本光電', model: 'TEC-5600', status: '待機中', installedDepartment: 'ME室', lendingDate: null, overdueDays: 0, dailyInspectionMenu: '除細動器 日常点検', dailyInspectionDate: null, periodicInspectionStatus: '03点検●ヶ月前', lendingCount: 3, lendingGroupName: '救急機器貸出', lendingTypeName: '定数配置', alertDays: 14, freeComment: '日常点検待ち' },
  { id: 5, qrCode: 'QR-005', itemName: '心電計', maker: 'フクダ電子', model: 'FX-8000', status: '返却済', installedDepartment: 'ME室', lendingDate: null, overdueDays: 0, dailyInspectionMenu: '心電計 使用前後点検', dailyInspectionDate: '2026-03-01', periodicInspectionStatus: '02点検月', lendingCount: 6, lendingGroupName: '救急機器貸出', lendingTypeName: '短期貸出', alertDays: 7, freeComment: '' },
  { id: 6, qrCode: 'QR-006', itemName: '生体情報モニタ', maker: '日本光電', model: 'BSM-3000', status: '使用不可', installedDepartment: 'ME室', lendingDate: null, overdueDays: 0, dailyInspectionMenu: null, dailyInspectionDate: null, periodicInspectionStatus: '04点検月超過', lendingCount: 2, lendingGroupName: 'ME機器貸出A', lendingTypeName: '短期貸出', alertDays: 7, freeComment: '修理申請中' },
  { id: 7, qrCode: 'QR-007', itemName: '輸液ポンプ', maker: 'テルモ', model: 'TE-171', status: '使用済', installedDepartment: '2階西病棟', lendingDate: '2026-03-01', overdueDays: 0, dailyInspectionMenu: '輸液ポンプ 使用前後点検', dailyInspectionDate: '2026-02-28', periodicInspectionStatus: '01点検週', lendingCount: 9, lendingGroupName: 'ME機器貸出A', lendingTypeName: '短期貸出', alertDays: 3, freeComment: '' },
];

interface LendingStore {
  devices: LendingDevice[];
  addDevice: (data: { qrCode: string; itemName: string; maker: string; model: string; department: string; section: string; lendingGroupName: string; alertDays: number }) => void;
  updateDevice: (id: number, data: Partial<LendingDevice>) => void;
  removeDevice: (id: number) => void;
}

export const useLendingStore = create<LendingStore>((set) => ({
  devices: initialDevices,

  addDevice: (data) => {
    const newDevice: LendingDevice = {
      id: Date.now(),
      qrCode: data.qrCode,
      itemName: data.itemName,
      maker: data.maker,
      model: data.model,
      status: '待機中',
      installedDepartment: data.section || data.department || '',
      lendingDate: null,
      overdueDays: 0,
      dailyInspectionMenu: null,
      dailyInspectionDate: null,
      periodicInspectionStatus: null,
      lendingCount: 0,
      lendingGroupName: data.lendingGroupName,
      lendingTypeName: '',
      alertDays: data.alertDays,
      freeComment: '',
    };
    set((state) => ({ devices: [...state.devices, newDevice] }));
  },

  updateDevice: (id, data) => {
    set((state) => ({
      devices: state.devices.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
  },

  removeDevice: (id) => {
    set((state) => ({ devices: state.devices.filter((d) => d.id !== id) }));
  },
}));
