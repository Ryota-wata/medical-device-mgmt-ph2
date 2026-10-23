// SHIP施設マスタの型定義
export interface FacilityMaster {
  id: string;
  facilityCode: string;
  facilityName: string;
  building?: string;    // 棟
  floor?: string;       // 階
  department?: string;  // 部門
  section?: string;     // 部署
  prefecture: string;
  foundingBody: string; // 設立母体
  city: string;
  address: string;
  postalCode: string;
  phoneNumber: string;
  establishedDate: string;
  facilityType: string;
  bedCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;

  // ── Ph2 施設マスタ（顧客ワイヤー 操作UI_施設マスタ v3.3 / MS-101・MS-102）──
  /** 施設略称（一覧・帳票ヘッダの表示に使用） */
  shortName?: string;
  /** 二次医療圏（手入力。登録済みの値を候補に出す） */
  secondaryMedicalArea?: string;
  /** 延床面積（㎡） */
  floorArea?: string;
  /** 契約状況。利用の開始・停止の操作で変わる（直接は変更しない） */
  contractStatus?: FacilityContractStatus;
  /** リモデル契約。契約状況とは独立 */
  remodelContract?: 'あり' | 'なし';
  /** 契約開始日・契約終了日（紙の契約書の日付。YYYY-MM-DD）。契約終了日＝契約更新日 */
  contractStartDate?: string;
  contractEndDate?: string;
  /** 利用開始日・利用停止予定日・利用停止日（操作で自動記録。YYYY/MM/DD） */
  useStartDate?: string;
  stopPlanDate?: string;
  stopDate?: string;
  /** 認定情報（分類ごとの複数選択を 1 つの配列で持つ） */
  certifications?: string[];
  /** 病床・治療室・諸室（キーは画面の項目名。'' は未入力で 0 と区別する） */
  beds?: Record<string, string>;
  rooms?: Record<string, string>;
  /** 担当する SHIP の管理組織（SHIP 管理者に見せる範囲） */
  managingOrgs?: string[];
}

/** 施設の契約状況（2026-09-15 SE 確認で 4 値） */
export type FacilityContractStatus = '未契約' | '契約中' | '停止予定' | '停止中';

// SHIP資産マスタの型定義
export interface AssetMaster {
  id: string;
  // JMDN分類・一般名称
  classificationCode: string;      // 類別コード (Col2)
  classificationName: string;      // 類別名称 (Col3)
  jmdnSubCategory: string;         // JMDN中分類名 (Col4)
  generalName: string;             // 一般的名称 (Col5)
  jmdnCode: string;                // JMDNコード (Col6)
  tradeName: string;               // 販売名 (Col7)
  manufacturer: string;            // 製造販売業者等 (Col8)
  packageInsert: string;           // 添付文書 (Col9)
  // SHIP資産マスタ
  assetMasterId: string;           // 資産マスタID (Col10)
  category: string;                // category (Col11)
  largeClass: string;              // 大分類 (Col12)
  mediumClass: string;             // 中分類 (Col13)
  item: string;                    // 品目 (Col14)
  maker: string;                   // メーカー名 (Col15)
  model: string;                   // 型式 (Col16)
  packageInsertDocument: string;   // 添付文書Document (Col17)
  catalogDocument: string;         // カタログDocument (Col18)
  otherDocument: string;           // その他Document (Col19)
  // システム管理
  specification: string;
  unitPrice: number;
  depreciationYears: number;
  maintenanceCycle: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// SHIP部署マスタの型定義
export interface DepartmentMaster {
  id: string;
  division: string;        // 部門
  department: string;      // 部署
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// SHIP諸室区分マスタの型定義
export interface RoomCategoryMaster {
  id: string;
  roomCategory1: string;   // 諸室区分①
  roomCategory2: string;   // 諸室区分②
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 業者マスタの型定義
export interface VendorMaster {
  id: string;
  facilityName: string;    // 担当施設名
  invoiceNumber: string;   // インボイス登録番号
  vendorName: string;      // 業者名
  address: string;         // 住所
  position: string;        // 役職
  role: string;            // 役割
  contactPerson: string;   // 氏名
  phone: string;           // 連絡先
  email: string;           // メール
  isPrimaryContact: boolean; // 担当フラグ
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// フィルター条件
export interface FacilityFilter {
  facilityCode?: string;
  facilityName?: string;
  prefecture?: string;
  city?: string;
  facilityType?: string;
  status?: 'active' | 'inactive' | 'all';
}

export interface AssetFilter {
  category?: string;
  largeClass?: string;
  mediumClass?: string;
  item?: string;
  maker?: string;
  model?: string;
  status?: 'active' | 'inactive' | 'all';
}
