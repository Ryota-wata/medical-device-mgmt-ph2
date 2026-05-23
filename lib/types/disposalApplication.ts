/**
 * 廃棄申請関連の型定義
 */

/**
 * 廃棄申請ステータス
 */
export type DisposalApplicationStatus =
  | '申請中'      // 臨床スタッフが申請した直後
  | '受付済'      // 事務担当者が受付
  | '見積取得済'  // 廃棄業者からの見積取得済み
  | '発注済'      // 廃棄業者へ発注済み
  | '検収済'      // 廃棄完了確認
  | '完了';       // 処理完了

/**
 * 廃棄理由
 */
export type DisposalReason =
  | '耐用年数超過'
  | '故障（修理不能）'
  | '更新に伴う廃棄'
  | 'その他';

/**
 * 廃棄申請
 */
export interface DisposalApplication {
  id: string;
  applicationNo: string;
  applicationDate: string;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  status: DisposalApplicationStatus;

  // 廃棄対象機器情報
  assetId?: string;
  qrCode?: string;
  itemName: string;
  maker: string;
  model: string;

  // 設置場所情報
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;

  // 廃棄理由
  disposalReason: DisposalReason;
  comment?: string;

  // 関連する更新申請（更新に伴う廃棄の場合）
  relatedPurchaseApplicationId?: string;

  // 添付ファイル
  attachedFiles?: string[];

  createdAt: string;
  updatedAt: string;
}

/**
 * 廃棄申請作成用データ
 */
export interface CreateDisposalApplicationInput {
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  assetId?: string;
  qrCode?: string;
  itemName: string;
  maker: string;
  model: string;
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
  disposalReason: DisposalReason;
  comment?: string;
  relatedPurchaseApplicationId?: string;
  attachedFiles?: string[];
}

/**
 * ステータスのバッジスタイル取得
 */
export function getDisposalApplicationStatusStyle(status: DisposalApplicationStatus): {
  background: string;
  color: string;
} {
  const styles: Record<DisposalApplicationStatus, { background: string; color: string }> = {
    '申請中': { background: '#f39c12', color: 'white' },
    '受付済': { background: '#3498db', color: 'white' },
    '見積取得済': { background: '#9b59b6', color: 'white' },
    '発注済': { background: '#00796b', color: 'white' },
    '検収済': { background: '#2e7d32', color: 'white' },
    '完了': { background: '#1b5e20', color: 'white' },
  };
  return styles[status];
}

/**
 * 廃棄理由のラベル取得
 */
export function getDisposalReasonLabel(reason: DisposalReason): string {
  return reason;
}
