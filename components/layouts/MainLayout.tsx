'use client';

import React from 'react';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  resultCount?: number;
  onExport?: () => void;
  onPrint?: () => void;
  onViewToggle?: () => void;
  showHeader?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  showBackButton,
  resultCount,
  onExport,
  onPrint,
  onViewToggle,
  showHeader = true
}) => {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA', padding: '20px' }}>
      <div
        className="mx-auto bg-white rounded-lg"
        style={{
          maxWidth: '1400px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        {showHeader && (
          <Header
            title={title}
            showBackButton={showBackButton}
            resultCount={resultCount}
            onExport={onExport}
            onPrint={onPrint}
            onViewToggle={onViewToggle}
          />
        )}
        <main style={{ padding: '20px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
