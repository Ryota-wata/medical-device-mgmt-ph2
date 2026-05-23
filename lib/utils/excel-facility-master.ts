import * as XLSX from 'xlsx';
import { FacilityMaster } from '@/lib/types/master';

const HEADERS = [
  '施設コード',
  '施設名',
  '都道府県',
  '設立母体',
  '市区町村',
  '住所',
  '郵便番号',
  '電話番号',
  '設立日',
  '施設種別',
  '病床数',
  'ステータス',
];

function facilityToRow(facility: FacilityMaster): (string | number)[] {
  return [
    facility.facilityCode,
    facility.facilityName,
    facility.prefecture,
    facility.foundingBody,
    facility.city,
    facility.address,
    facility.postalCode,
    facility.phoneNumber,
    facility.establishedDate,
    facility.facilityType,
    facility.bedCount,
    facility.status,
  ];
}

export function exportFacilitiesToExcel(facilities: FacilityMaster[], fileName?: string): void {
  const data = [HEADERS, ...facilities.map(facilityToRow)];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 14 }, // 施設コード
    { wch: 24 }, // 施設名
    { wch: 10 }, // 都道府県
    { wch: 12 }, // 設立母体
    { wch: 14 }, // 市区町村
    { wch: 30 }, // 住所
    { wch: 10 }, // 郵便番号
    { wch: 16 }, // 電話番号
    { wch: 12 }, // 設立日
    { wch: 14 }, // 施設種別
    { wch: 8 },  // 病床数
    { wch: 10 }, // ステータス
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SHIP施設マスタ');
  XLSX.writeFile(wb, fileName || 'SHIP施設マスタ.xlsx');
}
