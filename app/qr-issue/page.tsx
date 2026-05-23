'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/layouts/Header';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QRCodePlaceholder } from '@/components/ui/QRCodePlaceholder';

function QRIssueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { isMobile } = useResponsive();

  // 戻り先マッピング
  const backConfig = (() => {
    switch (from) {
      case 'inspection':
        return { href: '/quotation-data-box', label: '見積書管理に戻る' };
      default:
        return { href: '/main', label: 'メイン画面に戻る' };
    }
  })();
  const [tab, setTab] = useState<'new' | 'reissue'>('new');
  const [alpha, setAlpha] = useState('R');
  const [twoDigit, setTwoDigit] = useState('07');
  const [fiveDigit, setFiveDigit] = useState('00001');
  const [reissueNumber, setReissueNumber] = useState('');
  const [template, setTemplate] = useState('qr-12x12');
  const [footerText, setFooterText] = useState('');
  const [footerCharMax, setFooterCharMax] = useState(12);
  const [issueCount, setIssueCount] = useState(50);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const isFormDirty = footerText !== '' || reissueNumber !== '' || template !== 'qr-12x12' || issueCount !== 50 || tab !== 'new';

  const handleHomeClick = () => {
    if (isFormDirty) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  // フッター文字数制限を更新
  useEffect(() => {
    const limits: Record<string, number> = {
      'qr-12x12': 12,
      'qr-12x24': 12,
      'qr-18x18': 18,
      'qr-18x24': 18,
      'qr-24x24': 24,
      'qr-24x32': 24,
    };
    setFooterCharMax(limits[template] || 12);
  }, [template]);

  // 発行予定番号範囲を計算
  const calculateRange = () => {
    if (tab === 'reissue') {
      return { start: reissueNumber, end: reissueNumber, count: 1 };
    }

    const startNum = parseInt(fiveDigit) || 1;
    const endNum = startNum + issueCount - 1;
    const start = `${alpha}-${twoDigit}-${String(startNum).padStart(5, '0')}`;
    const end = `${alpha}-${twoDigit}-${String(endNum).padStart(5, '0')}`;
    return { start, end, count: issueCount };
  };

  const range = calculateRange();

  const handleGoToPrintPreview = () => {
    router.push(`/qr-print?template=${template}&start=${range.start}&end=${range.end}&footer=${encodeURIComponent(footerText)}`);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header
        title="QRコード発行"
        hideMenu={true}
        showBackButton={true}
        backHref={backConfig.href}
        backLabel={backConfig.label}
        backButtonVariant="secondary"
        hideHomeButton={backConfig.href === '/main'}
      />

      {/* メインコンテンツ */}
      <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        <p className="text-sm text-content-sub mb-4">資産管理用のQRコードを発行します</p>

        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-4 sm:p-6">
          {/* タブ切り替え（ラジオボタン） */}
          <div className="flex gap-6 mb-6">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="issueTab" checked={tab === 'new'} onChange={() => setTab('new')} className="accent-cta-primary size-4 cursor-pointer" />
              <span className={`text-sm ${tab === 'new' ? 'font-bold text-cta-primary' : 'text-content-primary'}`}>新規発行</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="issueTab" checked={tab === 'reissue'} onChange={() => setTab('reissue')} className="accent-cta-primary size-4 cursor-pointer" />
              <span className={`text-sm ${tab === 'reissue' ? 'font-bold text-cta-primary' : 'text-content-primary'}`}>再発行</span>
            </label>
          </div>

          {/* 新規発行タブ */}
          {tab === 'new' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-content-primary mb-2">
                QRコード番号 <span className="text-content-alert">*</span>
              </label>
              <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                <div className={isMobile ? 'w-full' : ''}>
                  <label className="block text-xs text-content-sub mb-1">アルファベット</label>
                  <select
                    value={alpha}
                    onChange={(e) => setAlpha(e.target.value)}
                    className="px-2.5 py-2 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary w-full sm:w-[80px] bg-surface-card"
                  >
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                </div>
                {!isMobile && <span className="text-lg text-content-sub mb-1.5">-</span>}
                <div className={isMobile ? 'w-full' : ''}>
                  <label className="block text-xs text-content-sub mb-1">2桁数字</label>
                  <input
                    type="text"
                    value={twoDigit}
                    onChange={(e) => setTwoDigit(e.target.value.slice(0, 2))}
                    maxLength={2}
                    placeholder="07"
                    className="px-2.5 py-2 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary w-full sm:w-[80px] tabular-nums"
                  />
                </div>
                {!isMobile && <span className="text-lg text-content-sub mb-1.5">-</span>}
                <div className={isMobile ? 'w-full' : ''}>
                  <label className="block text-xs text-content-sub mb-1">5桁数字（開始番号）</label>
                  <input
                    type="text"
                    value={fiveDigit}
                    onChange={(e) => setFiveDigit(e.target.value.slice(0, 5))}
                    maxLength={5}
                    placeholder="00001"
                    className="px-2.5 py-2 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary w-full sm:w-[120px] tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 再発行タブ */}
          {tab === 'reissue' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-content-primary mb-2">
                再発行したい番号を入力
              </label>
              <input
                type="text"
                value={reissueNumber}
                onChange={(e) => setReissueNumber(e.target.value)}
                placeholder="R-07-00001"
                className="px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary w-full max-w-[400px]"
              />
              <p className="text-xs text-content-sub mt-1.5">
                （社内で作成済みの番号を入力してください）
              </p>
            </div>
          )}

          {/* 発行枚数 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-content-primary mb-2">
              発行枚数 <span className="text-content-alert">*</span>
            </label>
            <input
              type="number"
              value={issueCount}
              onChange={(e) => setIssueCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              min={1}
              max={100}
              className="px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary w-full sm:w-[120px] tabular-nums"
            />
            <p className="text-xs text-content-sub mt-1.5">
              ※最大100枚まで一括発行可能です
            </p>
          </div>

          {/* 発行予定番号範囲 */}
          <div className="bg-surface-screen border border-stroke-input rounded-md p-4 mb-6">
            <div className="text-xs font-bold text-content-primary mb-2">発行予定番号範囲</div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-base font-bold text-content-primary tabular-nums">{range.start}</span>
              <span className="text-base text-content-sub">〜</span>
              <span className="text-base font-bold text-content-primary tabular-nums">{range.end}</span>
            </div>
          </div>

          {/* サイズ選択 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-content-primary mb-2">
              QRコードテンプレートを選択 <span className="text-content-alert">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: 'qr-12x12', label: '12×12mm' },
                { value: 'qr-12x24', label: '12×24mm' },
                { value: 'qr-18x18', label: '18×18mm' },
                { value: 'qr-18x24', label: '18×24mm' },
                { value: 'qr-24x24', label: '24×24mm' },
                { value: 'qr-24x32', label: '24×32mm' },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`flex flex-col items-center py-3 px-2 rounded-lg cursor-pointer transition-colors ${
                    template === item.value
                      ? 'border-2 border-cta-primary bg-surface-select'
                      : 'border border-stroke-input bg-surface-card hover:bg-surface-screen'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={item.value}
                    checked={template === item.value}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="sr-only"
                  />
                  <QRCodePlaceholder size={28} color={template === item.value ? '#008C1D' : '#8A8A8A'} className="mb-1.5" />
                  <span className={`text-xs font-bold ${template === item.value ? 'text-[#008C1D]' : 'text-content-primary'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* フリー記入項目 */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-content-primary mb-2">
              フリー記入項目
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value.slice(0, footerCharMax))}
              maxLength={footerCharMax}
              placeholder="テキストを入力"
              className="w-full px-3 py-2.5 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary transition-colors"
            />
            <p className="text-xs text-content-sub mt-1.5 text-right tabular-nums">
              {footerText.length} / {footerCharMax} 文字
            </p>
          </div>

          {/* ボタン */}
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'justify-end'}`}>
            <button
              onClick={() => router.push(backConfig.href)}
              className={`py-2.5 text-sm font-bold text-content-primary bg-surface-card border border-stroke-input rounded-md cursor-pointer hover:bg-surface-screen transition-colors ${isMobile ? 'w-full order-2' : 'px-8'}`}
            >
              キャンセル
            </button>
            <button
              onClick={handleGoToPrintPreview}
              className={`inline-flex items-center justify-center gap-1 py-2.5 text-sm font-bold text-white bg-cta-primary border-0 rounded-md cursor-pointer hover:bg-cta-primary-dark transition-colors ${isMobile ? 'w-full order-1' : 'px-8'}`}
            >
              印刷プレビューへ
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="mt-auto py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>

      <ConfirmDialog
        isOpen={showHomeConfirm}
        onClose={() => setShowHomeConfirm(false)}
        onConfirm={() => router.push('/main')}
        title="メイン画面に戻る"
        message="入力内容が破棄されます。メイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="入力を続ける"
        variant="warning"
      />
    </div>
  );
}

export default function QRIssuePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <QRIssueContent />
    </Suspense>
  );
}
