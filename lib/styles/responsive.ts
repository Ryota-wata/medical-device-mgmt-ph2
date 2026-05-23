import { CSSProperties } from 'react';

export type ResponsiveStyleProps = {
  isMobile: boolean;
  isTablet: boolean;
};

export const getResponsivePadding = ({ isMobile, isTablet }: ResponsiveStyleProps): string => {
  if (isMobile) return '12px';
  if (isTablet) return '16px';
  return '20px';
};

export const getResponsiveMargin = ({ isMobile, isTablet }: ResponsiveStyleProps): string => {
  if (isMobile) return '12px';
  if (isTablet) return '16px';
  return '20px';
};

export const getResponsiveFontSize = (
  size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl',
  { isMobile, isTablet }: ResponsiveStyleProps
): string => {
  const sizes = {
    mobile: { xs: '11px', sm: '12px', base: '14px', lg: '16px', xl: '18px', '2xl': '20px' },
    tablet: { xs: '12px', sm: '13px', base: '15px', lg: '17px', xl: '20px', '2xl': '22px' },
    desktop: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '22px', '2xl': '24px' },
  };

  if (isMobile) return sizes.mobile[size];
  if (isTablet) return sizes.tablet[size];
  return sizes.desktop[size];
};

export const getResponsiveGridColumns = (
  columns: number,
  { isMobile, isTablet }: ResponsiveStyleProps
): string => {
  if (isMobile) return '1fr';
  if (isTablet) return `repeat(${Math.min(2, columns)}, 1fr)`;
  return `repeat(${columns}, 1fr)`;
};

export const getResponsiveGap = ({ isMobile, isTablet }: ResponsiveStyleProps): string => {
  if (isMobile) return '8px';
  if (isTablet) return '12px';
  return '16px';
};

// 共通のレスポンシブスタイル
export const responsiveContainerStyle = ({ isMobile, isTablet }: ResponsiveStyleProps): CSSProperties => ({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: isMobile ? '20px 12px' : isTablet ? '30px 16px' : '40px 20px',
});

export const responsiveCardStyle = ({ isMobile, isTablet }: ResponsiveStyleProps): CSSProperties => ({
  background: 'white',
  borderRadius: '8px',
  padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
});

export const responsiveHeaderStyle = ({ isMobile, isTablet }: ResponsiveStyleProps): CSSProperties => ({
  padding: isMobile ? '12px 16px' : '16px 24px',
  fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
});
