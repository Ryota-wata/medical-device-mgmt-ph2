'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, Suspense, useMemo, useEffect } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { Asset } from '@/lib/types/asset';
import { useInspectionStore, useAuthStore, useLendingStore } from '@/lib/stores';
import { QRCodePlaceholder } from '@/components/ui/QRCodePlaceholder';

// モック: 原本資産データ（実際はIndexedDBまたはAPIから取得）
const MOCK_ORIGINAL_ASSETS: Asset[] = [
  {
    qrCode: 'QR-001',
    no: 1,
    facility: '本院',
    building: '本館',
    floor: '3F',
    department: '内科',
    section: '外来',
    category: 'ME機器',
    largeClass: '生体情報モニタ',
    mediumClass: 'ベッドサイドモニタ',
    item: '輸液ポンプ',
    name: '輸液ポンプ TE-161',
    maker: 'テルモ',
    model: 'TE-161',
    quantity: 1,
    width: 130,
    depth: 180,
    height: 220,
  },
  {
    qrCode: 'QR-002',
    no: 2,
    facility: '本院',
    building: '本館',
    floor: '3F',
    department: '内科',
    section: '外来',
    category: 'ME機器',
    largeClass: '生体情報モニタ',
    mediumClass: 'ベッドサイドモニタ',
    item: 'シリンジポンプ',
    name: 'シリンジポンプ TE-351',
    maker: 'テルモ',
    model: 'TE-351',
    quantity: 1,
    width: 100,
    depth: 150,
    height: 80,
  },
];

interface InspectionItemResult {
  itemName: string;
  content: string;
  result: '○' | '×' | string;  // REQ-103: 合否は ○/× で記録（定例0413 でマルバツ化）
  unit?: string;
  evaluationType?: '合否' | '単位' | 'フリー入力';
}

const DEFAULT_ITEMS: InspectionItemResult[] = [
  { itemName: '清掃', content: '本体の清掃', result: '', evaluationType: '合否' },
  { itemName: '外装点検', content: 'ACインレット', result: '', evaluationType: '合否' },
  { itemName: '外装点検', content: 'スライダー', result: '', evaluationType: '合否' },
  { itemName: '性能点検', content: '閉塞圧測定', result: '', unit: 'kPa', evaluationType: '単位' },
  { itemName: '性能点検', content: '流量測定', result: '', unit: 'ml', evaluationType: '単位' },
];

type Step = 'qr-scan' | 'inspection' | 'confirm';

function DailyInspectionContent() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { menus } = useInspectionStore();
  const { user } = useAuthStore();
  const lendingDevices = useLendingStore((s) => s.devices);
  const updateLendingDevice = useLendingStore((s) => s.updateDevice);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ステップ管理
  const [step, setStep] = useState<Step>('qr-scan');

  // QRスキャン状態
  const [qrCode, setQrCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // 点検実施状態
  const inspectorName = user?.username || '';
  const [usageTiming, setUsageTiming] = useState<'使用前' | '使用中' | '使用後'>('使用前');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [itemResults, setItemResults] = useState<InspectionItemResult[]>(DEFAULT_ITEMS);
  const [remarks, setRemarks] = useState('');
  const [overallResult, setOverallResult] = useState<'合格' | '異常あり' | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 日常点検メニュー取得
  const availableMenus = useMemo(() => {
    if (!selectedAsset) return [];
    return menus.filter(
      (m) => m.menuType === '日常点検' && m.item === selectedAsset.item
    );
  }, [menus, selectedAsset]);

  const filteredMenus = useMemo(() => {
    return availableMenus.filter((m) => m.dailyTiming === usageTiming);
  }, [availableMenus, usageTiming]);

  const selectedMenu = useMemo(() => {
    return menus.find((m) => m.id === selectedMenuId) || null;
  }, [menus, selectedMenuId]);

  // メニュー変更時に点検項目を更新
  useEffect(() => {
    if (selectedMenu && selectedMenu.inspectionItems.length > 0) {
      setItemResults(
        selectedMenu.inspectionItems.map((item) => ({
          itemName: item.itemName,
          content: item.content,
          result: '',
          unit: item.evaluationType === '単位' ? item.unitValue : undefined,
          evaluationType: item.evaluationType,
        }))
      );
    } else {
      setItemResults(DEFAULT_ITEMS);
    }
  }, [selectedMenu]);

  // タイミング変更時にメニュー自動選択
  useEffect(() => {
    if (filteredMenus.length > 0) {
      setSelectedMenuId(filteredMenus[0].id);
    } else {
      setSelectedMenuId('');
    }
  }, [filteredMenus]);

  // カメラ起動
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      alert('カメラの起動に失敗しました。カメラへのアクセスを許可してください。');
    }
  };

  // カメラ停止
  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // QRコード検索 → 点検実施へ
  const handleSearchByQR = () => {
    const asset = qrCode.trim()
      ? MOCK_ORIGINAL_ASSETS.find((a) => a.qrCode === qrCode.trim())
      : MOCK_ORIGINAL_ASSETS[0];

    if (asset) {
      setSelectedAsset(asset);
      handleStopCamera();
      setStep('inspection');
    } else {
      alert('該当する資産が見つかりませんでした');
    }
  };

  // 点検項目の結果変更
  const handleItemResultChange = (index: number, value: string) => {
    setItemResults((prev) => {
      const newResults = [...prev];
      newResults[index] = { ...newResults[index], result: value };
      return newResults;
    });
  };

  // 確認画面表示
  const handleShowConfirm = (result: '合格' | '異常あり') => {
    setOverallResult(result);
    setStep('confirm');
  };

  // 報告書出力
  const handleExportReport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert('点検結果報告書を出力しました');
  };

  // REQ-129: 貸出機器の場合の貸出ステータス更新
  // 判定基準: lendingStore に当該QRコードが存在 = 貸出機器（管理部署=ME系で貸出登録済）
  // 合格 → 貸出可（slide66/67: 日常点検（使用後）完了で貸出可）
  // 異常あり → 使用不可（4/30定例: 貸出機の異常時は「使用不可」共通）
  const updateLendingStatusFromInspection = (result: '合格' | '異常あり') => {
    if (!selectedAsset?.qrCode) return;
    const device = lendingDevices.find((d) => d.qrCode === selectedAsset.qrCode);
    if (!device) return;
    updateLendingDevice(device.id, {
      status: result === '合格' ? '貸出可' : '使用不可',
    });
  };

  // 完了
  const handleFinish = () => {
    updateLendingStatusFromInspection('合格');
    console.log('点検完了:', {
      overallResult,
      qrCode: selectedAsset?.qrCode,
      itemResults,
      remarks,
    });
    router.push('/inspection-prep');
  };

  // 修理申請へ
  const handleRepairRequest = () => {
    updateLendingStatusFromInspection('異常あり');
    sessionStorage.setItem('repairRequestData', JSON.stringify({
      qrCode: selectedAsset?.qrCode || '',
      largeClass: selectedAsset?.largeClass || '',
      mediumClass: selectedAsset?.mediumClass || '',
      item: selectedAsset?.item || '',
      maker: selectedAsset?.maker || '',
      model: selectedAsset?.model || '',
      inspectionRemarks: remarks,
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName,
    }));
    router.push('/repair-request');
  };

  // 次の点検へ
  const handleNextInspection = () => {
    resetState();
    setStep('qr-scan');
  };

  // 状態リセット
  const resetState = () => {
    setQrCode('');
    setSelectedAsset(null);
    setUsageTiming('使用前');
    setSelectedMenuId('');
    setItemResults(DEFAULT_ITEMS);
    setRemarks('');
    setOverallResult(null);
  };

  // 戻る
  const handleBack = () => {
    if (step === 'confirm') {
      setStep('inspection');
    } else if (step === 'inspection') {
      setStep('qr-scan');
      setSelectedAsset(null);
    } else {
      handleStopCamera();
      router.push('/inspection-prep');
    }
  };

  // SPの×ボタン
  const handleClose = () => {
    handleStopCamera();
    router.push('/inspection-prep');
  };

  // QRアイコンメニュー表示
  const [showQrMenu, setShowQrMenu] = useState(false);

  const isQrEntered = qrCode.trim() !== '';

  // 共通ヘッダー
  const PageHeader = ({ showClose = false }: { showClose?: boolean }) => (
    <header className="bg-white border-b border-stroke-card px-4 py-3">
      <div className="flex items-center justify-between max-w-[800px] mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="size-10 bg-cta-primary rounded-lg flex items-center justify-center text-white font-bold text-[10px] shrink-0">
            logo
          </div>
          <div className="text-sm font-bold text-content-primary text-balance">
            HEALTHCARE 医療機器管理システム
          </div>
        </div>
        {showClose && isMobile && (
          <button
            onClick={handleClose}
            className="size-10 flex items-center justify-center text-content-sub bg-transparent border-0 cursor-pointer"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );

  // 共通フッター（コピーライト）
  const PageFooter = () => (
    <footer className="py-3 text-center text-xs text-content-sub">
      &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
    </footer>
  );

  const now = new Date();
  const today = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
  const formattedDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  // ========== QRスキャンステップ（Figma再現） ==========
  if (step === 'qr-scan') {
    return (
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <PageHeader showClose />

        {/* メインコンテンツ */}
        <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
          <h1 className="text-lg font-bold text-content-primary mb-4 text-balance">
            日常点検：QRコード読み取り
          </h1>

          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
            {/* QRコード表示エリア */}
            <div className="bg-surface-disabled rounded-md flex flex-col items-center justify-center py-10 mb-6">
              <QRCodePlaceholder size={48} color="#8A8A8A" />
              <p className="text-sm text-content-sub mt-2">QRコードを読んでください</p>
            </div>

            {/* QRコード手入力 */}
            <div className="mb-2">
              <label className="block text-sm font-medium text-content-primary mb-2">
                QRコードを手入力
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="例: QR-001"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary transition-colors text-content-primary"
                />
                {/* QRアイコンボタン */}
                <button
                  type="button"
                  onClick={() => setShowQrMenu(!showQrMenu)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center text-content-sub hover:text-content-sub bg-transparent border-0 cursor-pointer rounded transition-colors"
                  aria-label="QR読み取りメニュー"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="6" height="6" rx="1" />
                    <rect x="16" y="2" width="6" height="6" rx="1" />
                    <rect x="2" y="16" width="6" height="6" rx="1" />
                    <rect x="16" y="16" width="4" height="4" rx="0.5" />
                    <path d="M10 2h2v6h-2z" />
                    <path d="M2 10h6v2H2z" />
                    <path d="M10 10h4v4h-4z" />
                  </svg>
                </button>

                {/* ポップオーバーメニュー */}
                {showQrMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowQrMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-stroke-card rounded-md shadow-md py-1 min-w-[180px]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowQrMenu(false);
                          if (isCameraActive) {
                            handleStopCamera();
                          } else {
                            handleStartCamera();
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-content-primary bg-transparent border-0 cursor-pointer hover:bg-surface-disabled transition-colors"
                      >
                        {isCameraActive ? 'カメラを停止' : 'カメラを起動'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQrMenu(false)}
                        className="w-full text-left px-4 py-2.5 text-sm text-content-primary bg-transparent border-0 cursor-pointer hover:bg-surface-disabled transition-colors"
                      >
                        ライブラリから読み込み
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* カメラプレビュー（起動時のみ） */}
            {isCameraActive && (
              <div className="mt-4 rounded-md overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* 下部ボタン */}
          <div className={`mt-4 ${isMobile ? 'flex flex-col gap-3' : 'flex gap-3'}`}>
            <button
              onClick={handleBack}
              className={`${isMobile ? 'w-full order-2' : 'flex-1'} py-3 text-sm font-medium text-[#4A4A4A] bg-[#E1E1E1] border-0 rounded-md cursor-pointer hover:bg-[#E1E1E1] transition-colors`}
            >
              戻る
            </button>
            <button
              onClick={handleSearchByQR}
              disabled={!isQrEntered}
              className={`${isMobile ? 'w-full order-1' : 'flex-1'} py-3 text-sm font-bold rounded-md transition-colors ${
                isQrEntered
                  ? 'text-cta-primary-dark bg-white border border-cta-primary cursor-pointer hover:bg-[#EBF5EE]'
                  : 'text-content-sub bg-surface-disabled border border-stroke-input cursor-default'
              }`}
            >
              検索して点検開始する
            </button>
          </div>
        </div>

        <PageFooter />
      </div>
    );
  }

  // ========== 点検実施ステップ ==========
  if (step === 'inspection') {
    return (
      <div className="flex flex-col min-h-dvh bg-surface-screen">
        <PageHeader />

        <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
          <h1 className="text-lg font-bold text-content-primary mb-1 text-balance">
            日常点検：QRコード読み取り
          </h1>
          <p className="text-sm text-content-sub mb-4">{formattedDate}</p>

          {/* 基本情報カード */}
          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6 mb-4">
            {/* QRコード・実施者名 */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-content-sub mb-1">QRコード</label>
                <input
                  type="text"
                  value={selectedAsset?.qrCode || ''}
                  readOnly
                  className="w-full px-3 py-2 text-sm bg-surface-disabled border border-stroke-input rounded-md text-content-primary tabular-nums outline-none"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-content-sub mb-1">実施者名</label>
                <input
                  type="text"
                  value={inspectorName}
                  readOnly
                  className="w-full px-3 py-2 text-sm bg-surface-disabled border border-stroke-input rounded-md text-content-primary outline-none"
                />
              </div>
            </div>

            {/* 機器タグバッジ */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-2.5 py-1 text-xs border border-stroke-input rounded-full text-[#4A4A4A] bg-white">{selectedAsset?.largeClass}</span>
              <span className="px-2.5 py-1 text-xs border border-stroke-input rounded-full text-[#4A4A4A] bg-white">{selectedAsset?.mediumClass}</span>
              <span className="px-2.5 py-1 text-xs border border-stroke-input rounded-full text-[#4A4A4A] bg-white">{selectedAsset?.item}/{selectedAsset?.maker}/ {selectedAsset?.model}</span>
            </div>

            {/* タイミング点検 */}
            <h3 className="text-sm font-bold text-content-primary mb-2">タイミング点検</h3>
            <div className="flex gap-4 mb-6">
              {(['使用前', '使用中', '使用後'] as const).map((timing) => (
                <label key={timing} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="usageTiming"
                    value={timing}
                    checked={usageTiming === timing}
                    onChange={() => setUsageTiming(timing)}
                    className="accent-cta-primary size-4 cursor-pointer"
                  />
                  <span className="text-sm text-content-primary">{timing}</span>
                </label>
              ))}
            </div>

            {/* 点検メニュー */}
            <h3 className="text-sm font-bold text-content-primary mb-2">点検メニュー</h3>
            <select
              value={selectedMenuId}
              onChange={(e) => setSelectedMenuId(e.target.value)}
              className={`w-full px-3 py-2.5 text-sm rounded-md outline-none transition-colors bg-white cursor-pointer ${
                filteredMenus.length === 0
                  ? 'border-2 border-[#DA0000] text-[#DA0000]'
                  : 'border border-stroke-input text-content-primary focus:border-cta-primary'
              }`}
            >
              <option value="">選択してください</option>
              {filteredMenus.map((menu) => (
                <option key={menu.id} value={menu.id}>{menu.name}</option>
              ))}
            </select>
            {filteredMenus.length === 0 && (
              <p className="text-xs text-[#DA0000] mt-1.5 text-pretty">
                この商品の「{usageTiming}」点検メニューが登録されていません
              </p>
            )}
          </div>

          {/* 点検実施カード */}
          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
            <p className="text-sm text-content-primary mb-4 text-pretty">
              対象点検、点検メニューにまちがないか確認して点検を実施してください
            </p>

            {/* 点検項目テーブル */}
            <div className="border border-stroke-card rounded-md overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-surface-screen">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-content-sub border-b border-stroke-card">項目</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-content-sub border-b border-stroke-card border-l border-stroke-card">内容点検</th>
                      <th className="px-3 py-2.5 border-b border-stroke-card border-l border-stroke-card w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemResults.map((item, index) => (
                      <tr key={index} className="border-b border-stroke-card last:border-b-0">
                        <td className="px-3 py-2.5 text-sm text-content-primary border border-stroke-input">{item.itemName}</td>
                        <td className="px-3 py-2.5 text-sm text-content-primary border-l border-stroke-card">{item.content}</td>
                        <td className="px-3 py-2.5 border-l border-stroke-card">
                          {/* REQ-103: 評価項目の入力形式を 3 パターンで切替（定例0413 確定） */}
                          {item.evaluationType === '単位' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                className="w-[60px] px-2 py-1 text-sm text-right border border-stroke-input rounded outline-none focus:border-cta-primary tabular-nums"
                                value={item.result}
                                onChange={(e) => handleItemResultChange(index, e.target.value)}
                                placeholder="入力し..."
                              />
                              <span className="text-xs text-content-sub">{item.unit}</span>
                            </div>
                          ) : item.evaluationType === 'フリー入力' ? (
                            <input
                              type="text"
                              className="w-[200px] px-2 py-1 text-sm border border-stroke-input rounded outline-none focus:border-cta-primary"
                              value={item.result}
                              onChange={(e) => handleItemResultChange(index, e.target.value)}
                              placeholder="自由記述"
                            />
                          ) : (
                            // 合否（マルバツ） — デフォルト
                            <div className="flex gap-1">
                              {['○', '×'].map((val) => {
                                const base = 'px-3 py-1.5 text-xs rounded border cursor-pointer transition-colors min-w-[44px] min-h-[32px]';
                                const active = item.result === val;
                                const color = val === '○'
                                  ? 'border-cta-primary bg-[#EBF5EE] text-cta-primary-dark'
                                  : 'border-[#DA0000] bg-[#FDF1E5] text-[#DA0000]';
                                return (
                                  <button
                                    key={val}
                                    className={`${base} ${active ? color : 'border-stroke-input bg-white text-content-primary hover:bg-surface-screen'}`}
                                    onClick={() => handleItemResultChange(index, val)}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 備考 */}
            <div className="mb-6">
              <label className="block text-xs text-content-sub mb-1">備考（部品交換等）</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="入力してください"
                className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary transition-colors text-content-primary"
              />
            </div>

            {/* 総合評価 */}
            <h3 className="text-sm font-bold text-content-primary mb-3">総合評価</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleShowConfirm('合格')}
                className="flex-1 py-3 text-sm font-bold text-white bg-cta-primary border-0 rounded-md cursor-pointer hover:opacity-90 transition-colors"
              >
                合格（使用可）
              </button>
              <button
                onClick={() => handleShowConfirm('異常あり')}
                className="flex-1 py-3 text-sm font-bold text-white bg-[#DA0000] border-0 rounded-md cursor-pointer hover:bg-[#DA0000] transition-colors"
              >
                異常あり（使用停止へ）
              </button>
            </div>
          </div>

          {/* 戻るボタン */}
          <div className="mt-4">
            <button
              onClick={handleBack}
              className="w-full py-3 text-sm font-medium text-[#4A4A4A] bg-[#E1E1E1] border-0 rounded-md cursor-pointer hover:bg-[#E1E1E1] transition-colors"
            >
              戻る
            </button>
          </div>
        </div>

        <PageFooter />
      </div>
    );
  }

  // ========== 確認ステップ ==========

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <PageHeader />

      <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        <h1 className="text-lg font-bold text-content-primary mb-4 text-balance">
          点検完了
        </h1>

        <div className="space-y-4">
          {/* 総合評価カード */}
          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
            <h2 className="text-sm font-bold text-content-primary mb-2">総合評価</h2>
            <div className={`text-2xl font-bold ${overallResult === '合格' ? 'text-cta-primary-dark' : 'text-[#DA0000]'}`}>
              {overallResult}
            </div>
          </div>

          {/* 点検対象機器カード */}
          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
            <h2 className="text-sm font-bold text-content-primary mb-3">点検対象機器</h2>
            <div className="border border-stroke-card rounded-md overflow-hidden">
              <div className="grid grid-cols-3">
                <div className="px-3 py-2 border-b border-stroke-card">
                  <div className="text-[10px] text-content-sub">QRコード</div>
                  <div className="text-sm font-semibold text-content-primary tabular-nums">{selectedAsset?.qrCode}</div>
                </div>
                <div className="px-3 py-2 border-b border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">大分類</div>
                  <div className="text-sm font-semibold text-content-primary">{selectedAsset?.largeClass}</div>
                </div>
                <div className="px-3 py-2 border-b border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">中分類</div>
                  <div className="text-sm font-semibold text-content-primary">{selectedAsset?.mediumClass}</div>
                </div>
              </div>
              <div className="grid grid-cols-3">
                <div className="px-3 py-2">
                  <div className="text-[10px] text-content-sub">品目</div>
                  <div className="text-sm font-semibold text-content-primary">{selectedAsset?.item}</div>
                </div>
                <div className="px-3 py-2 border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">メーカー</div>
                  <div className="text-sm font-semibold text-content-primary">{selectedAsset?.maker}</div>
                </div>
                <div className="px-3 py-2 border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">形式</div>
                  <div className="text-sm font-semibold text-content-primary">{selectedAsset?.model}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 点検情報カード */}
          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
            <h2 className="text-sm font-bold text-content-primary mb-3">点検情報</h2>
            <div className="border border-stroke-card rounded-md overflow-hidden">
              <div className="grid grid-cols-3">
                <div className="px-3 py-2 border-b border-stroke-card">
                  <div className="text-[10px] text-content-sub">種類検査</div>
                  <div className="text-sm font-semibold text-content-primary">日常点検</div>
                </div>
                <div className="px-3 py-2 border-b border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">タイミング</div>
                  <div className="text-sm font-semibold text-content-primary">{usageTiming}</div>
                </div>
                <div className="px-3 py-2 border-b border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">点検メニュー</div>
                  <div className="text-sm font-semibold text-content-primary">{selectedMenu?.name || '（メニュー未選択）'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3">
                <div className="px-3 py-2">
                  <div className="text-[10px] text-content-sub">実施者</div>
                  <div className="text-sm font-semibold text-content-primary">{inspectorName}</div>
                </div>
                <div className="px-3 py-2 border-l border-stroke-card">
                  <div className="text-[10px] text-content-sub">実施日</div>
                  <div className="text-sm font-semibold text-content-primary tabular-nums">{today}</div>
                </div>
                <div className="px-3 py-2 border-l border-stroke-card"></div>
              </div>
            </div>
          </div>

          {/* 点検項目結果カード */}
          <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">
            <h2 className="text-sm font-bold text-content-primary mb-3">点検項目結果</h2>
            <div className="border border-stroke-card rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="bg-surface-screen">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-content-sub border-b border-stroke-card">項目</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-content-sub border-b border-stroke-card border-l border-stroke-card">内容点検</th>
                      <th className="px-3 py-2.5 border-b border-stroke-card border-l border-stroke-card w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemResults.map((item, index) => (
                      <tr key={index} className="border-b border-stroke-card last:border-b-0">
                        <td className="px-3 py-2.5 text-sm text-content-primary border border-stroke-input">{item.itemName}</td>
                        <td className="px-3 py-2.5 text-sm text-content-primary border-l border-stroke-card">{item.content}</td>
                        <td className={`px-3 py-2.5 text-sm text-center font-semibold border-l border-stroke-card ${
                          item.result === '○' ? 'text-cta-primary-dark' : item.result === '×' ? 'text-[#DA0000]' : 'text-content-primary'
                        }`}>
                          {item.unit ? `${item.result} ${item.unit}` : item.result || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ボタンエリア */}
        <div className="mt-6 space-y-3">
          <button
            onClick={overallResult === '異常あり' ? handleRepairRequest : handleFinish}
            className="w-full py-3 text-sm font-bold text-white bg-cta-primary border-0 rounded-md cursor-pointer hover:opacity-90 transition-colors"
          >
            完了
          </button>
          <button
            onClick={handleNextInspection}
            className="w-full py-3 text-sm font-bold text-content-primary bg-white border border-stroke-card rounded-md cursor-pointer hover:bg-surface-screen transition-colors"
          >
            次の点検
          </button>
        </div>

        {/* 報告書出力（セパレート） */}
        <div className="mt-6">
          <button
            onClick={handleExportReport}
            disabled={isExporting}
            className={`w-full py-3 text-sm font-bold rounded-md transition-colors ${
              isExporting
                ? 'text-content-sub bg-surface-disabled border border-stroke-input cursor-not-allowed'
                : 'text-cta-primary-dark bg-white border border-cta-primary cursor-pointer hover:bg-[#EBF5EE]'
            }`}
          >
            {isExporting ? '出力中...' : '修理申請へ'}
          </button>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}

export default function DailyInspectionPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <DailyInspectionContent />
    </Suspense>
  );
}
