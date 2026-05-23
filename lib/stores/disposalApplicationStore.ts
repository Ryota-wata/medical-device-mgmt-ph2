import { create } from 'zustand';
import {
  DisposalApplication,
  DisposalApplicationStatus,
  CreateDisposalApplicationInput,
} from '@/lib/types/disposalApplication';

interface DisposalApplicationState {
  applications: DisposalApplication[];
  addApplication: (input: CreateDisposalApplicationInput) => DisposalApplication;
  updateApplicationStatus: (id: string, status: DisposalApplicationStatus) => void;
  getApplicationById: (id: string) => DisposalApplication | undefined;
  getPendingApplications: () => DisposalApplication[];
  getApplicationsByStatus: (status: DisposalApplicationStatus) => DisposalApplication[];
}

// サンプルデータ
const sampleApplications: DisposalApplication[] = [
  {
    id: 'da-001',
    applicationNo: 'DSP-2026-001',
    applicationDate: '2026-02-01',
    applicantId: 'user-clinical-001',
    applicantName: '山田 太郎',
    applicantDepartment: 'ME室',
    status: '発注済',
    itemName: '心電計',
    maker: '日本光電',
    model: 'ECG-2550',
    qrCode: 'QR-001234',
    facility: '〇〇病院',
    building: '本館',
    floor: '2F',
    department: '診療技術部',
    section: 'ME室',
    roomName: 'ME機器管理室',
    disposalReason: '耐用年数超過',
    comment: '10年以上使用、部品供給終了',
    createdAt: '2026-02-01T10:00:00',
    updatedAt: '2026-02-10T14:00:00',
  },
  {
    id: 'da-002',
    applicationNo: 'DSP-2026-002',
    applicationDate: '2026-02-05',
    applicantId: 'user-clinical-002',
    applicantName: '佐藤 花子',
    applicantDepartment: '手術部',
    status: '受付済',
    itemName: '電気メス',
    maker: 'コヴィディエン',
    model: 'Force FX',
    qrCode: 'QR-002345',
    facility: '〇〇病院',
    building: '本館',
    floor: '3F',
    department: '中央手術部門',
    section: '手術部',
    roomName: '手術室A',
    disposalReason: '故障（修理不能）',
    comment: '修理見積が新品購入価格を超過',
    createdAt: '2026-02-05T09:00:00',
    updatedAt: '2026-02-06T11:00:00',
  },
  {
    id: 'da-003',
    applicationNo: 'DSP-2026-003',
    applicationDate: '2026-02-10',
    applicantId: 'user-clinical-003',
    applicantName: '田中 一郎',
    applicantDepartment: 'ICU',
    status: '申請中',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-LM700',
    qrCode: 'QR-003456',
    facility: '〇〇病院',
    building: '本館',
    floor: '4F',
    department: '看護部',
    section: 'ICU',
    roomName: 'ICU-1',
    disposalReason: '耐用年数超過',
    comment: '新機種へ更新のため廃棄',
    createdAt: '2026-02-10T08:30:00',
    updatedAt: '2026-02-10T08:30:00',
  },
  {
    id: 'da-004',
    applicationNo: 'DSP-2026-004',
    applicationDate: '2026-02-08',
    applicantId: 'user-clinical-004',
    applicantName: '鈴木 次郎',
    applicantDepartment: '放射線科',
    status: '見積取得済',
    itemName: 'モニター',
    maker: 'EIZO',
    model: 'RadiForce RX250',
    qrCode: 'QR-004567',
    facility: '〇〇病院',
    building: '本館',
    floor: '1F',
    department: '診療部',
    section: '放射線科',
    roomName: 'CT室',
    disposalReason: '故障（修理不能）',
    comment: '液晶パネル不具合、交換部品なし',
    createdAt: '2026-02-08T14:00:00',
    updatedAt: '2026-02-12T10:00:00',
  },
];

export const useDisposalApplicationStore = create<DisposalApplicationState>((set, get) => ({
  applications: sampleApplications,

  addApplication: (input: CreateDisposalApplicationInput) => {
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();
    const applicationCount = get().applications.length + 1;

    const newApplication: DisposalApplication = {
      id: `da-${Date.now()}`,
      applicationNo: `DSP-${currentYear}-${String(applicationCount).padStart(3, '0')}`,
      applicationDate: now.split('T')[0],
      status: '申請中',
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      applications: [...state.applications, newApplication],
    }));

    return newApplication;
  },

  updateApplicationStatus: (id: string, status: DisposalApplicationStatus) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id
          ? { ...app, status, updatedAt: new Date().toISOString() }
          : app
      ),
    }));
  },

  getApplicationById: (id: string) => {
    return get().applications.find((app) => app.id === id);
  },

  getPendingApplications: () => {
    return get().applications.filter((app) => app.status === '申請中');
  },

  getApplicationsByStatus: (status: DisposalApplicationStatus) => {
    return get().applications.filter((app) => app.status === status);
  },
}));
