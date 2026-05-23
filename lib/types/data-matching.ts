/**
 * データ突合画面の型定義
 */

/**
 * 突合状況
 */
export type MatchingStatus =
  | '完全一致'
  | '部分一致'
  | '数量不一致'
  | '再確認'
  | '未確認'  // 台帳に存在するが現場に無い
  | '未登録'; // 現場に存在するが台帳に無い
// 注: 突合状況が未設定（undefined）の場合は未突合を意味する

/**
 * 突合ステップ
 */
export type MatchingStep = 1 | 2 | 3;

/**
 * リスト種別
 */
export type ListType = '現有品調査' | '固定資産台帳' | 'ME管理台帳';

/**
 * フィルター条件
 */
export interface DataMatchingFilters {
  category: string;
  department: string;
  section: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer: string;
  model: string;
  matchingStatus: string;  // '全て' | MatchingStatus
  keyword: string;
}

/**
 * 現有品調査データ
 */
export interface SurveyData {
  id: string;
  qrCode: string;              // QRコード（シール番号）
  assetNo?: string;            // 資産番号（突合後に設定される場合も）
  meNo?: string;               // ME管理番号
  department: string;          // 部門
  section: string;             // 部署
  roomName?: string;           // 諸室名称
  category: string;            // カテゴリ
  majorCategory: string;       // 大分類
  middleCategory: string;      // 中分類
  item: string;                // 品目
  manufacturer?: string;       // メーカー
  model?: string;              // 型式
  quantity: number;            // 数量
  acquisitionDate?: string;    // 取得年月日
  sourceList?: string;         // 元リスト名

  // 突合情報
  matchingStatus?: MatchingStatus;  // undefined = 未突合
  matchedLedgerId?: string;    // 紐付けた台帳のID
  matchedAt?: string;          // 突合日時
  matchedBy?: string;          // 突合実施者
  memo?: string;               // メモ
}

/**
 * 固定資産台帳データ
 */
export interface LedgerData {
  id: string;
  qrCode?: string;             // QRコード
  assetNo: string;             // 資産番号
  meNo?: string;               // ME管理番号
  department: string;          // 部門
  section: string;             // 部署
  roomName?: string;           // 諸室名称
  category: string;            // カテゴリ
  majorCategory: string;       // 大分類
  middleCategory: string;      // 中分類
  item: string;                // 品目
  manufacturer?: string;       // メーカー
  model?: string;              // 型式
  quantity: number;            // 数量
  acquisitionDate?: string;    // 取得年月日

  // 突合情報
  matchingStatus?: MatchingStatus;  // undefined = 未突合
  matchedSurveyId?: string;    // 紐付けた現有品のID
  matchedAt?: string;          // 突合日時
  matchedBy?: string;          // 突合実施者
}

/**
 * 突合編集データ
 */
export interface MatchingEditData {
  surveyId: string;
  matchingStatus: MatchingStatus;
  ledgerAssetNo?: string;
  memo?: string;
}

/**
 * ME管理台帳データ
 */
export interface MELedgerData {
  id: string;
  meNo: string;                 // ME管理番号
  assetNo?: string;             // 資産番号（あれば）
  department: string;           // 部門
  section: string;              // 部署
  roomName?: string;            // 諸室名称
  category: string;             // カテゴリ
  majorCategory: string;        // 大分類
  middleCategory: string;       // 中分類
  item: string;                 // 品目
  manufacturer?: string;        // メーカー
  model?: string;               // 型式
  serialNo?: string;            // シリアル番号
  quantity: number;             // 数量
  inspectionDate?: string;      // 点検日

  // 突合情報
  matchingStatus?: MatchingStatus;
  matchedIntermediateId?: string; // 紐付けた中間リストのID
  matchedAt?: string;
  matchedBy?: string;
}

/**
 * 中間リスト（Step1の結果）
 * 現有品調査 + 固定資産台帳の突合結果
 */
export interface IntermediateData {
  id: string;

  // 統合後のデータ
  assetNo?: string;
  qrCode?: string;
  department: string;
  section: string;
  roomName?: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer?: string;
  model?: string;
  quantity: number;
  acquisitionDate?: string;

  // 紐付け情報
  surveyId?: string;             // 現有品調査のID
  ledgerId?: string;             // 固定資産台帳のID
  step1Status: MatchingStatus;   // Step1での突合状況
  step1Memo?: string;

  // Step2用
  matchingStatus?: MatchingStatus;  // Step2での突合状況（undefined = 未突合）
  matchedMELedgerId?: string;    // 紐付けたME管理台帳のID
  matchedAt?: string;
  matchedBy?: string;
  step2Memo?: string;
}

/**
 * 原本リスト（最終結果）
 */
export interface OriginalData {
  id: string;

  // 最終データ
  assetNo?: string;
  qrCode?: string;
  meNo?: string;
  department: string;
  section: string;
  roomName?: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer?: string;
  model?: string;
  serialNo?: string;
  quantity: number;
  acquisitionDate?: string;

  // どのリストに存在していたか
  existsIn: ListType[];

  // 紐付け情報
  surveyId?: string;
  ledgerId?: string;
  meLedgerId?: string;

  // 突合履歴
  step1Status?: MatchingStatus;
  step2Status?: MatchingStatus;
  finalStatus: MatchingStatus;
  memo?: string;
}
