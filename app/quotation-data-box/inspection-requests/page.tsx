'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { InspectionManagementTab } from '../components/InspectionManagementTab';
import { SubTabNavigation } from '../components/SubTabNavigation';

function InspectionRequestsContent() {
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
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          <SubTabNavigation activeTab="inHouseInspection" />

          <div className="flex-1 bg-surface-card overflow-auto">
            <InspectionManagementTab />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InspectionRequestsPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-content-sub">読み込み中...</div>}>
      <InspectionRequestsContent />
    </Suspense>
  );
}
