import { create } from 'zustand';
import {
  PurchaseApplication,
  PurchaseApplicationStatus,
  CreatePurchaseApplicationInput,
} from '@/lib/types/purchaseApplication';

interface PurchaseApplicationState {
  applications: PurchaseApplication[];
  addApplication: (input: CreatePurchaseApplicationInput) => PurchaseApplication;
  updateApplicationStatus: (id: string, status: PurchaseApplicationStatus) => void;
  addToEditList: (applicationIds: string[], editListId: string, editListName: string) => void;
  updateRfqInfo: (applicationId: string, rfqGroupId: string, rfqNo: string) => void;
  rejectApplication: (id: string) => void;
  getApplicationById: (id: string) => PurchaseApplication | undefined;
  getPendingApplications: () => PurchaseApplication[];
}

// サンプルデータ
const sampleApplications: PurchaseApplication[] = [
  {
    id: 'pa-001',
    applicationNo: 'AP-2025-0001',
    applicationType: '更新申請',
    applicantId: 'user-clinical-001',
    applicantName: '田中太郎',
    applicantDepartment: '手術部門',
    applicationDate: '2025-02-18',
    status: '申請中',
    assets: [
      {
        assetId: 'asset-001',
        qrCode: 'QR-2025-0001',
        name: '電気メス',
        maker: 'ABC社',
        model: 'EM-5000',
        quantity: 1,
        unit: '台',
      },
    ],
    facility: '〇〇病院',
    building: '本館',
    floor: '2F',
    department: '手術部門',
    section: '手術室',
    roomName: '手術室A',
    desiredDeliveryDate: '2025-04-01',
    applicationReason: '現在使用中の電気メスが老朽化しており、メーカーサポートが終了するため更新を希望します。',
    createdAt: '2025-02-18T10:00:00',
    updatedAt: '2025-02-18T10:00:00',
  },
  {
    id: 'pa-002',
    applicationNo: 'AP-2025-0002',
    applicationType: '新規申請',
    applicantId: 'user-clinical-002',
    applicantName: '佐藤花子',
    applicantDepartment: '検査部門',
    applicationDate: '2025-02-17',
    status: '申請中',
    assets: [
      {
        name: '超音波診断装置',
        maker: 'XYZ社',
        model: 'US-3000',
        quantity: 1,
        unit: '台',
      },
    ],
    facility: '〇〇病院',
    building: '本館',
    floor: '3F',
    department: '検査部門',
    section: '生理検査室',
    roomName: '超音波検査室',
    desiredDeliveryDate: '2025-05-01',
    applicationReason: '患者数増加に伴い、新規超音波診断装置の導入を希望します。',
    createdAt: '2025-02-17T14:30:00',
    updatedAt: '2025-02-17T14:30:00',
  },
  {
    id: 'pa-003',
    applicationNo: 'AP-2025-0003',
    applicationType: '増設申請',
    applicantId: 'user-clinical-003',
    applicantName: '鈴木一郎',
    applicantDepartment: '外来部門',
    applicationDate: '2025-02-16',
    status: '申請中',
    assets: [
      {
        name: '心電計',
        maker: 'DEF社',
        model: 'ECG-200',
        quantity: 2,
        unit: '台',
      },
    ],
    facility: '〇〇病院',
    building: '本館',
    floor: '1F',
    department: '外来部門',
    section: '内科外来',
    roomName: '診察室1',
    desiredDeliveryDate: '2025-03-15',
    applicationReason: '外来患者数の増加に対応するため、心電計の増設を希望します。',
    createdAt: '2025-02-16T09:00:00',
    updatedAt: '2025-02-16T09:00:00',
  },
  {
    id: 'pa-004',
    applicationNo: 'AP-2025-0004',
    applicationType: '更新申請',
    applicantId: 'user-clinical-001',
    applicantName: '田中太郎',
    applicantDepartment: '手術部門',
    applicationDate: '2025-02-15',
    status: '編集中',
    assets: [
      {
        assetId: 'asset-002',
        qrCode: 'QR-2025-0002',
        name: '麻酔器',
        maker: 'GHI社',
        model: 'AN-1000',
        quantity: 1,
        unit: '台',
      },
    ],
    facility: '〇〇病院',
    building: '本館',
    floor: '2F',
    department: '手術部門',
    section: '手術室',
    roomName: '手術室B',
    editListId: 'edit-list-001',
    editListName: '2025年度リモデル計画',
    createdAt: '2025-02-15T11:00:00',
    updatedAt: '2025-02-16T14:00:00',
  },
];

export const usePurchaseApplicationStore = create<PurchaseApplicationState>((set, get) => ({
  applications: sampleApplications,

  addApplication: (input: CreatePurchaseApplicationInput) => {
    const now = new Date().toISOString();
    const newApplication: PurchaseApplication = {
      id: `pa-${Date.now()}`,
      applicationNo: `AP-${new Date().getFullYear()}-${String(get().applications.length + 1).padStart(4, '0')}`,
      ...input,
      applicationDate: now.split('T')[0],
      status: '申請中',
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      applications: [...state.applications, newApplication],
    }));

    return newApplication;
  },

  updateApplicationStatus: (id: string, status: PurchaseApplicationStatus) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id
          ? { ...app, status, updatedAt: new Date().toISOString() }
          : app
      ),
    }));
  },

  addToEditList: (applicationIds: string[], editListId: string, editListName: string) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        applicationIds.includes(app.id)
          ? {
              ...app,
              status: '編集中' as PurchaseApplicationStatus,
              editListId,
              editListName,
              updatedAt: new Date().toISOString(),
            }
          : app
      ),
    }));
  },

  updateRfqInfo: (applicationId: string, rfqGroupId: string, rfqNo: string) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === applicationId
          ? {
              ...app,
              status: '見積中' as PurchaseApplicationStatus,
              rfqGroupIds: [...(app.rfqGroupIds || []), rfqGroupId],
              rfqNos: [...(app.rfqNos || []), rfqNo],
              updatedAt: new Date().toISOString(),
            }
          : app
      ),
    }));
  },

  rejectApplication: (id: string) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id
          ? { ...app, status: '却下' as PurchaseApplicationStatus, updatedAt: new Date().toISOString() }
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
}));
