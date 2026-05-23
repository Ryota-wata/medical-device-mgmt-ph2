/**
 * ホバーエフェクト用カスタムフック
 * 98箇所で重複しているホバーロジックを共通化
 */

import { useState, useCallback } from 'react';

/**
 * ホバー状態を管理するフック
 *
 * 使用例:
 * ```tsx
 * const { isHovered, hoverProps } = useHover();
 *
 * <button
 *   {...hoverProps}
 *   style={{
 *     background: isHovered ? '#229954' : '#27ae60'
 *   }}
 * >
 *   ボタン
 * </button>
 * ```
 */
export const useHover = () => {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps = {
    onMouseEnter: useCallback(() => setIsHovered(true), []),
    onMouseLeave: useCallback(() => setIsHovered(false), []),
  };

  return { isHovered, hoverProps };
};

/**
 * 背景色のホバーエフェクト用フック
 *
 * 使用例:
 * ```tsx
 * const { style, hoverProps } = useHoverBackground({
 *   normal: '#27ae60',
 *   hover: '#229954'
 * });
 *
 * <button {...hoverProps} style={style}>ボタン</button>
 * ```
 */
export const useHoverBackground = ({
  normal,
  hover,
}: {
  normal: string;
  hover: string;
}) => {
  const { isHovered, hoverProps } = useHover();

  const style = {
    background: isHovered ? hover : normal,
    transition: '0.2s ease',
  };

  return { style, hoverProps, isHovered };
};

/**
 * 複数スタイルのホバーエフェクト用フック
 *
 * 使用例:
 * ```tsx
 * const { style, hoverProps } = useHoverStyle({
 *   normal: { background: '#27ae60', transform: 'scale(1)' },
 *   hover: { background: '#229954', transform: 'scale(1.05)' }
 * });
 *
 * <button {...hoverProps} style={style}>ボタン</button>
 * ```
 */
export const useHoverStyle = ({
  normal,
  hover,
}: {
  normal: React.CSSProperties;
  hover: React.CSSProperties;
}) => {
  const { isHovered, hoverProps } = useHover();

  const style = {
    ...normal,
    ...(isHovered ? hover : {}),
    transition: '0.2s ease',
  };

  return { style, hoverProps, isHovered };
};

/**
 * イベントハンドラベースのホバーエフェクト用フック
 * onMouseEnter/onMouseLeaveで直接スタイルを変更する既存パターン向け
 *
 * 使用例:
 * ```tsx
 * const hoverHandlers = useHoverHandlers({
 *   onEnter: (e) => { e.currentTarget.style.background = '#229954'; },
 *   onLeave: (e) => { e.currentTarget.style.background = '#27ae60'; }
 * });
 *
 * <button {...hoverHandlers}>ボタン</button>
 * ```
 */
export const useHoverHandlers = ({
  onEnter,
  onLeave,
}: {
  onEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onLeave?: (e: React.MouseEvent<HTMLElement>) => void;
}) => {
  return {
    onMouseEnter: useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        onEnter?.(e);
      },
      [onEnter]
    ),
    onMouseLeave: useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        onLeave?.(e);
      },
      [onLeave]
    ),
  };
};

/**
 * ボタン用のホバーエフェクトプリセット
 *
 * 使用例:
 * ```tsx
 * const buttonHover = useButtonHover('primary'); // 'primary' | 'secondary' | 'danger'
 * <button {...buttonHover.hoverProps} style={buttonHover.style}>ボタン</button>
 * ```
 */
export const useButtonHover = (
  variant: 'primary' | 'secondary' | 'danger' = 'primary'
) => {
  const presets = {
    primary: {
      normal: '#27ae60',
      hover: '#229954',
    },
    secondary: {
      normal: '#34495e',
      hover: '#2c3e50',
    },
    danger: {
      normal: '#e74c3c',
      hover: '#c0392b',
    },
  };

  return useHoverBackground(presets[variant]);
};

/**
 * カード用のホバーエフェクトプリセット
 *
 * 使用例:
 * ```tsx
 * const cardHover = useCardHover();
 * <div {...cardHover.hoverProps} style={cardHover.style}>カード内容</div>
 * ```
 */
export const useCardHover = () => {
  return useHoverStyle({
    normal: {
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(0)',
    },
    hover: {
      background: '#fff',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
  });
};

/**
 * テーブル行用のホバーエフェクトプリセット
 *
 * 使用例:
 * ```tsx
 * const rowHover = useTableRowHover();
 * <tr {...rowHover.hoverProps} style={rowHover.style}>...</tr>
 * ```
 */
export const useTableRowHover = () => {
  return useHoverBackground({
    normal: '#fff',
    hover: '#f8f8f8',
  });
};

/**
 * リンク用のホバーエフェクトプリセット
 *
 * 使用例:
 * ```tsx
 * const linkHover = useLinkHover();
 * <a {...linkHover.hoverProps} style={linkHover.style}>リンク</a>
 * ```
 */
export const useLinkHover = () => {
  return useHoverStyle({
    normal: {
      color: '#3498db',
      textDecoration: 'none',
    },
    hover: {
      color: '#2980b9',
      textDecoration: 'underline',
    },
  });
};
