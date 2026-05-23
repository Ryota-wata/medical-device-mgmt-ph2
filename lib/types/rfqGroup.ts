/**
 * 見積（発注）グループの型定義
 */

export interface RfqGroup {
  id: number;
  rfqNo: string;
  groupName: string;
  createdDate: string;
  applicationIds: string[];  // 申請ID または EditListItemのID
  status: RfqGroupStatus;
  editListId?: string;       // 作成元の編集リストID
  workflowType?: 'rfq' | 'disposal' | 'transfer';  // rfq=購入系, disposal=廃棄, transfer=移設
  vendorName?: string;
  personInCharge?: string;
  email?: string;
  tel?: string;
  deadline?: string;
  // 各ステップの期限・日付
  rfqDeadline?: string;            // 見積提出期限
  orderDeadline?: string;          // 発注期限
  registrationDeadline?: string;   // 登録期限（SHIP登録依頼時）
  deliveryDeadline?: string;       // 納入期限
  deliveryDate?: string;           // 納入年月日
  inspectionDate?: string;         // 検収年月日
  rejectionDate?: string;          // 却下日
  // 廃棄・移設用
  approvalDate?: string;           // 承認日
  completionDate?: string;         // 完了日（廃棄完了 or 移動完了）
}

export type RfqGroupStatus =
  | '見積依頼'
  | '見積依頼済'
  | '見積DB登録済'
  | '見積登録依頼中'
  | '発注用見積依頼済'
  | '発注見積登録済'
  | '発注済'
  | '納期確定'
  | '検収済'
  | '完了'
  | '申請を見送る'
  // 廃棄ワークフロー
  | '廃棄承認待ち'
  | '廃棄承認済み'
  | '廃棄完了'
  // 移設ワークフロー
  | '移動承認待ち'
  | '移動承認済み'
  | '移動完了';
