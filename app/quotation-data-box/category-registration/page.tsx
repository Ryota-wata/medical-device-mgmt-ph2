'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { ACCOUNT_DIVISIONS as CATEGORY_OPTIONS } from '@/lib/data/account-divisions';
import { customerStep3Items } from '@/lib/data/customer/step3-category';

type DetailClassification =
  | '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';

const DETAIL_CLASSIFICATION_OPTIONS: { value: DetailClassification; label: string }[] = [
  { value: '明細代表', label: '明細代表' },
  { value: '内訳代表', label: '内訳代表' },
  { value: '親明細', label: '親明細' },
  { value: '子明細', label: '子明細' },
  { value: '孫明細', label: '孫明細' },
  { value: 'その他', label: 'その他' },
  { value: '値引き', label: '値引き' },
];

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
  category: string;
  detailClassification: DetailClassification;
  isRegistered: boolean;
}

const classificationMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

const testDetailItems: DetailItem[] = customerStep3Items.map((item, i) => ({
  id: i + 1,
  itemName: item.itemName,
  manufacturer: item.manufacturer,
  model: item.model,
  quantity: item.quantity || null,
  listUnitPrice: item.listPriceUnit || null,
  listPrice: item.listPriceTotal || null,
  purchaseUnitPrice: item.purchasePriceUnit || null,
  purchaseAmount: item.purchasePriceTotal || null,
  category: item.category?.match(/^\d+/)?.[0] || '01',
  detailClassification: classificationMap[item.itemType] || '' as DetailClassification,
  isRegistered: false,
}));

export default function CategoryRegistrationPage() {
  const router = useRouter();
  const [detailItems, setDetailItems] = useState<DetailItem[]>(testDetailItems);

  const registeredCount = useMemo(
    () => detailItems.filter(item => item.isRegistered).length,
    [detailItems]
  );

  const handleCategoryChange = (index: number, value: string) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], category: value };
      return updated;
    });
  };

  const handleClassificationChange = (index: number, value: DetailClassification) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], detailClassification: value };
      return updated;
    });
  };

  const handleRegister = (index: number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isRegistered: true };
      return updated;
    });
  };

  const handleUnregister = (index: number) => {
    setDetailItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isRegistered: false };
      return updated;
    });
  };

  const handleBack = () => router.push('/quotation-data-box/ocr-confirm');

  const handleNext = () => {
    const allRegistered = detailItems.every(item => item.isRegistered);
    if (!allRegistered) {
      if (!confirm('未登録の明細があります。続行しますか？')) return;
    }
    router.push('/quotation-data-box/item-ai-matching');
  };

  const selectCls = 'w-full px-2 py-1.5 text-xs border border-stroke-input rounded-sm bg-surface-card focus:outline-none focus:border-cta-primary';

  return (
    <div className="flex flex-col h-dvh bg-surface-screen">
      <Header title="見積登録（購入）AI判定確認" stepBadge="STEP 3" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={3} />

      <div className="flex-1 overflow-auto p-4">
        <section className="bg-surface-card border border-stroke-input rounded mb-4">
          <div className="flex items-center justify-between px-4 py-3 bg-surface-card border-b border-stroke-input">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-content-primary">登録区分登録</span>
              <span className="text-xs text-content-sub tabular-nums">登録: {registeredCount} / {detailItems.length}件</span>
            </div>
          </div>

          <div className="px-4 py-3 bg-surface-select text-xs text-cta-primary-dark">
            登録区分をチェック・修正してください　※QRラベルを発行・除却が可能な単位にて登録を行います
          </div>

          <div className="p-4">
            <div className="border border-stroke-input rounded overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead className="sticky top-0 z-[2]">
                  <tr>
                    <th colSpan={5} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-[11px] font-bold text-content-primary border-r border-stroke-input">商品情報（原本情報）</th>
                    <th colSpan={4} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-surface-select text-[11px] font-bold text-cta-primary-dark">STEP❸ 明細区分登録</th>
                  </tr>
                  <tr>
                    <th className="px-1.5 py-2 text-center bg-surface-screen border-b border-stroke-input w-10 font-normal text-content-primary">No.</th>
                    <th className="px-1.5 py-2 text-left bg-surface-screen border-b border-stroke-input font-normal text-content-primary">品名（見積名称）</th>
                    <th className="px-1.5 py-2 text-left bg-surface-screen border-b border-stroke-input w-[100px] font-normal text-content-primary">メーカー</th>
                    <th className="px-1.5 py-2 text-left bg-surface-screen border-b border-stroke-input w-[120px] font-normal text-content-primary">型式（見積名称）</th>
                    <th className="px-1.5 py-2 text-center bg-surface-screen border-b border-stroke-input border-r border-stroke-input w-[50px] font-normal text-content-primary">数量</th>
                    <th className="px-1.5 py-2 text-center bg-surface-select border-b border-stroke-input w-[160px] font-bold text-cta-primary-dark">カテゴリ</th>
                    <th className="px-1.5 py-2 text-center bg-surface-select border-b border-stroke-input w-[200px] font-bold text-cta-primary-dark">明細区分</th>
                    <th className="px-1.5 py-2 text-center bg-surface-select border-b border-stroke-input w-20 font-bold text-cta-primary-dark">ステータス</th>
                    <th className="px-1.5 py-2 text-center bg-surface-select border-b border-stroke-input w-20 font-bold text-cta-primary-dark">アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {detailItems.map((item, index) => (
                    <tr key={item.id} className={`border-b border-stroke-card ${item.isRegistered ? 'bg-surface-select' : 'bg-surface-card'}`}>
                      <td className="px-1.5 py-1.5 text-center bg-surface-screen border border-stroke-input tabular-nums">{item.id}</td>
                      <td className="px-1.5 py-1.5 border border-stroke-input">
                        <div className="font-bold text-[11px] text-content-primary">{item.itemName}</div>
                      </td>
                      <td className="px-1.5 py-1.5 border border-stroke-input text-[11px] text-content-primary">{item.manufacturer}</td>
                      <td className="px-1.5 py-1.5 border border-stroke-input text-[11px] text-content-primary">{item.model}</td>
                      <td className="px-1.5 py-1.5 border border-stroke-input text-center text-[11px] text-content-primary tabular-nums">{item.quantity ?? '-'}</td>
                      <td className="px-1.5 py-1.5 bg-surface-select border border-stroke-input">
                        <select
                          value={item.category}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          className={selectCls}
                        >
                          {CATEGORY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1.5 py-1.5 bg-surface-select border border-stroke-input">
                        <select
                          value={item.detailClassification}
                          onChange={(e) => handleClassificationChange(index, e.target.value as DetailClassification)}
                          className={selectCls}
                        >
                          <option value="">選択...</option>
                          {DETAIL_CLASSIFICATION_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1.5 py-1.5 border border-stroke-input text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.isRegistered ? 'bg-cta-primary' : 'bg-content-sub'}`}>
                          {item.isRegistered ? '登録済' : '未登録'}
                        </span>
                      </td>
                      <td className="px-1.5 py-1.5 border border-stroke-input text-center">
                        {item.isRegistered ? (
                          <button
                            onClick={() => handleUnregister(index)}
                            className="px-3 py-1 bg-content-alert text-white border-0 rounded-sm cursor-pointer text-[10px] font-bold hover:opacity-90 transition-colors"
                          >
                            解除
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(index)}
                            disabled={!item.detailClassification}
                            className={`px-3 py-1 text-white border-0 rounded-sm text-[10px] font-bold transition-colors ${
                              item.detailClassification
                                ? 'bg-cta-primary cursor-pointer hover:bg-cta-primary-dark'
                                : 'bg-surface-disabled cursor-not-allowed'
                            }`}
                          >
                            登録
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="flex gap-3 justify-between mt-4">
          <button
            onClick={handleBack}
            className="h-12 px-7 bg-surface-negative text-content-primary border-0 rounded cursor-pointer text-sm font-bold hover:bg-stroke-input transition-colors"
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleNext}
            className="h-12 px-7 bg-cta-primary text-white border-0 rounded cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors"
          >
            個体品目AI判定へ
          </button>
        </div>
      </div>
    </div>
  );
}
