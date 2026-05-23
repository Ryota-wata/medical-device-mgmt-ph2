/**
 * 発注関連の型定義
 */

/** 発注形態 */
export type OrderType =
  | '購入'
  | '割賦'
  | 'リース（ファイナンス）'
  | 'リース（オペレーティング）'
  | 'レンタル';

/** 支払い条件（レガシー — OrderRegistrationModal で使用） */
export type PaymentTerms =
  | '納品時一括'
  | '検収後一括'
  | '分割払い'
  | '月末締め翌月末払い'
  | 'その他';

/** 支払方法 */
export type PaymentMethod =
  | 'でんさい'
  | '銀行振込'
  | 'クレジット'
  | '現金';

/** 検収書の発行 */
export type InspectionCertType = '本体のみ' | '付属品含む';

/** 保存形式 */
export type StorageFormat = '電子取引' | 'スキャナ保存' | '未指定';

/** 登録区分 */
export type RegistrationType = '本体' | '付属品';

/** 発注グループ */
export interface OrderGroup {
  id: number;
  orderNo: string;
  rfqGroupId: number;
  rfqNo: string;
  groupName: string;
  vendorName: string;
  /** 申請者 */
  applicant: string;
  applicantEmail: string;
  /** 院内決済No. */
  inHouseSettlementNo?: string;
  /** 発注形態 */
  orderType: OrderType;
  /** 納期（発注段階で確定。納品日は検収準備で登録） */
  deliveryDate?: string;
  /** 支払い条件（レガシー） */
  paymentTerms: PaymentTerms;
  /** 支払条件: 締め月 */
  paymentClosingMonth?: string;
  /** 支払条件: 締め日 */
  paymentClosingDay?: string;
  /** 支払条件: 支払月 */
  paymentMonth?: string;
  /** 支払条件: 支払日 */
  paymentDay?: string;
  /** 支払方法 */
  paymentMethod?: PaymentMethod;
  /** 支払期日（○日サイト） */
  paymentSiteDays?: number;
  /** 支払い期日（レガシー） */
  paymentDueDate?: string;
  /** リース会社 */
  leaseCompany?: string;
  /** リース開始日 */
  leaseStartDate?: string;
  /** リース終了日 */
  leaseEndDate?: string;
  /** リース年数（レガシー） */
  leaseYears?: number;
  /** コメント */
  comment?: string;
  /** 検収書の発行 */
  inspectionCertType: InspectionCertType;
  /** 保管形式 */
  storageFormat: StorageFormat;
  /** 合計金額（税込） */
  totalAmount: number;
  /** 発注日 */
  orderDate: string;
  /** 検収日 */
  inspectionDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** 発注明細 */
export interface OrderItem {
  id: number;
  orderGroupId: number;
  /** 元の見積明細ID */
  quotationItemId: number;
  itemName: string;
  manufacturer: string;
  model: string;
  /** 登録区分 */
  registrationType: RegistrationType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** 個別の納品日（グループと異なる場合） */
  deliveryDate?: string;
  remarks?: string;
}
