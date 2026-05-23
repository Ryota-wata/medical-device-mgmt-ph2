/**
 * 共通スタイル定義
 * アプリケーション全体で再利用される共通スタイルオブジェクト
 */

import { CSSProperties } from 'react';

/**
 * モーダル共通スタイル
 */
export const modalStyles = {
  /** モーダルのオーバーレイ背景 */
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as CSSProperties,

  /** モーダルコンテンツのベーススタイル */
  content: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    maxHeight: '90vh',
    overflow: 'auto',
  } as CSSProperties,

  /** モーダルヘッダー */
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  /** モーダルヘッダータイトル */
  headerTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: 0,
  } as CSSProperties,

  /** モーダルボディ */
  body: {
    padding: '24px',
  } as CSSProperties,

  /** モーダルフッター */
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  } as CSSProperties,

  /** 閉じるボタン */
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#95a5a6',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
} as const;

/**
 * テーブル共通スタイル
 */
export const tableStyles = {
  /** テーブルコンテナ */
  container: {
    width: '100%',
    overflow: 'auto',
  } as CSSProperties,

  /** テーブル本体 */
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  } as CSSProperties,

  /** ヘッダー行 */
  headerRow: {
    background: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
  } as CSSProperties,

  /** ヘッダーセル（左揃え） */
  th: {
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  /** ヘッダーセル（右揃え） */
  thRight: {
    padding: '12px 8px',
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  /** ヘッダーセル（中央揃え） */
  thCenter: {
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  /** ボディ行 */
  row: {
    borderBottom: '1px solid #dee2e6',
  } as CSSProperties,

  /** ボディセル（左揃え） */
  td: {
    padding: '12px 8px',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as CSSProperties,

  /** ボディセル（右揃え） */
  tdRight: {
    padding: '12px 8px',
    textAlign: 'right',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  /** ボディセル（中央揃え） */
  tdCenter: {
    padding: '12px 8px',
    textAlign: 'center',
    color: '#2c3e50',
    whiteSpace: 'nowrap',
  } as CSSProperties,
} as const;

/**
 * バッジスタイル生成関数
 */
export type CommonBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'gray';

const badgeColors: Record<CommonBadgeVariant, { bg: string; color: string }> = {
  success: { bg: '#d4edda', color: '#155724' },
  warning: { bg: '#fff3cd', color: '#856404' },
  error: { bg: '#f8d7da', color: '#721c24' },
  info: { bg: '#cce5ff', color: '#004085' },
  default: { bg: '#e2e8f0', color: '#4a5568' },
  gray: { bg: '#e0e0e0', color: '#666666' },
};

export const getBadgeStyle = (variant: CommonBadgeVariant): CSSProperties => ({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: badgeColors[variant].bg,
  color: badgeColors[variant].color,
});

/**
 * 申請種別バッジスタイル
 */
export const applicationTypeBadgeStyles: Record<string, CSSProperties> = {
  '新規申請': { ...getBadgeStyle('info') },
  '増設申請': { ...getBadgeStyle('success') },
  '更新申請': { ...getBadgeStyle('warning') },
  '移動申請': { backgroundColor: '#e8f4fd', color: '#2980b9', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  '廃棄申請': { ...getBadgeStyle('error') },
  '保留': { ...getBadgeStyle('gray') },
};

export const getApplicationTypeBadgeStyle = (type: string): CSSProperties => {
  return applicationTypeBadgeStyles[type] || getBadgeStyle('default');
};

/**
 * ステータスバッジスタイル
 */
export const statusBadgeStyles: Record<string, CSSProperties> = {
  '承認待ち': { ...getBadgeStyle('warning') },
  '承認済み': { ...getBadgeStyle('success') },
  '却下': { ...getBadgeStyle('error') },
  '処理中': { ...getBadgeStyle('info') },
  '完了': { backgroundColor: '#d4edda', color: '#155724', display: 'inline-block', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
  '稼働中': { ...getBadgeStyle('success') },
  '停止中': { ...getBadgeStyle('error') },
  '準備中': { ...getBadgeStyle('warning') },
};

export const getStatusBadgeStyle = (status: string): CSSProperties => {
  return statusBadgeStyles[status] || getBadgeStyle('default');
};

/**
 * ボタン共通スタイル
 */
export const buttonStyles = {
  /** 基本ボタン */
  base: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  } as CSSProperties,

  /** プライマリボタン（緑） */
  primary: {
    padding: '8px 16px',
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as CSSProperties,

  /** セカンダリボタン（青） */
  secondary: {
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as CSSProperties,

  /** デンジャーボタン（赤） */
  danger: {
    padding: '8px 16px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as CSSProperties,

  /** ワーニングボタン（オレンジ） */
  warning: {
    padding: '8px 16px',
    background: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as CSSProperties,

  /** グレーボタン */
  gray: {
    padding: '8px 16px',
    background: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  } as CSSProperties,

  /** 無効化ボタン */
  disabled: {
    padding: '8px 16px',
    background: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
    fontSize: '14px',
    fontWeight: 'bold',
  } as CSSProperties,
} as const;

/**
 * フォーム共通スタイル
 */
export const formStyles = {
  /** フォームグループ */
  group: {
    marginBottom: '16px',
  } as CSSProperties,

  /** ラベル */
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#2c3e50',
  } as CSSProperties,

  /** テキスト入力 */
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  } as CSSProperties,

  /** セレクトボックス */
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
  } as CSSProperties,

  /** テキストエリア */
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '80px',
  } as CSSProperties,
} as const;

/**
 * カード共通スタイル
 */
export const cardStyles = {
  /** カードコンテナ */
  container: {
    background: 'white',
    border: '1px solid #dee2e6',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  } as CSSProperties,

  /** カードヘッダー */
  header: {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #dee2e6',
  } as CSSProperties,

  /** カードタイトル */
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: 0,
  } as CSSProperties,
} as const;
