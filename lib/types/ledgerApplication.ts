/**
 * 電帳法対応 申請データ（区分1-1: Ph2 新規）
 *
 * 電帳法準拠で必要なフィールド:
 * - 取引年月日 (transactionDate)
 * - 取引先 (vendor)
 * - 金額 (amount)
 * - 訂正・削除履歴 (history)
 * - 業務処理期間経過後の入力事実 (lateEntry)
 * - 帳簿同士の関連性 (relatedDocuments)
 */

export type LedgerApplicationType = '購入' | '廃棄';
export type LedgerApplicationStatus = '申請中' | '承認済' | '差戻し' | '取下げ';

export const LEDGER_APPLICATION_TYPES: LedgerApplicationType[] = ['購入', '廃棄'];
export const LEDGER_APPLICATION_STATUSES: LedgerApplicationStatus[] = [
  '申請中',
  '承認済',
  '差戻し',
  '取下げ',
];

export interface LedgerApplicationHistoryEntry {
  /** ISO datetime */
  at: string;
  by: string;
  action: '作成' | '訂正' | '削除' | '承認' | '差戻し';
  /** 変更内容のサマリ */
  detail: string;
}

export interface LedgerRelatedDocument {
  /** 帳簿種別: 発注書 / 検収書 / 廃棄証明 等 */
  type: string;
  documentNumber: string;
}

export interface LedgerApplication {
  id: string;
  /** 申請種別 */
  type: LedgerApplicationType;
  /** 取引年月日 (YYYY-MM-DD) */
  transactionDate: string;
  /** 取引先 */
  vendor: string;
  /** 金額（税込・円） */
  amount: number;
  /** ステータス */
  status: LedgerApplicationStatus;
  /** 申請者 */
  applicant: string;
  /** 申請日 (YYYY-MM-DD) */
  applicationDate: string;
  /** 業務処理期間経過後の入力か */
  lateEntry: boolean;
  /** 訂正・削除履歴（電帳法準拠） */
  history: LedgerApplicationHistoryEntry[];
  /** 関連帳簿 */
  relatedDocuments: LedgerRelatedDocument[];
  /** 対象資産名（参考表示） */
  assetName: string;
  /** 施設 */
  facility: string;
}
