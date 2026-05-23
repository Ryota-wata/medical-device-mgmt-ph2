/**
 * 見積書管理関連の定数定義
 */

// ウィンドウサイズ
export const WINDOW_SIZES = {
  ASSET_MASTER: {
    width: 1400,
    height: 900,
  },
} as const;

// タイムアウト
export const TIMEOUTS = {
  OCR_SIMULATION: 1000, // OCRシミュレーションの待機時間（ミリ秒）
} as const;

// メッセージ
export const MESSAGES = {
  QUOTATION_REGISTERED: (quotationNo: string, itemCount: number) =>
    `見積書を登録しました\n見積番号: ${quotationNo}\n明細数: ${itemCount}件`,
  CONFIRM_DELETE: '見積書を削除しますか？',
  CONFIRM_DELETE_ITEM: 'この見積明細を削除しますか？',
} as const;

// フェーズスタイル
export const PHASE_STYLES = {
  定価見積: {
    background: '#e8f5e9',
    color: '#2e7d32',
  },
  概算見積: {
    background: '#fff3e0',
    color: '#e65100',
  },
  確定見積: {
    background: '#e3f2fd',
    color: '#1565c0',
  },
} as const;

// ステータススタイル
export const STATUS_STYLES = {
  未送信: {
    background: '#95a5a6',
    color: 'white',
  },
  送信済み: {
    background: '#3498db',
    color: 'white',
  },
  回答受領: {
    background: '#27ae60',
    color: 'white',
  },
} as const;
