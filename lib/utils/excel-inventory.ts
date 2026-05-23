import * as XLSX from 'xlsx';

// Excel出力用の型定義（page.tsxへの依存を避ける）
type InventoryStatus = 'unchecked' | 'stock_ok' | 'location_changed' | 'disposed' | 'action_required';

export interface InventoryExportItem {
  asset: {
    qrCode: string;
    name: string;
    department: string;
    building: string;
    section: string;
    roomName?: string;
    maker: string;
    model: string;
    serialNumber?: string;
    assetNo?: string;
  };
  status: InventoryStatus;
  confirmedAt?: string;
}

const HEADERS = [
  '棚卸担当者',
  '棚卸登録日',
  '結果',
  'QRコード',
  '資産名',
  '管理部署',
  '設置場所',
  'メーカー',
  '型式',
  'シリアルNo.',
  '固定資産番号',
];

const STATUS_LABELS: Record<InventoryStatus, string> = {
  unchecked: '未確認',
  stock_ok: '確認済',
  location_changed: '移動',
  disposed: '廃棄',
  action_required: '要対応',
};

function formatDate(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
}

function itemToRow(item: InventoryExportItem): string[] {
  const location = [item.asset.building, item.asset.section, item.asset.roomName]
    .filter(Boolean)
    .join(' ');

  return [
    'モックユーザー',
    formatDate(item.confirmedAt),
    STATUS_LABELS[item.status] || item.status,
    item.asset.qrCode,
    item.asset.name,
    item.asset.department,
    location,
    item.asset.maker,
    item.asset.model,
    item.asset.serialNumber || '',
    item.asset.assetNo || '',
  ];
}

export function exportInventoryToExcel(
  items: InventoryExportItem[],
  fileName?: string
): void {
  const data = [HEADERS, ...items.map(itemToRow)];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 14 }, // 棚卸担当者
    { wch: 14 }, // 棚卸登録日
    { wch: 10 }, // 結果
    { wch: 16 }, // QRコード
    { wch: 28 }, // 資産名
    { wch: 14 }, // 管理部署
    { wch: 24 }, // 設置場所
    { wch: 16 }, // メーカー
    { wch: 20 }, // 型式
    { wch: 16 }, // シリアルNo.
    { wch: 18 }, // 固定資産番号
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '棚卸し結果');
  XLSX.writeFile(wb, fileName || '棚卸し結果.xlsx');
}
