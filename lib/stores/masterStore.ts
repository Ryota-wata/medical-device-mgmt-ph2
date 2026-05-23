import { create } from 'zustand';
import { FacilityMaster, AssetMaster, DepartmentMaster, RoomCategoryMaster, VendorMaster } from '@/lib/types/master';
import { initialAssetMasters } from '@/lib/data/initialAssetMasters';
import { customerDepartments, customerRoomCategories } from '@/lib/data/customer/departments';

interface MasterStore {
  facilities: FacilityMaster[];
  assets: AssetMaster[];
  departments: DepartmentMaster[];
  roomCategories: RoomCategoryMaster[];
  vendors: VendorMaster[];

  // Facility actions
  setFacilities: (facilities: FacilityMaster[]) => void;
  addFacility: (facility: FacilityMaster) => void;
  updateFacility: (id: string, facility: Partial<FacilityMaster>) => void;
  deleteFacility: (id: string) => void;
  getFacilityById: (id: string) => FacilityMaster | undefined;

  // Asset actions
  setAssets: (assets: AssetMaster[]) => void;
  addAsset: (asset: AssetMaster) => void;
  updateAsset: (id: string, asset: Partial<AssetMaster>) => void;
  deleteAsset: (id: string) => void;
  getAssetById: (id: string) => AssetMaster | undefined;

  // Department actions
  setDepartments: (departments: DepartmentMaster[]) => void;
  addDepartment: (department: DepartmentMaster) => void;
  updateDepartment: (id: string, department: Partial<DepartmentMaster>) => void;
  deleteDepartment: (id: string) => void;
  getDepartmentById: (id: string) => DepartmentMaster | undefined;

  // RoomCategory actions
  setRoomCategories: (roomCategories: RoomCategoryMaster[]) => void;
  addRoomCategory: (roomCategory: RoomCategoryMaster) => void;
  updateRoomCategory: (id: string, roomCategory: Partial<RoomCategoryMaster>) => void;
  deleteRoomCategory: (id: string) => void;
  getRoomCategoryById: (id: string) => RoomCategoryMaster | undefined;

  // Vendor actions
  setVendors: (vendors: VendorMaster[]) => void;
  addVendor: (vendor: VendorMaster) => void;
  updateVendor: (id: string, vendor: Partial<VendorMaster>) => void;
  deleteVendor: (id: string) => void;
  getVendorById: (id: string) => VendorMaster | undefined;

  // Search functions
  searchFacilities: (query: string) => FacilityMaster[];
  searchAssets: (query: string) => AssetMaster[];
  searchDepartments: (query: string) => DepartmentMaster[];
  searchRoomCategories: (query: string) => RoomCategoryMaster[];
  searchVendors: (query: string) => VendorMaster[];
}

// サンプル施設マスタデータ（20件）
const initialFacilities: FacilityMaster[] = [
  {
    id: 'FAC021',
    facilityCode: 'FAC021',
    facilityName: 'サンプル病院',
    prefecture: '東京都',
    foundingBody: '公立',
    city: '千代田区',
    address: '丸の内1-1-1',
    postalCode: '100-0005',
    phoneNumber: '03-9999-0000',
    establishedDate: '2010-04-01',
    facilityType: '総合病院',
    bedCount: 600,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC001',
    facilityCode: 'FAC001',
    facilityName: '東京総合病院',
    building: '本館',
    floor: '3F',
    department: '外科',
    section: '手術室',
    prefecture: '東京都',
    foundingBody: '国立',
    city: '新宿区',
    address: '西新宿1-1-1',
    postalCode: '160-0023',
    phoneNumber: '03-1234-5678',
    establishedDate: '2000-04-01',
    facilityType: '総合病院',
    bedCount: 500,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC002',
    facilityCode: 'FAC002',
    facilityName: '横浜医療センター',
    building: '東館',
    floor: '2F',
    department: '内科',
    section: '診察室',
    prefecture: '神奈川県',
    foundingBody: '公立',
    city: '横浜市',
    address: '中区本町1-1',
    postalCode: '231-0005',
    phoneNumber: '045-1234-5678',
    establishedDate: '2005-06-15',
    facilityType: '医療センター',
    bedCount: 300,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC003',
    facilityCode: 'FAC003',
    facilityName: '大阪クリニック',
    building: '別館',
    floor: '1F',
    department: '小児科',
    section: '受付',
    prefecture: '大阪府',
    foundingBody: '医療法人',
    city: '大阪市',
    address: '北区梅田1-1-1',
    postalCode: '530-0001',
    phoneNumber: '06-1234-5678',
    establishedDate: '2010-03-20',
    facilityType: 'クリニック',
    bedCount: 50,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC004',
    facilityCode: 'FAC004',
    facilityName: '名古屋中央病院',
    building: '新館',
    floor: '5F',
    department: '整形外科',
    section: 'リハビリ室',
    prefecture: '愛知県',
    foundingBody: '国立',
    city: '名古屋市',
    address: '中区栄1-1-1',
    postalCode: '460-0008',
    phoneNumber: '052-1234-5678',
    establishedDate: '1998-09-10',
    facilityType: '総合病院',
    bedCount: 400,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC005',
    facilityCode: 'FAC005',
    facilityName: '福岡市民病院',
    building: '本館',
    floor: '4F',
    department: '循環器科',
    section: '検査室',
    prefecture: '福岡県',
    foundingBody: '公立',
    city: '福岡市',
    address: '博多区博多駅前1-1',
    postalCode: '812-0011',
    phoneNumber: '092-1234-5678',
    establishedDate: '2002-11-05',
    facilityType: '市民病院',
    bedCount: 350,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC006',
    facilityCode: 'FAC006',
    facilityName: '札幌記念病院',
    prefecture: '北海道',
    foundingBody: '医療法人',
    city: '札幌市',
    address: '中央区北1条西1-1',
    postalCode: '060-0001',
    phoneNumber: '011-1234-5678',
    establishedDate: '2008-07-12',
    facilityType: '記念病院',
    bedCount: 250,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC007',
    facilityCode: 'FAC007',
    facilityName: '仙台総合医療センター',
    prefecture: '宮城県',
    foundingBody: '公立',
    city: '仙台市',
    address: '青葉区中央1-1-1',
    postalCode: '980-0021',
    phoneNumber: '022-1234-5678',
    establishedDate: '2003-05-18',
    facilityType: '医療センター',
    bedCount: 450,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC008',
    facilityCode: 'FAC008',
    facilityName: '神戸中央クリニック',
    prefecture: '兵庫県',
    foundingBody: '医療法人',
    city: '神戸市',
    address: '中央区三宮町1-1-1',
    postalCode: '650-0021',
    phoneNumber: '078-1234-5678',
    establishedDate: '2012-02-28',
    facilityType: 'クリニック',
    bedCount: 30,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC009',
    facilityCode: 'FAC009',
    facilityName: '京都大学病院',
    prefecture: '京都府',
    foundingBody: '国立',
    city: '京都市',
    address: '左京区聖護院川原町54',
    postalCode: '606-8507',
    phoneNumber: '075-1234-5678',
    establishedDate: '1899-05-01',
    facilityType: '大学病院',
    bedCount: 1000,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC010',
    facilityCode: 'FAC010',
    facilityName: '広島県立病院',
    prefecture: '広島県',
    foundingBody: '公立',
    city: '広島市',
    address: '中区基町1-1',
    postalCode: '730-0011',
    phoneNumber: '082-1234-5678',
    establishedDate: '1995-08-22',
    facilityType: '県立病院',
    bedCount: 600,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC011',
    facilityCode: 'FAC011',
    facilityName: '千葉メディカルセンター',
    prefecture: '千葉県',
    foundingBody: '公立',
    city: '千葉市',
    address: '中央区新町1-1',
    postalCode: '260-0028',
    phoneNumber: '043-1234-5678',
    establishedDate: '2007-04-10',
    facilityType: '医療センター',
    bedCount: 320,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC012',
    facilityCode: 'FAC012',
    facilityName: '埼玉協同病院',
    prefecture: '埼玉県',
    foundingBody: '医療法人',
    city: 'さいたま市',
    address: '浦和区高砂1-1-1',
    postalCode: '330-0063',
    phoneNumber: '048-1234-5678',
    establishedDate: '2001-12-01',
    facilityType: '協同病院',
    bedCount: 280,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC013',
    facilityCode: 'FAC013',
    facilityName: '静岡県総合病院',
    prefecture: '静岡県',
    foundingBody: '公立',
    city: '静岡市',
    address: '葵区呉服町1-1',
    postalCode: '420-0031',
    phoneNumber: '054-1234-5678',
    establishedDate: '1997-06-15',
    facilityType: '総合病院',
    bedCount: 520,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC014',
    facilityCode: 'FAC014',
    facilityName: '岡山中央医療センター',
    prefecture: '岡山県',
    foundingBody: '国立',
    city: '岡山市',
    address: '北区大供1-1-1',
    postalCode: '700-0913',
    phoneNumber: '086-1234-5678',
    establishedDate: '2009-09-30',
    facilityType: '医療センター',
    bedCount: 380,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC015',
    facilityCode: 'FAC015',
    facilityName: '熊本赤十字病院',
    prefecture: '熊本県',
    foundingBody: '日本赤十字社',
    city: '熊本市',
    address: '中央区水前寺1-1-1',
    postalCode: '862-0950',
    phoneNumber: '096-1234-5678',
    establishedDate: '1920-03-01',
    facilityType: '赤十字病院',
    bedCount: 700,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC016',
    facilityCode: 'FAC016',
    facilityName: '鹿児島市立病院',
    prefecture: '鹿児島県',
    foundingBody: '公立',
    city: '鹿児島市',
    address: '中央町1-1',
    postalCode: '890-0053',
    phoneNumber: '099-1234-5678',
    establishedDate: '2004-10-12',
    facilityType: '市立病院',
    bedCount: 360,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC017',
    facilityCode: 'FAC017',
    facilityName: '新潟大学医歯学総合病院',
    prefecture: '新潟県',
    foundingBody: '国立',
    city: '新潟市',
    address: '中央区旭町通1-1',
    postalCode: '951-8520',
    phoneNumber: '025-1234-5678',
    establishedDate: '1910-07-01',
    facilityType: '大学病院',
    bedCount: 800,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC018',
    facilityCode: 'FAC018',
    facilityName: '金沢医療センター',
    prefecture: '石川県',
    foundingBody: '国立',
    city: '金沢市',
    address: '香林坊1-1-1',
    postalCode: '920-0981',
    phoneNumber: '076-1234-5678',
    establishedDate: '2006-11-20',
    facilityType: '医療センター',
    bedCount: 290,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC019',
    facilityCode: 'FAC019',
    facilityName: '長野県立こども病院',
    prefecture: '長野県',
    foundingBody: '公立',
    city: '長野市',
    address: '善光寺1-1-1',
    postalCode: '380-0851',
    phoneNumber: '026-1234-5678',
    establishedDate: '2013-04-05',
    facilityType: 'こども病院',
    bedCount: 200,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'FAC020',
    facilityCode: 'FAC020',
    facilityName: '沖縄総合病院',
    prefecture: '沖縄県',
    foundingBody: '公立',
    city: '那覇市',
    address: '久茂地1-1-1',
    postalCode: '900-0015',
    phoneNumber: '098-1234-5678',
    establishedDate: '2011-08-15',
    facilityType: '総合病院',
    bedCount: 420,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// 資産マスタデータ — 初期ロードは既存の軽量データのみ
// 顧客の全件データ(36,365件)はship-asset-masterページで遅延ロードする
const initialAssets: AssetMaster[] = initialAssetMasters;

// サンプル業者マスタデータ
const initialVendors: VendorMaster[] = [
  {
    id: 'VND001',
    facilityName: '東京総合病院',
    invoiceNumber: 'T1234567890123',
    vendorName: 'オリンパスメディカルシステムズ株式会社',
    address: '東京都新宿区西新宿2-3-1',
    position: '部長',
    role: '営業',
    contactPerson: '山田 太郎',
    phone: '090-1234-5678',
    email: 'yamada@olympus-med.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND002',
    facilityName: '横浜医療センター',
    invoiceNumber: 'T2345678901234',
    vendorName: 'GEヘルスケア・ジャパン株式会社',
    address: '東京都港区赤坂4-1-10',
    position: '課長',
    role: '技術',
    contactPerson: '鈴木 一郎',
    phone: '090-2345-6789',
    email: 'suzuki@ge-healthcare.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND003',
    facilityName: '大阪クリニック',
    invoiceNumber: 'T3456789012345',
    vendorName: 'シーメンスヘルスケア株式会社',
    address: '東京都品川区東品川2-2-8',
    position: '主任',
    role: '営業',
    contactPerson: '佐藤 花子',
    phone: '090-3456-7890',
    email: 'sato@siemens-healthcare.jp',
    isPrimaryContact: false,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND004',
    facilityName: '名古屋中央病院',
    invoiceNumber: 'T4567890123456',
    vendorName: '日本光電工業株式会社',
    address: '東京都新宿区西落合1-31-4',
    position: '係長',
    role: 'システム担当',
    contactPerson: '田中 健一',
    phone: '090-4567-8901',
    email: 'tanaka@nihonkohden.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND005',
    facilityName: '福岡市民病院',
    invoiceNumber: 'T5678901234567',
    vendorName: 'フィリップス・ジャパン株式会社',
    address: '東京都港区港南2-13-37',
    position: 'マネージャー',
    role: '営業',
    contactPerson: '伊藤 美咲',
    phone: '090-5678-9012',
    email: 'ito@philips.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND006',
    facilityName: '札幌記念病院',
    invoiceNumber: 'T6789012345678',
    vendorName: '東芝メディカルシステムズ株式会社',
    address: '栃木県大田原市下石上1385',
    position: '部長',
    role: '技術',
    contactPerson: '高橋 直人',
    phone: '090-6789-0123',
    email: 'takahashi@toshiba-med.co.jp',
    isPrimaryContact: false,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND007',
    facilityName: '仙台総合医療センター',
    invoiceNumber: 'T7890123456789',
    vendorName: '株式会社日立ハイテク',
    address: '東京都港区虎ノ門1-17-1',
    position: '課長',
    role: 'システム担当',
    contactPerson: '渡辺 誠',
    phone: '090-7890-1234',
    email: 'watanabe@hitachi-hightech.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND008',
    facilityName: '神戸中央クリニック',
    invoiceNumber: 'T8901234567890',
    vendorName: 'パラマウントベッド株式会社',
    address: '東京都江東区東砂2-14-5',
    position: '主任',
    role: '営業',
    contactPerson: '小林 真理',
    phone: '090-8901-2345',
    email: 'kobayashi@paramount-bed.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND009',
    facilityName: '京都大学病院',
    invoiceNumber: 'T9012345678901',
    vendorName: 'テルモ株式会社',
    address: '東京都渋谷区幡ヶ谷2-44-1',
    position: '係長',
    role: '技術',
    contactPerson: '加藤 隆',
    phone: '090-9012-3456',
    email: 'kato@terumo.co.jp',
    isPrimaryContact: false,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND010',
    facilityName: '広島県立病院',
    invoiceNumber: 'T0123456789012',
    vendorName: '富士フイルムメディカル株式会社',
    address: '東京都港区西麻布2-26-30',
    position: 'マネージャー',
    role: '営業',
    contactPerson: '吉田 裕子',
    phone: '090-0123-4567',
    email: 'yoshida@fujifilm-med.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND011',
    facilityName: '千葉メディカルセンター',
    invoiceNumber: 'T1111222233334',
    vendorName: 'ドレーゲルジャパン株式会社',
    address: '東京都品川区北品川1-5-12',
    position: '部長',
    role: 'システム担当',
    contactPerson: '中村 大輔',
    phone: '090-1111-2222',
    email: 'nakamura@draeger.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND012',
    facilityName: '埼玉協同病院',
    invoiceNumber: 'T2222333344445',
    vendorName: 'ストライカージャパン株式会社',
    address: '東京都文京区後楽2-6-1',
    position: '課長',
    role: '営業',
    contactPerson: '山本 和子',
    phone: '090-2222-3333',
    email: 'yamamoto@stryker.co.jp',
    isPrimaryContact: false,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND013',
    facilityName: '静岡県総合病院',
    invoiceNumber: 'T3333444455556',
    vendorName: '日機装株式会社',
    address: '東京都渋谷区恵比寿4-20-3',
    position: '主任',
    role: '技術',
    contactPerson: '松田 浩一',
    phone: '090-3333-4444',
    email: 'matsuda@nikkiso.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND014',
    facilityName: '岡山中央医療センター',
    invoiceNumber: 'T4444555566667',
    vendorName: 'シスメックス株式会社',
    address: '兵庫県神戸市中央区脇浜海岸通1-5-1',
    position: '係長',
    role: '営業',
    contactPerson: '井上 早苗',
    phone: '090-4444-5555',
    email: 'inoue@sysmex.co.jp',
    isPrimaryContact: true,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'VND015',
    facilityName: '熊本赤十字病院',
    invoiceNumber: 'T5555666677778',
    vendorName: 'サクラ精機株式会社',
    address: '東京都品川区南大井5-16-6',
    position: 'マネージャー',
    role: 'システム担当',
    contactPerson: '森 健二',
    phone: '090-5555-6666',
    email: 'mori@sakura-seiki.co.jp',
    isPrimaryContact: false,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// 部署マスタデータ（顧客Excel「共通部署マスタ」シート B+C列: 89件）
const initialDepartments: DepartmentMaster[] = [
  { id: 'DEPT001', division: '01 救急部', department: '01 救命救急センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT002', division: '01 救急部', department: '02 救急外来', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT003', division: '02 外来診療部(内科系)', department: '01 総合診療科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT004', division: '02 外来診療部(内科系)', department: '02 循環器内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT005', division: '02 外来診療部(内科系)', department: '03 腎臓内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT006', division: '02 外来診療部(内科系)', department: '04 消化器内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT007', division: '02 外来診療部(内科系)', department: '05 糖尿病･内分泌･代謝内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT008', division: '02 外来診療部(内科系)', department: '06 呼吸器内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT009', division: '02 外来診療部(内科系)', department: '07 免疫内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT010', division: '02 外来診療部(内科系)', department: '08 血液･腫瘍内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT011', division: '02 外来診療部(内科系)', department: '09 老年･高血圧内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT012', division: '02 外来診療部(内科系)', department: '10 感染症内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT013', division: '02 外来診療部(内科系)', department: '11 脳神経内科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT014', division: '02 外来診療部(内科系)', department: '12 神経科･精神科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT015', division: '03 外来診療部(外科系)', department: '01 心臓血管外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT016', division: '03 外来診療部(外科系)', department: '02 呼吸器外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT017', division: '03 外来診療部(外科系)', department: '03 消化器外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT018', division: '03 外来診療部(外科系)', department: '04 乳腺･内分泌外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT019', division: '03 外来診療部(外科系)', department: '05 小児外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT020', division: '03 外来診療部(外科系)', department: '06 脳神経外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT021', division: '03 外来診療部(外科系)', department: '07 麻酔科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT022', division: '03 外来診療部(外科系)', department: '08 脳神経精神科系', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT023', division: '04 外来診療部(特殊外来)', department: '01 小児科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT024', division: '04 外来診療部(特殊外来)', department: '02 産婦人科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT025', division: '04 外来診療部(特殊外来)', department: '03 産科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT026', division: '04 外来診療部(特殊外来)', department: '04 婦人科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT027', division: '04 外来診療部(特殊外来)', department: '05 泌尿器科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT028', division: '04 外来診療部(特殊外来)', department: '06 整形外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT029', division: '04 外来診療部(特殊外来)', department: '07 耳鼻咽喉科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT030', division: '04 外来診療部(特殊外来)', department: '08 眼科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT031', division: '04 外来診療部(特殊外来)', department: '09 形成外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT032', division: '04 外来診療部(特殊外来)', department: '10 皮膚科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT033', division: '04 外来診療部(特殊外来)', department: '11 歯科口腔外科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT034', division: '05 外来診療部(センター化)', department: '01 中央処置室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT035', division: '05 外来診療部(センター化)', department: '02 化学療法センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT036', division: '05 外来診療部(センター化)', department: '03 ユニバーサル外来', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT037', division: '05 外来診療部(センター化)', department: '04 消化器センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT038', division: '05 外来診療部(センター化)', department: '05 呼吸器センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT039', division: '05 外来診療部(センター化)', department: '06 脳卒中センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT040', division: '05 外来診療部(センター化)', department: '07 生殖医療センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT041', division: '05 外来診療部(センター化)', department: '08 共通', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT042', division: '06 重症病棟', department: '01 救急病棟', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT043', division: '06 重症病棟', department: '02 E-ICU(遠隔集中治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT044', division: '06 重症病棟', department: '03 ICU(集中治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT045', division: '06 重症病棟', department: '04 HCU(ハイケアユニット)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT046', division: '06 重症病棟', department: '05 G-ICU(総合集中治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT047', division: '06 重症病棟', department: '06 CCU(冠疾患集中治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT048', division: '06 重症病棟', department: '07 SCU(脳卒中ケアユニット)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT049', division: '06 重症病棟', department: '08 NICU(新生児集中治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT050', division: '06 重症病棟', department: '09 GCU(新生児回復治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT051', division: '06 重症病棟', department: '10 MFICU(母体･胎児集中治療室)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT052', division: '06 重症病棟', department: '10 分娩室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT053', division: '07 病棟', department: '01 一般病床', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT054', division: '07 病棟', department: '02 一般病床(無菌病棟)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT055', division: '07 病棟', department: '03 一般病床(緩和ケア)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT056', division: '07 病棟', department: '04 一般病床(回復期リハ)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT057', division: '07 病棟', department: '05 一般病床(地域包括ケア)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT058', division: '07 病棟', department: '06 療養病床', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT059', division: '07 病棟', department: '07 精神病床', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT060', division: '07 病棟', department: '08 感染症･結核病床', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT061', division: '08 中央診療部', department: '01 内視鏡室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT062', division: '08 中央診療部', department: '02 人工透析室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT063', division: '08 中央診療部', department: '03 手術部', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT064', division: '08 中央診療部', department: '04 リハビリ', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT065', division: '09 放射線部', department: '01 放射線(治療)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT066', division: '09 放射線部', department: '02 放射線(核医学)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT067', division: '09 放射線部', department: '03 放射線(MRI/CT)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT068', division: '09 放射線部', department: '04 放射線(血管造影)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT069', division: '09 放射線部', department: '05 放射線(X-TV)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT070', division: '09 放射線部', department: '06 放射線(一般･特殊)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT071', division: '09 放射線部', department: '07 放射線(共通)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT072', division: '10 臨床検査部', department: '01 検体検査', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT073', division: '10 臨床検査部', department: '02 検体検査(一般)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT074', division: '10 臨床検査部', department: '03 検体検査(血液)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT075', division: '10 臨床検査部', department: '04 検体検査(生化･免疫)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT076', division: '10 臨床検査部', department: '05 検体検査(輸血)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT077', division: '10 臨床検査部', department: '06 検体検査(細菌)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT078', division: '10 臨床検査部', department: '07 検体検査(遺伝子)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT079', division: '10 臨床検査部', department: '08 中央採血室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT080', division: '10 臨床検査部', department: '09 生理検査', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT081', division: '10 臨床検査部', department: '10 病理診断･検査', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT082', division: '10 臨床検査部', department: '11 解剖･霊安', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT083', division: '11 供給部', department: '01 薬剤科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT084', division: '11 供給部', department: '02 中央材料', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT085', division: '11 供給部', department: '03 MEセンター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT086', division: '11 供給部', department: '04 栄養科', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT087', division: '12 事務部', department: '01 検診センター', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT088', division: '12 事務部', department: '01 医療情報', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'DEPT089', division: '12 事務部', department: '02 施設課', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

// 諸室区分マスタデータ（顧客Excel「共通部署マスタ」シート E+F列: 44件）
const initialRoomCategories: RoomCategoryMaster[] = [
  { id: 'ROOM001', roomCategory1: '01 パブリック関連諸室', roomCategory2: '01 外来待合関連', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM002', roomCategory1: '01 パブリック関連諸室', roomCategory2: '02 その他待合室関連', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM003', roomCategory1: '01 パブリック関連諸室', roomCategory2: '03 病棟ディルーム', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM004', roomCategory1: '01 パブリック関連諸室', roomCategory2: '04 家族待機室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM005', roomCategory1: '01 パブリック関連諸室', roomCategory2: '05 授乳室・プレイコーナー', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM006', roomCategory1: '01 パブリック関連諸室', roomCategory2: '06 ラウンジ関連', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM007', roomCategory1: '01 パブリック関連諸室', roomCategory2: '07 病室全般', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM008', roomCategory1: '02 受付関連', roomCategory2: '01 外来受付・計算関連', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM009', roomCategory1: '02 受付関連', roomCategory2: '02 中央診療受付関連', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM010', roomCategory1: '03 外来基準諸室', roomCategory2: '01 診察・予診室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM011', roomCategory1: '03 外来基準諸室', roomCategory2: '01 診察・予診室（中央診療）', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM012', roomCategory1: '03 外来基準諸室', roomCategory2: '02 特殊診察室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM013', roomCategory1: '03 外来基準諸室', roomCategory2: '03 スタッフエリア', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM014', roomCategory1: '04 面談・相談室関連', roomCategory2: '01 外来面談・相談室・問診室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM015', roomCategory1: '04 面談・相談室関連', roomCategory2: '02 その他面談・相談室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM016', roomCategory1: '05 カンファ・休憩関連', roomCategory2: '01 カンファ・事務室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM017', roomCategory1: '05 カンファ・休憩関連', roomCategory2: '02 休憩室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM018', roomCategory1: '05 カンファ・休憩関連', roomCategory2: '03 役職者居室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM019', roomCategory1: '06 当直・仮眠室関連', roomCategory2: '01 中央診療', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM020', roomCategory1: '06 当直・仮眠室関連', roomCategory2: '02 管理系', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM021', roomCategory1: '07 更衣室関連', roomCategory2: '01 患者使用', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM022', roomCategory1: '07 更衣室関連', roomCategory2: '02 スタッフ使用', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM023', roomCategory1: '08 病棟基準諸室', roomCategory2: '01 スタッフステーション', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM024', roomCategory1: '08 病棟基準諸室', roomCategory2: '02 処置室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM025', roomCategory1: '08 病棟基準諸室', roomCategory2: '03 薬剤準備室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM026', roomCategory1: '08 病棟基準諸室', roomCategory2: '04 面談室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM027', roomCategory1: '08 病棟基準諸室', roomCategory2: '05 スタッフ休憩室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM028', roomCategory1: '08 病棟基準諸室', roomCategory2: '06 汚物処理室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM029', roomCategory1: '08 病棟基準諸室', roomCategory2: '07 材料保管室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM030', roomCategory1: '08 病棟基準諸室', roomCategory2: '08 パントリー・下膳室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM031', roomCategory1: '08 病棟基準諸室', roomCategory2: '09 ＳＷ／ＵＳ／脱衣／前室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM032', roomCategory1: '08 病棟基準諸室', roomCategory2: '09 シャワー浴室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM033', roomCategory1: '08 病棟基準諸室', roomCategory2: '10 洗濯室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM034', roomCategory1: '08 病棟基準諸室', roomCategory2: '11 当直室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM035', roomCategory1: '08 病棟基準諸室', roomCategory2: '12 カンファレンスルーム', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM036', roomCategory1: '08 病棟基準諸室', roomCategory2: '13 器材室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM037', roomCategory1: '08 病棟基準諸室', roomCategory2: '14 リネン庫(清潔)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM038', roomCategory1: '08 病棟基準諸室', roomCategory2: '14 リネン庫(不潔)', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM039', roomCategory1: '08 病棟基準諸室', roomCategory2: '15 廃棄物置場', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM040', roomCategory1: '08 病棟基準諸室', roomCategory2: '16 師長室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM041', roomCategory1: '08 病棟基準諸室', roomCategory2: '17 備蓄庫', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM042', roomCategory1: '08 病棟基準諸室', roomCategory2: '18 掃除用具置場', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM043', roomCategory1: '08 病棟基準諸室', roomCategory2: '19 給湯室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'ROOM044', roomCategory1: '08 病棟基準諸室', roomCategory2: '20 洗髪室', status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

export const useMasterStore = create<MasterStore>((set, get) => ({
  facilities: initialFacilities,
  assets: initialAssets,
  departments: customerDepartments,
  roomCategories: customerRoomCategories,
  vendors: initialVendors,

  // Facility actions
  setFacilities: (facilities) => set({ facilities }),

  addFacility: (facility) => set((state) => ({
    facilities: [...state.facilities, facility]
  })),

  updateFacility: (id, facility) => set((state) => ({
    facilities: state.facilities.map((f) =>
      f.id === id ? { ...f, ...facility, updatedAt: new Date().toISOString() } : f
    )
  })),

  deleteFacility: (id) => set((state) => ({
    facilities: state.facilities.filter((f) => f.id !== id)
  })),

  getFacilityById: (id) => {
    return get().facilities.find((f) => f.id === id);
  },

  // Asset actions
  setAssets: (assets) => set({ assets }),

  addAsset: (asset) => set((state) => ({
    assets: [...state.assets, asset]
  })),

  updateAsset: (id, asset) => set((state) => ({
    assets: state.assets.map((a) =>
      a.id === id ? { ...a, ...asset, updatedAt: new Date().toISOString() } : a
    )
  })),

  deleteAsset: (id) => set((state) => ({
    assets: state.assets.filter((a) => a.id !== id)
  })),

  getAssetById: (id) => {
    return get().assets.find((a) => a.id === id);
  },

  // Search functions (fuzzy search)
  searchFacilities: (query) => {
    const facilities = get().facilities;
    if (!query) return facilities;

    const lowerQuery = query.toLowerCase();
    return facilities.filter((f) =>
      f.facilityCode.toLowerCase().includes(lowerQuery) ||
      f.facilityName.toLowerCase().includes(lowerQuery) ||
      f.prefecture.toLowerCase().includes(lowerQuery) ||
      f.city.toLowerCase().includes(lowerQuery)
    );
  },

  searchAssets: (query) => {
    const assets = get().assets;
    if (!query) return assets;

    const lowerQuery = query.toLowerCase();
    return assets.filter((a) =>
      a.category.toLowerCase().includes(lowerQuery) ||
      a.largeClass.toLowerCase().includes(lowerQuery) ||
      a.mediumClass.toLowerCase().includes(lowerQuery) ||
      a.item.toLowerCase().includes(lowerQuery) ||
      a.maker.toLowerCase().includes(lowerQuery) ||
      a.model.toLowerCase().includes(lowerQuery) ||
      a.classificationCode.toLowerCase().includes(lowerQuery) ||
      a.classificationName.toLowerCase().includes(lowerQuery) ||
      a.generalName.toLowerCase().includes(lowerQuery) ||
      a.jmdnCode.toLowerCase().includes(lowerQuery) ||
      a.tradeName.toLowerCase().includes(lowerQuery) ||
      a.manufacturer.toLowerCase().includes(lowerQuery)
    );
  },

  // Department actions
  setDepartments: (departments) => set({ departments }),

  addDepartment: (department) => set((state) => ({
    departments: [...state.departments, department]
  })),

  updateDepartment: (id, department) => set((state) => ({
    departments: state.departments.map((d) =>
      d.id === id ? { ...d, ...department, updatedAt: new Date().toISOString() } : d
    )
  })),

  deleteDepartment: (id) => set((state) => ({
    departments: state.departments.filter((d) => d.id !== id)
  })),

  getDepartmentById: (id) => {
    return get().departments.find((d) => d.id === id);
  },

  searchDepartments: (query) => {
    const departments = get().departments;
    if (!query) return departments;

    const lowerQuery = query.toLowerCase();
    return departments.filter((d) =>
      d.division.toLowerCase().includes(lowerQuery) ||
      d.department.toLowerCase().includes(lowerQuery)
    );
  },

  // RoomCategory actions
  setRoomCategories: (roomCategories) => set({ roomCategories }),

  addRoomCategory: (roomCategory) => set((state) => ({
    roomCategories: [...state.roomCategories, roomCategory]
  })),

  updateRoomCategory: (id, roomCategory) => set((state) => ({
    roomCategories: state.roomCategories.map((r) =>
      r.id === id ? { ...r, ...roomCategory, updatedAt: new Date().toISOString() } : r
    )
  })),

  deleteRoomCategory: (id) => set((state) => ({
    roomCategories: state.roomCategories.filter((r) => r.id !== id)
  })),

  getRoomCategoryById: (id) => {
    return get().roomCategories.find((r) => r.id === id);
  },

  searchRoomCategories: (query) => {
    const roomCategories = get().roomCategories;
    if (!query) return roomCategories;

    const lowerQuery = query.toLowerCase();
    return roomCategories.filter((r) =>
      r.roomCategory1.toLowerCase().includes(lowerQuery) ||
      r.roomCategory2.toLowerCase().includes(lowerQuery)
    );
  },

  // Vendor actions
  setVendors: (vendors) => set({ vendors }),

  addVendor: (vendor) => set((state) => ({
    vendors: [...state.vendors, vendor]
  })),

  updateVendor: (id, vendor) => set((state) => ({
    vendors: state.vendors.map((v) =>
      v.id === id ? { ...v, ...vendor, updatedAt: new Date().toISOString() } : v
    )
  })),

  deleteVendor: (id) => set((state) => ({
    vendors: state.vendors.filter((v) => v.id !== id)
  })),

  getVendorById: (id) => {
    return get().vendors.find((v) => v.id === id);
  },

  searchVendors: (query) => {
    const vendors = get().vendors;
    if (!query) return vendors;

    const lowerQuery = query.toLowerCase();
    return vendors.filter((v) =>
      v.facilityName.toLowerCase().includes(lowerQuery) ||
      v.invoiceNumber.toLowerCase().includes(lowerQuery) ||
      v.vendorName.toLowerCase().includes(lowerQuery) ||
      v.address.toLowerCase().includes(lowerQuery) ||
      v.position.toLowerCase().includes(lowerQuery) ||
      v.role.toLowerCase().includes(lowerQuery) ||
      v.contactPerson.toLowerCase().includes(lowerQuery) ||
      v.phone.toLowerCase().includes(lowerQuery) ||
      v.email.toLowerCase().includes(lowerQuery)
    );
  },
}));
