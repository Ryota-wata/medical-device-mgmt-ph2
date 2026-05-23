'use client';

import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { customerStep2Items } from '@/lib/data/customer/step2-ocr';

type AccountingCategoryType = '医療機器' | '什器備品' | '情報システム' | '消耗品' | '保守' | '';

interface PreviousInputData {
  quotationPhase: string;
  rfqNo: string;
  rfqGroupName: string;
  facilityName: string;
  vendorName: string;
}

interface OcrResultData {
  quotationDate: string;
  deliveryPeriod: string;
  validityPeriod: string;
}

interface DetailItem {
  id: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number | null;
  listUnitPrice: number | null;
  listPrice: number | null;
  purchaseUnitPrice: number | null;
  purchaseAmount: number | null;
  accountingCategory: AccountingCategoryType;
  categoryType?: string;
}

const testDetailItems: DetailItem[] = customerStep2Items.map((item, i) => ({
  id: i + 1,
  itemName: item.itemName,
  manufacturer: item.manufacturer,
  model: item.model,
  quantity: item.quantity || null,
  listUnitPrice: item.listPriceUnit || null,
  listPrice: item.listPriceTotal || null,
  purchaseUnitPrice: item.purchasePriceUnit || null,
  purchaseAmount: item.purchasePriceTotal || null,
  accountingCategory: '医療機器' as AccountingCategoryType,
  categoryType: '有形資産',
}));

export default function OcrConfirmPage() {
  const router = useRouter();

  const [previousInput] = useState<PreviousInputData>({
    quotationPhase: '定価',
    rfqNo: 'RFQ-20250119-0001',
    rfqGroupName: '2025年度放射線科機器更新',
    facilityName: '医療法人○○会 ○○病院',
    vendorName: 'GEヘルスケア・ジャパン',
  });

  const [ocrResult, setOcrResult] = useState<OcrResultData>({
    quotationDate: '2025/01/15',
    deliveryPeriod: '3',
    validityPeriod: '1',
  });

  const [detailItems, setDetailItems] = useState<DetailItem[]>(testDetailItems);

  const [totalAmountInput, setTotalAmountInput] = useState<string>(() => {
    const total = testDetailItems.reduce((sum, item) => sum + (item.purchaseAmount || 0), 0);
    return total.toLocaleString();
  });

  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setLeftPanelWidth(Math.min(80, Math.max(20, newWidth)));
  }, []);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  const totalAmount = useMemo(() => {
    return detailItems.reduce((sum, item) => sum + (item.purchaseAmount || 0), 0);
  }, [detailItems]);

  const handleOcrResultChange = (field: keyof OcrResultData, value: string) => {
    setOcrResult(prev => ({ ...prev, [field]: value }));
  };

  const handleDetailChange = (index: number, field: keyof DetailItem, value: string | number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleExcelImport = () => {
    alert('Excel取込機能は今後実装予定です。\nOCR結果の明細データをExcelファイルで差し替えます。');
  };

  const handleBack = () => router.push('/quotation-data-box');
  const handleAiJudgment = () => router.push('/quotation-data-box/category-registration');

  const inputCls = 'px-2 py-1.5 border border-stroke-input rounded text-sm bg-surface-card focus:outline-none focus:border-cta-primary';
  const cellInputCls = 'w-full px-2 py-1 border border-stroke-input rounded-sm text-xs bg-surface-card focus:outline-none focus:border-cta-primary';

  return (
    <div className="flex flex-col h-dvh bg-surface-screen">
      <Header
        title="見積登録（購入）OCR明細確認"
        stepBadge="STEP 2"
        hideMenu={true}
        showBackButton={false}
      />
      <StepProgressBar currentStep={2} />

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        <div ref={containerRef} className="flex flex-1 min-h-0 relative">
          {/* 左パネル: 単一カード (Figma 338:45767 構造) */}
          <div
            className="flex flex-col overflow-auto bg-surface-card border border-stroke-card rounded-2xl"
            style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="p-4 flex flex-col gap-6">
              {/* 基本情報 (table-fixed で列幅を CSS テーブルレイアウトに任せる) */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm table-fixed min-w-[640px]">
                  <colgroup>
                    <col className="w-[120px]" />
                    <col />
                    <col className="w-[120px]" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積日付</th>
                      <td className="px-3 py-2 border border-stroke-input">
                        <input
                          type="text"
                          placeholder="yyyy/mm/dd"
                          value={ocrResult.quotationDate}
                          onChange={(e) => handleOcrResultChange('quotationDate', e.target.value)}
                          className={`${inputCls} w-full tabular-nums`}
                        />
                      </td>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積フェーズ</th>
                      <td className="px-3 py-2 border border-stroke-input text-content-primary">{previousInput.quotationPhase}</td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">宛先（施設名）</th>
                      <td className="px-3 py-2 border border-stroke-input text-content-primary" colSpan={3}>{previousInput.facilityName}</td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積依頼No.</th>
                      <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums">{previousInput.rfqNo}</td>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積依頼G名称</th>
                      <td className="px-3 py-2 border border-stroke-input text-content-primary">{previousInput.rfqGroupName}</td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">業者・メーカー</th>
                      <td className="px-3 py-2 border border-stroke-input text-content-primary" colSpan={3}>{previousInput.vendorName}</td>
                    </tr>
                    <tr>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">納期</th>
                      <td className="px-3 py-2 border border-stroke-input">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={ocrResult.deliveryPeriod}
                            onChange={(e) => handleOcrResultChange('deliveryPeriod', e.target.value)}
                            className={`${inputCls} w-[60px] tabular-nums`}
                          />
                          <span className="text-content-primary">ヶ月</span>
                        </div>
                      </td>
                      <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積有効期限</th>
                      <td className="px-3 py-2 border border-stroke-input">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={ocrResult.validityPeriod}
                            onChange={(e) => handleOcrResultChange('validityPeriod', e.target.value)}
                            className={`${inputCls} w-[60px] tabular-nums`}
                          />
                          <span className="text-content-primary">ヶ月</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 見積明細チェック (合計金額入力のみ) */}
              <div className="flex items-center gap-3 flex-wrap py-3 border-b border-stroke-input">
                <span className="text-sm font-bold text-content-primary whitespace-nowrap">見積明細チェック</span>
                <div className="flex flex-1 items-center justify-end gap-3 flex-wrap min-w-0 pr-4">
                  <span className="text-sm text-content-primary">合計金額（税抜）</span>
                  <input
                    type="text"
                    value={totalAmountInput}
                    onChange={(e) => setTotalAmountInput(e.target.value)}
                    className="px-3 py-1.5 border border-stroke-input rounded text-xl font-bold w-[180px] text-right bg-surface-card tabular-nums text-content-alert focus:outline-none focus:border-cta-primary"
                    aria-label="合計金額"
                  />
                </div>
              </div>

              {/* テーブル */}
              <div className="border border-stroke-input rounded overflow-auto">
                <table className="w-full border-collapse text-xs min-w-[900px]">
                  <thead className="sticky top-0 z-[2] bg-stroke-card">
                    <tr>
                      <th rowSpan={2} className="px-2 py-2 text-center border border-stroke-input w-[40px] font-bold text-content-primary">No.</th>
                      <th colSpan={4} className="px-2 py-2 text-center border border-stroke-input font-bold text-content-primary">商品情報（原本情報）</th>
                      <th colSpan={4} className="px-2 py-2 text-center border border-stroke-input font-bold text-content-primary">価格情報（原本情報）</th>
                    </tr>
                    <tr>
                      <th className="px-2 py-2 text-left border border-stroke-input font-normal text-content-primary">品名（見積名称）</th>
                      <th className="px-2 py-2 text-left border border-stroke-input w-[120px] font-normal text-content-primary">メーカー</th>
                      <th className="px-2 py-2 text-left border border-stroke-input w-[140px] font-normal text-content-primary">型式（見積名称）</th>
                      <th className="px-2 py-2 text-center border border-stroke-input w-[50px] font-normal text-content-primary">数量</th>
                      <th className="px-2 py-2 text-right border border-stroke-input w-[100px] font-normal text-content-primary">定価単価</th>
                      <th className="px-2 py-2 text-right border border-stroke-input w-[110px] font-normal text-content-primary">定価金額</th>
                      <th className="px-2 py-2 text-right border border-stroke-input w-[100px] font-normal text-content-primary">購入単価</th>
                      <th className="px-2 py-2 text-right border border-stroke-input w-[110px] font-normal text-content-primary">購入金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailItems.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-2 py-1 text-center tabular-nums border border-stroke-input text-content-primary">{item.id}</td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleDetailChange(index, 'itemName', e.target.value)}
                            className={cellInputCls}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.manufacturer}
                            onChange={(e) => handleDetailChange(index, 'manufacturer', e.target.value)}
                            className={cellInputCls}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) => handleDetailChange(index, 'model', e.target.value)}
                            className={cellInputCls}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input text-center">
                          <input
                            type="text"
                            value={item.quantity ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value, 10) || 0;
                              handleDetailChange(index, 'quantity', value as number);
                            }}
                            className={`${cellInputCls} text-center`}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.listUnitPrice?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'listUnitPrice', value as number);
                            }}
                            className={`${cellInputCls} text-right tabular-nums`}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.listPrice?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'listPrice', value as number);
                            }}
                            className={`${cellInputCls} text-right tabular-nums`}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.purchaseUnitPrice?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'purchaseUnitPrice', value as number);
                            }}
                            className={`${cellInputCls} text-right tabular-nums`}
                          />
                        </td>
                        <td className="px-1.5 py-1 border border-stroke-input">
                          <input
                            type="text"
                            value={item.purchaseAmount?.toLocaleString() ?? ''}
                            onChange={(e) => {
                              const value = e.target.value === '' ? null : parseInt(e.target.value.replace(/,/g, ''), 10) || 0;
                              handleDetailChange(index, 'purchaseAmount', value as number);
                            }}
                            className={`${cellInputCls} text-right tabular-nums`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 注意文 + Excel取込 (Figma 下部) */}
              <div className="flex items-end gap-4">
                <div className="flex-1 text-xs text-content-sub leading-loose">
                  <div>① 読み込んだお見積もりと相違ないか確認・修正を行って下さい</div>
                  <div>② 金額は単価×数量にて登録されています</div>
                </div>
                <button
                  onClick={handleExcelImport}
                  className="h-11 px-8 bg-cta-primary text-white border-0 rounded cursor-pointer text-sm font-bold whitespace-nowrap flex-shrink-0 hover:bg-cta-primary-dark transition-colors"
                >
                  Excel取込
                </button>
              </div>
            </div>
          </div>

          {/* ドラッグハンドル (機能維持: PDF プレビュー幅調整) */}
          <div
            onMouseDown={handleDragStart}
            className="w-2 cursor-col-resize bg-stroke-card flex items-center justify-center shrink-0"
            aria-label="パネル幅を調整"
          >
            <div className="w-0.5 h-10 bg-stroke-input rounded" />
          </div>

          {/* 右パネル: PDF プレビュー */}
          <div className="flex-1 flex flex-col border border-stroke-card rounded-2xl overflow-auto bg-surface-card">
            <div className="min-h-full relative bg-surface-screen p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/quotation-sample.png"
                alt="見積書サンプル"
                className="w-full h-auto border border-stroke-input shadow-md"
              />
            </div>
          </div>
        </div>

        {/* フッターボタン */}
        <div className="flex gap-3 justify-between mt-4">
          <button
            onClick={handleBack}
            className="h-12 px-7 bg-surface-negative text-content-primary border-0 rounded cursor-pointer text-sm font-bold hover:bg-stroke-input transition-colors"
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleAiJudgment}
            className="h-12 px-7 bg-cta-primary text-white border-0 rounded cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors"
          >
            登録区分のAI判定へ
          </button>
        </div>
      </div>
    </div>
  );
}
