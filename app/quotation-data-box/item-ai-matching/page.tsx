'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';

type DetailClassification =
  | '明細代表'
  | '内訳代表'
  | '親明細'
  | '子明細'
  | '孫明細'
  | 'その他'
  | '値引き'
  | '';

interface AIJudgmentResult {
  category: string;
  majorCategory: string;
  middleCategory: string;
  assetName: string;
  manufacturer: string;
  model: string;
}

interface ConfirmedAssetInfo {
  category?: string;
  majorCategory?: string;
  middleCategory?: string;
  assetName: string;
  manufacturer: string;
  model: string;
}

interface ConfirmedState {
  status: 'ai_confirmed' | 'asset_master_selected';
  assetInfo: ConfirmedAssetInfo;
}

interface DetailItem {
  id: number;
  rowNo: number;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number | null;
  detailClassification: DetailClassification;
  category: string;
  aiJudgment: AIJudgmentResult | null;
}

import { customerStep4Items } from '@/lib/data/customer/step4-asset-master';

const step4ClassMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

const testDetailItems: DetailItem[] = customerStep4Items.map((item, i) => {
  const classification = step4ClassMap[item.itemType] || '' as DetailClassification;
  const hasAI = classification === '親明細' || classification === '明細代表';
  return {
    id: i + 1,
    rowNo: item.rowNo,
    itemName: item.originalItemName,
    manufacturer: item.originalManufacturer,
    model: item.originalModel,
    quantity: item.quantity || null,
    detailClassification: classification,
    category: item.category || '',
    aiJudgment: hasAI && item.itemName ? {
      category: item.category || '',
      majorCategory: item.largeClass || '',
      middleCategory: item.middleClass || '',
      assetName: item.itemName,
      manufacturer: item.manufacturer || item.originalManufacturer,
      model: item.model || item.originalModel,
    } : null,
  };
});

export default function ItemAiMatchingPage() {
  const router = useRouter();
  const [detailItems] = useState<DetailItem[]>(testDetailItems);
  const [confirmedState, setConfirmedState] = useState<Record<string, ConfirmedState>>({});
  const [selectingRow, setSelectingRow] = useState<number | null>(null);
  const [showOnlyIndividual, setShowOnlyIndividual] = useState(false);

  const individualItems = useMemo(() => {
    return detailItems.filter(
      item => item.detailClassification === '親明細' || item.detailClassification === '子明細'
    );
  }, [detailItems]);

  const displayItems = useMemo(() => {
    if (showOnlyIndividual) return individualItems;
    return detailItems;
  }, [detailItems, individualItems, showOnlyIndividual]);

  const getConfirmedInfo = (id: number): ConfirmedState | null => {
    return confirmedState[`${id}`] || null;
  };

  const confirmedCount = useMemo(() => {
    return individualItems.filter(item => getConfirmedInfo(item.id) !== null).length;
  }, [individualItems, confirmedState]);

  const handleAssetMasterMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    if (event.data?.type === 'ASSET_SELECTED' && selectingRow !== null) {
      const assetMasters = event.data.assets as Record<string, string>[];
      const scope = (event.data.scope as 'all' | 'toMaker' | 'toItem') || 'all';

      if (assetMasters && assetMasters.length > 0) {
        const master = assetMasters[0];
        let assetInfo: ConfirmedAssetInfo;

        switch (scope) {
          case 'toItem':
            assetInfo = { category: master.category || '', majorCategory: master.largeClass || '', middleCategory: master.mediumClass || '', assetName: master.item || '', manufacturer: '', model: '' };
            break;
          case 'toMaker':
            assetInfo = { category: master.category || '', majorCategory: master.largeClass || '', middleCategory: master.mediumClass || '', assetName: master.item || '', manufacturer: master.maker || '', model: '' };
            break;
          case 'all':
          default:
            assetInfo = { category: master.category || '', majorCategory: master.largeClass || '', middleCategory: master.mediumClass || '', assetName: master.item || '', manufacturer: master.maker || '', model: master.model || '' };
            break;
        }

        setConfirmedState(prev => ({
          ...prev,
          [`${selectingRow}`]: { status: 'asset_master_selected', assetInfo },
        }));
        setSelectingRow(null);
      }
    }
  }, [selectingRow]);

  useEffect(() => {
    window.addEventListener('message', handleAssetMasterMessage);
    return () => window.removeEventListener('message', handleAssetMasterMessage);
  }, [handleAssetMasterMessage]);

  const handleApplyAI = (id: number, aiJudgment: AIJudgmentResult) => {
    setConfirmedState(prev => ({
      ...prev,
      [`${id}`]: {
        status: 'ai_confirmed',
        assetInfo: {
          category: aiJudgment.category,
          majorCategory: aiJudgment.majorCategory,
          middleCategory: aiJudgment.middleCategory,
          assetName: aiJudgment.assetName,
          manufacturer: aiJudgment.manufacturer,
          model: aiJudgment.model,
        },
      },
    }));
  };

  const handleUnconfirm = (id: number) => {
    setConfirmedState(prev => {
      const next = { ...prev };
      delete next[`${id}`];
      return next;
    });
  };

  const handleOpenAssetMaster = (id: number) => {
    setSelectingRow(id);
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  const handleBack = () => router.push('/quotation-data-box/category-registration');

  const handleNext = () => {
    const allConfirmed = individualItems.every(item => getConfirmedInfo(item.id) !== null);
    if (!allConfirmed) {
      if (!confirm('未登録の個体品目があります。続行しますか？')) return;
    }
    router.push('/quotation-data-box/price-allocation');
  };

  return (
    <div className="flex flex-col h-dvh bg-surface-screen">
      <Header title="見積登録（購入）個体品目AI判定" stepBadge="STEP 4" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={4} />

      <div className="flex-1 overflow-auto p-4">
        {/* 単一カード (Figma 338:49204) */}
        <section className="bg-surface-card border border-stroke-card rounded-2xl mb-4">
          <div className="p-4 flex flex-col gap-6">
            {/* 説明エリア (Figma 338:49207 構造: ラベル列 200px + 入力 flex-1, 両子を items-stretch で高さ揃え) */}
            <div className="flex items-stretch border border-stroke-input rounded">
              <div className="flex items-center justify-center px-4 w-[200px] shrink-0 bg-stroke-card text-base text-content-primary text-center">
                個体品目AI判定
              </div>
              <div className="flex-1 flex flex-col justify-center px-4 py-3 bg-surface-select gap-1">
                <p className="text-sm font-semibold text-cta-primary-dark">
                  個体管理品目のAI判定を実施し確認・修正を実施してください
                </p>
                <p className="text-xs text-content-primary leading-relaxed">
                  ・不適格な場合は資産マスタを別ウィンドウで開いて選択が可能です<br />
                  ・IDの登録により耐用年数、推奨使用年数、添付文書などの情報が登録できます
                </p>
              </div>
            </div>

            {/* フィルター + 件数表示 */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
                className={`px-4 py-2 rounded text-xs font-bold cursor-pointer transition-colors border ${
                  showOnlyIndividual
                    ? 'bg-cta-primary text-white border-cta-primary hover:bg-cta-primary-dark'
                    : 'bg-surface-card text-content-primary border-stroke-input hover:bg-stroke-card'
                }`}
                aria-pressed={showOnlyIndividual}
              >
                個体管理品目のみ表示
              </button>
              <span className="text-xs text-content-primary">
                紐付け済み: <span className="tabular-nums font-bold">{confirmedCount}/{individualItems.length}</span>件
              </span>
            </div>

            {/* テーブル */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[1400px]">
                <thead className="sticky top-0 z-[2] bg-stroke-card">
                  <tr>
                    <th colSpan={7} className="px-2 py-2 text-center border border-stroke-input text-sm font-bold text-content-primary">
                      商品情報（原本情報）
                    </th>
                    <th colSpan={6} className="px-2 py-2 text-center border border-stroke-input text-sm font-bold text-content-primary">
                      個体管理品目 AI判定
                    </th>
                  </tr>
                  <tr className="bg-stroke-card">
                    <th className="px-2 py-2 text-center border border-stroke-input w-[50px] font-normal text-content-primary">No</th>
                    <th className="px-2 py-2 text-left border border-stroke-input min-w-[260px] font-normal text-content-primary">品名（見積名称）</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">メーカー</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">型式</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[60px] font-normal text-content-primary">数量</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[80px] font-normal text-content-primary">明細区分</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">カテゴリ</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[120px] font-normal text-content-primary">大分類</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[120px] font-normal text-content-primary">中分類</th>
                    <th className="px-2 py-2 text-left border border-stroke-input min-w-[140px] font-normal text-content-primary">個体管理品目</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">メーカー</th>
                    <th className="px-2 py-2 text-left border border-stroke-input w-[100px] font-normal text-content-primary">型式</th>
                    <th className="px-2 py-2 text-center border border-stroke-input w-[160px] font-normal text-content-primary">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((item) => {
                    const confirmedInfo = getConfirmedInfo(item.id);
                    const rowIsConfirmed = confirmedInfo !== null;
                    const isSelectingThisRow = selectingRow === item.id;
                    const aiJudgment = item.aiJudgment;
                    const displayData = confirmedInfo?.assetInfo || aiJudgment;
                    const isIndividual = item.detailClassification === '親明細' || item.detailClassification === '子明細';
                    const classBgCls =
                      item.detailClassification === '親明細' ? 'bg-cta-primary' :
                      item.detailClassification === '子明細' ? 'bg-content-link' :
                      item.detailClassification === '孫明細' ? 'bg-content-primary' :
                      'bg-content-sub';
                    const rowBgCls = rowIsConfirmed || isSelectingThisRow ? 'bg-surface-select' : 'bg-surface-card';

                    return (
                      <tr key={item.id} className={rowBgCls}>
                        <td className="px-2 py-2 text-center tabular-nums border border-stroke-input text-content-primary">{item.rowNo}</td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary" title={item.itemName}>{item.itemName}</td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">{item.manufacturer || ''}</td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">{item.model || ''}</td>
                        <td className="px-2 py-2 text-center tabular-nums border border-stroke-input text-content-primary">{item.quantity ?? '-'}</td>
                        <td className="px-2 py-2 text-center border border-stroke-input">
                          {item.detailClassification && (
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white ${classBgCls}`}>
                              {item.detailClassification.replace('明細', '')}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">
                          {item.category || ''}
                        </td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">
                          {displayData?.majorCategory || ''}
                        </td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">
                          {displayData?.middleCategory || ''}
                        </td>
                        <td className={`px-2 py-2 border border-stroke-input text-content-primary ${isIndividual ? 'font-bold' : ''}`}>
                          {displayData?.assetName || item.itemName || ''}
                        </td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">
                          {displayData?.manufacturer || ''}
                        </td>
                        <td className="px-2 py-2 border border-stroke-input text-content-primary">
                          {displayData?.model || ''}
                        </td>
                        <td className="px-2 py-2 text-center border border-stroke-input">
                          {isIndividual ? (
                            rowIsConfirmed ? (
                              <div className="flex gap-1 justify-center items-center flex-wrap">
                                <span className="px-1.5 py-0.5 bg-cta-primary text-white rounded text-[9px] font-bold">
                                  AI適用
                                </span>
                                <span className="px-1.5 py-0.5 bg-cta-primary-dark text-white rounded text-[9px] font-bold">
                                  資産マスタ
                                </span>
                                <span className="px-1.5 py-0.5 bg-content-link text-white rounded text-[9px] font-bold">
                                  紐付済
                                </span>
                                <button
                                  onClick={() => handleUnconfirm(item.id)}
                                  className="px-1.5 py-0.5 bg-content-alert text-white border-0 rounded text-[9px] font-bold cursor-pointer hover:opacity-90 transition-colors"
                                >
                                  解除
                                </button>
                              </div>
                            ) : isSelectingThisRow ? (
                              <span className="inline-block px-2 py-1 bg-cta-primary text-white rounded text-[9px] font-bold">
                                選択中...
                              </span>
                            ) : (
                              <div className="flex gap-1 justify-center flex-wrap">
                                {aiJudgment && (
                                  <button onClick={() => handleApplyAI(item.id, aiJudgment)} className="px-1.5 py-0.5 bg-cta-primary text-white border-0 rounded text-[9px] font-bold cursor-pointer hover:bg-cta-primary-dark transition-colors">
                                    AI適用
                                  </button>
                                )}
                                <button onClick={() => handleOpenAssetMaster(item.id)} className="px-1.5 py-0.5 bg-cta-primary-dark text-white border-0 rounded text-[9px] font-bold cursor-pointer whitespace-nowrap hover:opacity-90 transition-colors">
                                  資産マスタ
                                </button>
                              </div>
                            )
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
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
            個体登録/価格按分へ
          </button>
        </div>
      </div>
    </div>
  );
}
