'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore, useAuthStore } from '@/lib/stores';
import { useHospitalFacilityStore } from '@/lib/stores/hospitalFacilityStore';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

function SurveyLocationContent() {
  const router = useRouter();
  const facilityName = useAuthStore().selectedFacility || '';
  const { isMobile } = useResponsive();
  const { assets: assetMasters } = useMasterStore();
  const { facilities: hospitalFacilities } = useHospitalFacilityStore();

  const facilityMasterData = useMemo(() => {
    // selectedFacility 未設定時は全施設データから抽出 (デモ用フォールバック)
    if (!facilityName) return hospitalFacilities;
    const filtered = hospitalFacilities.filter(f => f.hospitalName === facilityName);
    // 選択施設に該当データがない場合も全件にフォールバック (selectedFacility がマスタ未登録の場合の救済)
    return filtered.length > 0 ? filtered : hospitalFacilities;
  }, [hospitalFacilities, facilityName]);

  const surveyDate = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [section, setSection] = useState('');
  const [room, setRoom] = useState('');
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const isFormDirty = category !== '' || department !== '' || section !== '' || room !== '';

  const handleHomeClick = () => {
    if (isFormDirty) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  const departmentOptions = useMemo(() => {
    const uniqueDivisions = Array.from(new Set(facilityMasterData.map(f => f.oldShipDivision).filter((d): d is string => !!d)));
    return uniqueDivisions;
  }, [facilityMasterData]);

  const sectionOptions = useMemo(() => {
    const filtered = department
      ? facilityMasterData.filter(f => f.oldShipDivision === department)
      : facilityMasterData;
    const uniqueDepartments = Array.from(new Set(filtered.map(f => f.oldShipDepartment).filter((d): d is string => !!d)));
    return uniqueDepartments;
  }, [facilityMasterData, department]);


  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    if (value) {
      const validSections = facilityMasterData
        .filter(f => f.oldShipDivision === value)
        .map(f => f.oldShipDepartment);
      if (!validSections.includes(section)) {
        setSection('');
      }
    }
  };

  const handleSectionChange = (value: string) => {
    setSection(value);
    // 部署選択時、対応する部門を自動設定
    if (value && !department) {
      const match = facilityMasterData.find(f => f.oldShipDepartment === value);
      if (match?.oldShipDivision) {
        setDepartment(match.oldShipDivision);
      }
    }
  };

  const handleBack = () => {
    router.push('/offline-prep');
  };

  const handleNext = () => {
    if (!category || !department || !section) {
      alert('Category・部門・部署を選択してください');
      return;
    }
    const queryParams = new URLSearchParams({ category, department, section, room, surveyDate });
    router.push(`/asset-survey-integrated?${queryParams.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      {/* ヘッダー */}
      <header className="bg-surface-card border-b border-stroke-input px-4 py-3">
        <div className="flex items-center justify-between max-w-[800px] mx-auto">
          <button
            onClick={handleBack}
            className="size-10 flex items-center justify-center text-content-sub bg-transparent border-0 cursor-pointer hover:text-content-primary transition-colors"
            aria-label="戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-bold text-content-primary text-balance">HEALTHCARE 医療機器管理システム</span>
          <button
            onClick={handleHomeClick}
            className="size-10 flex items-center justify-center text-content-sub bg-transparent border-0 cursor-pointer hover:text-content-primary transition-colors"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6 flex-1">
        <h1 className="text-lg font-bold text-content-primary mb-4 text-balance">現有資産調査</h1>

        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-4 sm:p-6">
          {/* 調査日 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-content-primary mb-2">調査日</label>
            <div className="px-3 py-2.5 text-sm text-content-primary border border-stroke-input rounded-md bg-surface-screen tabular-nums">
              {surveyDate}
            </div>
          </div>

          {/* Category */}
          <div className="mb-6">
            <SearchableSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* 部門 */}
          <div className="mb-6">
            <SearchableSelect
              label="部門"
              value={department}
              onChange={handleDepartmentChange}
              options={departmentOptions}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* 部署 */}
          <div className="mb-6">
            <SearchableSelect
              label="部署"
              value={section}
              onChange={handleSectionChange}
              options={sectionOptions}
              placeholder="選択してください"
              isMobile={isMobile}
            />
          </div>

          {/* 諸室 */}
          <div>
            <label className="block text-sm font-bold text-content-primary mb-2">諸室</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="諸室名を入力"
              className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary transition-colors"
            />
          </div>
        </div>

        {/* 下部ボタン */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 text-sm font-bold text-content-primary bg-stroke-input border-0 rounded-md cursor-pointer hover:bg-stroke-input transition-colors"
          >
            戻る
          </button>
          <button
            onClick={handleNext}
            className="flex-1 py-3 text-sm font-bold text-cta-primary bg-surface-card border border-cta-primary rounded-md cursor-pointer hover:bg-surface-select transition-colors"
          >
            次へ
          </button>
        </div>
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="選択内容が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="選択を続ける"
        variant="warning"
      />
    </div>
  );
}

export default function SurveyLocationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <SurveyLocationContent />
    </Suspense>
  );
}
