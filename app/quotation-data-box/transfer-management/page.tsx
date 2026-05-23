'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { TransferDisposalManagementTab } from '../components/TransferDisposalManagementTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function TransferManagementContent() {
  return (
    <div className="h-dvh flex flex-col bg-surface-screen">
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div className="flex flex-1 overflow-hidden">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', overflowY: 'auto', gap: '16px' }}>
          <SubTabNavigation activeTab="transferDisposalManagement" />

          <TransferDisposalManagementTab />
        </div>
      </div>
    </div>
  );
}

export default function TransferManagementPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-content-sub">読み込み中...</div>}>
      <TransferManagementContent />
    </Suspense>
  );
}
