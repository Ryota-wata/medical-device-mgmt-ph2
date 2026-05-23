/**
 * 点検管理の型定義
 */

/** 点検メニュー種類 */
export type InspectionMenuType = '定期点検' | '日常点検';

/** 日常点検タイミング */
export type DailyInspectionTiming = '使用前' | '使用中' | '使用後';

/** 評価方式 */
export type EvaluationType = '合否' | '単位' | 'フリー入力';

/** 単位オプション */
export type UnitOption = '℃' | '%' | '個' | 'その他';

/** 貸出状況ステータス */
export type LendingStatus = '待機中' | '貸出可' | '貸出中' | '使用中' | '使用済' | '返却済' | '使用不可';

/** 点検タスクステータス（定期ステータス） */
export type InspectionTaskStatus =
  | '点検週'
  | '点検月'
  | string             // '点検●ヶ月前' （動的ラベル）
  | '点検月超過';

/** 点検種別（タスク用） */
export type InspectionType = '院内定期点検' | 'メーカー保守' | '院内スポット点検';

/**
 * 点検項目
 */
export interface InspectionItem {
  id: string;
  order: number;                    // 表示順
  itemName: string;                 // 項目名
  content: string;                  // 点検内容
  inputType: '選択' | 'フリー入力';
  evaluationType: EvaluationType;
  unitValue?: string;               // 単位（evaluationType='単位'の場合）
  freeValue?: string;               // フリー入力値（evaluationType='フリー入力'の場合）
  selectOptions?: string[];         // 選択肢（選択入力の場合）
}

/**
 * 点検メニュー（マスタ）
 */
export interface InspectionMenu {
  id: string;
  name: string;                     // "輸液ポンプ 日常点検 使用前点検"

  // 対象機器
  largeClass: string;               // 大分類
  mediumClass: string;              // 中分類
  item: string;                     // 品目

  // 点検区分
  menuType: InspectionMenuType;

  // 定期点検の場合
  cycleMonths?: number;             // 点検周期（月）

  // 日常点検の場合
  dailyTiming?: DailyInspectionTiming;

  // 点検項目リスト
  inspectionItems: InspectionItem[];

  createdAt: string;
  updatedAt: string;
}

/**
 * 点検タスク（点検対象資産）
 */
export interface InspectionTask {
  id: string;

  // 資産情報
  assetId: string;                  // QRコード
  assetName: string;                // 品目名
  maker: string;                    // メーカー
  model: string;                    // 型式
  largeClass: string;               // 大分類
  mediumClass: string;              // 中分類
  managementDepartment: string;     // 管理部署
  installedDepartment: string;      // 設置部署
  purchaseDate?: string;            // 購入年月

  // 点検種別
  inspectionType: InspectionType;

  // 紐付けメニュー（最大2つ）
  periodicMenuIds: string[];

  // 日常点検
  hasDailyInspection: boolean;
  dailyMenus: {
    before?: string;                // 使用前メニューID
    during?: string;                // 使用中メニューID
    after?: string;                 // 使用後メニューID
  };

  // メーカー保守（メーカー保守の場合）
  vendorName?: string;
  maintenanceContractId?: string;

  // 貸出状況
  lendingStatus: LendingStatus;

  // 保守・点検グループ名
  inspectionGroupName?: string;

  // スケジュール
  nextInspectionDate: string;       // 次回点検予定日
  lastInspectionDate?: string;      // 前回点検日

  // 進捗 "1/2" 形式
  completedCount: number;
  totalCount: number;

  // ステータス（定期ステータス）
  status: InspectionTaskStatus;
}

/**
 * 点検実績
 */
export interface InspectionRecord {
  id: string;
  taskId: string;                   // 点検タスクID
  assetId: string;                  // 資産ID（QRコード）
  menuId: string;                   // 点検メニューID

  // 日程
  plannedDate: string;              // 予定日
  actualDate: string;               // 実施日

  // 結果
  result: '合格' | '条件付合格' | '要修理';
  resultDetails?: InspectionResultDetail[];

  // 実施者
  staffName?: string;               // 担当者名（院内点検）
  vendorName?: string;              // 業者名（メーカー保守）

  // ドキュメント
  documentType?: '点検報告書' | 'その他';
  documentUrl?: string;

  // コスト
  partsCost?: number;               // 部品費
  partsDetail?: string;             // 交換部品詳細
  laborCost?: number;               // 作業費
  totalCost?: number;               // 合計

  memo?: string;
  createdAt: string;
}

/**
 * 点検結果詳細（各項目の結果）
 */
export interface InspectionResultDetail {
  itemId: string;                   // 点検項目ID
  itemName: string;                 // 項目名
  result: '合格' | '不合格' | string; // 合否またはフリー入力値
  note?: string;                    // 備考
}

/**
 * 点検メニュー登録フォーム用
 */
export interface InspectionMenuFormData {
  name: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  menuType: InspectionMenuType;
  cycleMonths?: number;
  dailyTiming?: DailyInspectionTiming;
  inspectionItems: Omit<InspectionItem, 'id'>[];
}

/**
 * 点検タスク登録フォーム用
 */
export interface InspectionTaskFormData {
  assetId: string;
  inspectionType: InspectionType;
  periodicMenuIds: string[];
  hasDailyInspection: boolean;
  dailyMenus: {
    before?: string;
    during?: string;
    after?: string;
  };
  vendorName?: string;
  nextInspectionDate: string;
}
