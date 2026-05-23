/**
 * スタイルヘルパー関数
 * 頻出するスタイルパターンを関数化して再利用性を向上
 */

import { colors, spacing, fontSize, fontWeight, borderRadius, shadows, transitions } from './constants';

/**
 * ボタンスタイルのバリエーション
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  isMobile?: boolean;
}

/**
 * ボタンスタイルを生成
 * 使用例:
 * <button style={buttonStyle({ variant: 'primary', size: 'md', isMobile })}>
 */
export const buttonStyle = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  isMobile = false,
}: ButtonStyleOptions = {}): React.CSSProperties => {
  // バリアント別の色設定
  const variantColors = {
    primary: {
      background: colors.primary,
      color: colors.text.white,
      hoverBackground: colors.primaryHover,
    },
    secondary: {
      background: colors.background.secondary,
      color: colors.text.white,
      hoverBackground: colors.background.hover,
    },
    danger: {
      background: colors.status.error,
      color: colors.text.white,
      hoverBackground: '#c0392b',
    },
    ghost: {
      background: 'transparent',
      color: colors.text.primary,
      hoverBackground: colors.background.gray,
    },
  };

  // サイズ別の設定
  const sizeConfig = {
    sm: {
      padding: isMobile ? '6px 12px' : '8px 16px',
      fontSize: isMobile ? fontSize.sm : fontSize.md,
    },
    md: {
      padding: isMobile ? '8px 16px' : '10px 20px',
      fontSize: isMobile ? fontSize.md : fontSize.lg,
    },
    lg: {
      padding: isMobile ? '10px 20px' : '12px 24px',
      fontSize: isMobile ? fontSize.lg : fontSize.xl,
    },
  };

  const { background, color } = variantColors[variant];
  const { padding, fontSize: btnFontSize } = sizeConfig[size];

  return {
    background,
    color,
    padding,
    fontSize: btnFontSize,
    border: '0',
    borderRadius: borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: transitions.base,
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
  };
};

/**
 * アイコンボタンスタイルを生成
 */
export const iconButtonStyle = ({
  size = 'md',
  variant = 'secondary',
  isMobile = false,
}: Pick<ButtonStyleOptions, 'size' | 'variant' | 'isMobile'> = {}): React.CSSProperties => {
  const sizeConfig = {
    sm: { width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', fontSize: isMobile ? '16px' : '20px' },
    md: { width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', fontSize: isMobile ? '20px' : '24px' },
    lg: { width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', fontSize: isMobile ? '24px' : '28px' },
  };

  const variantColors = {
    primary: colors.primary,
    secondary: colors.background.secondary,
    danger: colors.status.error,
    ghost: 'transparent',
  };

  const { width, height, fontSize: iconFontSize } = sizeConfig[size];

  return {
    width,
    height,
    fontSize: iconFontSize,
    background: variantColors[variant],
    color: colors.text.white,
    border: '0',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: transitions.base,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
};

/**
 * カードスタイルを生成
 */
export const cardStyle = ({
  padding = 'lg',
  shadow = 'base',
  background = 'white',
}: {
  padding?: keyof typeof spacing;
  shadow?: keyof typeof shadows;
  background?: 'white' | 'light' | 'gray';
} = {}): React.CSSProperties => {
  const backgroundColors = {
    white: colors.background.white,
    light: colors.background.light,
    gray: colors.background.gray,
  };

  return {
    background: backgroundColors[background],
    padding: spacing[padding],
    borderRadius: borderRadius.md,
    boxShadow: shadows[shadow],
    border: `1px solid ${colors.border.light}`,
  };
};

/**
 * テーブルセルスタイルを生成
 */
export const tableCellStyle = ({
  isHeader = false,
  align = 'left',
  padding = 'md',
  truncate = true,
}: {
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  padding?: keyof typeof spacing;
  truncate?: boolean;
} = {}): React.CSSProperties => {
  return {
    padding: `${spacing[padding]} ${spacing.sm}`,
    textAlign: align,
    color: isHeader ? colors.text.primary : colors.text.primary,
    fontWeight: isHeader ? fontWeight.bold : fontWeight.normal,
    fontSize: fontSize.base,
    whiteSpace: truncate ? 'nowrap' : 'normal',
    overflow: truncate ? 'hidden' : 'visible',
    textOverflow: truncate ? 'ellipsis' : 'clip',
  };
};

/**
 * テーブルスタイルを生成
 */
export const tableStyle = ({
  fixedLayout = false,
  fullWidth = true,
}: {
  fixedLayout?: boolean;
  fullWidth?: boolean;
} = {}): React.CSSProperties => {
  return {
    width: fullWidth ? '100%' : 'auto',
    borderCollapse: 'collapse',
    fontSize: fontSize.base,
    tableLayout: fixedLayout ? 'fixed' : 'auto',
  };
};

/**
 * 入力フィールドスタイルを生成
 */
export const inputStyle = ({
  hasError = false,
  disabled = false,
  fullWidth = true,
}: {
  hasError?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
} = {}): React.CSSProperties => {
  return {
    width: fullWidth ? '100%' : 'auto',
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.md,
    border: `1px solid ${hasError ? colors.status.error : colors.border.light}`,
    borderRadius: borderRadius.sm,
    background: disabled ? colors.background.gray : colors.background.white,
    color: colors.text.primary,
    cursor: disabled ? 'not-allowed' : 'text',
    transition: transitions.base,
    outline: 'none',
  };
};

/**
 * セレクトボックススタイルを生成
 */
export const selectStyle = ({
  hasError = false,
  disabled = false,
  fullWidth = true,
}: {
  hasError?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
} = {}): React.CSSProperties => {
  return {
    ...inputStyle({ hasError, disabled, fullWidth }),
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
};

/**
 * モーダルオーバーレイスタイル
 */
export const modalOverlayStyle = (): React.CSSProperties => {
  return {
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
    padding: spacing.lg,
  };
};

/**
 * モーダルコンテンツスタイル
 */
export const modalContentStyle = ({
  maxWidth = '600px',
  isMobile = false,
}: {
  maxWidth?: string;
  isMobile?: boolean;
} = {}): React.CSSProperties => {
  return {
    background: colors.background.white,
    borderRadius: borderRadius.md,
    boxShadow: shadows.xl,
    maxWidth: isMobile ? '100%' : maxWidth,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
  };
};

/**
 * ラベルスタイルを生成
 */
export const labelStyle = ({
  required = false,
  disabled = false,
}: {
  required?: boolean;
  disabled?: boolean;
} = {}): React.CSSProperties => {
  return {
    display: 'block',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: disabled ? colors.text.muted : colors.text.primary,
    marginBottom: spacing.xs,
  };
};

/**
 * バッジスタイルを生成
 */
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export const badgeStyle = ({
  variant = 'default',
  size = 'sm',
}: {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
} = {}): React.CSSProperties => {
  const variantColors = {
    success: { background: colors.status.success, color: colors.text.white },
    warning: { background: colors.status.warning, color: colors.text.white },
    error: { background: colors.status.error, color: colors.text.white },
    info: { background: colors.status.info, color: colors.text.white },
    default: { background: colors.background.secondary, color: colors.text.white },
  };

  const sizeConfig = {
    sm: { padding: `2px ${spacing.sm}`, fontSize: fontSize.xs },
    md: { padding: `4px ${spacing.md}`, fontSize: fontSize.sm },
  };

  const { background, color } = variantColors[variant];
  const { padding, fontSize: badgeFontSize } = sizeConfig[size];

  return {
    display: 'inline-block',
    padding,
    fontSize: badgeFontSize,
    fontWeight: fontWeight.medium,
    background,
    color,
    borderRadius: borderRadius.sm,
    whiteSpace: 'nowrap',
  };
};

/**
 * 区切り線スタイル
 */
export const dividerStyle = ({
  spacing: dividerSpacing = 'md',
  color = 'light',
}: {
  spacing?: keyof typeof spacing;
  color?: 'light' | 'medium' | 'dark';
} = {}): React.CSSProperties => {
  const colorMap = {
    light: colors.border.light,
    medium: colors.border.medium,
    dark: colors.border.dark,
  };

  return {
    border: 'none',
    borderTop: `1px solid ${colorMap[color]}`,
    margin: `${spacing[dividerSpacing]} 0`,
  };
};

/**
 * フレックスレイアウトヘルパー
 */
export const flexStyle = ({
  direction = 'row',
  align = 'center',
  justify = 'flex-start',
  gap = 'md',
  wrap = false,
}: {
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  gap?: keyof typeof spacing;
  wrap?: boolean;
} = {}): React.CSSProperties => {
  return {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap: spacing[gap],
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };
};
