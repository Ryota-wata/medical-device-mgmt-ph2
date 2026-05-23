/**
 * 見積依頼(RFQ)関連の型定義
 */

export type RfqStatus = '見積待ち' | '見積受領';

export interface RfqApplication {
  applicationNo: string;
  assetName: string;
}

export interface Rfq {
  id: number;
  rfqNo: string;
  vendor: string;
  requestDate: string;
  status: RfqStatus;
  applicationCount: number;
  applications: RfqApplication[];
}

/**
 * ステータスバッジのスタイルを返す
 */
export function getRfqStatusBadgeStyle(status: RfqStatus): {
  background: string;
  color: string;
} {
  switch (status) {
    case '見積待ち':
      return { background: '#f39c12', color: 'white' };
    case '見積受領':
      return { background: '#27ae60', color: 'white' };
    default:
      return { background: '#95a5a6', color: 'white' };
  }
}

/**
 * 見積処理関連の型定義
 */

// OCR抽出結果
export interface OcrResult {
  id: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string;
}

// 資産マスタ候補
export interface AssetMasterCandidate {
  itemId: string;
  itemName: string;
  itemCode?: string;
  largeName: string;
  mediumName: string;
  similarity: number;
}

// マッチング結果
export interface MatchingResult {
  id: number;
  ocrItemName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  candidates: AssetMasterCandidate[];
  selectedCandidate: AssetMasterCandidate | null;
  linkedApplication: any | null;
  isConfirmed: boolean;
}
