'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { customerStep5Items } from '@/lib/data/customer/step5-individual';
import { customerStep4Items } from '@/lib/data/customer/step4-asset-master';

type DetailClassification = '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';
const UNIT_OPTIONS = ['台', '個', '本', '枚', '組', 'セット', '式'];

const classMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

interface Row {
  id: string;
  rowNo: number;
  category: string;
  detailClassification: DetailClassification;
  itemName: string;
  manufacturer: string;
  model: string;
  quantity: number;
  listPriceUnit: number;
  listPriceTotal: number;
  purchasePriceUnit: number;
  purchasePriceTotal: number;
  unit: string;
  seqId: string;
  allocationCategory: string;
  differenceAllocation: string;
  allocListPrice: number;
  allocPurchasePrice: number;
  taxCategory: string;
  allocPurchaseTaxIncl: number;
  isFirstOfGroup: boolean;
  groupRowCount: number;
}

function buildRows(): Row[] {
  const rows: Row[] = [];
  let seqCounter = 1;
  for (const item of customerStep5Items) {
    const cls = (classMap[item.itemType] || item.itemType || '') as DetailClassification;
    const isParent = cls === '親明細';
    const step4Item = customerStep4Items.find(s4 => s4.rowNo === item.rowNo);
    const expandCount = isParent ? (step4Item?.quantity || item.quantity || 1) : 1;

    for (let i = 0; i < expandCount; i++) {
      rows.push({
        id: `r-${item.rowNo}-${i}`,
        rowNo: item.rowNo,
        category: item.category || '',
        detailClassification: cls,
        itemName: item.itemName,
        manufacturer: item.manufacturer,
        model: item.model,
        quantity: isParent ? 1 : (item.quantity || 1),
        listPriceUnit: item.listPriceUnit || 0,
        listPriceTotal: item.listPriceTotal || 0,
        purchasePriceUnit: item.purchasePriceUnit || 0,
        purchasePriceTotal: item.purchasePriceTotal || 0,
        unit: item.unit || '台',
        seqId: isParent ? String(seqCounter++) : (cls === '子明細' || cls === '孫明細') ? '-' : '',
        allocationCategory: item.allocationCategory || '対象',
        differenceAllocation: item.differenceAllocation || '',
        allocListPrice: 0,
        allocPurchasePrice: 0,
        taxCategory: item.taxCategory || '課税',
        allocPurchaseTaxIncl: 0,
        isFirstOfGroup: i === 0,
        groupRowCount: expandCount,
      });
    }
  }
  return rows;
}

function calcTotals(rows: Row[]) {
  const seen = new Set<number>();
  let total = 0;
  let allocationTarget = 0;
  let allocationExcluded = 0;

  for (const r of rows) {
    if (r.isFirstOfGroup && !seen.has(r.rowNo)) {
      seen.add(r.rowNo);
      total += r.purchasePriceTotal;
      if (r.allocationCategory === '対象') {
        allocationTarget += r.purchasePriceTotal;
      } else {
        allocationExcluded += r.purchasePriceTotal;
      }
    }
  }
  return { total, allocationTarget, allocationExcluded, difference: 0 };
}

const classLabelStyleMap: Record<DetailClassification, string> = {
  '親明細': 'bg-content-alert text-white',
  '子明細': 'bg-content-link text-white',
  '孫明細': 'bg-content-primary text-white',
  '明細代表': 'bg-content-sub text-white',
  '内訳代表': 'bg-content-sub text-white',
  'その他': 'bg-content-sub text-white',
  '値引き': 'bg-content-sub text-white',
  '': '',
};

export default function PriceAllocationPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(buildRows);
  const [showOnlyIndividual, setShowOnlyIndividual] = useState(false);

  const displayRows = useMemo(() => {
    if (showOnlyIndividual) {
      return rows.filter(r => r.detailClassification === '親明細' || r.detailClassification === '子明細');
    }
    return rows;
  }, [rows, showOnlyIndividual]);

  const totals = useMemo(() => calcTotals(rows), [rows]);

  const handleFieldChange = useCallback((id: string, field: keyof Row, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const fmtNum = (n: number) => n ? n.toLocaleString() : '';

  const cellInputCls = 'w-full text-[9px] px-1 py-0.5 border border-stroke-input rounded-sm bg-surface-card box-border focus:outline-none focus:border-cta-primary';

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header title="見積登録（購入）個体登録及び金額按分" stepBadge="STEP 5" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={5} />

      <div className="flex-1 overflow-auto p-4">
        <section className="bg-surface-card border border-stroke-input rounded-lg mb-4">
          {/* 上部バー */}
          <div className="px-4 py-3 flex justify-between items-center flex-wrap gap-3 border-b border-stroke-input">
            <button
              onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
              className={`px-3.5 py-1.5 border rounded-md text-xs font-bold cursor-pointer transition-colors ${
                showOnlyIndividual
                  ? 'bg-cta-primary text-white border-cta-primary hover:bg-cta-primary-dark'
                  : 'bg-surface-select text-cta-primary-dark border-cta-primary hover:bg-stroke-card'
              }`}
            >
              個体管理品目のみ表示
            </button>

            <div className="flex gap-4 items-center flex-wrap">
              <div className="text-center">
                <div className="text-[10px] text-content-sub">合計金額（税抜）</div>
                <div className="text-base font-bold text-cta-primary bg-surface-select px-3 py-1 rounded-md tabular-nums">
                  {totals.total.toLocaleString()}
                </div>
              </div>
              <div className="text-right text-xs tabular-nums">
                <div>案分対象 <strong className="text-cta-primary-dark">{totals.allocationTarget.toLocaleString()}</strong></div>
                <div>案分除外 <strong className="text-cta-primary-dark">{totals.allocationExcluded.toLocaleString()}</strong></div>
                <div>差額 <strong className={totals.difference !== 0 ? 'text-content-alert' : 'text-content-primary'}>{totals.difference.toLocaleString()}</strong></div>
              </div>
            </div>
          </div>

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px] min-w-[1500px]">
              <thead className="sticky top-0 z-[2]">
                <tr>
                  <th colSpan={3} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❸</th>
                  <th colSpan={4} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❹ 資産マスタ登録</th>
                  <th colSpan={4} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">価格情報（原本情報）</th>
                  <th colSpan={8} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-surface-select text-xs font-bold text-cta-primary-dark">STEP❺ 個体登録／金額案分</th>
                </tr>
                <tr className="bg-surface-screen">
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[30px] text-center font-normal text-content-primary">No</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[90px] text-left font-normal text-content-primary">カテゴリ</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[55px] text-center font-normal text-content-primary border-r border-stroke-input">明細区分</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap text-left font-normal text-content-primary">個体管理品目</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-left font-normal text-content-primary">メーカー</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[100px] text-left font-normal text-content-primary">型式（見積名称）</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[35px] text-center font-normal text-content-primary border-r border-stroke-input">数量</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary">定価単価</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary">定価金額</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary">購入単価<br />(税別)</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary border-r border-stroke-input">購入金額<br />(税別)</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[40px] text-center font-normal text-content-primary bg-surface-select">単位</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[35px] text-center font-normal text-content-primary bg-surface-select">親子<br />関</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[50px] text-center font-normal text-content-primary bg-surface-select">価格案分<br />区分</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[70px] text-center font-bold text-content-alert bg-stroke-card">差額金額<br />を案分</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary bg-surface-select">定価金額</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary bg-surface-select">購入金額<br />(税別)</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[45px] text-center font-normal text-content-primary bg-surface-select">税区分</th>
                  <th className="px-1.5 py-1 border-b border-stroke-input text-[10px] whitespace-nowrap w-[80px] text-right font-normal text-content-primary bg-surface-select">購入金額<br />(税込)</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => {
                  const showOriginal = row.isFirstOfGroup;
                  const span = row.groupRowCount;
                  const clsLabel = row.detailClassification.replace('明細', '');

                  return (
                    <tr key={row.id} className="border-b border-stroke-card">
                      {showOriginal && (
                        <>
                          <td rowSpan={span} className="px-1.5 py-1 text-center tabular-nums align-top border-b border-stroke-input text-content-primary">{row.rowNo}</td>
                          <td rowSpan={span} className="px-1.5 py-1 align-top border-b border-stroke-input text-content-primary">{row.category}</td>
                          <td rowSpan={span} className="px-1.5 py-1 text-center align-top border-b border-stroke-input border-r border-stroke-input">
                            {row.detailClassification && (
                              <span className={`inline-block px-1.5 py-px rounded text-[9px] font-bold ${classLabelStyleMap[row.detailClassification]}`}>{clsLabel}</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-1.5 py-1 whitespace-nowrap align-top text-content-primary">{row.itemName}</td>
                      <td className="px-1.5 py-1 align-top text-content-primary">{row.manufacturer}</td>
                      <td className="px-1.5 py-1 align-top text-content-primary">{row.model}</td>
                      <td className="px-1.5 py-1 text-center tabular-nums align-top text-content-primary border-r border-stroke-input">{row.quantity || '-'}</td>
                      {showOriginal && (
                        <>
                          <td rowSpan={span} className="px-1.5 py-1 text-right tabular-nums align-top border-b border-stroke-input text-content-primary">{fmtNum(row.listPriceUnit)}</td>
                          <td rowSpan={span} className="px-1.5 py-1 text-right tabular-nums align-top border-b border-stroke-input text-content-primary">{fmtNum(row.listPriceTotal)}</td>
                          <td rowSpan={span} className="px-1.5 py-1 text-right tabular-nums align-top border-b border-stroke-input text-content-primary">{fmtNum(row.purchasePriceUnit)}</td>
                          <td rowSpan={span} className="px-1.5 py-1 text-right tabular-nums align-top border-b border-stroke-input border-r border-stroke-input font-bold text-content-primary">{fmtNum(row.purchasePriceTotal)}</td>
                        </>
                      )}
                      <td className="px-1.5 py-1 text-center align-top bg-surface-select">
                        <select value={row.unit} onChange={e => handleFieldChange(row.id, 'unit', e.target.value)} className="px-0.5 py-0.5 text-[9px] border border-stroke-input rounded-sm w-9 bg-surface-card focus:outline-none focus:border-cta-primary">
                          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-1.5 py-1 text-center align-top bg-surface-select tabular-nums">
                        <input type="text" value={row.seqId} onChange={e => handleFieldChange(row.id, 'seqId', e.target.value)} className="w-7 px-0.5 py-0.5 text-[9px] border border-stroke-input rounded-sm text-center bg-surface-card focus:outline-none focus:border-cta-primary" />
                      </td>
                      <td className="px-1.5 py-1 text-center align-top bg-surface-select text-[9px]">
                        <select value={row.allocationCategory} onChange={e => handleFieldChange(row.id, 'allocationCategory', e.target.value)} className="px-0.5 py-0.5 text-[9px] border border-stroke-input rounded-sm w-11 bg-surface-card focus:outline-none focus:border-cta-primary">
                          <option value="対象">対象</option>
                          <option value="-">-</option>
                        </select>
                      </td>
                      <td className="px-1.5 py-1 text-right align-top bg-stroke-card">
                        <input type="text" value={row.differenceAllocation} onChange={e => handleFieldChange(row.id, 'differenceAllocation', e.target.value)} className="w-[60px] px-0.5 py-0.5 text-[9px] border border-stroke-input rounded-sm text-right bg-surface-card focus:outline-none focus:border-cta-primary" />
                      </td>
                      <td className="px-1.5 py-1 text-right align-top bg-surface-select tabular-nums">
                        <input type="text" value={fmtNum(row.allocListPrice)} onChange={e => handleFieldChange(row.id, 'allocListPrice', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} className={`${cellInputCls} text-right w-[68px]`} />
                      </td>
                      <td className="px-1.5 py-1 text-right align-top bg-surface-select tabular-nums">
                        <input type="text" value={fmtNum(row.allocPurchasePrice)} onChange={e => handleFieldChange(row.id, 'allocPurchasePrice', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} className={`${cellInputCls} text-right w-[68px]`} />
                      </td>
                      <td className="px-1.5 py-1 text-center align-top bg-surface-select">
                        <select value={row.taxCategory} onChange={e => handleFieldChange(row.id, 'taxCategory', e.target.value)} className="px-0.5 py-0.5 text-[9px] border border-stroke-input rounded-sm w-[42px] bg-surface-card focus:outline-none focus:border-cta-primary">
                          <option value="課税">課税</option>
                          <option value="非課税">非課税</option>
                        </select>
                      </td>
                      <td className="px-1.5 py-1 text-right align-top bg-surface-select tabular-nums font-bold">
                        <input type="text" value={fmtNum(row.allocPurchaseTaxIncl)} onChange={e => handleFieldChange(row.id, 'allocPurchaseTaxIncl', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)} className={`${cellInputCls} text-right w-[68px] font-bold`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* フッターボタン */}
        <div className="flex gap-3 justify-between mt-4">
          <button
            onClick={() => router.push('/quotation-data-box/item-ai-matching')}
            className="h-12 px-7 bg-surface-negative text-content-primary border-0 rounded-lg cursor-pointer text-sm font-bold hover:bg-stroke-input transition-colors"
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={() => router.push('/quotation-data-box/registration-confirm')}
            className="h-12 px-7 bg-cta-primary text-white border-0 rounded-lg cursor-pointer text-sm font-bold hover:bg-cta-primary-dark transition-colors"
          >
            登録確認
          </button>
        </div>
      </div>
    </div>
  );
}
