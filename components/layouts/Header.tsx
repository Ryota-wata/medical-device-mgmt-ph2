'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';

interface HeaderProps {
  title?: string;
  stepBadge?: string;
  subInfo?: string;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  backButtonVariant?: 'primary' | 'secondary';
  hideHomeButton?: boolean;
  resultCount?: number;
  showOriginalLabel?: boolean;
  onExport?: () => void;
  onPrint?: () => void;
  onViewToggle?: () => void;
  onColumnSettings?: () => void;
  hideMenu?: boolean;
  showApplicationListLink?: boolean;
  facility?: string;
  department?: string;
  targetFacilities?: string[];
  createdAt?: string;
  children?: React.ReactNode;
  centerContent?: React.ReactNode;
}

// ─── アイコン（lucide-style 線画 SVG。絵文字は廃止） ─────────────────
const Icon = {
  Settings: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Layout: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  Download: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Printer: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  ChevronLeft: (p: { size?: number }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  Menu: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  LogOut: (p: { size?: number }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  FileText: (p: { size?: number }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  ),
  Box: (p: { size?: number }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
};

// 共通スタイル
const ICON_BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  background: '#FFFFFF',
  border: '1px solid #E1E1E1',
  borderRadius: 6,
  color: '#4A4A4A',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};

export const Header: React.FC<HeaderProps> = ({
  title = '資産リスト',
  stepBadge,
  subInfo,
  showBackButton = true,
  backHref,
  backLabel,
  backButtonVariant = 'primary',
  hideHomeButton = false,
  resultCount,
  showOriginalLabel = true,
  onExport,
  onPrint,
  onViewToggle,
  onColumnSettings,
  hideMenu = false,
  facility = '',
  department = '',
  targetFacilities,
  createdAt,
  children,
  centerContent
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { isMobile } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    if (backHref) router.push(backHref);
    else router.back();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      className="flex justify-between items-center"
      style={{
        background: '#EDEDED',
        color: '#4A4A4A',
        padding: isMobile ? '6px 12px' : '8px 16px',
        borderBottom: '1px solid #E1E1E1',
        flexWrap: 'wrap',
        gap: isMobile ? '8px' : '12px',
        minHeight: isMobile ? 48 : 52,
      }}
    >
      {/* 左: ロゴ + タイトル + 件数 + バッジ */}
      <div className="flex items-center" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div
          aria-label="SHIP"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
            background: '#008C1D',
            borderRadius: 6,
            color: '#FFFFFF',
            fontSize: isMobile ? 10 : 12,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          SHIP
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h1 style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: '#4A4A4A', margin: 0, lineHeight: 1.2 }}>
            {title}
          </h1>
          {resultCount !== undefined && (
            <span style={{ fontSize: isMobile ? 12 : 13, color: '#8A8A8A' }} className="tabular-nums">
              {resultCount.toLocaleString()}件{showOriginalLabel && '（原本）'}
            </span>
          )}
        </div>
        {stepBadge && (
          <span style={{ background: '#DA0000', color: '#FFFFFF', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, letterSpacing: 0.2 }}>
            {stepBadge}
          </span>
        )}
        {subInfo && (
          <span style={{ background: '#FAFAFA', color: '#4A4A4A', padding: '3px 10px', borderRadius: 4, fontSize: 11, border: '1px solid #4A4A4A' }}>
            {subInfo}
          </span>
        )}
        {targetFacilities && targetFacilities.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#8A8A8A' }}>対象施設:</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {targetFacilities.map((f, idx) => (
                <span key={idx} style={{ padding: '2px 8px', background: '#EBF5EE', border: '1px solid #008C1D', borderRadius: 999, fontSize: 11, color: '#146E2E' }}>
                  {f}
                </span>
              ))}
            </div>
            {createdAt && (
              <span style={{ fontSize: 11, color: '#8A8A8A' }}>作成日: {new Date(createdAt).toLocaleDateString('ja-JP')}</span>
            )}
          </div>
        )}
      </div>

      {/* 中央: カスタム */}
      {centerContent && (
        <div className="flex items-center justify-center" style={{ flex: 1 }}>
          {centerContent}
        </div>
      )}

      {/* 右: アクション */}
      <div className="flex items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
        {children}

        {/* ナビメニュー（hideMenu=false 時のみ） */}
        {!hideMenu && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                ...ICON_BTN,
                width: 'auto',
                padding: '0 12px',
                gap: 6,
                fontSize: 13,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
              aria-expanded={isMenuOpen}
              aria-label="メニュー"
            >
              <Icon.Menu size={16} />
              {!isMobile && <span>メニュー</span>}
            </button>
            {isMenuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', background: '#FFFFFF', border: '1px solid #E1E1E1', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 180, zIndex: 50, overflow: 'hidden' }}>
                <button
                  onClick={() => { router.push('/main'); setIsMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4A4A4A', fontSize: 13, textAlign: 'left' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon.FileText size={16} /><span>申請一覧</span>
                </button>
                <button
                  onClick={() => { router.push('/quotation-data-box'); setIsMenuOpen(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4A4A4A', fontSize: 13, textAlign: 'left', borderTop: '1px solid #E1E1E1' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon.Box size={16} /><span>見積書管理</span>
                </button>
                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#DA0000', fontSize: 13, textAlign: 'left', borderTop: '1px solid #E1E1E1' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FDF1E5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon.LogOut size={16} /><span>ログアウト</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* アイコンボタン群 */}
        {onColumnSettings && (
          <button onClick={onColumnSettings} style={ICON_BTN} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')} onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')} aria-label="表示カラム設定" title="表示カラム設定">
            <Icon.Settings />
          </button>
        )}
        {onViewToggle && (
          <button onClick={onViewToggle} style={ICON_BTN} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')} onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')} aria-label="表示切替" title="表示切替（リスト/カード）">
            <Icon.Layout />
          </button>
        )}
        {onExport && (
          <button onClick={onExport} style={ICON_BTN} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')} onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')} aria-label="Excel/PDF出力" title="Excel/PDF出力">
            <Icon.Download />
          </button>
        )}
        {onPrint && (
          <button onClick={onPrint} style={ICON_BTN} onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')} onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')} aria-label="印刷" title="印刷">
            <Icon.Printer />
          </button>
        )}

        {/* メイン画面に戻る（テキストリンク + 矢印アイコン） */}
        {showBackButton && backHref && backHref !== '/main' && !hideHomeButton && (
          <button
            onClick={() => router.push('/main')}
            style={{ ...ICON_BTN, width: 'auto', padding: '0 12px', gap: 4, fontSize: 13 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
          >
            <Icon.ChevronLeft size={14} /><span>メイン</span>
          </button>
        )}

        {/* 戻るボタン */}
        {showBackButton && (
          backButtonVariant === 'secondary' ? (
            <button
              onClick={handleBack}
              style={{ ...ICON_BTN, width: 'auto', padding: '0 12px', gap: 4, fontSize: 13 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F1F1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              <Icon.ChevronLeft size={14} /><span>{backLabel || '戻る'}</span>
            </button>
          ) : (
            <button
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                height: 34,
                padding: '0 14px',
                background: '#008C1D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#146E2E')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#008C1D')}
            >
              <Icon.ChevronLeft size={14} /><span>{backLabel || '戻る'}</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
