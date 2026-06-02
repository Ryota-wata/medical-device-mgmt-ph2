import { create } from 'zustand';
import type { LedgerApplication } from '../types/ledgerApplication';

/**
 * 電帳法対応 申請データ ストア（Ph2 新規 / 区分1-1）
 *
 * モックデータは Ph1 で蓄積された購入・廃棄申請を電帳法準拠の形に集約した想定。
 * 訂正・削除履歴を含む形で電帳法準拠の検索・出力をサポートする。
 */

const MOCK_ENTRIES: LedgerApplication[] = [
  {
    id: 'LA-2026-0001',
    type: '購入',
    transactionDate: '2026-03-12',
    vendor: '〇〇医療機器株式会社',
    amount: 4_280_000,
    status: '承認済',
    applicant: '高橋 健二',
    applicationDate: '2026-03-15',
    lateEntry: false,
    assetName: '生体情報モニタ BSM-3500',
    facility: '東京中央病院',
    relatedDocuments: [
      { type: '発注書', documentNumber: 'PO-2026-00132' },
      { type: '検収書', documentNumber: 'RC-2026-00099' },
    ],
    history: [
      { at: '2026-03-15T09:12:00+09:00', by: '高橋 健二', action: '作成', detail: '購入申請を作成' },
      { at: '2026-03-18T14:05:00+09:00', by: '佐藤 美智子', action: '承認', detail: 'システム管理者承認' },
    ],
  },
  {
    id: 'LA-2026-0002',
    type: '購入',
    transactionDate: '2026-03-22',
    vendor: '株式会社メディコサプライ',
    amount: 1_950_000,
    status: '承認済',
    applicant: '高橋 健二',
    applicationDate: '2026-03-23',
    lateEntry: false,
    assetName: '輸液ポンプ TE-SS720',
    facility: '東京中央病院',
    relatedDocuments: [
      { type: '発注書', documentNumber: 'PO-2026-00148' },
    ],
    history: [
      { at: '2026-03-23T10:30:00+09:00', by: '高橋 健二', action: '作成', detail: '購入申請を作成' },
      { at: '2026-03-24T11:00:00+09:00', by: '高橋 健二', action: '訂正', detail: '金額を 1,890,000 円 → 1,950,000 円 に訂正（請求書再発行）' },
      { at: '2026-03-25T09:15:00+09:00', by: '佐藤 美智子', action: '承認', detail: '訂正後内容で承認' },
    ],
  },
  {
    id: 'LA-2026-0003',
    type: '廃棄',
    transactionDate: '2026-02-28',
    vendor: '産業廃棄物処理 ◇◇興業',
    amount: 84_000,
    status: '承認済',
    applicant: '高橋 健二',
    applicationDate: '2026-03-02',
    lateEntry: false,
    assetName: '人工呼吸器 SV-300（旧型）',
    facility: '東京中央病院',
    relatedDocuments: [
      { type: 'マニフェスト', documentNumber: 'MF-2026-00078' },
      { type: '廃棄証明', documentNumber: 'CR-2026-00078' },
    ],
    history: [
      { at: '2026-03-02T08:45:00+09:00', by: '高橋 健二', action: '作成', detail: '廃棄申請を作成' },
      { at: '2026-03-04T10:20:00+09:00', by: '佐藤 美智子', action: '承認', detail: 'マニフェスト確認後承認' },
    ],
  },
  {
    id: 'LA-2026-0004',
    type: '購入',
    transactionDate: '2026-04-05',
    vendor: '株式会社ライフライン医療',
    amount: 12_600_000,
    status: '申請中',
    applicant: '田中 花子',
    applicationDate: '2026-04-08',
    lateEntry: false,
    assetName: '超音波診断装置 LISENDO 880',
    facility: '東京中央病院',
    relatedDocuments: [
      { type: '見積書', documentNumber: 'EST-2026-00231' },
    ],
    history: [
      { at: '2026-04-08T13:22:00+09:00', by: '田中 花子', action: '作成', detail: '購入申請を作成' },
    ],
  },
  {
    id: 'LA-2026-0005',
    type: '購入',
    transactionDate: '2026-01-10',
    vendor: '〇〇医療機器株式会社',
    amount: 286_000,
    status: '承認済',
    applicant: '高橋 健二',
    applicationDate: '2026-03-20',
    lateEntry: true,
    assetName: 'パルスオキシメータ NellcorPM10N',
    facility: '横浜総合病院',
    relatedDocuments: [
      { type: '発注書', documentNumber: 'PO-2026-00088' },
    ],
    history: [
      { at: '2026-03-20T15:50:00+09:00', by: '高橋 健二', action: '作成', detail: '業務処理期間経過後の遅延入力（紙伝票の電子化）' },
      { at: '2026-03-21T09:00:00+09:00', by: '佐藤 美智子', action: '承認', detail: '遅延入力の理由を確認の上承認' },
    ],
  },
  {
    id: 'LA-2026-0006',
    type: '廃棄',
    transactionDate: '2026-04-12',
    vendor: '産業廃棄物処理 ◇◇興業',
    amount: 42_000,
    status: '差戻し',
    applicant: '田中 花子',
    applicationDate: '2026-04-13',
    lateEntry: false,
    assetName: '電気メス ESG-400',
    facility: '東京中央病院',
    relatedDocuments: [],
    history: [
      { at: '2026-04-13T11:00:00+09:00', by: '田中 花子', action: '作成', detail: '廃棄申請を作成' },
      { at: '2026-04-14T14:30:00+09:00', by: '佐藤 美智子', action: '差戻し', detail: 'マニフェスト未添付のため差戻し' },
    ],
  },
  {
    id: 'LA-2026-0007',
    type: '購入',
    transactionDate: '2026-04-18',
    vendor: '株式会社メディコサプライ',
    amount: 880_000,
    status: '申請中',
    applicant: '高橋 健二',
    applicationDate: '2026-04-18',
    lateEntry: false,
    assetName: 'シリンジポンプ TE-SS831',
    facility: '東京中央病院',
    relatedDocuments: [
      { type: '見積書', documentNumber: 'EST-2026-00261' },
    ],
    history: [
      { at: '2026-04-18T09:30:00+09:00', by: '高橋 健二', action: '作成', detail: '購入申請を作成' },
    ],
  },
  {
    id: 'LA-2026-0008',
    type: '購入',
    transactionDate: '2026-02-14',
    vendor: '〇〇医療機器株式会社',
    amount: 6_750_000,
    status: '承認済',
    applicant: '伊藤 三郎',
    applicationDate: '2026-02-15',
    lateEntry: false,
    assetName: '手術用顕微鏡 OPMI Lumera',
    facility: '東京中央病院',
    relatedDocuments: [
      { type: '発注書', documentNumber: 'PO-2026-00045' },
      { type: '検収書', documentNumber: 'RC-2026-00031' },
    ],
    history: [
      { at: '2026-02-15T13:00:00+09:00', by: '伊藤 三郎', action: '作成', detail: '購入申請を作成' },
      { at: '2026-02-17T10:00:00+09:00', by: '佐藤 美智子', action: '承認', detail: '承認' },
    ],
  },
  {
    id: 'LA-2026-0009',
    type: '廃棄',
    transactionDate: '2026-03-08',
    vendor: '医療廃棄物処理 △△環境',
    amount: 168_000,
    status: '承認済',
    applicant: '田中 花子',
    applicationDate: '2026-03-09',
    lateEntry: false,
    assetName: '除細動器 LIFEPAK 20（旧型 3台一括）',
    facility: '千葉医療センター',
    relatedDocuments: [
      { type: 'マニフェスト', documentNumber: 'MF-2026-00115' },
      { type: '廃棄証明', documentNumber: 'CR-2026-00115' },
    ],
    history: [
      { at: '2026-03-09T08:40:00+09:00', by: '田中 花子', action: '作成', detail: '廃棄申請を作成（3台一括）' },
      { at: '2026-03-09T16:10:00+09:00', by: '田中 花子', action: '訂正', detail: '対象台数を 2台 → 3台 に訂正' },
      { at: '2026-03-10T09:30:00+09:00', by: '佐藤 美智子', action: '承認', detail: '訂正後内容で承認' },
    ],
  },
  {
    id: 'LA-2026-0010',
    type: '購入',
    transactionDate: '2026-04-22',
    vendor: '株式会社ライフライン医療',
    amount: 2_310_000,
    status: '取下げ',
    applicant: '高橋 健二',
    applicationDate: '2026-04-22',
    lateEntry: false,
    assetName: '心電図モニタ BSM-2401',
    facility: '東京中央病院',
    relatedDocuments: [],
    history: [
      { at: '2026-04-22T10:00:00+09:00', by: '高橋 健二', action: '作成', detail: '購入申請を作成' },
      { at: '2026-04-23T15:00:00+09:00', by: '高橋 健二', action: '削除', detail: '機種変更のため一度取下げ（別申請で再起票予定）' },
    ],
  },
];

interface LedgerApplicationStore {
  entries: LedgerApplication[];
}

export const useLedgerApplicationStore = create<LedgerApplicationStore>(() => ({
  entries: MOCK_ENTRIES,
}));
