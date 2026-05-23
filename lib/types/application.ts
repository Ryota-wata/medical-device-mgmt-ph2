/**
 * 申請関連の型定義
 */

/**
 * 原本登録ドキュメント種別
 */
export type OriginalDocumentType =
  | '契約書（押印済）'
  | '納品書（業者）'
  | '検収書（押印分）'
  | '保証書'
  | '取扱説明書'
  | '添付文書（JMDN発行）'
  | 'カタログdata';

/**
 * アップロードファイル情報
 */
export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

/**
 * 原本登録情報
 */
export interface OriginalRegistration {
  qrCodeNo?: string;
  serialNo?: string;
  photos: UploadedFile[];
  documents: {
    type: OriginalDocumentType;
    files: UploadedFile[];
  }[];
  registeredAt?: string;
  registeredBy?: string;
}

/**
 * 申請情報
 */
export interface Application {
  id: number;
  applicationNo: string;
  applicationDate: string;
  applicationType: ApplicationType;
  asset: {
    name: string;
    model: string;
  };
  vendor: string;
  quantity: string;
  unit?: string;
  rfqNo?: string;
  rfqGroupName?: string;
  status: ApplicationStatus;
  approvalProgress: {
    current: number;
    total: number;
  };
  facility: {
    building: string;
    floor: string;
    department: string;
    section: string;
  };
  roomName?: string;
  freeInput: string;
  executionYear: string;
  currentConnectionStatus?: string;
  currentConnectionDestination?: string;
  requestConnectionStatus?: string;
  requestConnectionDestination?: string;
  applicationReason?: string;
  quotationInfo?: QuotationInfo[];
  individualRegistered?: boolean;
  originalRegistration?: OriginalRegistration;
  // 見積・概算情報
  quotationVendor?: string;
  quotationAmount?: number;
  estimatedAmount?: number;
  // 編集用フリーカラム
  editColumn1?: string;
  editColumn2?: string;
  // 移動申請用：移動先情報
  transferDestination?: {
    department: string;
    section: string;
    roomName: string;
  };
  // 廃棄申請用：添付ファイル
  attachedFiles?: string[];
  // リモデル連携
  source?: 'remodel' | 'normal';
  editListId?: string;
}

/**
 * 申請種別
 */
export type ApplicationType =
  | '新規申請'
  | '増設申請'
  | '更新申請'
  | '移動申請'
  | '廃棄申請'
  | '保留';

/**
 * 申請ステータス
 */
export type ApplicationStatus =
  | '下書き'
  | '承認待ち'
  | '承認済み'
  | '差し戻し'
  | '却下'
  | '執行済み'
  | '見積依頼中'
  | '発注済み'
  | '検収済み'
  | '廃棄完了'
  | '移動完了';

/**
 * 見積情報
 */
export interface QuotationInfo {
  quotationId: string;
  quotationDate: string;
  vendor: string;
  ocrItemName: string;
  assetMaster: {
    itemId: string;
    itemName: string;
    largeName: string;
    mediumName: string;
  };
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * 見積依頼レコード
 */
export interface RfqRecord {
  rfqNo: string;
  vendor: string;
  applicationIds: number[];
  createdDate: string;
}

/**
 * 申請種別のバッジスタイル取得
 */
export function getApplicationTypeBadgeStyle(type: ApplicationType): {
  background: string;
  color: string;
} {
  const styles: Record<ApplicationType, { background: string; color: string }> = {
    '新規申請': { background: '#27ae60', color: 'white' },
    '増設申請': { background: '#3498db', color: 'white' },
    '更新申請': { background: '#e67e22', color: 'white' },
    '移動申請': { background: '#9b59b6', color: 'white' },
    '廃棄申請': { background: '#e74c3c', color: 'white' },
    '保留': { background: '#95a5a6', color: 'white' },
  };
  return styles[type];
}

/**
 * ステータスのバッジスタイル取得
 */
export function getStatusBadgeStyle(status: ApplicationStatus): {
  background: string;
  color: string;
} {
  const styles: Record<ApplicationStatus, { background: string; color: string }> = {
    '下書き': { background: '#95a5a6', color: 'white' },
    '承認待ち': { background: '#f39c12', color: 'white' },
    '承認済み': { background: '#27ae60', color: 'white' },
    '差し戻し': { background: '#e67e22', color: 'white' },
    '却下': { background: '#e74c3c', color: 'white' },
    '執行済み': { background: '#2c3e50', color: 'white' },
    '見積依頼中': { background: '#c2185b', color: 'white' },
    '発注済み': { background: '#00796b', color: 'white' },
    '検収済み': { background: '#00695c', color: 'white' },
    '廃棄完了': { background: '#7b1fa2', color: 'white' },
    '移動完了': { background: '#3f51b5', color: 'white' },
  };
  return styles[status];
}
