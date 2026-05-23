'use client';

import { useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';

function InspectionPrepContent() {
  const router = useRouter();
  const { isMobile } = useResponsive();

  const [downloadStatus, setDownloadStatus] = useState<'none' | 'downloading' | 'completed'>('completed');
  const [lastDownloadTime, setLastDownloadTime] = useState<string | null>('2025/06/02 10:30');
  const [facilityCount, setFacilityCount] = useState('125件');
  const [itemCount, setItemCount] = useState('1,234件');

  const [connectionStatus] = useState('オンライン');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>('2025/06/01 18:45');
  const [unsyncedCount, setUnsyncedCount] = useState(25);
  const [isOnline] = useState(true);

  const handleDownloadData = () => {
    setDownloadStatus('downloading');
    setTimeout(() => {
      setDownloadStatus('completed');
      setLastDownloadTime(new Date().toLocaleString('ja-JP'));
      setFacilityCount('125件');
      setItemCount('1,234件');
    }, 2000);
  };

  const handleSyncData = () => {
    if (!isOnline) {
      alert('オフライン状態のため送信できません。オンラインに接続してください。');
      return;
    }
    alert('点検結果を送信しました');
    setUnsyncedCount(0);
    setLastSyncTime(new Date().toLocaleString('ja-JP'));
  };

  const handleStartInspection = () => {
    if (downloadStatus !== 'completed' && !isOnline) {
      alert('オフライン状態でデータがダウンロードされていません。先にデータをダウンロードしてください。');
      return;
    }
    router.push('/daily-inspection');
  };

  const handleClose = () => {
    router.push('/main');
  };

  const getStatusText = () => {
    switch (downloadStatus) {
      case 'none': return '---';
      case 'downloading': return 'ダウンロード中...';
      case 'completed': return '最新';
    }
  };

  const downloadTableData = [
    { label: '状態', value: getStatusText() },
    { label: '最終更新', value: lastDownloadTime || '---', tabular: true },
    { label: '施設', value: downloadStatus === 'completed' ? facilityCount : '---', tabular: true },
    { label: '品目', value: downloadStatus === 'completed' ? itemCount : '---', tabular: true },
  ];

  const syncTableData: { label: string; value: string; tabular?: boolean; colorClass?: string }[] = [
    { label: '接続状態', value: connectionStatus, colorClass: isOnline ? 'text-cta-primary' : 'text-content-alert' },
    { label: '最終送信', value: lastSyncTime || '---', tabular: true },
    { label: '未送信データ', value: `${unsyncedCount}件`, tabular: true, colorClass: unsyncedCount > 0 ? 'text-content-alert' : undefined },
  ];

  const StatusTable = ({ data }: { data: { label: string; value: string; tabular?: boolean; colorClass?: string }[] }) => (
    <div className="border border-stroke-input rounded-lg overflow-hidden mb-4">
      <div className="flex border-b border-stroke-input">
        {data.map((item, i) => (
          <div key={i} className={`flex-1 px-3 py-2 text-xs text-content-sub ${i > 0 ? 'border-l border-stroke-input' : ''}`}>
            {item.label}
          </div>
        ))}
      </div>
      <div className="flex">
        {data.map((item, i) => (
          <div key={i} className={`flex-1 px-3 py-2.5 text-sm font-semibold ${item.tabular ? 'tabular-nums' : ''} ${item.colorClass || 'text-content-primary'} ${i > 0 ? 'border-l border-stroke-input' : ''}`}>
            {item.value}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="日常点検：オフライン準備"
        hideMenu={true}
        showBackButton={true}
        backHref="/main"
        backLabel="閉じる"
        backButtonVariant="secondary"
        hideHomeButton={true}
      />

      <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6 flex-1">
        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-4 sm:p-6">
          <div className="pb-6 border-b border-stroke-input">
            <h2 className="text-sm font-bold text-content-primary mb-3">点検メニューデータ</h2>
            <p className="text-xs text-content-sub leading-relaxed mb-4 text-pretty">
              オフライン環境で日常点検を実施する場合は、事前にデータをダウンロードしてください。ダウンロード後、ネットワーク接続がなくても点検を実施できます。
            </p>

            <StatusTable data={downloadTableData} />

            <button
              onClick={handleDownloadData}
              disabled={downloadStatus === 'downloading'}
              className={`w-full h-12 text-sm font-bold rounded-lg transition-colors ${
                downloadStatus === 'downloading'
                  ? 'text-content-sub bg-surface-disabled border border-stroke-input cursor-not-allowed'
                  : 'text-cta-primary bg-surface-card border border-cta-primary cursor-pointer hover:bg-surface-select'
              }`}
            >
              {downloadStatus === 'downloading' ? 'ダウンロード中...' : 'データをダウンロード'}
            </button>
          </div>

          <div className="pt-6">
            <h2 className="text-sm font-bold text-content-primary mb-3">点検結果送信</h2>
            <p className="text-xs text-content-sub leading-relaxed mb-4 text-pretty">
              オフラインで実施した点検結果をサーバーに送信します。送信前にオンライン環境に接続していることを確認してください。
            </p>

            <StatusTable data={syncTableData} />

            <button
              onClick={handleSyncData}
              className="w-full h-12 text-sm font-bold text-cta-primary bg-surface-card border border-cta-primary rounded-lg cursor-pointer hover:bg-surface-select transition-colors"
            >
              点検結果を送信
            </button>
          </div>
        </div>

        <div className={`mt-6 ${isMobile ? 'flex flex-col gap-3' : 'flex gap-3 justify-center'}`}>
          <button
            onClick={handleClose}
            className={`${isMobile ? 'w-full order-2' : 'w-[239px]'} h-12 text-base font-medium text-content-primary bg-surface-negative rounded-lg cursor-pointer hover:bg-stroke-input transition-colors`}
          >
            閉じる
          </button>
          <button
            onClick={handleStartInspection}
            className={`${isMobile ? 'w-full order-1' : 'w-[239px]'} h-12 text-base font-medium text-white bg-cta-primary border-0 rounded-lg cursor-pointer hover:bg-cta-primary-dark transition-colors`}
          >
            点検を開始する
          </button>
        </div>
      </div>

      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>
    </div>
  );
}

export default function InspectionPrepPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <InspectionPrepContent />
    </Suspense>
  );
}
