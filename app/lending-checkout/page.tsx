'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useToast } from '@/components/ui/Toast';
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock';
import { Header } from '@/components/layouts';

// 4段階ステータス
type DeviceStatus = 'available' | 'lending' | 'in_use' | 'used';

// 処理種別
type ProcessedAction = 'lend' | 'return' | 'start_use' | 'end_use';

// 担当者マスタモック
const MOCK_USERS: { [id: string]: { name: string; department: string } } = {
  '1': { name: '山田太郎', department: '3階東病棟' },
  '2': { name: '佐藤花子', department: 'ICU' },
  '3': { name: '鈴木一郎', department: 'ME室' },
  '4': { name: '田中美咲', department: '手術室' },
};

// 機器マスタモック（状態付き）
interface DeviceInfo {
  name: string;
  manufacturer: string;
  model: string;
  meNo: string;
  status: DeviceStatus;
  lendingInfo?: {
    department: string;
    lendingDate: string;
    returnDueDate: string;
  };
}

// 機器モックデータ（4ステータスを網羅）
const MOCK_DEVICES: { [qrCode: string]: DeviceInfo } = {
  '1': {
    name: '輸液ポンプ',
    manufacturer: 'テルモ',
    model: 'TE-161S',
    meNo: 'ME-0001',
    status: 'available',
  },
  '2': {
    name: 'シリンジポンプ',
    manufacturer: 'テルモ',
    model: 'TE-331S',
    meNo: 'ME-0002',
    status: 'lending',
    lendingInfo: {
      department: 'ICU',
      lendingDate: '2026/2/28',
      returnDueDate: '2026/3/6',
    },
  },
  '3': {
    name: 'ベッドサイドモニター',
    manufacturer: 'フクダ電子',
    model: 'DS-8500',
    meNo: 'ME-0003',
    status: 'in_use',
    lendingInfo: {
      department: '手術室',
      lendingDate: '2026/3/1',
      returnDueDate: '2026/3/14',
    },
  },
  '4': {
    name: 'パルスオキシメーター',
    manufacturer: 'コニカミノルタ',
    model: 'PULSOX-Neo',
    meNo: 'ME-0004',
    status: 'used',
    lendingInfo: {
      department: '3階東病棟',
      lendingDate: '2026/2/1',
      returnDueDate: '2026/2/15',
    },
  },
};

// ステータスラベル
const STATUS_LABELS: Record<DeviceStatus, string> = {
  available: '貸出可',
  lending: '貸出中',
  in_use: '使用中',
  used: '使用済',
};

// ステータスに応じたバッジスタイル
const STATUS_STYLES: Record<DeviceStatus, string> = {
  available: 'bg-[#EBF5EE] text-[#146E2E] border-cta-primary',
  lending: 'bg-[#EBF5EE] text-[#4A4A4A] border-[#087CB6]',
  in_use: 'bg-[#FAFAFA] text-[#4A4A4A] border-[#4A4A4A]',
  used: 'bg-[#FDF1E5] text-[#DA0000] border-[#DA0000]',
};

export default function LendingCheckoutPage() {
  const router = useRouter();
  const { isMobile, isTablet } = useResponsive();
  const { showToast } = useToast();

  // 入力状態
  const [qrLabel, setQrLabel] = useState('');
  const [userId, setUserId] = useState('');
  const [isReturnDateModalOpen, setIsReturnDateModalOpen] = useState(false);
  const [returnDate, setReturnDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  });

  // 処理完了状態
  const [isProcessed, setIsProcessed] = useState(false);
  const [processedAction, setProcessedAction] = useState<ProcessedAction | null>(null);

  // ドラムロール用の一時状態
  const [tempYear, setTempYear] = useState('');
  const [tempMonth, setTempMonth] = useState('');
  const [tempDay, setTempDay] = useState('');

  // ドラムロールのスクロール参照
  const yearScrollRef = useRef<HTMLDivElement>(null);
  const monthScrollRef = useRef<HTMLDivElement>(null);
  const dayScrollRef = useRef<HTMLDivElement>(null);

  const ITEM_HEIGHT = 44;

  // モーダル表示時のbodyスクロールロック
  useBodyScrollLock(isReturnDateModalOpen);

  // 担当者情報（IDから自動取得）
  const userInfo = useMemo(() => {
    return MOCK_USERS[userId] || null;
  }, [userId]);

  // 機器情報（QRから取得）
  const deviceInfo = useMemo(() => {
    return MOCK_DEVICES[qrLabel] || null;
  }, [qrLabel]);

  // 年の選択肢（今年〜来年）
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear; y <= currentYear + 1; y++) {
      years.push(y.toString());
    }
    return years;
  }, []);

  // 月の選択肢
  const monthOptions = useMemo(() => {
    const months: string[] = [];
    for (let m = 1; m <= 12; m++) {
      months.push(m.toString());
    }
    return months;
  }, []);

  // 日の選択肢（選択された年月に応じて変動）
  const dayOptions = useMemo(() => {
    const days: string[] = [];
    const year = tempYear ? parseInt(tempYear, 10) : new Date().getFullYear();
    const month = tempMonth ? parseInt(tempMonth, 10) : new Date().getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d.toString());
    }
    return days;
  }, [tempYear, tempMonth]);

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatShortDate = (date: Date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // モーダルを開く際に現在の値をセット
  const openDatePicker = () => {
    setTempYear(returnDate.getFullYear().toString());
    setTempMonth((returnDate.getMonth() + 1).toString());
    setTempDay(returnDate.getDate().toString());
    setIsReturnDateModalOpen(true);
  };

  // モーダルでの選択を確定
  const confirmDatePicker = () => {
    const year = parseInt(tempYear, 10);
    const month = parseInt(tempMonth, 10);
    const day = parseInt(tempDay, 10);
    const newDate = new Date(year, month - 1, day);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (newDate < tomorrow) {
      showToast('明日以降の日付を選択してください', 'warning');
      return;
    }

    setReturnDate(newDate);
    setIsReturnDateModalOpen(false);
    showToast(`返却予定日を${formatShortDate(newDate)}に変更しました`, 'success');
  };

  const cancelDatePicker = () => {
    setIsReturnDateModalOpen(false);
  };

  // スクロール位置を選択値に基づいて設定
  useEffect(() => {
    if (isReturnDateModalOpen) {
      setTimeout(() => {
        if (yearScrollRef.current) {
          const index = yearOptions.indexOf(tempYear);
          if (index >= 0) {
            yearScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
        if (monthScrollRef.current) {
          const index = monthOptions.indexOf(tempMonth);
          if (index >= 0) {
            monthScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
        if (dayScrollRef.current) {
          const index = dayOptions.indexOf(tempDay);
          if (index >= 0) {
            dayScrollRef.current.scrollTop = index * ITEM_HEIGHT;
          }
        }
      }, 100);
    }
  }, [isReturnDateModalOpen, tempYear, tempMonth, tempDay, yearOptions, monthOptions, dayOptions]);

  const handleYearScroll = () => {
    if (!yearScrollRef.current) return;
    const scrollTop = yearScrollRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < yearOptions.length) {
      setTempYear(yearOptions[index]);
    }
  };

  const handleMonthScroll = () => {
    if (!monthScrollRef.current) return;
    const scrollTop = monthScrollRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < monthOptions.length) {
      setTempMonth(monthOptions[index]);
    }
  };

  const handleDayScroll = () => {
    if (!dayScrollRef.current) return;
    const scrollTop = dayScrollRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (index >= 0 && index < dayOptions.length) {
      setTempDay(dayOptions[index]);
    }
  };

  // QR読取ハンドラー
  const handleQRScan = () => {
    showToast('QR読取機能を起動中...', 'info');
    setTimeout(() => {
      const codes = ['1', '2', '3', '4'];
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      setQrLabel(randomCode);
      setIsProcessed(false);
      setProcessedAction(null);
      showToast('QRコードを読み取りました', 'success');
    }, 500);
  };

  // バーコード読取ハンドラー
  const handleBarcodeScan = () => {
    showToast('バーコード読取機能を起動中...', 'info');
    setTimeout(() => {
      setUserId('1');
      showToast('バーコードを読み取りました', 'success');
    }, 500);
  };

  // 貸出処理（事務）
  const handleLending = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('lend');
    showToast(`${deviceInfo?.name}を${userInfo.department}へ貸出しました`, 'success');
  };

  // 返却処理（事務）
  const handleReturn = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('return');
    showToast(`${deviceInfo?.name}の返却を受け付けました`, 'success');
  };

  // 使用開始（臨床）
  const handleStartUse = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('start_use');
    showToast(`${deviceInfo?.name}の使用を開始しました`, 'success');
  };

  // 使用終了（臨床）
  const handleEndUse = () => {
    if (!userInfo) {
      showToast('担当者IDを入力してください', 'warning');
      return;
    }
    setIsProcessed(true);
    setProcessedAction('end_use');
    showToast(`${deviceInfo?.name}の使用を終了しました`, 'success');
  };

  // 次の機器へ
  const handleNextDevice = () => {
    setQrLabel('');
    setUserId('');
    setIsProcessed(false);
    setProcessedAction(null);
  };

  // 完了メッセージ
  const getCompletionTitle = (): string => {
    switch (processedAction) {
      case 'lend': return '貸出完了';
      case 'return': return '返却完了';
      case 'start_use': return '使用開始登録完了';
      case 'end_use': return '使用終了登録完了';
      default: return '完了';
    }
  };

  const getCompletionDescription = (): string => {
    if (!deviceInfo) return '';
    switch (processedAction) {
      case 'lend': return `${deviceInfo.name}${userInfo ? ` → ${userInfo.department}` : ''}`;
      case 'return': return `${deviceInfo.name}の返却を受け付けました`;
      case 'start_use': return `${deviceInfo.name}の使用を開始しました`;
      case 'end_use': return `${deviceInfo.name}の使用を終了しました`;
      default: return '';
    }
  };

  // 返却予定日を設定可能か（貸出可: 新規設定、貸出中: 表示+変更可）
  const showReturnDate = deviceInfo && (
    deviceInfo.status === 'available' || deviceInfo.status === 'lending'
  );

  // 貸出情報を表示のみ（使用中、使用済）
  const showLendingInfoReadonly = deviceInfo && deviceInfo.lendingInfo && (
    deviceInfo.status === 'in_use' || deviceInfo.status === 'used'
  );

  // アクションボタンのラベル
  const getActionLabel = (): string => {
    if (!deviceInfo) return '';
    switch (deviceInfo.status) {
      case 'available': return '貸出する';
      case 'lending': return '使用を開始する';
      case 'in_use': return '使用を終了する';
      case 'used': return '返却する';
      default: return '';
    }
  };

  // アクションボタンのハンドラー
  const getActionHandler = () => {
    if (!deviceInfo) return () => {};
    switch (deviceInfo.status) {
      case 'available': return handleLending;
      case 'lending': return handleStartUse;
      case 'in_use': return handleEndUse;
      case 'used': return handleReturn;
      default: return () => {};
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-surface-screen">
      {/* 共通ヘッダー */}
      <Header
        title="貸出・返却"
        showBackButton={true}
        backHref="/main"
        backLabel="メイン画面に戻る"
        hideMenu={true}
      />

      {/* メインコンテンツ */}
      <div className="flex-1 w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        <div className="bg-white rounded-lg shadow-sm border border-stroke-card p-4 sm:p-6">

          {/* QRラベル入力セクション */}
          <div className="pb-6 border-b border-stroke-card">
            <h2 className="text-sm font-bold text-content-primary mb-3">機器のQRコードを読み取る</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrLabel}
                onChange={(e) => {
                  setQrLabel(e.target.value);
                  setIsProcessed(false);
                  setProcessedAction(null);
                }}
                placeholder="例: 1（貸出可）/ 2（貸出中）/ 3（使用中）/ 4（使用済）"
                className="flex-1 px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary focus:ring-1 focus:ring-[#008C1D]/20 transition-colors"
              />
              {(isTablet || isMobile) && (
                <button
                  onClick={handleQRScan}
                  className="px-4 py-2.5 bg-cta-primary text-white text-sm font-medium border-0 rounded-md cursor-pointer hover:opacity-90 transition-colors whitespace-nowrap"
                >
                  QR読取
                </button>
              )}
            </div>
          </div>

          {/* 機器情報・操作セクション */}
          {deviceInfo && !isProcessed && (
            <>
              {/* 機器情報 */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">機器情報</h2>
                <div className="bg-surface-select border border-cta-primary rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="text-base font-bold text-content-primary">{deviceInfo.name}</div>
                      <div className="text-xs text-content-sub mt-0.5">
                        {deviceInfo.manufacturer} / {deviceInfo.model}
                      </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded border ${STATUS_STYLES[deviceInfo.status]}`}>
                      {STATUS_LABELS[deviceInfo.status]}
                    </span>
                  </div>
                  <div className="text-xs text-content-sub">
                    ME管理No: <span className="font-semibold text-[#4A4A4A] tabular-nums">{deviceInfo.meNo}</span>
                  </div>
                  {showLendingInfoReadonly && deviceInfo.lendingInfo && (
                    <div className="mt-2 pt-2 border-t border-cta-primary text-xs text-content-sub">
                      貸出日: <span className="tabular-nums">{deviceInfo.lendingInfo.lendingDate}</span> ／
                      返却予定: <span className="tabular-nums">{deviceInfo.lendingInfo.returnDueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 担当者ID入力 */}
              <div className="py-6 border-b border-stroke-card">
                <h2 className="text-sm font-bold text-content-primary mb-3">担当者ID</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="例: 1 / 2 / 3 / 4"
                    className="flex-1 px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary focus:ring-1 focus:ring-[#008C1D]/20 transition-colors"
                  />
                  {(isTablet || isMobile) && (
                    <button
                      onClick={handleBarcodeScan}
                      className="px-4 py-2.5 bg-content-sub text-white text-sm font-medium border-0 rounded-md cursor-pointer hover:opacity-90 transition-colors whitespace-nowrap"
                    >
                      バーコード
                    </button>
                  )}
                </div>
                {userInfo && (
                  <div className="mt-2 text-sm font-semibold text-cta-primary-dark">
                    {userInfo.name}（{userInfo.department}）
                  </div>
                )}
              </div>

              {/* 返却予定日（貸出可/貸出中のときのみ） */}
              {showReturnDate && (
                <div className="py-6 border-b border-stroke-card">
                  <h2 className="text-sm font-bold text-content-primary mb-3">返却予定日</h2>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-content-primary tabular-nums">
                      {deviceInfo.status === 'lending' && deviceInfo.lendingInfo
                        ? deviceInfo.lendingInfo.returnDueDate
                        : formatDate(returnDate)
                      }
                    </span>
                    <button
                      onClick={openDatePicker}
                      className="px-4 py-2 bg-content-sub text-white text-sm font-medium border-0 rounded-md cursor-pointer hover:opacity-90 transition-colors"
                    >
                      変更
                    </button>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="pt-6">
                <button
                  onClick={getActionHandler()}
                  disabled={!userInfo}
                  className={`w-full py-3.5 text-base font-bold border-0 rounded-md transition-colors ${
                    userInfo
                      ? 'bg-cta-primary text-white cursor-pointer hover:opacity-90'
                      : 'bg-surface-disabled text-content-sub cursor-not-allowed'
                  }`}
                >
                  {getActionLabel()}
                </button>
              </div>
            </>
          )}

          {/* 処理完了表示 */}
          {isProcessed && deviceInfo && (
            <div className="py-6">
              <div className="text-center mb-6">
                <div className="text-cta-primary-dark text-lg font-bold mb-1">{getCompletionTitle()}</div>
                <div className="text-sm text-content-sub">{getCompletionDescription()}</div>
              </div>

              {/* 完了時の機器情報カード */}
              <div className="bg-surface-select border border-cta-primary rounded-lg p-4 mb-6">
                <div className="text-base font-bold text-content-primary mb-1">{deviceInfo.name}</div>
                <div className="text-xs text-content-sub">
                  {deviceInfo.manufacturer} / {deviceInfo.model}
                </div>
                <div className="text-xs text-content-sub mt-1">
                  ME管理No: <span className="font-semibold text-[#4A4A4A] tabular-nums">{deviceInfo.meNo}</span>
                </div>
              </div>

              <div className="text-center">
                <span
                  onClick={handleNextDevice}
                  className="text-sm text-cta-primary-dark font-semibold underline cursor-pointer hover:text-[#008C1D] transition-colors"
                >
                  次の機器を処理
                </span>
              </div>
            </div>
          )}

          {/* 初期状態（機器未選択） */}
          {!deviceInfo && !isProcessed && (
            <div className="py-12 text-center">
              <div className="w-20 h-16 mx-auto mb-4 bg-surface-disabled rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-content-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-sm text-content-sub text-pretty">
                機器のQRコードを読み取ってください
              </div>
              <div className="text-xs text-content-sub mt-2 text-pretty">
                機器の状態に応じて貸出・返却・使用開始・使用終了を行います
              </div>
            </div>
          )}
        </div>

        {/* 戻るボタン */}
        <div className="mt-4">
          <button
            onClick={() => router.push('/main')}
            className="px-8 py-2.5 bg-surface-disabled text-sm font-medium text-[#4A4A4A] rounded-md border-0 cursor-pointer hover:bg-[#E1E1E1] transition-colors"
          >
            戻る
          </button>
        </div>
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>

      {/* 返却予定日変更モーダル（ドラムロール式） */}
      {isReturnDateModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-5"
          onClick={cancelDatePicker}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[400px] shadow-lg overflow-hidden overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-stroke-card">
              <button
                onClick={cancelDatePicker}
                className="bg-transparent border-0 text-base text-content-sub cursor-pointer px-1 py-1"
              >
                キャンセル
              </button>
              <span className="text-base font-bold text-content-primary">
                返却予定日
              </span>
              <button
                onClick={confirmDatePicker}
                className="bg-transparent border-0 text-base text-cta-primary-dark font-bold cursor-pointer px-1 py-1"
              >
                完了
              </button>
            </div>

            {/* 年月日ヘッダー */}
            <div className="flex px-2.5 py-2 border-b border-stroke-card bg-[#FAFAFA]">
              <div className="flex-1 text-center text-[13px] font-bold text-content-sub">年</div>
              <div className="flex-1 text-center text-[13px] font-bold text-content-sub">月</div>
              <div className="flex-1 text-center text-[13px] font-bold text-content-sub">日</div>
            </div>

            {/* ドラムロール */}
            <div className="flex h-[200px] relative overflow-hidden">
              {/* 選択行ハイライト */}
              <div
                className="absolute left-2.5 right-2.5 bg-surface-select rounded-lg pointer-events-none z-[1]"
                style={{
                  top: '50%',
                  height: `${ITEM_HEIGHT}px`,
                  transform: 'translateY(-50%)',
                }}
              />

              {/* 年カラム */}
              <div className="flex-1 relative">
                <div
                  ref={yearScrollRef}
                  onScroll={handleYearScroll}
                  className="h-full overflow-y-auto overscroll-contain"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(200 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(200 - ITEM_HEIGHT) / 2}px`,
                  }}
                >
                  {yearOptions.map(year => (
                    <div
                      key={year}
                      className="flex items-center justify-center relative z-[2] tabular-nums"
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        scrollSnapAlign: 'center',
                        fontSize: '18px',
                        color: tempYear === year ? '#008C1D' : '#4A4A4A',
                        fontWeight: tempYear === year ? 'bold' : 'normal',
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </div>
              </div>

              {/* 月カラム */}
              <div className="flex-1 relative">
                <div
                  ref={monthScrollRef}
                  onScroll={handleMonthScroll}
                  className="h-full overflow-y-auto overscroll-contain"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(200 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(200 - ITEM_HEIGHT) / 2}px`,
                  }}
                >
                  {monthOptions.map(month => (
                    <div
                      key={month}
                      className="flex items-center justify-center relative z-[2] tabular-nums"
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        scrollSnapAlign: 'center',
                        fontSize: '18px',
                        color: tempMonth === month ? '#008C1D' : '#4A4A4A',
                        fontWeight: tempMonth === month ? 'bold' : 'normal',
                      }}
                    >
                      {month}
                    </div>
                  ))}
                </div>
              </div>

              {/* 日カラム */}
              <div className="flex-1 relative">
                <div
                  ref={dayScrollRef}
                  onScroll={handleDayScroll}
                  className="h-full overflow-y-auto overscroll-contain"
                  style={{
                    scrollSnapType: 'y mandatory',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: `${(200 - ITEM_HEIGHT) / 2}px`,
                    paddingBottom: `${(200 - ITEM_HEIGHT) / 2}px`,
                  }}
                >
                  {dayOptions.map(day => (
                    <div
                      key={day}
                      className="flex items-center justify-center relative z-[2] tabular-nums"
                      style={{
                        height: `${ITEM_HEIGHT}px`,
                        scrollSnapAlign: 'center',
                        fontSize: '18px',
                        color: tempDay === day ? '#008C1D' : '#4A4A4A',
                        fontWeight: tempDay === day ? 'bold' : 'normal',
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* クイック選択 */}
            <div className="px-5 py-3 border-t border-stroke-card">
              <div className="text-xs text-content-sub mb-2">クイック選択:</div>
              <div className="flex gap-2 flex-wrap">
                {[7, 14, 21, 30].map(days => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + days);
                  return (
                    <button
                      key={days}
                      onClick={() => {
                        setTempYear(targetDate.getFullYear().toString());
                        setTempMonth((targetDate.getMonth() + 1).toString());
                        setTempDay(targetDate.getDate().toString());
                      }}
                      className="px-4 py-2 bg-white border border-cta-primary rounded-full text-[13px] cursor-pointer text-cta-primary-dark hover:bg-surface-select transition-colors"
                    >
                      {days}日後
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
