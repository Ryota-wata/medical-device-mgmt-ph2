/**
 * 見積書関連の型定義
 */

// 見積フェーズ
export type QuotationPhase =
  | '定価見積'
  | '概算見積'
  | '確定見積';

// 明細分類（登録区分）
export type QuotationItemType =
  | 'A_表紙明細'
  | 'B_明細代表'
  | 'C_個体管理品目'
  | 'D_付属品'
  | 'E_その他役務'
  | 'F_値引き';

// 資産区分（category）
export type AssetCategory =
  | '有形資産_医療用機器備品'
  | '有形資産_器具備品'
  | '有形資産_建物附属設備'
  | '無形資産_ソフトウェア'
  | '費用_消耗品経費'
  | '長期前払費用_保守費';

// 会計区分
export type AccountingCategory =
  | '資本的支出'
  | '経費'
  | '前払費用';

// 受領見積グループ（ヘッダー情報）
export interface ReceivedQuotationGroup {
  id: number;
  receivedQuotationNo: string; // 施設番号-yyyy-mm-###
  rfqGroupId?: number; // 見積依頼グループとの紐づけ
  rfqNo?: string; // 見積依頼No（表示用）
  vendorName: string;
  vendorNo?: string;
  vendorContact?: string;
  vendorEmail?: string;
  quotationDate: string; // 見積日
  validityPeriod?: number; // 有効期限（月数）
  deliveryPeriod?: number; // 納期（月数）
  phase: QuotationPhase;
  totalAmount?: number; // 全明細の合計金額
  pdfUrl?: string; // 見積書PDFのURL
  createdAt: string;
  updatedAt: string;
}

// 勘定科目
export type AccountTitle =
  | '器械備品'
  | '医療機器'
  | '什器備品'
  | '建物付属設備'
  | '消耗品費'
  | '修繕費'
  | '委託費';

// 受領見積明細（個別レコード）
export interface ReceivedQuotationItem {
  id: number;
  quotationGroupId: number; // 見積グループとの紐づけ
  receivedQuotationNo: string; // 見積番号（表示用）

  // === 商品情報（原本情報） ===
  rowNo?: number; // No（見積書上の行番号）
  originalItemName: string; // 品名（原本）
  originalManufacturer?: string; // メーカー（原本）
  originalModel?: string; // 型式（原本）
  originalQuantity: number; // 数量（原本）

  // === AI判定・資産マスタ情報 ===
  itemType: QuotationItemType; // 登録区分
  category?: string; // category（01医療機器など）
  largeClass?: string; // 大分類
  middleClass?: string; // 中分類
  itemName: string; // 個体管理品目（確定後の資産名）
  manufacturer?: string; // メーカー（確定後）
  model?: string; // 型式（確定後）
  aiQuantity: number; // 数量（登録区分Cは1、それ以外は原本数量）

  // === 見積依頼No・枝番 ===
  rfqNo?: string; // 見積依頼No
  branchNo?: number; // 枝番（登録区分Cのみ使用、1から連番）

  // === 価格情報（原本情報） ===
  listPriceUnit?: number; // 定価単価
  listPriceTotal?: number; // 定価金額
  purchasePriceUnit?: number; // 購入単価
  purchasePriceTotal?: number; // 購入金額
  remarks?: string; // 備考

  // === 価格情報（按分登録）- 編集可能 ===
  allocListPriceUnit?: number; // 定価単価（按分）
  allocListPriceTotal?: number; // 定価金額（按分）
  allocPriceUnit?: number; // 登録単価（税別）
  allocDiscount?: number; // 値引率
  allocTaxRate?: number; // 消費税率
  allocTaxTotal?: number; // 税込金額
  accountTitle?: AccountTitle; // 勘定科目

  // === 個体登録情報（STEP5/6から） ===
  seqId?: string; // SEQ_ID（個体管理品目の連番）
  parentSeqId?: string; // 親と紐付け

  // === その他 ===
  unit?: string;
  assetMasterId?: string; // 資産Masterとの紐づけ
  linkedApplicationIds?: number[]; // 紐づけられた申請ID（複数可）
  isSpecificationLine?: boolean; // 仕様行フラグ
  specificationText?: string; // 仕様テキスト
  createdAt: string;
  updatedAt: string;
}

// 後方互換性のため、旧型を残す（非推奨）
/** @deprecated ReceivedQuotationGroupとReceivedQuotationItemを使用してください */
export interface ReceivedQuotation {
  id: number;
  receivedQuotationNo: string;
  rfqGroupId?: number;
  rfqNo?: string;
  vendorName: string;
  vendorNo?: string;
  vendorContact?: string;
  vendorEmail?: string;
  quotationDate: string;
  validityPeriod?: number;
  deliveryPeriod?: number;
  phase: QuotationPhase;
  items: QuotationItem[];
  totalAmount?: number;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated ReceivedQuotationItemを使用してください */
export interface QuotationItem {
  id: number;
  itemType: QuotationItemType;
  itemName: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  unit?: string;
  listPriceUnit?: number;
  listPriceTotal?: number;
  sellingPriceUnit?: number;
  sellingPriceTotal?: number;
  discount?: number;
  taxRate: number;
  totalWithTax?: number;
  assetMasterId?: number;
  linkedApplicationIds?: number[];
}

// AI判定結果（資産マスタ推薦情報）
export interface AIJudgmentResult {
  itemType: QuotationItemType; // 登録区分（AI判定）
  category: string; // category（01医療機器、02什器備品など）
  majorCategory: string; // 大分類
  middleCategory: string; // 中分類
  assetName: string; // 個体管理品目名
  manufacturer: string; // メーカー
  model: string; // 型式
  quantity: number; // 数量（C_個体管理品目は常に1）
}

// OCR結果の型定義（原本情報）
export interface OCRResultItem {
  rowNo?: number; // No
  itemType: QuotationItemType; // 登録区分（原本）
  itemName: string; // 品名
  manufacturer: string; // メーカー
  model: string; // 型式
  specification?: string; // 仕様
  quantity: number; // 数量
  unit: string; // 単位
  // 定価情報
  listPriceUnit: number; // 定価単価
  listPriceTotal: number; // 定価合計
  // 購入価格情報（新規追加）
  purchasePriceUnit: number; // 購入単価
  purchasePriceTotal: number; // 購入金額
  // 値引・税・備考
  discount: number; // 値引率
  taxRate: number; // 税率
  totalWithTax: number; // 税込合計
  remarks?: string; // 備考
  // 資産区分・会計区分（ユーザー入力/AI判定）
  assetCategory?: AssetCategory; // 資産区分（category）
  accountingCategory?: AccountingCategory; // 会計区分
  // 後方互換性のため残す
  sellingPriceUnit?: number; // 売価単価（非推奨：purchasePriceUnitを使用）
  sellingPriceTotal?: number; // 売価合計（非推奨：purchasePriceTotalを使用）
  // AI判定結果（1対1対応）
  aiJudgments: AIJudgmentResult[];
  // 個体管理品目向け：親子関係
  parentItemIndex?: number; // 親アイテムのインデックス（付属品の場合）
  allocatedPrice?: number; // 案分後の金額
}

export interface OCRResult {
  vendorName: string;
  facilityName: string; // 宛先（施設名）
  quotationDate: string;
  validityPeriod: number;
  deliveryPeriod: number;
  phase: QuotationPhase;
  items: OCRResultItem[];
  totalAmount: number;
}

// フォームとフィルタの型定義
export interface QuotationFormData {
  rfqGroupId: string;
  pdfFile: File | null;
}

export interface QuotationFilter {
  rfqGroupId: string;
  phase: string;
}

// Step2での確定情報（Step3に引き継ぐ）
export interface ConfirmedAssetInfo {
  category: string;
  majorCategory: string;
  middleCategory: string;
  assetName: string;
  manufacturer: string;
  model: string;
}

export interface ConfirmedItemInfo {
  status: 'ai_confirmed' | 'asset_master_selected';
  assetInfo: ConfirmedAssetInfo; // 確定した資産情報
}

// 確定状態のマップ（key: `${ocrItemIndex}-${aiIndex}`）
export type ConfirmedStateMap = Record<string, ConfirmedItemInfo>;
