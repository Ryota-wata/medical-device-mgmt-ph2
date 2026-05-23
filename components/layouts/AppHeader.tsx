'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';
import { useResponsive } from '@/lib/hooks/useResponsive';

export interface AppHeaderNavItem {
  key: string;
  label: string;
  icon: 'qr' | 'list' | 'clipboard' | 'user';
  onClick: () => void;
  visible: boolean;
}

export interface AppHeaderProps {
  /** 横並びナビ項目（権限フィルタは呼出側） */
  navItems?: AppHeaderNavItem[];
}

const NavIcon: React.FC<{ type: AppHeaderNavItem['icon'] }> = ({ type }) => {
  const cls = 'size-4 text-content-sub';
  switch (type) {
    case 'qr':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
          <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h1a1 1 0 110 2h-2a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM13 11a1 1 0 100 2h3a1 1 0 100-2h-3zM15 13a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
        </svg>
      );
    case 'list':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      );
    case 'clipboard':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
      );
    case 'user':
      return (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

export const AppHeader: React.FC<AppHeaderProps> = ({ navItems = [] }) => {
  const router = useRouter();
  const { user, logout, selectedFacility } = useAuthStore();
  const { isMobile } = useResponsive();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ユーザーメニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const visibleNavItems = navItems.filter((i) => i.visible);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItemClass =
    'flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-content-primary hover:bg-surface-disabled rounded-md transition-colors cursor-pointer border-0 bg-transparent';

  const userMenuItemClass =
    'flex items-center gap-2 px-4 py-2.5 text-sm text-content-primary hover:bg-surface-disabled cursor-pointer border-0 bg-transparent w-full text-left transition-colors';

  return (
    <header className="bg-surface-header px-5 py-3" style={{ color: '#4A4A4A' }}>
      <div className="flex justify-between items-center gap-3 flex-wrap">
        {/* 左: ロゴ + システム名 */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="size-10 bg-[#4A4A4A] rounded-lg flex items-center justify-center text-white font-bold text-[10px]">
            logo
          </div>
          {!isMobile && (
            <div className="text-base font-bold text-content-primary text-balance">
              HEALTHCARE 医療機器管理システム
            </div>
          )}
        </div>

        {/* 右: 横並びナビ + ユーザーメニュー */}
        <div className="flex items-center gap-1">
          {/* PC/タブレット: 横並びナビ */}
          {!isMobile &&
            visibleNavItems.map((item) => (
              <button key={item.key} onClick={item.onClick} className={navItemClass}>
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}

          {/* ユーザーメニュー（▼ドロップダウン）: 全画面で同じ位置・同じ操作 */}
          {!isMobile && (
            <div className="relative ml-2 pl-2 border-l border-stroke-card" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-content-primary hover:bg-surface-disabled transition-colors cursor-pointer border-0 bg-transparent"
                aria-label="ユーザーメニュー"
                aria-expanded={isUserMenuOpen}
              >
                <svg className="size-5 text-content-sub" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {user?.username || 'ユーザー'}
                </span>
                <svg
                  className={`size-3 text-content-sub transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-surface-card rounded-lg overflow-hidden z-50 border border-stroke-card"
                  style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                >
                  {/* ユーザー情報 */}
                  {user && (
                    <div className="px-4 py-3 border-b border-stroke-card bg-surface-screen">
                      <div className="text-sm font-semibold text-content-primary truncate">
                        {user.username}
                      </div>
                      {user.email && (
                        <div className="text-xs text-content-sub mt-0.5 truncate">{user.email}</div>
                      )}
                    </div>
                  )}

                  {/* 施設切替 */}
                  {selectedFacility && user?.accessibleFacilities && (
                    <>
                      <div className="px-4 py-2 text-xs text-content-sub bg-surface-screen">
                        現在の施設
                      </div>
                      <button
                        onClick={() => {
                          router.push('/facility-select');
                          setIsUserMenuOpen(false);
                        }}
                        className={userMenuItemClass}
                      >
                        <span className="px-2 py-0.5 bg-surface-select text-cta-primary-dark border border-cta-primary rounded-full text-xs font-medium">
                          {selectedFacility}
                        </span>
                        <span className="text-xs text-content-sub ml-auto">切替</span>
                      </button>
                      <div className="border-t border-stroke-card" />
                    </>
                  )}

                  {/* メイン画面へ */}
                  <button
                    onClick={() => {
                      router.push('/main');
                      setIsUserMenuOpen(false);
                    }}
                    className={userMenuItemClass}
                  >
                    <svg className="size-4 text-content-sub" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span>メイン画面</span>
                  </button>

                  <div className="border-t border-stroke-card" />

                  {/* ログアウト */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer border-0 bg-transparent w-full text-left transition-colors"
                  >
                    <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H7a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 11-2 0V7.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>ログアウト</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* モバイル: ハンバーガー（ナビ + ユーザーメニュー統合） */}
          {isMobile && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="size-10 flex items-center justify-center rounded-md text-content-primary hover:bg-surface-disabled transition-colors cursor-pointer border-0 bg-transparent"
              aria-label={isMobileMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="size-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="size-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* モバイル展開メニュー */}
      {isMobile && isMobileMenuOpen && (
        <div className="mt-3 pt-3 border-t border-stroke-card flex flex-col gap-1">
          {selectedFacility && user?.accessibleFacilities && (
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="px-3 py-1 bg-surface-select text-cta-primary-dark border border-cta-primary rounded-full text-xs font-medium">
                {selectedFacility}
              </span>
              <button
                onClick={() => {
                  router.push('/facility-select');
                  setIsMobileMenuOpen(false);
                }}
                className="text-xs text-content-sub hover:text-content-primary border-0 bg-transparent cursor-pointer"
              >
                施設切替
              </button>
            </div>
          )}

          {visibleNavItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                item.onClick();
                setIsMobileMenuOpen(false);
              }}
              className={`${navItemClass} w-full text-left`}
            >
              <NavIcon type={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}

          <div className="border-t border-stroke-card mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer border-0 bg-transparent w-full"
            >
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4.414l-4.293 4.293a1 1 0 01-1.414-1.414L11.586 7H7a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 11-2 0V7.414z" clipRule="evenodd" />
              </svg>
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
