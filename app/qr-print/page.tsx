'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { QRCodePlaceholder } from '@/components/ui/QRCodePlaceholder';

function QRPrintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useResponsive();

  const [printer, setPrinter] = useState('sr5900p');
  const [qrNumbers, setQrNumbers] = useState<string[]>([]);
  const [template, setTemplate] = useState('');
  const [footerText, setFooterText] = useState('');
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  const isFormDirty = qrNumbers.length > 0;

  const handleHomeClick = () => {
    if (isFormDirty) {
      setShowHomeConfirm(true);
    } else {
      router.push('/main');
    }
  };

  useEffect(() => {
    const templateParam = searchParams.get('template') || 'qr-small';
    const startParam = searchParams.get('start') || '';
    const endParam = searchParams.get('end') || '';
    const footerParam = searchParams.get('footer') || '';

    setTemplate(templateParam);
    setFooterText(footerParam);

    if (startParam && endParam) {
      const numbers = generateQRNumberList(startParam, endParam);
      setQrNumbers(numbers);
    }
  }, [searchParams]);

  const generateQRNumberList = (start: string, end: string): string[] => {
    if (start === end) {
      return [start];
    }

    const startParts = start.split('-');
    const endParts = end.split('-');

    if (startParts.length !== 3 || endParts.length !== 3) {
      return [start];
    }

    const alpha = startParts[0];
    const twoDigit = startParts[1];
    const startNum = parseInt(startParts[2]);
    const endNum = parseInt(endParts[2]);

    const numbers: string[] = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = String(i).padStart(5, '0');
      numbers.push(`${alpha}-${twoDigit}-${numStr}`);
    }

    return numbers;
  };

  const getSealSizeFromTemplate = (templateKey: string): string => {
    const sizes: Record<string, string> = {
      'qr-12x12': '12mm幅',
      'qr-12x24': '12mm幅（長尺）',
      'qr-18x18': '18mm幅',
      'qr-18x24': '18mm幅（長尺）',
      'qr-24x24': '24mm幅',
      'qr-24x32': '24mm幅（長尺）',
    };
    return sizes[templateKey] || templateKey;
  };

  const handleCancel = () => {
    router.push('/qr-issue');
  };

  const handlePrintStart = () => {
    alert('印刷を開始します（この機能は実装予定）');
  };

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      {/* ヘッダー */}
      <header className="bg-surface-card border-b border-stroke-input px-4 py-3">
        <div className="flex items-center gap-3 max-w-[800px] mx-auto">
          <button
            onClick={() => router.push('/qr-issue')}
            className="text-sm text-content-sub bg-transparent border-0 cursor-pointer hover:text-content-primary transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            QRコード発行
          </button>
          <button
            onClick={handleHomeClick}
            className="ml-auto text-xs text-content-sub bg-transparent border-0 cursor-pointer hover:text-content-primary transition-colors"
          >
            メイン画面に戻る
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="w-full max-w-[800px] mx-auto px-3 py-6 sm:px-6">
        <h1 className="text-base font-bold text-content-primary mb-4 text-balance">QRコード印刷プレビュー</h1>

        <div className="bg-surface-card rounded-lg shadow-sm border border-stroke-input p-4 sm:p-6">
          {/* プレビュー */}
          <div className="pb-6 border-b border-stroke-input">
            <h2 className="text-sm font-bold text-content-primary mb-4">プレビュー</h2>

            <div className={`flex gap-6 ${isMobile ? 'flex-col items-center' : 'items-start'}`}>
              {/* QRコード画像 */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-[100px] h-[100px] border border-stroke-input rounded bg-surface-card flex items-center justify-center p-2">
                  <QRCodePlaceholder size={80} />
                </div>
                <span className="text-xs font-bold text-cta-primary tabular-nums">
                  {qrNumbers.length > 0 ? qrNumbers[0] : ''}
                </span>
                {footerText && (
                  <span className="text-[10px] text-content-sub text-center max-w-[120px] truncate">
                    {footerText}
                  </span>
                )}
              </div>

              {/* 設定 */}
              <div className={`flex flex-col gap-4 ${isMobile ? 'w-full' : 'flex-1'}`}>
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">プリンタ</label>
                  <select
                    value={printer}
                    onChange={(e) => setPrinter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stroke-input rounded-md outline-none focus:border-cta-primary bg-surface-card cursor-pointer"
                  >
                    <option value="sr5900p">TEPRA SR5900P (USB接続)</option>
                    <option value="sr970">TEPRA SR970 (Bluetooth)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-content-primary mb-1">シールサイズ</label>
                  <div className="w-full px-3 py-2 text-sm border border-stroke-input rounded-md bg-surface-screen text-content-primary">
                    {getSealSizeFromTemplate(template)}
                  </div>
                  <p className="text-[10px] text-content-sub mt-1">
                    ※前の画面で設定したテンプレートに基づいて表示されます
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 印刷対象リスト */}
          <div className="pt-6">
            <h2 className="text-sm font-bold text-content-primary mb-3">印刷対象リスト</h2>

            <div className="border border-stroke-input rounded-md overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-surface-screen">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-content-sub border-b border-stroke-input sticky top-0 bg-surface-screen w-[60px]">No.</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-content-sub border-b border-stroke-input sticky top-0 bg-surface-screen">QR番号</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-content-sub border-b border-stroke-input sticky top-0 bg-surface-screen">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qrNumbers.map((number, index) => (
                      <tr key={index} className={index < qrNumbers.length - 1 ? 'border-b border-stroke-card' : ''}>
                        <td className="px-3 py-2 text-xs text-content-sub tabular-nums">{index + 1}</td>
                        <td className="px-3 py-2 text-xs font-semibold text-cta-primary tabular-nums font-mono">{number}</td>
                        <td className="px-3 py-2 text-xs text-content-sub">印刷待機中</td>
                      </tr>
                    ))}
                    {qrNumbers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-xs text-content-sub">
                          印刷対象がありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ボタン */}
        <div className={`mt-4 flex gap-3 ${isMobile ? 'flex-col' : 'justify-end'}`}>
          <button
            onClick={handleCancel}
            className={`py-2.5 text-sm font-bold text-content-primary bg-stroke-input border-0 rounded-md cursor-pointer hover:bg-stroke-input transition-colors ${isMobile ? 'w-full order-2' : 'px-8'}`}
          >
            キャンセル
          </button>
          <button
            onClick={handlePrintStart}
            className={`py-2.5 text-sm font-bold text-white bg-cta-primary border-0 rounded-md cursor-pointer hover:bg-cta-primary-dark transition-colors ${isMobile ? 'w-full order-1' : 'px-8'}`}
          >
            印刷を開始
          </button>
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
        message="印刷フローを中断してメイン画面に戻りますか？"
        confirmLabel="メイン画面に戻る"
        cancelLabel="印刷を続ける"
        variant="warning"
      />
    </div>
  );
}

export default function QRPrintPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <QRPrintContent />
    </Suspense>
  );
}
