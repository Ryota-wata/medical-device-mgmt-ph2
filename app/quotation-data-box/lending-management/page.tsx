'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { LendingManagementTab } from '../components/LendingManagementTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function LendingManagementContent() {
  return (
    <div className="h-dvh flex flex-col bg-surface-screen">
      <Header
        title="タスク管理"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="flex-1 flex flex-col p-4 overflow-hidden" style={{ minHeight: 0 }}>
          <SubTabNavigation activeTab="lendingManagement" />

          <div className="flex-1 bg-surface-card overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
            <LendingManagementTab />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LendingManagementPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-content-sub">読み込み中...</div>}>
      <LendingManagementContent />
    </Suspense>
  );
}
