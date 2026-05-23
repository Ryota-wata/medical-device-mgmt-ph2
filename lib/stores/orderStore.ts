import { create } from 'zustand';
import { OrderGroup, OrderItem } from '@/lib/types';

// テストデータ: 3つのフローに対応
//   rfqGroupId=4（発注登録済）→ 検収登録ボタン用
//   rfqGroupId=5（検収登録済）→ 資産仮登録ボタン用（キヤノンメディカル リハビリ科）
//   rfqGroupId=8（検収登録済）→ 資産仮登録ボタン用（オリンパス 内視鏡）
const testOrderGroups: OrderGroup[] = [
  // --- rfqGroupId=4: 発注登録済（検収未） ---
  {
    id: 1,
    orderNo: 'PO-20250130-0001',
    rfqGroupId: 4,
    rfqNo: 'RFQ-20250115-0004',
    groupName: '2025年度内視鏡センター機器',
    vendorName: 'オリンパス',
    applicant: '田中次郎',
    applicantEmail: 'tanaka@olympus.co.jp',
    orderType: '購入',
    deliveryDate: '2025-04-30',
    paymentTerms: '検収後一括',
    inspectionCertType: '本体のみ',
    storageFormat: '未指定',
    totalAmount: 12650000,
    orderDate: '2025-01-30',
    createdAt: '2025-01-30T10:00:00.000Z',
    updatedAt: '2025-01-30T10:00:00.000Z',
  },
  // --- rfqGroupId=5: 検収登録済（キヤノンメディカル リハビリ科） ---
  {
    id: 2,
    orderNo: 'PO-20250205-0002',
    rfqGroupId: 5,
    rfqNo: 'RFQ-20250120-0005',
    groupName: '2025年度リハビリ科機器導入',
    vendorName: 'キヤノンメディカル',
    applicant: '高橋美咲',
    applicantEmail: 'takahashi@canon-med.co.jp',
    orderType: '購入',
    deliveryDate: '2025-05-15',
    paymentTerms: '検収後一括',
    inspectionCertType: '付属品含む',
    storageFormat: '電子取引',
    totalAmount: 4280000,
    orderDate: '2025-02-05',
    inspectionDate: '2025-05-20',
    createdAt: '2025-02-05T10:00:00.000Z',
    updatedAt: '2025-05-20T10:00:00.000Z',
  },
  // --- rfqGroupId=8: 検収登録済（オリンパス 内視鏡） ---
  {
    id: 3,
    orderNo: 'PO-20250210-0003',
    rfqGroupId: 8,
    rfqNo: 'RFQ-20250128-0008',
    groupName: '2025年度内視鏡センター機器（検収済）',
    vendorName: 'オリンパス',
    applicant: '田中次郎',
    applicantEmail: 'tanaka@olympus.co.jp',
    orderType: '購入',
    deliveryDate: '2025-04-30',
    paymentTerms: '検収後一括',
    inspectionCertType: '本体のみ',
    storageFormat: '未指定',
    totalAmount: 12650000,
    orderDate: '2025-02-10',
    inspectionDate: '2025-04-30',
    createdAt: '2025-02-10T10:00:00.000Z',
    updatedAt: '2025-04-30T10:00:00.000Z',
  },
];

const testOrderItems: OrderItem[] = [
  // ========================================
  // orderGroupId=1: rfqGroupId=4 内視鏡（発注登録済）
  // ========================================
  // 本体
  {
    id: 1,
    orderGroupId: 1,
    quotationItemId: 1,
    itemName: '内視鏡システム EVIS X1',
    manufacturer: 'オリンパス',
    model: 'CV-1500',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 8800000,
    totalPrice: 8800000,
  },
  {
    id: 2,
    orderGroupId: 1,
    quotationItemId: 2,
    itemName: '上部消化管汎用ビデオスコープ',
    manufacturer: 'オリンパス',
    model: 'GIF-1100',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1650000,
    totalPrice: 1650000,
  },
  {
    id: 3,
    orderGroupId: 1,
    quotationItemId: 2,
    itemName: '上部消化管汎用ビデオスコープ',
    manufacturer: 'オリンパス',
    model: 'GIF-1100',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1650000,
    totalPrice: 1650000,
  },
  {
    id: 4,
    orderGroupId: 1,
    quotationItemId: 3,
    itemName: '内視鏡洗浄消毒装置',
    manufacturer: 'オリンパス',
    model: 'OER-5',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 550000,
    totalPrice: 550000,
  },
  // 付属品
  {
    id: 5,
    orderGroupId: 1,
    quotationItemId: 1,
    itemName: '内視鏡用モニター',
    manufacturer: 'オリンパス',
    model: 'OEV-262H',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 450000,
    totalPrice: 450000,
  },
  {
    id: 6,
    orderGroupId: 1,
    quotationItemId: 1,
    itemName: '内視鏡用トロリー',
    manufacturer: 'オリンパス',
    model: 'WM-NP1',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 180000,
    totalPrice: 180000,
  },
  {
    id: 7,
    orderGroupId: 1,
    quotationItemId: 3,
    itemName: '洗浄チューブセット',
    manufacturer: 'オリンパス',
    model: 'MAJ-1888',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 35000,
    totalPrice: 35000,
  },

  // ========================================
  // orderGroupId=2: rfqGroupId=5 リハビリ科（検収登録済）
  // ========================================
  // 本体
  {
    id: 8,
    orderGroupId: 2,
    quotationItemId: 10,
    itemName: '低周波治療器',
    manufacturer: 'キヤノンメディカル',
    model: 'EU-910',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 380000,
    totalPrice: 380000,
  },
  {
    id: 9,
    orderGroupId: 2,
    quotationItemId: 11,
    itemName: '超音波治療器',
    manufacturer: 'キヤノンメディカル',
    model: 'US-750',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1200000,
    totalPrice: 1200000,
  },
  {
    id: 10,
    orderGroupId: 2,
    quotationItemId: 12,
    itemName: 'ウォーターベッド型マッサージ器',
    manufacturer: 'キヤノンメディカル',
    model: 'WB-300',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1800000,
    totalPrice: 1800000,
  },
  // 付属品
  {
    id: 11,
    orderGroupId: 2,
    quotationItemId: 10,
    itemName: '導子セット（低周波用）',
    manufacturer: 'キヤノンメディカル',
    model: 'PAD-EU-10',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 45000,
    totalPrice: 45000,
  },
  {
    id: 12,
    orderGroupId: 2,
    quotationItemId: 11,
    itemName: '超音波プローブ',
    manufacturer: 'キヤノンメディカル',
    model: 'PRB-US-5',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 85000,
    totalPrice: 85000,
  },

  // ========================================
  // orderGroupId=3: rfqGroupId=8 内視鏡（検収登録済）
  // ========================================
  // 本体
  {
    id: 13,
    orderGroupId: 3,
    quotationItemId: 1,
    itemName: '内視鏡システム EVIS X1',
    manufacturer: 'オリンパス',
    model: 'CV-1500',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 8800000,
    totalPrice: 8800000,
  },
  {
    id: 14,
    orderGroupId: 3,
    quotationItemId: 2,
    itemName: '上部消化管汎用ビデオスコープ',
    manufacturer: 'オリンパス',
    model: 'GIF-1100',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1650000,
    totalPrice: 1650000,
  },
  {
    id: 15,
    orderGroupId: 3,
    quotationItemId: 2,
    itemName: '上部消化管汎用ビデオスコープ',
    manufacturer: 'オリンパス',
    model: 'GIF-1100',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 1650000,
    totalPrice: 1650000,
  },
  {
    id: 16,
    orderGroupId: 3,
    quotationItemId: 3,
    itemName: '内視鏡洗浄消毒装置',
    manufacturer: 'オリンパス',
    model: 'OER-5',
    registrationType: '本体',
    quantity: 1,
    unitPrice: 550000,
    totalPrice: 550000,
  },
  // 付属品
  {
    id: 17,
    orderGroupId: 3,
    quotationItemId: 1,
    itemName: '内視鏡用モニター',
    manufacturer: 'オリンパス',
    model: 'OEV-262H',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 450000,
    totalPrice: 450000,
  },
  {
    id: 18,
    orderGroupId: 3,
    quotationItemId: 1,
    itemName: '内視鏡用トロリー',
    manufacturer: 'オリンパス',
    model: 'WM-NP1',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 180000,
    totalPrice: 180000,
  },
  {
    id: 19,
    orderGroupId: 3,
    quotationItemId: 3,
    itemName: '洗浄チューブセット',
    manufacturer: 'オリンパス',
    model: 'MAJ-1888',
    registrationType: '付属品',
    quantity: 1,
    unitPrice: 35000,
    totalPrice: 35000,
  },
];

interface OrderState {
  orderGroups: OrderGroup[];
  orderItems: OrderItem[];

  addOrderGroup: (group: Omit<OrderGroup, 'id' | 'createdAt' | 'updatedAt'>) => number;
  updateOrderGroup: (id: number, updates: Partial<OrderGroup>) => void;
  getOrderGroupById: (id: number) => OrderGroup | undefined;
  getOrderGroupByRfqGroupId: (rfqGroupId: number) => OrderGroup | undefined;

  addOrderItems: (items: Omit<OrderItem, 'id'>[]) => void;
  getOrderItemsByGroupId: (orderGroupId: number) => OrderItem[];

  generateOrderNo: () => string;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orderGroups: testOrderGroups,
  orderItems: testOrderItems,

  addOrderGroup: (group) => {
    const now = new Date().toISOString();
    const newId = get().orderGroups.length > 0
      ? Math.max(...get().orderGroups.map(g => g.id)) + 1
      : 1;

    const newGroup: OrderGroup = {
      ...group,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      orderGroups: [...state.orderGroups, newGroup],
    }));

    return newId;
  },

  updateOrderGroup: (id, updates) => {
    set((state) => ({
      orderGroups: state.orderGroups.map((group) =>
        group.id === id
          ? { ...group, ...updates, updatedAt: new Date().toISOString() }
          : group
      ),
    }));
  },

  getOrderGroupById: (id) => {
    return get().orderGroups.find((group) => group.id === id);
  },

  getOrderGroupByRfqGroupId: (rfqGroupId) => {
    return get().orderGroups.find((group) => group.rfqGroupId === rfqGroupId);
  },

  addOrderItems: (items) => {
    const currentMax = get().orderItems.length > 0
      ? Math.max(...get().orderItems.map(i => i.id))
      : 0;

    const newItems: OrderItem[] = items.map((item, index) => ({
      ...item,
      id: currentMax + index + 1,
    }));

    set((state) => ({
      orderItems: [...state.orderItems, ...newItems],
    }));
  },

  getOrderItemsByGroupId: (orderGroupId) => {
    return get().orderItems.filter((item) => item.orderGroupId === orderGroupId);
  },

  generateOrderNo: () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const sequence = String(get().orderGroups.length + 1).padStart(4, '0');

    return `PO-${year}${month}${day}-${sequence}`;
  },
}));
