import { create } from 'zustand';
import { RfqGroup } from '@/lib/types';

interface RfqGroupState {
  rfqGroups: RfqGroup[];
  addRfqGroup: (rfqGroup: Omit<RfqGroup, 'id'>) => RfqGroup;
  updateRfqGroup: (id: number, updates: Partial<RfqGroup>) => void;
  deleteRfqGroup: (id: number) => void;
  getRfqGroupById: (id: number) => RfqGroup | undefined;
  generateRfqNo: () => string;
  generateDisposalNo: () => string;
  generateTransferNo: () => string;
  cloneRfqGroupForVendor: (sourceId: number, vendorInfo: {
    vendorName: string;
    personInCharge: string;
    email: string;
    tel: string;
    deadline?: string;
  }) => RfqGroup;
  getRfqGroupsByRfqNo: (rfqNo: string) => RfqGroup[];
  getRfqGroupsByWorkflowType: (type: 'rfq' | 'disposal' | 'transfer') => RfqGroup[];
}

// テストデータ（新ステータス体系）
const testRfqGroups: RfqGroup[] = [
  // デモ用: edit-list-demo（リモデル）の見積依頼グループ。発注登録に進める状態にしてある
  {
    id: 100,
    rfqNo: 'QT26-00001',
    groupName: '耳鼻科ユニット 一式（デモ）',
    createdDate: '2026-04-15',
    applicationIds: [],
    status: '発注見積登録済',
    editListId: 'edit-list-demo',
    workflowType: 'rfq',
    vendorName: '第一医科',
    personInCharge: '担当者A',
    email: 'sample@daiichi-med.co.jp',
    tel: '03-9999-0001',
    orderDeadline: '2026-05-31',
  },
  {
    id: 10,
    rfqNo: 'RFQ-20250108-0010',
    groupName: '2025年度皮膚科機器新規導入',
    createdDate: '2025-01-08',
    applicationIds: ['10'],
    status: '見積依頼',
    editListId: 'edit-list-001',
    vendorName: '日立メディコ',
    personInCharge: '松本和也',
    email: 'matsumoto@hitachi-med.co.jp',
    tel: '03-8901-2345',
  },
  {
    id: 11,
    rfqNo: 'RFQ-20250108-0010',
    groupName: '2025年度皮膚科機器新規導入',
    createdDate: '2025-01-08',
    applicationIds: ['10'],
    status: '見積依頼済',
    editListId: 'edit-list-001',
    vendorName: '東芝メディカルシステムズ',
    personInCharge: '加藤隆',
    email: 'kato@toshiba-med.co.jp',
    tel: '03-1111-2222',
    rfqDeadline: '2025-02-20',
  },
  {
    id: 1,
    rfqNo: 'RFQ-20250110-0001',
    groupName: '2025年度放射線科機器更新',
    createdDate: '2025-01-10',
    applicationIds: ['1'],
    status: '見積依頼済',
    editListId: 'edit-list-001',
    vendorName: 'シーメンス・ジャパン',
    personInCharge: '山田太郎',
    email: 'yamada@siemens.co.jp',
    tel: '03-1234-5678',
    rfqDeadline: '2025-02-15',
  },
  {
    id: 2,
    rfqNo: 'RFQ-20250111-0002',
    groupName: '2025年度循環器科新規導入',
    createdDate: '2025-01-11',
    applicationIds: ['2'],
    status: '見積DB登録済',
    editListId: 'edit-list-001',
    vendorName: 'GEヘルスケア',
    personInCharge: '鈴木一郎',
    email: 'suzuki@gehealthcare.co.jp',
    tel: '03-2345-6789',
    rfqDeadline: '2025-02-15',
    orderDeadline: '2025-03-31',
  },
  {
    id: 3,
    rfqNo: 'RFQ-20250113-0003',
    groupName: '2025年度検査科・手術室機器更新',
    createdDate: '2025-01-13',
    applicationIds: ['3'],
    status: '見積登録依頼中',
    editListId: 'edit-list-001',
    vendorName: 'フィリップス・ジャパン',
    personInCharge: '佐藤花子',
    email: 'sato@philips.co.jp',
    tel: '03-3456-7890',
    registrationDeadline: '2025-02-28',
  },
  {
    id: 4,
    rfqNo: 'RFQ-20250115-0004',
    groupName: '2025年度内視鏡センター機器',
    createdDate: '2025-01-15',
    applicationIds: ['4'],
    status: '発注済',
    editListId: 'edit-list-002',
    vendorName: 'オリンパス',
    personInCharge: '田中次郎',
    email: 'tanaka@olympus.co.jp',
    tel: '03-4567-8901',
    deliveryDeadline: '2025-04-30',
  },
  {
    id: 5,
    rfqNo: 'RFQ-20250120-0005',
    groupName: '2025年度リハビリ科機器導入',
    createdDate: '2025-01-20',
    applicationIds: ['5'],
    status: '納期確定',
    editListId: 'edit-list-002',
    vendorName: 'キヤノンメディカル',
    personInCharge: '高橋美咲',
    email: 'takahashi@canon-med.co.jp',
    tel: '03-5678-9012',
    deliveryDate: '2025-05-15',
  },
  {
    id: 6,
    rfqNo: 'RFQ-20250122-0006',
    groupName: '2025年度眼科機器更新',
    createdDate: '2025-01-22',
    applicationIds: ['6'],
    status: '検収済',
    vendorName: 'トプコン',
    personInCharge: '中村健一',
    email: 'nakamura@topcon.co.jp',
    tel: '03-6789-0123',
    inspectionDate: '2025-06-10',
  },
  {
    id: 7,
    rfqNo: 'RFQ-20250125-0007',
    groupName: '2024年度病理科機器更新',
    createdDate: '2025-01-25',
    applicationIds: ['7'],
    status: '完了',
    vendorName: '島津製作所',
    personInCharge: '伊藤裕子',
    email: 'ito@shimadzu.co.jp',
    tel: '03-7890-1234',
  },
  {
    id: 8,
    rfqNo: 'RFQ-20250128-0008',
    groupName: '2025年度発注見積テスト',
    createdDate: '2025-01-28',
    applicationIds: ['4'],
    status: '発注用見積依頼済',
    editListId: 'edit-list-002',
    vendorName: 'オリンパス',
    personInCharge: '田中次郎',
    email: 'tanaka@olympus.co.jp',
    tel: '03-4567-8901',
    rfqDeadline: '2025-03-15',
  },
  {
    id: 9,
    rfqNo: 'RFQ-20250130-0009',
    groupName: '2025年度発注見積登録済テスト',
    createdDate: '2025-01-30',
    applicationIds: ['5'],
    status: '発注見積登録済',
    vendorName: 'キヤノンメディカル',
    personInCharge: '高橋美咲',
    email: 'takahashi@canon-med.co.jp',
    tel: '03-5678-9012',
  },
];

export const useRfqGroupStore = create<RfqGroupState>((set, get) => ({
  rfqGroups: testRfqGroups,

  addRfqGroup: (rfqGroup) => {
    const newId = get().rfqGroups.length > 0
      ? Math.max(...get().rfqGroups.map(g => g.id)) + 1
      : 1;

    const newRfqGroup: RfqGroup = {
      ...rfqGroup,
      id: newId,
    };

    set((state) => ({
      rfqGroups: [...state.rfqGroups, newRfqGroup],
    }));

    return newRfqGroup;
  },

  updateRfqGroup: (id, updates) => {
    set((state) => ({
      rfqGroups: state.rfqGroups.map((group) =>
        group.id === id ? { ...group, ...updates } : group
      ),
    }));
  },

  deleteRfqGroup: (id) => {
    set((state) => ({
      rfqGroups: state.rfqGroups.filter((group) => group.id !== id),
    }));
  },

  getRfqGroupById: (id) => {
    return get().rfqGroups.find((group) => group.id === id);
  },

  generateRfqNo: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const sequence = String(get().rfqGroups.length + 1).padStart(4, '0');

    return `RFQ-${year}${month}${day}-${sequence}`;
  },

  cloneRfqGroupForVendor: (sourceId, vendorInfo) => {
    const source = get().rfqGroups.find(g => g.id === sourceId);
    if (!source) throw new Error(`RfqGroup not found: ${sourceId}`);

    const newId = Math.max(...get().rfqGroups.map(g => g.id)) + 1;
    const newGroup: RfqGroup = {
      id: newId,
      rfqNo: source.rfqNo,
      groupName: source.groupName,
      createdDate: source.createdDate,
      applicationIds: [...source.applicationIds],
      status: '見積依頼済',
      editListId: source.editListId,
      vendorName: vendorInfo.vendorName,
      personInCharge: vendorInfo.personInCharge,
      email: vendorInfo.email,
      tel: vendorInfo.tel,
      rfqDeadline: vendorInfo.deadline,
    };

    set((state) => ({
      rfqGroups: [...state.rfqGroups, newGroup],
    }));

    return newGroup;
  },

  getRfqGroupsByRfqNo: (rfqNo) => {
    return get().rfqGroups.filter(g => g.rfqNo === rfqNo);
  },

  generateDisposalNo: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const disposalCount = get().rfqGroups.filter(g => g.workflowType === 'disposal').length;
    const sequence = String(disposalCount + 1).padStart(4, '0');
    return `DISP-${year}${month}${day}-${sequence}`;
  },

  generateTransferNo: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const transferCount = get().rfqGroups.filter(g => g.workflowType === 'transfer').length;
    const sequence = String(transferCount + 1).padStart(4, '0');
    return `TRAN-${year}${month}${day}-${sequence}`;
  },

  getRfqGroupsByWorkflowType: (type) => {
    return get().rfqGroups.filter(g => g.workflowType === type);
  },
}));
