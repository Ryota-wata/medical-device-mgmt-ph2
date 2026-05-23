'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { StepProgressBar } from '../components/StepProgressBar';
import { useQuotationStore } from '@/lib/stores/quotationStore';
import { QuotationItemType } from '@/lib/types/quotation';
import { customerStep6Items } from '@/lib/data/customer/step6-confirm';
import { customerStep4Items } from '@/lib/data/customer/step4-asset-master';

type DetailClassification = '明細代表' | '内訳代表' | '親明細' | '子明細' | '孫明細' | 'その他' | '値引き' | '';

const classMap: Record<string, DetailClassification> = {
  '代表明細': '明細代表', '親': '親明細', '子': '子明細', '孫': '孫明細',
  'その他': 'その他', '文字列': 'その他', '値引き': '値引き',
};

interface BasicInfo {
  quotationPhase: string; rfqNo: string; rfqGroupName: string; facilityName: string;
  vendorName: string; contact: string; mail: string;
  quotationDate: string; invoiceNo: string; deliveryPeriod: string; validityPeriod: string;
}
const testBasicInfo: BasicInfo = {
  quotationPhase: '定価', rfqNo: 'RFQ-20250119-0001', rfqGroupName: '2025年度放射線科機器更新',
  facilityName: '医療法人○○会 ○○病院', vendorName: 'GEヘルスケア・ジャパン',
  contact: '03-1234-5678', mail: 'info@example.com',
  quotationDate: '2026/01/15', invoiceNo: 'T1234567890123',
  deliveryPeriod: '2026/03/31', validityPeriod: '2026/02/28',
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
  unit: string;
  seqId: string;
  listPriceTotal: number;
  purchasePriceTotal: number;
  department: string;
  section: string;
  roomName: string;
  managingSection: string;
  isFirstOfGroup: boolean;
  groupRowCount: number;
}

function buildRows(): Row[] {
  const rows: Row[] = [];
  let seqCounter = 1;
  for (const item of customerStep6Items) {
    const cls = (classMap[item.itemType] || '') as DetailClassification;
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
        unit: item.unit || '台',
        seqId: isParent ? String(seqCounter++) : (cls === '子明細' || cls === '孫明細') ? '-' : '',
        listPriceTotal: item.listPriceTotal || 0,
        purchasePriceTotal: item.purchasePriceTotal || 0,
        department: item.department || '',
        section: item.section || '',
        roomName: item.roomName || '',
        managingSection: item.managementDepartment || '',
        isFirstOfGroup: i === 0,
        groupRowCount: expandCount,
      });
    }
  }
  return rows;
}

const detailClassificationToItemType = (c: DetailClassification): QuotationItemType => {
  const m: Record<string, QuotationItemType> = { '明細代表': 'B_明細代表', '親明細': 'C_個体管理品目', '子明細': 'D_付属品', 'その他': 'E_その他役務', '値引き': 'F_値引き' };
  return m[c] || 'C_個体管理品目';
};

const classLabelStyleMap: Record<DetailClassification, string> = {
  '親明細': 'bg-cta-primary text-white',
  '子明細': 'bg-content-link text-white',
  '孫明細': 'bg-content-primary text-white',
  '明細代表': 'bg-content-sub text-white',
  '内訳代表': 'bg-content-sub text-white',
  'その他': 'bg-content-sub text-white',
  '値引き': 'bg-content-sub text-white',
  '': '',
};

export default function RegistrationConfirmPage() {
  const router = useRouter();
  const { addQuotationGroup, addQuotationItems, generateReceivedQuotationNo } = useQuotationStore();
  const [basicInfo] = useState<BasicInfo>(testBasicInfo);
  const [rows] = useState<Row[]>(buildRows);
  const [showOnlyIndividual, setShowOnlyIndividual] = useState(false);

  const displayRows = useMemo(() => {
    if (showOnlyIndividual) return rows.filter(r => r.detailClassification === '親明細' || r.detailClassification === '子明細');
    return rows;
  }, [rows, showOnlyIndividual]);

  const totalAmount = useMemo(() => {
    const seen = new Set<number>();
    let total = 0;
    for (const r of rows) {
      if (r.isFirstOfGroup && !seen.has(r.rowNo)) { seen.add(r.rowNo); total += r.purchasePriceTotal; }
    }
    return total;
  }, [rows]);

  const handleRegister = () => {
    if (confirm('見積情報をDatabaseに登録します。よろしいですか？')) {
      const quotationNo = generateReceivedQuotationNo();
      const groupId = addQuotationGroup({
        receivedQuotationNo: quotationNo, rfqNo: basicInfo.rfqNo, vendorName: basicInfo.vendorName,
        vendorContact: basicInfo.contact, vendorEmail: basicInfo.mail, quotationDate: basicInfo.quotationDate,
        validityPeriod: 1, deliveryPeriod: 3, phase: basicInfo.quotationPhase === '定価' ? '定価見積' : '確定見積',
        totalAmount,
      });
      const itemsToAdd = rows.map(r => ({
        quotationGroupId: groupId, receivedQuotationNo: quotationNo, rowNo: r.rowNo,
        originalItemName: r.itemName, originalManufacturer: r.manufacturer, originalModel: r.model,
        originalQuantity: r.quantity, itemType: detailClassificationToItemType(r.detailClassification),
        category: r.category, itemName: r.itemName, manufacturer: r.manufacturer, model: r.model,
        aiQuantity: 1, unit: r.unit, seqId: r.seqId || undefined, linkedApplicationIds: [],
      }));
      addQuotationItems(itemsToAdd);
      alert(`登録が完了しました（見積番号: ${quotationNo}）`);
      router.push('/quotation-data-box/purchase-management');
    }
  };

  const fmtNum = (n: number) => n ? n.toLocaleString() : '';

  return (
    <div className="flex flex-col min-h-dvh bg-surface-screen">
      <Header title="見積登録（購入）登録確認へ" stepBadge="STEP 6" hideMenu showBackButton={false} />
      <StepProgressBar currentStep={6} />

      <div className="flex-1 overflow-auto p-4">
        {/* 単一カード: 確認テキスト + 基本情報 + フィルター/合計 + テーブル */}
        <section className="bg-surface-card border border-stroke-card rounded-2xl mb-4">
          <div className="p-4 flex flex-col gap-6">
            {/* 確認テキスト */}
            <p className="text-base font-semibold text-content-primary">
              下記の内容で見積Databaseへ登録を実施します。
            </p>

            {/* 基本情報フォーム (table-fixed で列幅を CSS テーブルレイアウトに任せる) */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm table-fixed min-w-[900px]">
                <colgroup>
                  <col className="w-[140px]" />
                  <col />
                  <col className="w-[140px]" />
                  <col />
                  <col className="w-[140px]" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積日付</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums">{basicInfo.quotationDate}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積フェーズ</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary">{basicInfo.quotationPhase}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積依頼G名称</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary">{basicInfo.rfqGroupName}</td>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積依頼No.</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums">{basicInfo.rfqNo}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">宛先（施設名）</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary" colSpan={3}>{basicInfo.facilityName}</td>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">業者・メーカー</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary">{basicInfo.vendorName}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">連絡先</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums">{basicInfo.contact}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">mail</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary break-all">{basicInfo.mail}</td>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">納期</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums">{basicInfo.deliveryPeriod}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">見積有効期限</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums">{basicInfo.validityPeriod}</td>
                    <th className="px-3 py-2 bg-stroke-card text-content-primary font-normal border border-stroke-input text-left whitespace-nowrap">インボイス</th>
                    <td className="px-3 py-2 border border-stroke-input text-content-primary tabular-nums break-all">{basicInfo.invoiceNo}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* フィルター + 合計行 (Figma 339:54069 構造: ラベル列 200px + 入力行 flex-1) */}
            <div className="flex items-center h-[65px]">
              <button
                onClick={() => setShowOnlyIndividual(!showOnlyIndividual)}
                className={`flex items-center justify-center h-[65px] w-[200px] shrink-0 text-base text-content-primary cursor-pointer border-0 transition-colors ${
                  showOnlyIndividual ? 'bg-surface-select' : 'bg-stroke-card hover:bg-surface-select'
                }`}
                aria-pressed={showOnlyIndividual}
              >
                個体管理品目のみ表示
              </button>
              <div className="flex-1 flex items-center justify-end pr-4 gap-3">
                <span className="text-sm text-content-primary">合計金額（税抜）</span>
                <span className="text-xl font-bold text-content-alert tabular-nums">
                  ¥{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* テーブル */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs min-w-[1100px]">
                <thead className="sticky top-0 z-[2]">
                  <tr>
                    <th colSpan={3} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❸</th>
                    <th colSpan={3} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary border-r border-stroke-input">STEP❹ 個体管理品目</th>
                    <th colSpan={5} className="px-1.5 py-1.5 text-center border-b-2 border-content-primary bg-stroke-card text-xs font-bold text-content-primary">STEP❺ 個体登録／金額案分</th>
                  </tr>
                  <tr className="bg-stroke-card">
                    <th className="px-2 py-2 text-center border border-stroke-input text-xs font-bold text-content-primary w-[60px]">No</th>
                    <th className="px-2 py-2 text-left border border-stroke-input text-xs font-bold text-content-primary w-[100px]">カテゴリ</th>
                    <th className="px-2 py-2 text-center border border-stroke-input text-xs font-bold text-content-primary w-[80px]">明細区分</th>
                    <th className="px-2 py-2 text-left border border-stroke-input text-xs font-bold text-content-primary">個体管理品目</th>
                    <th className="px-2 py-2 text-left border border-stroke-input text-xs font-bold text-content-primary w-[100px]">メーカー</th>
                    <th className="px-2 py-2 text-left border border-stroke-input text-xs font-bold text-content-primary w-[120px]">型式（見積名称）</th>
                    <th className="px-2 py-2 text-center border border-stroke-input text-xs font-bold text-content-primary w-[50px]">数量</th>
                    <th className="px-2 py-2 text-center border border-stroke-input text-xs font-bold text-content-primary w-[50px]">単位</th>
                    <th className="px-2 py-2 text-center border border-stroke-input text-xs font-bold text-content-primary w-[50px]">親子<br />関</th>
                    <th className="px-2 py-2 text-right border border-stroke-input text-xs font-bold text-content-primary w-[100px]">定価金額</th>
                    <th className="px-2 py-2 text-right border border-stroke-input text-xs font-bold text-content-primary w-[110px]">購入金額<br />(税別)</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => {
                    const showOriginal = row.isFirstOfGroup;
                    const span = row.groupRowCount;
                    const clsLabel = row.detailClassification.replace('明細', '');

                    return (
                      <tr key={row.id}>
                        {showOriginal && (
                          <>
                            <td rowSpan={span} className="px-2 py-2 text-center tabular-nums align-middle border border-stroke-input text-content-primary">{row.rowNo}</td>
                            <td rowSpan={span} className="px-2 py-2 align-middle border border-stroke-input text-content-primary">{row.category}</td>
                            <td rowSpan={span} className="px-2 py-2 text-center align-middle border border-stroke-input">
                              {row.detailClassification && (
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${classLabelStyleMap[row.detailClassification]}`}>{clsLabel}</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className="px-2 py-2 whitespace-nowrap align-middle border border-stroke-input text-content-primary">{row.itemName}</td>
                        <td className="px-2 py-2 align-middle border border-stroke-input text-content-primary">{row.manufacturer}</td>
                        <td className="px-2 py-2 align-middle border border-stroke-input text-content-primary">{row.model}</td>
                        <td className="px-2 py-2 text-center tabular-nums align-middle border border-stroke-input text-content-primary">{row.quantity || '-'}</td>
                        <td className="px-2 py-2 text-center align-middle border border-stroke-input text-content-primary">{row.unit}</td>
                        <td className="px-2 py-2 text-center tabular-nums align-middle border border-stroke-input text-content-primary">{row.seqId}</td>
                        {showOriginal && (
                          <>
                            <td rowSpan={span} className="px-2 py-2 text-right tabular-nums align-middle border border-stroke-input text-content-primary">{fmtNum(row.listPriceTotal)}</td>
                            <td rowSpan={span} className="px-2 py-2 text-right tabular-nums align-middle border border-stroke-input font-bold text-content-primary">{fmtNum(row.purchasePriceTotal)}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* フッターボタン (Figma 339:54307 構造: 左寄せ x=0 width=239 + x=287 width=254) */}
        <div className="flex gap-12 mt-4 px-4">
          <button
            onClick={() => router.push('/quotation-data-box/price-allocation')}
            className="h-12 w-[239px] bg-surface-negative text-content-primary border-0 rounded-lg cursor-pointer text-base font-normal hover:bg-stroke-input transition-colors"
          >
            一つ前のSTEPに戻る
          </button>
          <button
            onClick={handleRegister}
            className="h-12 w-[254px] bg-cta-primary text-white border-0 rounded-lg cursor-pointer text-base font-normal hover:bg-cta-primary-dark transition-colors"
          >
            見積情報Databaseに登録
          </button>
        </div>
      </div>
    </div>
  );
}
