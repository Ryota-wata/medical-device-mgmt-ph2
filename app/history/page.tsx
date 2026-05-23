'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
interface HistoryCardData {
  id: number;
  labelNumber: string;
  item: string;
  maker: string;
  model: string;
  size: string;
}

function HistoryContent() {
  const router = useRouter();
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPerPageMenu, setShowPerPageMenu] = useState(false);

  const allHistoryData: HistoryCardData[] = [
    { id: 1, labelNumber: 'L-001234', item: '超音波診断装置', maker: 'オフィス機器GH', model: 'RES-500', size: '300×350×280' },
    { id: 2, labelNumber: 'L-001236', item: 'CTスキャナー', maker: 'イメージテック', model: 'CT-9000', size: '700×600×500' },
    { id: 3, labelNumber: 'L-001235', item: '心電図モニター', maker: 'メディカルデバイスタイムズ', model: 'ECG-100', size: '250×200×150' },
    { id: 4, labelNumber: 'L-001237', item: 'MRI装置', maker: 'ヘルスケアソリューションズ', model: 'MRI-300', size: '900×800×700' },
    { id: 5, labelNumber: 'L-001238', item: '血液分析装置', maker: 'バイオメディカルトレンド', model: 'BA-1500', size: '400×350×200' },
    { id: 6, labelNumber: 'L-001239', item: '業務用複合機', maker: 'オフィス機器', model: 'MFP-7000', size: '550×580×680' },
    { id: 7, labelNumber: 'L-001240', item: '電子カルテ端末', maker: 'メディカルIT', model: 'EHR-200', size: '320×220×30' },
    { id: 8, labelNumber: 'L-001241', item: '人工呼吸器', maker: 'DEF社', model: 'RES-500', size: '300×350×280' },
    { id: 9, labelNumber: 'L-001242', item: 'ノートPC', maker: 'XYZ社', model: 'NB-2000', size: '350×250×25' },
    { id: 10, labelNumber: 'L-001243', item: '事務デスク', maker: '家具工房', model: 'D-1200', size: '1200×700×720' },
    { id: 11, labelNumber: 'L-001244', item: '輸液ポンプ', maker: 'メディカル社', model: 'IP-400', size: '150×120×200' },
    { id: 12, labelNumber: 'L-001245', item: '除細動器', maker: 'ライフセーブ', model: 'AED-X1', size: '280×250×100' },
  ];

  const totalPages = Math.ceil(allHistoryData.length / perPage);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return allHistoryData.slice(start, start + perPage);
  }, [currentPage, perPage]);

  const startIndex = (currentPage - 1) * perPage + 1;
  const endIndex = Math.min(currentPage * perPage, allHistoryData.length);

  const allPageSelected = pageData.length > 0 && pageData.every(d => selectedCards.has(d.id));

  const handleSelectAll = () => {
    const newSelected = new Set(selectedCards);
    if (allPageSelected) {
      pageData.forEach(d => newSelected.delete(d.id));
    } else {
      pageData.forEach(d => newSelected.add(d.id));
    }
    setSelectedCards(newSelected);
  };

  const handleSelectCard = (id: number) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCards(newSelected);
  };

  const handleEdit = () => {
    if (selectedCards.size === 0) {
      alert('修正する項目を選択してください');
      return;
    }
    alert(`${selectedCards.size}件の修正を開始します`);
  };

  const handleReuse = () => {
    if (selectedCards.size === 0) {
      alert('再利用する項目を選択してください');
      return;
    }
    alert(`${selectedCards.size}件のデータを再利用します`);
    router.push('/asset-survey-integrated');
  };

  const handleBack = () => {
    router.push('/asset-survey-integrated');
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
    setShowPerPageMenu(false);
  };

  // ページネーション番号の生成
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4);
      if (currentPage > 4) pages.push('...');
      if (currentPage > 4 && currentPage < totalPages) pages.push(currentPage);
      if (currentPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return [...new Set(pages)];
  }, [totalPages, currentPage]);

  const selectedOnPage = pageData.filter(d => selectedCards.has(d.id)).length;

  const fields: { label: string; key: keyof HistoryCardData }[] = [
    { label: 'ラベル番号', key: 'labelNumber' },
    { label: '品目', key: 'item' },
    { label: 'メーカー', key: 'maker' },
    { label: '型式', key: 'model' },
    { label: 'サイズ（W×D×H）', key: 'size' },
  ];

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
          <h1 className="text-sm font-bold text-content-primary">登録履歴</h1>
          <div className="size-10" />
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="w-full max-w-[800px] mx-auto px-3 py-4 sm:px-6 flex-1">
        {/* ツールバー */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            {/* 全選択 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={handleSelectAll}
                className="size-4 accent-[#008C1D] cursor-pointer"
              />
              <span className="text-sm text-content-primary">全選択</span>
            </label>
            {/* ページ情報 + 件数選択 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-content-sub tabular-nums">{startIndex}-{endIndex} / {allHistoryData.length}P</span>
              <div className="relative">
                <button
                  onClick={() => setShowPerPageMenu(!showPerPageMenu)}
                  className="flex items-center gap-1 text-xs text-content-sub bg-transparent border-0 cursor-pointer hover:text-content-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {showPerPageMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowPerPageMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-surface-card border border-stroke-input rounded-md shadow-lg z-20 min-w-[80px]">
                      {[10, 30].map(n => (
                        <button
                          key={n}
                          onClick={() => handlePerPageChange(n)}
                          className={`w-full px-3 py-2 text-xs text-left border-0 cursor-pointer transition-colors ${
                            perPage === n ? 'text-cta-primary font-bold bg-surface-select' : 'text-content-primary bg-surface-card hover:bg-surface-screen'
                          }`}
                        >
                          {n}件
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 選択状態テキスト */}
          {selectedOnPage > 0 && (
            <p className="text-xs text-content-sub mb-2">
              ページ内のスレッド<span className="font-bold text-content-primary">{selectedOnPage}件</span>が選択されています。
            </p>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              disabled={selectedCards.size === 0}
              className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors ${
                selectedCards.size > 0
                  ? 'text-cta-primary border-cta-primary bg-surface-card cursor-pointer hover:bg-surface-select'
                  : 'text-content-sub border-stroke-input bg-surface-screen cursor-not-allowed'
              }`}
            >
              修正
            </button>
            <button
              onClick={handleReuse}
              disabled={selectedCards.size === 0}
              className={`px-4 py-1.5 text-xs font-bold rounded border transition-colors ${
                selectedCards.size > 0
                  ? 'text-cta-primary border-cta-primary bg-surface-card cursor-pointer hover:bg-surface-select'
                  : 'text-content-sub border-stroke-input bg-surface-screen cursor-not-allowed'
              }`}
            >
              再利用
            </button>
          </div>
        </div>

        {/* カードリスト */}
        <div className="flex flex-col gap-3">
          {pageData.map((card) => {
            const isSelected = selectedCards.has(card.id);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelectCard(card.id)}
                className={`text-left bg-surface-card rounded-lg border-0 cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-[#008C1D]' : 'ring-1 ring-[#E1E1E1]'
                }`}
              >
                {fields.map((field, i) => (
                  <div
                    key={field.key}
                    className={`flex items-center px-4 py-2.5 ${
                      i < fields.length - 1 ? 'border-b border-stroke-card' : ''
                    }`}
                  >
                    <span className="text-xs text-content-sub w-[100px] shrink-0">{field.label}</span>
                    <span className={`text-sm text-content-primary flex-1 ${field.key === 'labelNumber' || field.key === 'size' ? 'tabular-nums' : ''}`}>
                      {card[field.key]}
                    </span>
                    {/* チェックボックス（ラベル番号行のみ） */}
                    {field.key === 'labelNumber' && (
                      <div className={`size-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-cta-primary' : 'border-2 border-stroke-input bg-surface-card'
                      }`}>
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </button>
            );
          })}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-6">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="size-8 flex items-center justify-center text-xs text-content-sub bg-transparent border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-8 flex items-center justify-center text-xs text-content-sub bg-transparent border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &lsaquo;
            </button>
            {pageNumbers.map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="size-8 flex items-center justify-center text-xs text-content-sub">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`size-8 flex items-center justify-center text-xs rounded border-0 cursor-pointer transition-colors tabular-nums ${
                    currentPage === p
                      ? 'text-cta-primary font-bold bg-transparent'
                      : 'text-content-sub bg-transparent hover:text-content-primary'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-8 flex items-center justify-center text-xs text-content-sub bg-transparent border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="size-8 flex items-center justify-center text-xs text-content-sub bg-transparent border-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              &raquo;
            </button>
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="py-3 text-center text-xs text-content-sub">
        &copy;Copyright 2024 SHIP HEALTHCARE Research&amp;Consulting, INC. All rights reserved
      </footer>

    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh text-sm text-content-sub">読み込み中...</div>}>
      <HistoryContent />
    </Suspense>
  );
}
