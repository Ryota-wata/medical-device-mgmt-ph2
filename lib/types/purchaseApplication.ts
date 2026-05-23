/**
 * 購入申請関連の型定義
 * 臨床スタッフが資産一覧から申請し、事務担当者が編集リストに追加するフロー用
 */

/**
 * 購入申請種別
 */
export type PurchaseApplicationType = '更新申請' | '増設申請' | '新規申請';

/**
 * 購入申請ステータス
 */
export type PurchaseApplicationStatus =
  | '申請中'      // 臨床スタッフが申請した直後
  | '却下'        // 事務担当者が却下
  | '編集中'      // 編集リストに追加済み
  | '見積中'      // 見積依頼No.採番済み
  | '発注済'
  | '納品済'
  | '検収済'
  | '完了';       // 原本登録完了

/**
 * 購入申請
 */
export interface PurchaseApplication {
  id: string;
  applicationNo: string;
  applicationType: PurchaseApplicationType;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  applicationDate: string;
  status: PurchaseApplicationStatus;

  // 対象資産情報
  assets: PurchaseApplicationAsset[];

  // 設置場所情報
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;

  // 申請内容
  desiredDeliveryDate?: string;
  applicationReason?: string;
  attachedFiles?: string[];
  priority?: string; // 優先順位

  // 使用用途及び件数
  usagePurpose?: string;
  caseCount?: string;

  // コメント
  comment?: string;

  // システム接続要望
  currentConnectionStatus?: string;
  currentConnectionDestination?: string;
  requestConnectionStatus?: string;
  requestConnectionDestination?: string;

  // 編集リスト追加後の情報
  editListId?: string;
  editListName?: string;

  // 見積依頼グループ情報（採番後）
  rfqGroupIds?: string[];
  rfqNos?: string[];

  createdAt: string;
  updatedAt: string;
}

/**
 * 購入申請の対象資産
 */
export interface PurchaseApplicationAsset {
  assetId?: string;          // 既存資産の場合
  qrCode?: string;           // 既存資産のQRコード
  name: string;
  maker: string;
  model: string;
  category?: string;
  largeClass?: string;
  mediumClass?: string;
  item?: string;
  quantity: number;
  unit: string;
}

/**
 * 購入申請作成用データ
 */
export interface CreatePurchaseApplicationInput {
  applicationType: PurchaseApplicationType;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  assets: PurchaseApplicationAsset[];
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
  desiredDeliveryDate?: string;
  applicationReason?: string;
  attachedFiles?: string[];
  priority?: string;
  usagePurpose?: string;
  caseCount?: string;
  comment?: string;
  currentConnectionStatus?: string;
  currentConnectionDestination?: string;
  requestConnectionStatus?: string;
  requestConnectionDestination?: string;
}

/**
 * ステータスのバッジスタイル取得
 */
export function getPurchaseApplicationStatusStyle(status: PurchaseApplicationStatus): {
  background: string;
  color: string;
} {
  const styles: Record<PurchaseApplicationStatus, { background: string; color: string }> = {
    '申請中': { background: '#f39c12', color: 'white' },
    '却下': { background: '#e74c3c', color: 'white' },
    '編集中': { background: '#3498db', color: 'white' },
    '見積中': { background: '#9b59b6', color: 'white' },
    '発注済': { background: '#00796b', color: 'white' },
    '納品済': { background: '#00695c', color: 'white' },
    '検収済': { background: '#2e7d32', color: 'white' },
    '完了': { background: '#1b5e20', color: 'white' },
  };
  return styles[status];
}

/**
 * 申請種別のバッジスタイル取得
 */
export function getPurchaseApplicationTypeStyle(type: PurchaseApplicationType): {
  background: string;
  color: string;
} {
  const styles: Record<PurchaseApplicationType, { background: string; color: string }> = {
    '更新申請': { background: '#e67e22', color: 'white' },
    '増設申請': { background: '#3498db', color: 'white' },
    '新規申請': { background: '#27ae60', color: 'white' },
  };
  return styles[type];
}
