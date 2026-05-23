'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useLendingStore } from '@/lib/stores';
import { Header } from '@/components/layouts';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

export default function LendingAvailablePage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { devices } = useLendingStore();

  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');

  // 貸出グループ名の一覧（重複排除）
  const groupNames = useMemo(() => {
    return [...new Set(devices.map(d => d.lendingGroupName).filter(Boolean))];
  }, [devices]);

  // 選択グループ内の機種名一覧（重複排除）
  const deviceNames = useMemo(() => {
    if (!selectedGroup) return [];
    return [...new Set(
      devices
        .filter(d => d.lendingGroupName === selectedGroup)
        .map(d => d.itemName)
        .filter(Boolean)
    )];
  }, [devices, selectedGroup]);

  // 選択グループ内の機種別台数集計
  const deviceCounts = useMemo(() => {
    if (!selectedGroup) return [];
    const grouped = devices
      .filter(d => d.lendingGroupName === selectedGroup)
      .reduce<Record<string, { total: number; available: number }>>((acc, d) => {
        if (!acc[d.itemName]) {
          acc[d.itemName] = { total: 0, available: 0 };
        }
        acc[d.itemName].total += 1;
        if (d.status === '貸出可' || d.status === '待機中') {
          acc[d.itemName].available += 1;
        }
        return acc;
      }, {});
    return Object.entries(grouped).map(([name, counts]) => ({ name, ...counts }));
  }, [devices, selectedGroup]);

  const selectedDeviceCounts = useMemo(() => {
    return deviceCounts.find(d => d.name === selectedDevice);
  }, [deviceCounts, selectedDevice]);

  // 合計（機種選択時はその機種の数、未選択時はグループ全体）
  const totalAvailable = selectedDeviceCounts
    ? selectedDeviceCounts.available
    : deviceCounts.reduce((sum, d) => sum + d.available, 0);

  // フィルター対象の機種リスト（選択された機種のみ表示 or 全機種）
  const displayedDevices = selectedDevice && selectedDeviceCounts
    ? [selectedDeviceCounts]
    : deviceCounts;

  const handleGroupChange = (value: string) => {
    setSelectedGroup(value);
    setSelectedDevice('');
  };

  // 機種が選択されたときの一覧（個別機器の台数）
  const inventoryItems = useMemo(() => {
    if (!selectedGroup) return [];
    return devices
      .filter(d => d.lendingGroupName === selectedGroup && (!selectedDevice || d.itemName === selectedDevice));
  }, [devices, selectedGroup, selectedDevice]);

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      {/* 共通ヘッダー */}
      <Header
        title="貸出可能機器閲覧"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      {/* メインコンテンツ */}
      <div className="flex-1 w-full max-w-[1080px] mx-auto px-4 py-6">
        <div className="bg-surface-card rounded-lg border border-stroke-card overflow-hidden">

          {/* 貸出種別名 */}
          <section className="px-6 py-4 border-b border-stroke-card">
            <h2 className="text-base font-bold text-content-primary mb-3">貸出種別名</h2>
            <div className="max-w-[350px]">
              <SearchableSelect
                value={selectedGroup}
                onChange={handleGroupChange}
                options={groupNames}
                placeholder="グループを選択"
                isMobile={isMobile}
              />
            </div>
          </section>

          {/* 貸出可能対象機種 */}
          <section className="px-6 py-4 border-b border-stroke-card">
            <h2 className="text-base font-bold text-content-primary mb-3">貸出可能対象機種</h2>
            <div className="max-w-[350px]">
              <SearchableSelect
                value={selectedDevice}
                onChange={setSelectedDevice}
                options={deviceNames}
                placeholder={selectedGroup ? '機種を選択（未選択時は全機種）' : 'グループを先に選択してください'}
                disabled={!selectedGroup}
                isMobile={isMobile}
              />
            </div>
          </section>

          {/* 貸出可能台数 */}
          <section className="px-6 py-4">
            <h2 className="text-base font-bold text-content-primary mb-3">貸出可能台数</h2>

            {!selectedGroup ? (
              <p className="text-sm text-content-sub">貸出グループを選択すると、機器の貸出可能状況が表示されます</p>
            ) : deviceCounts.length === 0 ? (
              <p className="text-sm text-content-alert">選択した部署に在庫がありません</p>
            ) : (
              <>
                {/* 機種ごとの台数（Figma準拠: 機種名 + チップ3つ並び） */}
                <div className="space-y-4">
                  {displayedDevices.map(device => {
                    const itemDevices = inventoryItems.filter(d => d.itemName === device.name);
                    return (
                      <div key={device.name}>
                        <h3 className="text-sm font-semibold text-content-primary mb-3">{device.name}</h3>
                        <div className="grid grid-cols-3 gap-2">
                          {itemDevices.map(d => (
                            <div
                              key={d.id}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs ${
                                d.status === '貸出可'
                                  ? 'bg-surface-select border-cta-primary text-cta-primary-dark'
                                  : 'bg-surface-card border-stroke-card text-content-sub'
                              }`}
                            >
                              <span className="font-mono text-[10px] shrink-0">{d.qrCode}</span>
                              <span className="flex-1 min-w-0 truncate">{d.model || '—'}</span>
                              <span className="text-[10px] shrink-0">{d.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 合計 */}
                <div className="mt-6 pt-4 border-t border-stroke-card flex items-baseline gap-3">
                  <span className="text-sm font-semibold text-content-primary">合計</span>
                  <span className="text-3xl font-bold text-cta-primary-dark tabular-nums">{totalAvailable}</span>
                  <span className="text-sm text-content-sub">台</span>
                </div>
              </>
            )}
          </section>

          {/* 戻るボタン */}
          <div className="px-6 py-4 border-t border-stroke-card">
            <button
              onClick={() => router.push('/main')}
              className="px-6 py-2 bg-surface-card text-content-primary border border-stroke-input rounded-md cursor-pointer text-sm font-medium hover:bg-surface-disabled transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-[10px] font-light text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>
    </div>
  );
}
