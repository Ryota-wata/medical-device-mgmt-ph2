import { create } from 'zustand';

/**
 * 修理依頼ステータス
 */
export type RepairRequestStatus = '受付' | '依頼済' | '引取済' | '修理中' | '完了';

/**
 * 修理依頼
 */
export interface RepairRequest {
  id: string;
  requestNo: string;
  requestDate: string;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  // 機器情報
  qrLabel: string;
  itemName: string;
  maker: string;
  model: string;
  serialNo: string;
  // 設置場所
  installDepartment: string;
  roomName: string;
  // 受付情報
  receptionDepartment: string;
  receptionPerson: string;
  receptionContact: string;
  // ステータス
  status: RepairRequestStatus;
  // 日程
  pickupDate?: string;
  deliveryDate?: string;
  // 代替機
  alternativeDevice?: string;
  alternativeReturnDate?: string;
  // 備考
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface RepairRequestState {
  requests: RepairRequest[];
  addRequest: (request: Omit<RepairRequest, 'id' | 'requestNo' | 'createdAt' | 'updatedAt'>) => RepairRequest;
  updateStatus: (id: string, status: RepairRequestStatus) => void;
  updateRequest: (id: string, data: Partial<RepairRequest>) => void;
  getRequestById: (id: string) => RepairRequest | undefined;
  getRequestsByApplicant: (applicantId: string) => RepairRequest[];
  getRequestsByDepartment: (department: string) => RepairRequest[];
}

// サンプルデータ
const sampleRequests: RepairRequest[] = [
  {
    id: 'rep-001',
    requestNo: 'REP-20260205-001',
    requestDate: '2026-02-05',
    applicantId: 'user-hospital-001',
    applicantName: '田中花子',
    applicantDepartment: '手術部門',
    qrLabel: 'QR-001',
    itemName: '人工呼吸器',
    maker: 'フクダ電子',
    model: 'FV-500',
    serialNo: 'SN-001234',
    installDepartment: '手術部門',
    roomName: '手術室1',
    receptionDepartment: 'ME室',
    receptionPerson: '鈴木太郎',
    receptionContact: '内線2345',
    status: '修理中',
    pickupDate: '2026-02-09',
    deliveryDate: '2026-02-20',
    alternativeDevice: '代替人工呼吸器 FV-300',
    alternativeReturnDate: '2026-02-20',
    createdAt: '2026-02-05T10:00:00',
    updatedAt: '2026-02-09T14:00:00',
  },
  {
    id: 'rep-002',
    requestNo: 'REP-20260204-001',
    requestDate: '2026-02-04',
    applicantId: 'user-hospital-001',
    applicantName: '田中花子',
    applicantDepartment: '手術部門',
    qrLabel: 'QR-002',
    itemName: '輸液ポンプ',
    maker: 'テルモ',
    model: 'TE-LM700',
    serialNo: 'SN-002345',
    installDepartment: '手術部門',
    roomName: '手術室2',
    receptionDepartment: 'ME室',
    receptionPerson: '鈴木太郎',
    receptionContact: '内線2345',
    status: '受付',
    createdAt: '2026-02-04T09:00:00',
    updatedAt: '2026-02-04T09:00:00',
  },
  {
    id: 'rep-003',
    requestNo: 'REP-20260201-001',
    requestDate: '2026-02-01',
    applicantId: 'user-hospital-002',
    applicantName: '佐藤一郎',
    applicantDepartment: '手術部門',
    qrLabel: 'QR-003',
    itemName: 'ベッドサイドモニター',
    maker: '日本光電',
    model: 'BSM-2301',
    serialNo: 'SN-003456',
    installDepartment: '手術部門',
    roomName: '手術準備室',
    receptionDepartment: 'ME室',
    receptionPerson: '鈴木太郎',
    receptionContact: '内線2345',
    status: '完了',
    pickupDate: '2026-02-03',
    deliveryDate: '2026-02-08',
    createdAt: '2026-02-01T11:00:00',
    updatedAt: '2026-02-08T16:00:00',
  },
];

export const useRepairRequestStore = create<RepairRequestState>((set, get) => ({
  requests: sampleRequests,

  addRequest: (requestData) => {
    const now = new Date().toISOString();
    const dateStr = now.split('T')[0].replace(/-/g, '');
    const count = get().requests.filter(r => r.requestNo.includes(dateStr)).length + 1;

    const newRequest: RepairRequest = {
      ...requestData,
      id: `rep-${Date.now()}`,
      requestNo: `REP-${dateStr}-${String(count).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      requests: [...state.requests, newRequest],
    }));

    return newRequest;
  },

  updateStatus: (id, status) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id
          ? { ...req, status, updatedAt: new Date().toISOString() }
          : req
      ),
    }));
  },

  updateRequest: (id, data) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id
          ? { ...req, ...data, updatedAt: new Date().toISOString() }
          : req
      ),
    }));
  },

  getRequestById: (id) => {
    return get().requests.find((req) => req.id === id);
  },

  getRequestsByApplicant: (applicantId) => {
    return get().requests.filter((req) => req.applicantId === applicantId);
  },

  getRequestsByDepartment: (department) => {
    return get().requests.filter((req) => req.applicantDepartment === department);
  },
}));

/**
 * ステータスのバッジスタイル取得
 */
export function getRepairStatusStyle(status: RepairRequestStatus): {
  background: string;
  color: string;
} {
  const styles: Record<RepairRequestStatus, { background: string; color: string }> = {
    '受付': { background: '#f39c12', color: 'white' },
    '依頼済': { background: '#3498db', color: 'white' },
    '引取済': { background: '#9b59b6', color: 'white' },
    '修理中': { background: '#e67e22', color: 'white' },
    '完了': { background: '#27ae60', color: 'white' },
  };
  return styles[status];
}
