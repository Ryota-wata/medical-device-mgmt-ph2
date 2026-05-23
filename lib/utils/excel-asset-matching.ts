import * as XLSX from 'xlsx';
import { MatchingData } from '@/lib/types/asset-matching';

const HEADERS = [
  'No.',
  // 台帳データ
  '共通部門',
  '共通部署',
  '品目名(原)',
  'メーカー名(原)',
  '型式(原)',
  '数量',
  // AI判定（推薦）
  'AI_category',
  'AI_大分類',
  'AI_中分類',
  'AI_品目',
  'AI_メーカー名',
  'AI_型式',
  // SHIP資産マスタ紐づけ
  'SHIP_category',
  'SHIP_大分類',
  'SHIP_中分類',
  'SHIP_品目',
  'SHIP_メーカー名',
  'SHIP_型式',
];

function matchingToRow(row: MatchingData, index: number): (string | number)[] {
  return [
    index + 1,
    row.department,
    row.section,
    row.originalItemName,
    row.manufacturer,
    row.model,
    row.quantityUnit,
    row.aiRecommendation.category,
    row.aiRecommendation.major,
    row.aiRecommendation.middle,
    row.aiRecommendation.item,
    row.aiRecommendation.manufacturer,
    row.aiRecommendation.model,
    row.linked.category,
    row.linked.majorCategory,
    row.linked.middleCategory,
    row.linked.item,
    row.linked.manufacturer,
    row.linked.model,
  ];
}

export function exportAssetMatchingToExcel(data: MatchingData[], fileName?: string): void {
  const rows = data.map((row, i) => matchingToRow(row, i));
  const sheetData = [HEADERS, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 6 },   // No.
    { wch: 14 },  // 共通部門
    { wch: 16 },  // 共通部署
    { wch: 24 },  // 品目名(原)
    { wch: 20 },  // メーカー名(原)
    { wch: 20 },  // 型式(原)
    { wch: 8 },   // 数量
    { wch: 12 },  // AI_category
    { wch: 16 },  // AI_大分類
    { wch: 16 },  // AI_中分類
    { wch: 24 },  // AI_品目
    { wch: 20 },  // AI_メーカー名
    { wch: 20 },  // AI_型式
    { wch: 12 },  // SHIP_category
    { wch: 16 },  // SHIP_大分類
    { wch: 16 },  // SHIP_中分類
    { wch: 24 },  // SHIP_品目
    { wch: 20 },  // SHIP_メーカー名
    { wch: 20 },  // SHIP_型式
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '突き合わせ結果');
  XLSX.writeFile(wb, fileName || '資産台帳突き合わせ結果.xlsx');
}
