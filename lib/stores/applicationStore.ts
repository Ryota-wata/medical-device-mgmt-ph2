import { create } from 'zustand';
import { Application } from '@/lib/types';

interface ApplicationState {
  applications: Application[];
  addApplication: (application: Omit<Application, 'id'>) => void;
  updateApplication: (id: number, application: Partial<Application>) => void;
  deleteApplication: (id: number) => void;
  getApplicationById: (id: number) => Application | undefined;
  getApplicationsByRfqNo: (rfqNo: string) => Application[];
}

// テストデータ
const testApplications: Application[] = [
  {
    id: 1,
    applicationNo: 'APP-2025-001',
    applicationDate: '2025-01-10',
    applicationType: '更新申請',
    facility: {
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'MRI室'
    },
    roomName: 'MRI検査室1',
    asset: {
      name: 'MRI装置',
      model: 'MAGNETOM Altea 1.5T'
    },
    vendor: 'シーメンスヘルスケア',
    quantity: '1',
    unit: '台',
    currentConnectionStatus: '電源接続',
    currentConnectionDestination: '専用電源',
    requestConnectionStatus: '電源接続',
    requestConnectionDestination: '専用電源',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: {
      current: 2,
      total: 3
    },
    freeInput: '',
    rfqNo: 'RFQ-20250110-0001',
    quotationInfo: [
      {
        quotationId: '001-2025-01-001',
        quotationDate: '2025-01-15',
        vendor: '株式会社メディカルサプライ',
        ocrItemName: 'MRI装置 MAGNETOM Altea',
        assetMaster: {
          itemId: '5',
          itemName: 'MRI装置',
          largeName: '画像診断機器',
          mediumName: 'MRI'
        },
        quantity: 1,
        unitPrice: 100000000,
        amount: 100000000
      },
      {
        quotationId: '001-2025-01-001',
        quotationDate: '2025-01-15',
        vendor: '株式会社メディカルサプライ',
        ocrItemName: 'MRI用頭部コイル',
        assetMaster: {
          itemId: '',
          itemName: '',
          largeName: '',
          mediumName: ''
        },
        quantity: 2,
        unitPrice: 1800000,
        amount: 3600000
      },
      {
        quotationId: '001-2025-01-001',
        quotationDate: '2025-01-15',
        vendor: '株式会社メディカルサプライ',
        ocrItemName: '設置工事費',
        assetMaster: {
          itemId: '',
          itemName: '',
          largeName: '',
          mediumName: ''
        },
        quantity: 1,
        unitPrice: 5000000,
        amount: 5000000
      }
    ]
  },
  {
    id: 2,
    applicationNo: 'APP-2025-002',
    applicationDate: '2025-01-11',
    applicationType: '新規申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: '循環器科',
      section: '検査室'
    },
    roomName: '心臓カテーテル室',
    asset: {
      name: '血管造影装置',
      model: 'Azurion 7'
    },
    vendor: 'フィリップス',
    quantity: '1',
    unit: '台',
    applicationReason: '新規導入',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: {
      current: 1,
      total: 3
    },
    freeInput: '',
    quotationInfo: []
  },
  {
    id: 3,
    applicationNo: 'APP-2025-003',
    applicationDate: '2025-01-12',
    applicationType: '更新申請',
    facility: {
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'CT室'
    },
    roomName: 'CT検査室1',
    asset: {
      name: 'CT装置',
      model: 'Aquilion ONE'
    },
    vendor: 'キヤノンメディカル',
    quantity: '1',
    unit: '台',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: {
      current: 2,
      total: 3
    },
    freeInput: '',
    rfqNo: 'RFQ-20250110-0001',
    quotationInfo: [
      {
        quotationId: '001-2025-01-002',
        quotationDate: '2025-01-16',
        vendor: '東日本メディカル株式会社',
        ocrItemName: 'CT装置 Aquilion ONE',
        assetMaster: {
          itemId: '3',
          itemName: 'CT装置',
          largeName: '画像診断機器',
          mediumName: 'CT'
        },
        quantity: 1,
        unitPrice: 75000000,
        amount: 75000000
      },
      {
        quotationId: '001-2025-01-002',
        quotationDate: '2025-01-16',
        vendor: '東日本メディカル株式会社',
        ocrItemName: '設置工事費',
        assetMaster: {
          itemId: '',
          itemName: '',
          largeName: '',
          mediumName: ''
        },
        quantity: 1,
        unitPrice: 3000000,
        amount: 3000000
      }
    ]
  },
  {
    id: 4,
    applicationNo: 'APP-2025-004',
    applicationDate: '2025-01-13',
    applicationType: '増設申請',
    facility: {
      building: '本館',
      floor: '1F',
      department: '検査科',
      section: '生化学検査室'
    },
    roomName: '生化学検査室',
    asset: {
      name: '自動分析装置',
      model: 'JCA-BM8000'
    },
    vendor: '日本電子',
    quantity: '1',
    unit: '台',
    applicationReason: '検査数増加対応',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: {
      current: 1,
      total: 3
    },
    freeInput: '',
    quotationInfo: []
  },
  {
    id: 5,
    applicationNo: 'APP-2025-005',
    applicationDate: '2025-01-14',
    applicationType: '更新申請',
    facility: {
      building: '本館',
      floor: '4F',
      department: '手術室',
      section: '中央手術室'
    },
    roomName: '手術室1',
    asset: {
      name: '手術台',
      model: 'ALPHAMAXX'
    },
    vendor: 'マッケ',
    quantity: '1',
    unit: '台',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: {
      current: 1,
      total: 3
    },
    freeInput: '',
    quotationInfo: []
  },
  // rfqGroupId=5 リハビリ科（検収登録済 → 資産仮登録対象）
  {
    id: 6,
    applicationNo: 'APP-2025-006',
    applicationDate: '2025-01-20',
    applicationType: '新規申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: 'リハビリテーション科',
      section: '理学療法室'
    },
    roomName: 'PT室1',
    asset: { name: '低周波治療器', model: 'EU-910' },
    vendor: 'キヤノンメディカル',
    quantity: '1',
    unit: '台',
    applicationReason: '新規導入',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 3, total: 3 },
    freeInput: '',
    rfqNo: 'RFQ-20250120-0005',
    quotationInfo: []
  },
  {
    id: 7,
    applicationNo: 'APP-2025-007',
    applicationDate: '2025-01-20',
    applicationType: '新規申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: 'リハビリテーション科',
      section: '理学療法室'
    },
    roomName: 'PT室1',
    asset: { name: '超音波治療器', model: 'US-750' },
    vendor: 'キヤノンメディカル',
    quantity: '1',
    unit: '台',
    applicationReason: '新規導入',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 3, total: 3 },
    freeInput: '',
    rfqNo: 'RFQ-20250120-0005',
    quotationInfo: []
  },
  {
    id: 8,
    applicationNo: 'APP-2025-008',
    applicationDate: '2025-01-20',
    applicationType: '新規申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: 'リハビリテーション科',
      section: '物理療法室'
    },
    roomName: 'ウォーターベッド室',
    asset: { name: 'ウォーターベッド型マッサージ器', model: 'WB-300' },
    vendor: 'キヤノンメディカル',
    quantity: '1',
    unit: '台',
    applicationReason: '新規導入',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 3, total: 3 },
    freeInput: '',
    rfqNo: 'RFQ-20250120-0005',
    quotationInfo: []
  },
  // rfqGroupId=8 内視鏡センター（検収登録済 → 資産仮登録対象）
  {
    id: 9,
    applicationNo: 'APP-2025-009',
    applicationDate: '2025-01-28',
    applicationType: '更新申請',
    facility: {
      building: '本館',
      floor: '3F',
      department: '内視鏡センター',
      section: '検査室'
    },
    roomName: '内視鏡検査室1',
    asset: { name: '内視鏡システム EVIS X1', model: 'CV-1500' },
    vendor: 'オリンパス',
    quantity: '1',
    unit: '台',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 3, total: 3 },
    freeInput: '',
    rfqNo: 'RFQ-20250128-0008',
    quotationInfo: []
  },
  {
    id: 10,
    applicationNo: 'APP-2025-010',
    applicationDate: '2025-01-28',
    applicationType: '更新申請',
    facility: {
      building: '本館',
      floor: '3F',
      department: '内視鏡センター',
      section: '検査室'
    },
    roomName: '内視鏡検査室1',
    asset: { name: '上部消化管汎用ビデオスコープ', model: 'GIF-1100' },
    vendor: 'オリンパス',
    quantity: '2',
    unit: '本',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 3, total: 3 },
    freeInput: '',
    rfqNo: 'RFQ-20250128-0008',
    quotationInfo: []
  },
  {
    id: 11,
    applicationNo: 'APP-2025-011',
    applicationDate: '2025-01-28',
    applicationType: '更新申請',
    facility: {
      building: '本館',
      floor: '3F',
      department: '内視鏡センター',
      section: '洗浄室'
    },
    roomName: '内視鏡洗浄室',
    asset: { name: '内視鏡洗浄消毒装置', model: 'OER-5' },
    vendor: 'オリンパス',
    quantity: '1',
    unit: '台',
    applicationReason: '老朽化による更新',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 3, total: 3 },
    freeInput: '',
    rfqNo: 'RFQ-20250128-0008',
    quotationInfo: []
  },
  // 移動申請サンプル
  {
    id: 12,
    applicationNo: 'TRAN-2025-001',
    applicationDate: '2025-02-01',
    applicationType: '移動申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: '循環器科',
      section: '検査室'
    },
    roomName: '心電図室',
    asset: { name: '心電計', model: 'ECG-2550' },
    vendor: 'フクダ電子',
    quantity: '1',
    unit: '台',
    applicationReason: '部署統合による移動',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: { current: 0, total: 1 },
    freeInput: '4月からの部署統合に伴い、内科検査室へ移動',
    transferDestination: {
      department: '内科',
      section: '検査室',
      roomName: '内科検査室1',
    },
    quotationInfo: []
  },
  {
    id: 13,
    applicationNo: 'TRAN-2025-002',
    applicationDate: '2025-02-05',
    applicationType: '移動申請',
    facility: {
      building: '本館',
      floor: '3F',
      department: '放射線科',
      section: 'CT室'
    },
    roomName: 'CT検査室2',
    asset: { name: 'ポータブルX線装置', model: 'MobileArt Evolution' },
    vendor: '島津製作所',
    quantity: '1',
    unit: '台',
    applicationReason: '病棟での使用頻度増加',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: { current: 0, total: 1 },
    freeInput: '5階病棟での使用頻度が高いため移動',
    transferDestination: {
      department: '5階病棟',
      section: 'ナースステーション',
      roomName: '医療機器室',
    },
    quotationInfo: []
  },
  // 廃棄申請サンプル
  {
    id: 14,
    applicationNo: 'DISP-2025-001',
    applicationDate: '2025-01-25',
    applicationType: '廃棄申請',
    facility: {
      building: '本館',
      floor: '1F',
      department: '検査科',
      section: '血液検査室'
    },
    roomName: '血液検査室',
    asset: { name: '血球計数装置', model: 'XN-1000' },
    vendor: 'シスメックス',
    quantity: '1',
    unit: '台',
    applicationReason: '老朽化による故障（修理不能）',
    executionYear: '2025',
    status: '承認待ち',
    approvalProgress: { current: 0, total: 1 },
    freeInput: '15年使用。メーカーより修理不能の回答あり。',
    quotationInfo: []
  },
  {
    id: 15,
    applicationNo: 'DISP-2025-002',
    applicationDate: '2025-02-10',
    applicationType: '廃棄申請',
    facility: {
      building: '本館',
      floor: '4F',
      department: '手術室',
      section: '中央手術室'
    },
    roomName: '手術室3',
    asset: { name: '無影灯', model: 'MACH LED 5' },
    vendor: 'ドクター中松',
    quantity: '1',
    unit: '台',
    applicationReason: '更新に伴う廃棄',
    executionYear: '2025',
    status: '承認済み',
    approvalProgress: { current: 1, total: 1 },
    freeInput: '新規購入した無影灯と入れ替え。廃棄業者選定中。',
    quotationInfo: []
  },
  {
    id: 16,
    applicationNo: 'DISP-2025-003',
    applicationDate: '2025-01-15',
    applicationType: '廃棄申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: 'リハビリテーション科',
      section: '理学療法室'
    },
    roomName: 'PT室2',
    asset: { name: '干渉電流型低周波治療器', model: 'SSP-C3' },
    vendor: '日本メディックス',
    quantity: '1',
    unit: '台',
    applicationReason: '老朽化',
    executionYear: '2025',
    status: '見積依頼中',
    approvalProgress: { current: 1, total: 1 },
    freeInput: '廃棄業者: 株式会社メディカル廃棄\n見積日: 2025-01-20\n発注日: \n検収日: ',
    quotationInfo: []
  },
  // 手術部門 — 申請ステータスモーダル用サンプル (移動)
  {
    id: 17,
    applicationNo: 'TRAN-2026-001',
    applicationDate: '2026-02-03',
    applicationType: '移動申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術室'
    },
    roomName: '手術室3',
    asset: { name: '麻酔器', model: 'Aisys CS2' },
    vendor: 'GEヘルスケア',
    quantity: '1',
    unit: '台',
    applicationReason: '手術室レイアウト変更に伴う移動',
    executionYear: '2026',
    status: '承認済み',
    approvalProgress: { current: 1, total: 1 },
    freeInput: '4月の手術室再編に合わせて移動',
    transferDestination: {
      department: '手術部門',
      section: '手術室',
      roomName: '手術室5',
    },
    quotationInfo: []
  },
  // 手術部門 — 申請ステータスモーダル用サンプル (廃棄)
  {
    id: 18,
    applicationNo: 'DISP-2026-001',
    applicationDate: '2026-01-28',
    applicationType: '廃棄申請',
    facility: {
      building: '本館',
      floor: '2F',
      department: '手術部門',
      section: '手術室'
    },
    roomName: '手術準備室',
    asset: { name: '除細動器', model: 'TEC-5631' },
    vendor: '日本光電',
    quantity: '1',
    unit: '台',
    applicationReason: '更新に伴う廃棄',
    executionYear: '2026',
    status: '見積依頼中',
    approvalProgress: { current: 1, total: 1 },
    freeInput: '廃棄業者: 株式会社メディカル廃棄\n見積依頼日: 2026-02-02',
    quotationInfo: []
  },
];

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: testApplications,

  addApplication: (application) => {
    const newId = get().applications.length > 0
      ? Math.max(...get().applications.map(a => a.id)) + 1
      : 1;

    const newApplication: Application = {
      ...application,
      id: newId,
    };

    set((state) => ({
      applications: [...state.applications, newApplication],
    }));
  },

  updateApplication: (id, updates) => {
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    }));
  },

  deleteApplication: (id) => {
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== id),
    }));
  },

  getApplicationById: (id) => {
    return get().applications.find((app) => app.id === id);
  },

  getApplicationsByRfqNo: (rfqNo) => {
    return get().applications.filter((app) => app.rfqNo === rfqNo);
  },

}));
