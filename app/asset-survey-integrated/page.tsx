'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore, useAuthStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QRCodePlaceholder } from '@/components/ui/QRCodePlaceholder';
import { updateFieldWithParents } from '@/lib/utils/asset-hierarchy';

function AssetSurveyIntegratedContent() {
  const router = useRouter();
  const facilityName = useAuthStore().selectedFacility || '';
  const { isMobile } = useResponsive();
  const { assets: assetMasters } = useMasterStore();

  const [bulkMode, setBulkMode] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [largeClass, setLargeClass] = useState('');
  const [mediumClass, setMediumClass] = useState('');
  const [item, setItem] = useState('');
  const [maker, setMaker] = useState('');
  const [model, setModel] = useState('');
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  // 購入年月日
  const [purchaseYear, setPurchaseYear] = useState('');
  const [purchaseMonth, setPurchaseMonth] = useState('');
  const [purchaseDay, setPurchaseDay] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState('');
  const [tempMonth, setTempMonth] = useState('');
  const [tempDay, setTempDay] = useState('');

  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const isFormDirty = qrScanned || photoTaken || largeClass !== '' || mediumClass !== '' || item !== '' || maker !== '' || model !== '' || purchaseYear !== '';

  const handleHomeClick = () => {
    if (isFormDirty) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  // 和暦変換
  const toWareki = (year: number): string => {
    if (year >= 2019) return `令和${year - 2018}`;
    if (year >= 1989) return `平成${year - 1988}`;
    if (year >= 1926) return `昭和${year - 1925}`;
    if (year >= 1912) return `大正${year - 1911}`;
    return `明治${year - 1867}`;
  };

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear + 1; y >= 1950; y--) years.push(y.toString());
    return years;
  }, []);

  const monthOptions = useMemo(() => {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) months.push(m.toString());
    return months;
  }, []);

  const dayOptions = useMemo(() => {
    const days: string[] = [];
    const year = tempYear ? parseInt(tempYear, 10) : null;
    const month = tempMonth ? parseInt(tempMonth, 10) : null;
    const max = year && month ? new Date(year, month, 0).getDate() : 31;
    for (let d = 1; d <= max; d++) days.push(d.toString());
    return days;
  }, [tempYear, tempMonth]);

  const ITEM_HEIGHT = 44;

  const openDatePicker = () => {
    setTempYear(purchaseYear);
    setTempMonth(purchaseMonth);
    setTempDay(purchaseDay);
    setShowDatePicker(true);
  };

  const confirmDatePicker = () => {
    setPurchaseYear(tempYear);
    setPurchaseMonth(tempMonth);
    setPurchaseDay(tempDay);
    setShowDatePicker(false);
  };

  useEffect(() => {
    if (showDatePicker) {
      setTimeout(() => {
        if (yearScrollRef.current) {
          const index = tempYear ? yearOptions.indexOf(tempYear) + 1 : 0;
          yearScrollRef.current.scrollTop = index * ITEM_HEIGHT;
        }
        if (monthScrollRef.current) {
          const index = tempMonth ? monthOptions.indexOf(tempMonth) + 1 : 0;
          monthScrollRef.current.scrollTop = index * ITEM_HEIGHT;
        }
        if (dayScrollRef.current) {
          const index = tempDay ? dayOptions.indexOf(tempDay) + 1 : 0;
          dayScrollRef.current.scrollTop = index * ITEM_HEIGHT;
        }
      }, 100);
    }
  }, [showDatePicker]);

  const handleScrollSelect = (
    ref: React.RefObject<HTMLDivElement | null>,
    options: string[],
    setter: (v: string) => void
  ) => {
    if (!ref.current) return;
    const index = Math.round(ref.current.scrollTop / ITEM_HEIGHT);
    setter(index === 0 ? '' : (options[index - 1] ?? ''));
  };

  const formatDisplayDate = () => {
    if (!purchaseYear) return '選択してください';
    let display = `${purchaseYear}（${toWareki(parseInt(purchaseYear, 10))}）年`;
    if (purchaseMonth) {
      display += ` ${purchaseMonth}月`;
      if (purchaseDay) display += ` ${purchaseDay}日`;
    }
    return display;
  };

  // マスタデータから選択肢を生成（親選択に連動してフィルタ）
  const largeClassOptions = useMemo(() => Array.from(new Set(assetMasters.map(a => a.largeClass).filter(Boolean))), [assetMasters]);
  const mediumClassOptions = useMemo(() => {
    const source = largeClass ? assetMasters.filter(a => a.largeClass === largeClass) : assetMasters;
    return Array.from(new Set(source.map(a => a.mediumClass).filter(Boolean)));
  }, [assetMasters, largeClass]);
  const itemOptions = useMemo(() => {
    let source = assetMasters;
    if (largeClass) source = source.filter(a => a.largeClass === largeClass);
    if (mediumClass) source = source.filter(a => a.mediumClass === mediumClass);
    return Array.from(new Set(source.map(a => a.item).filter(Boolean)));
  }, [assetMasters, largeClass, mediumClass]);
  const makerOptions = useMemo(() => {
    let source = assetMasters;
    if (largeClass) source = source.filter(a => a.largeClass === largeClass);
    if (mediumClass) source = source.filter(a => a.mediumClass === mediumClass);
    if (item) source = source.filter(a => a.item === item);
    return Array.from(new Set(source.map(a => a.maker).filter(Boolean)));
  }, [assetMasters, largeClass, mediumClass, item]);
  const modelOptions = useMemo(() => {
    let source = assetMasters;
    if (largeClass) source = source.filter(a => a.largeClass === largeClass);
    if (mediumClass) source = source.filter(a => a.mediumClass === mediumClass);
    if (item) source = source.filter(a => a.item === item);
    if (maker) source = source.filter(a => a.maker === maker);
    return Array.from(new Set(source.map(a => a.model).filter(Boolean)));
  }, [assetMasters, largeClass, mediumClass, item, maker]);

  // 分類フィールド変更ハンドラ（子→親自動反映 + 親変更時の子クリア）
  const handleClassFieldChange = (field: 'largeClass' | 'mediumClass' | 'item' | 'maker' | 'model', value: string) => {
    const fieldMap = {
      largeClass: 'majorCategory' as const,
      mediumClass: 'middleCategory' as const,
      item: 'item' as const,
      maker: 'manufacturer' as const,
      model: 'model' as const,
    };
    const currentData = {
      majorCategory: largeClass,
      middleCategory: mediumClass,
      item,
      manufacturer: maker,
      model,
    };

    const updates = updateFieldWithParents(fieldMap[field], value, currentData, assetMasters);

    // 子→親の自動反映を適用
    if (updates.majorCategory !== undefined) setLargeClass(updates.majorCategory);
    if (updates.middleCategory !== undefined) setMediumClass(updates.middleCategory);
    if (updates.item !== undefined) setItem(updates.item);
    if (updates.manufacturer !== undefined) setMaker(updates.manufacturer);
    if (updates.model !== undefined) setModel(updates.model);

    // 親変更時: 無効な子をクリア
    if (field === 'largeClass') {
      const validMasters = value ? assetMasters.filter(a => a.largeClass === value) : assetMasters;
      if (mediumClass && !validMasters.some(a => a.mediumClass === mediumClass)) setMediumClass('');
      if (item && !validMasters.some(a => a.item === item)) setItem('');
      if (maker && !validMasters.some(a => a.maker === maker)) setMaker('');
      if (model && !validMasters.some(a => a.model === model)) setModel('');
    } else if (field === 'mediumClass') {
      const validMasters = value
        ? assetMasters.filter(a => a.mediumClass === value && (!largeClass || a.largeClass === largeClass))
        : assetMasters;
      if (item && !validMasters.some(a => a.item === item)) setItem('');
      if (maker && !validMasters.some(a => a.maker === maker)) setMaker('');
      if (model && !validMasters.some(a => a.model === model)) setModel('');
    } else if (field === 'item') {
      const validMasters = value
        ? assetMasters.filter(a => a.item === value && (!largeClass || a.largeClass === largeClass) && (!mediumClass || a.mediumClass === mediumClass))
        : assetMasters;
      if (maker && !validMasters.some(a => a.maker === maker)) setMaker('');
      if (model && !validMasters.some(a => a.model === model)) setModel('');
    } else if (field === 'maker') {
      const validMasters = value
        ? assetMasters.filter(a => a.maker === value && (!largeClass || a.largeClass === largeClass) && (!mediumClass || a.mediumClass === mediumClass) && (!item || a.item === item))
        : assetMasters;
      if (model && !validMasters.some(a => a.model === model)) setModel('');
    }
  };

  const handleBack = () => router.push('/survey-location');
  const handleShowHistory = () => router.push('/history');
  const handleQRScan = () => { setQrScanned(true); alert('QRコードを読み取りました'); };
  const handlePhotoCapture = () => { setPhotoTaken(true); alert('写真を撮影しました'); };
  const handleAssetRegistration = () => alert('商品を登録しました');

  const inputClass = 'w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary transition-colors';

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      {/* ヘッダー */}
      <header className="bg-surface-card border-b border-stroke-input px-4 py-3 sticky top-0 z-50">
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

      {/* QRコード + 室名（sticky） */}
      <div className="sticky top-[53px] z-40 bg-surface-card border-b border-stroke-input px-4 py-3">
        <div className="max-w-[800px] mx-auto grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-content-primary mb-1.5">QRコード</label>
            <input type="text" placeholder="入力してください" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm text-content-primary mb-1.5">室名</label>
            <input type="text" placeholder="入力してください" className={inputClass} />
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-[800px] mx-auto px-3 py-4 sm:px-6">

          {/* カード2: メインフォーム */}
          <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input mt-3">
            {/* 登録モード */}
            <div className="p-4">
              <h2 className="text-sm font-bold text-content-primary mb-2">登録モード</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  className="size-[18px] accent-[#008C1D] cursor-pointer"
                />
                <span className="text-sm text-content-primary">一括登録モード</span>
              </label>
              <p className="text-xs text-content-sub mt-1 ml-[26px]">同じ機器を複数個登録する場合にチェック</p>
            </div>

            <div className="border-t border-stroke-input" />

            {/* 読み取ったQRコード */}
            <div className="p-4">
              <h2 className="text-sm font-bold text-content-primary mb-3">読み取ったQRコード</h2>
              <div className={`border-2 border-dashed rounded-lg py-10 flex flex-col items-center justify-center ${qrScanned ? 'border-cta-primary bg-surface-select' : 'border-stroke-input bg-surface-screen'}`}>
                <QRCodePlaceholder size={32} color={qrScanned ? '#008C1D' : '#8A8A8A'} />
                <p className={`text-sm mt-2 ${qrScanned ? 'text-cta-primary' : 'text-content-sub'}`}>
                  {qrScanned ? 'QRコード読み取り済み' : 'QRコードを読んでください'}
                </p>
              </div>
            </div>

            <div className="border-t border-stroke-input" />

            {/* 資産番号・備品番号・シリアルNo + 購入年月日 */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-sm text-content-primary mb-1.5">資産番号</label>
                  <input type="text" placeholder="入力してください" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-content-primary mb-1.5">備品番号</label>
                  <input type="text" placeholder="入力してください" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-content-primary mb-1.5">シリアルNo.</label>
                  <input type="text" placeholder="入力してください" className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-sm text-content-primary mb-1.5">購入年月日</label>
                <button
                  type="button"
                  onClick={openDatePicker}
                  className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md bg-surface-card text-left flex items-center justify-between cursor-pointer hover:border-cta-primary transition-colors"
                >
                  <span className={purchaseYear ? 'text-content-primary' : 'text-content-sub'}>{formatDisplayDate()}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="border-t border-stroke-input" />

            {/* 写真 */}
            <div className="p-4">
              <h2 className="text-sm font-bold text-content-primary mb-3">写真</h2>
              <div className={`border-2 border-dashed rounded-lg py-10 flex flex-col items-center justify-center ${photoTaken ? 'border-cta-primary bg-surface-select' : 'border-stroke-input bg-surface-screen'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={photoTaken ? '#008C1D' : '#8A8A8A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className={`text-sm mt-2 ${photoTaken ? 'text-cta-primary' : 'text-content-sub'}`}>
                  {photoTaken ? '写真撮影済み' : '写真をアップしてください'}
                </p>
              </div>
            </div>

            <div className="border-t border-stroke-input" />

            {/* 分類情報 */}
            <div className="p-4">
              <h2 className="text-sm font-bold text-content-primary mb-4">分類情報</h2>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <SearchableSelect label="大分類" value={largeClass} onChange={(v) => handleClassFieldChange('largeClass', v)} options={['', ...largeClassOptions]} placeholder="選択してください" isMobile={isMobile} />
                <SearchableSelect label="中分類" value={mediumClass} onChange={(v) => handleClassFieldChange('mediumClass', v)} options={['', ...mediumClassOptions]} placeholder="選択してください" isMobile={isMobile} />
                <SearchableSelect label="品目" value={item} onChange={(v) => handleClassFieldChange('item', v)} options={['', ...itemOptions]} placeholder="選択してください" isMobile={isMobile} />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <SearchableSelect label="メーカー" value={maker} onChange={(v) => handleClassFieldChange('maker', v)} options={['', ...makerOptions]} placeholder="選択してください" isMobile={isMobile} />
                <SearchableSelect label="型式" value={model} onChange={(v) => handleClassFieldChange('model', v)} options={['', ...modelOptions]} placeholder="選択してください" isMobile={isMobile} />
              </div>

              <h2 className="text-sm font-bold text-content-primary mb-4 mt-2">サイズ情報</h2>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-content-primary mb-1.5">W (幅)</label>
                  <input type="text" placeholder="0mm" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-content-primary mb-1.5">D (奥行)</label>
                  <input type="text" placeholder="0mm" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm text-content-primary mb-1.5">H (高さ)</label>
                  <input type="text" placeholder="0mm" className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-content-sub mt-2">単位: mm</p>
            </div>

            <div className="border-t border-stroke-input" />

            {/* 備考 */}
            <div className="p-4">
              <label className="block text-sm text-content-primary mb-1.5">備考</label>
              <input type="text" placeholder="入力してください" className={inputClass} />
            </div>
          </div>

          {/* 一括登録モード: 終了QR */}
          {bulkMode && (
            <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input mt-3 p-4">
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-sm text-content-primary mb-1.5">終了QRコード</label>
                  <input
                    type="text"
                    placeholder="終了QRコードを入力"
                    readOnly
                    className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md bg-surface-screen outline-none"
                  />
                  <p className="text-xs text-content-sub mt-1">一括登録の終了QRコード</p>
                </div>
                <button
                  onClick={() => alert('終了QRコードを読み取りました')}
                  className="px-4 py-2.5 text-sm font-bold text-white bg-cta-primary border-0 rounded-md cursor-pointer hover:bg-cta-primary-dark transition-colors min-h-[44px]"
                >
                  終了QR読取
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ボトムナビバー */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-stroke-input z-50">
        <div className="max-w-[800px] mx-auto flex justify-around pt-2 pb-1">
          <button
            onClick={handleShowHistory}
            className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-2 min-w-[60px] text-content-sub hover:text-content-primary transition-colors"
            aria-label="履歴表示"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[11px]">履歴表示</span>
          </button>

          <button
            onClick={handleQRScan}
            className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-2 min-w-[60px] text-content-sub hover:text-content-primary transition-colors"
            aria-label="QR読取"
          >
            <QRCodePlaceholder size={22} color="currentColor" />
            <span className="text-[11px]">QR読取</span>
          </button>

          <button
            onClick={handlePhotoCapture}
            className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-2 min-w-[60px] text-content-sub hover:text-content-primary transition-colors"
            aria-label="写真撮影"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-[11px]">写真撮影</span>
          </button>

          <button
            onClick={handleAssetRegistration}
            className="flex flex-col items-center gap-1 bg-transparent border-0 cursor-pointer p-2 min-w-[60px] text-cta-primary transition-colors"
            aria-label="商品登録"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-[11px] font-bold">商品登録</span>
          </button>
        </div>
        <div className="text-center text-[10px] text-content-sub pb-2">
          &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
        </div>
      </nav>

      {/* 日付ピッカーモーダル */}
      {showDatePicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowDatePicker(false)}
        >
          <div
            className="bg-surface-card rounded-2xl w-[90%] max-w-[400px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-stroke-input">
              <button
                onClick={() => setShowDatePicker(false)}
                className="bg-transparent border-0 text-base text-content-sub cursor-pointer px-2 py-1"
              >
                キャンセル
              </button>
              <span className="text-base font-bold text-content-primary">購入年月日</span>
              <button
                onClick={confirmDatePicker}
                className="bg-transparent border-0 text-base text-cta-primary font-bold cursor-pointer px-2 py-1"
              >
                完了
              </button>
            </div>

            {/* ラベル行 */}
            <div className="flex px-2.5 py-2 border-b border-stroke-input bg-surface-screen">
              <div className="flex-[2] text-center text-[13px] font-bold text-content-sub">年</div>
              <div className="flex-1 text-center text-[13px] font-bold text-content-sub">月</div>
              <div className="flex-1 text-center text-[13px] font-bold text-content-sub">日</div>
            </div>

            {/* ドラムロール */}
            <div className="flex h-[200px] relative overflow-hidden">
              {/* 選択インジケーター */}
              <div
                className="absolute left-2.5 right-2.5 bg-surface-select rounded-lg pointer-events-none z-[1]"
                style={{ top: '50%', height: ITEM_HEIGHT, transform: 'translateY(-50%)' }}
              />

              {/* 年 */}
              <div className="flex-[2] relative">
                <div
                  ref={yearScrollRef}
                  onScroll={() => handleScrollSelect(yearScrollRef, yearOptions, setTempYear)}
                  className="h-full overflow-y-auto"
                  style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', paddingTop: (200 - ITEM_HEIGHT) / 2, paddingBottom: (200 - ITEM_HEIGHT) / 2 }}
                >
                  <div className="h-[44px] flex items-center justify-center text-base relative z-[2]" style={{ scrollSnapAlign: 'center', color: !tempYear ? '#008C1D' : '#8A8A8A', fontWeight: !tempYear ? 'bold' : 'normal' }}>
                    未選択
                  </div>
                  {yearOptions.map(y => (
                    <div key={y} className="h-[44px] flex items-center justify-center text-base relative z-[2]" style={{ scrollSnapAlign: 'center', color: tempYear === y ? '#008C1D' : '#4A4A4A', fontWeight: tempYear === y ? 'bold' : 'normal' }}>
                      {y}（{toWareki(parseInt(y, 10))}）
                    </div>
                  ))}
                </div>
              </div>

              {/* 月 */}
              <div className="flex-1 relative">
                <div
                  ref={monthScrollRef}
                  onScroll={() => handleScrollSelect(monthScrollRef, monthOptions, setTempMonth)}
                  className="h-full overflow-y-auto"
                  style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', paddingTop: (200 - ITEM_HEIGHT) / 2, paddingBottom: (200 - ITEM_HEIGHT) / 2 }}
                >
                  <div className="h-[44px] flex items-center justify-center text-lg relative z-[2]" style={{ scrollSnapAlign: 'center', color: !tempMonth ? '#008C1D' : '#8A8A8A', fontWeight: !tempMonth ? 'bold' : 'normal' }}>
                    --
                  </div>
                  {monthOptions.map(m => (
                    <div key={m} className="h-[44px] flex items-center justify-center text-lg relative z-[2]" style={{ scrollSnapAlign: 'center', color: tempMonth === m ? '#008C1D' : '#4A4A4A', fontWeight: tempMonth === m ? 'bold' : 'normal' }}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* 日 */}
              <div className="flex-1 relative">
                <div
                  ref={dayScrollRef}
                  onScroll={() => handleScrollSelect(dayScrollRef, dayOptions, setTempDay)}
                  className="h-full overflow-y-auto"
                  style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', paddingTop: (200 - ITEM_HEIGHT) / 2, paddingBottom: (200 - ITEM_HEIGHT) / 2 }}
                >
                  <div className="h-[44px] flex items-center justify-center text-lg relative z-[2]" style={{ scrollSnapAlign: 'center', color: !tempDay ? '#008C1D' : '#8A8A8A', fontWeight: !tempDay ? 'bold' : 'normal' }}>
                    --
                  </div>
                  {dayOptions.map(d => (
                    <div key={d} className="h-[44px] flex items-center justify-center text-lg relative z-[2]" style={{ scrollSnapAlign: 'center', color: tempDay === d ? '#008C1D' : '#4A4A4A', fontWeight: tempDay === d ? 'bold' : 'normal' }}>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* クリアボタン */}
            <div className="px-5 py-3 border-t border-stroke-input">
              <button
                onClick={() => {
                  setTempYear(''); setTempMonth(''); setTempDay('');
                  if (yearScrollRef.current) yearScrollRef.current.scrollTop = 0;
                  if (monthScrollRef.current) monthScrollRef.current.scrollTop = 0;
                  if (dayScrollRef.current) dayScrollRef.current.scrollTop = 0;
                }}
                className="w-full py-3 bg-stroke-card border-0 rounded-lg text-sm text-content-sub cursor-pointer hover:bg-stroke-input transition-colors"
              >
                クリア
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="入力中の調査データが破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="調査を続ける"
        variant="warning"
      />
    </div>
  );
}

export default function AssetSurveyIntegratedPage() {
  return <AssetSurveyIntegratedContent />;
}
