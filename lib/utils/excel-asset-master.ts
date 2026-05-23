import * as XLSX from 'xlsx';
import { AssetMaster } from '@/lib/types/master';

const HEADERS = [
  'ID',
  '類別コード',
  '類別名称',
  'JMDN中分類名',
  '一般的名称',
  'JMDNコード',
  '販売名',
  '製造販売業者等',
  '添付文書',
  '資産マスタID',
  'Category',
  '大分類',
  '中分類',
  '品目',
  'メーカー',
  '型式',
  '添付文書Document',
  'カタログDocument',
  'その他Document',
  '仕様',
  '単価',
  '耐用年数',
  'メンテナンスサイクル(月)',
  'ステータス',
];

const REQUIRED_FIELDS = ['Category', '大分類', '中分類', '品目', 'メーカー', '型式'] as const;

interface ParseResult {
  assets: AssetMaster[];
  errors: string[];
}

function assetToRow(asset: AssetMaster): (string | number)[] {
  return [
    asset.id,
    asset.classificationCode,
    asset.classificationName,
    asset.jmdnSubCategory,
    asset.generalName,
    asset.jmdnCode,
    asset.tradeName,
    asset.manufacturer,
    asset.packageInsert,
    asset.assetMasterId,
    asset.category,
    asset.largeClass,
    asset.mediumClass,
    asset.item,
    asset.maker,
    asset.model,
    asset.packageInsertDocument,
    asset.catalogDocument,
    asset.otherDocument,
    asset.specification,
    asset.unitPrice,
    asset.depreciationYears,
    asset.maintenanceCycle,
    asset.status,
  ];
}

export function exportAssetsToExcel(assets: AssetMaster[], fileName?: string): void {
  const data = [HEADERS, ...assets.map(assetToRow)];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 列幅を設定
  ws['!cols'] = [
    { wch: 12 }, // ID
    { wch: 10 }, // 類別コード
    { wch: 30 }, // 類別名称
    { wch: 16 }, // JMDN中分類名
    { wch: 24 }, // 一般的名称
    { wch: 12 }, // JMDNコード
    { wch: 30 }, // 販売名
    { wch: 20 }, // 製造販売業者等
    { wch: 24 }, // 添付文書
    { wch: 14 }, // 資産マスタID
    { wch: 12 }, // Category
    { wch: 16 }, // 大分類
    { wch: 16 }, // 中分類
    { wch: 24 }, // 品目
    { wch: 16 }, // メーカー
    { wch: 16 }, // 型式
    { wch: 20 }, // 添付文書Document
    { wch: 20 }, // カタログDocument
    { wch: 20 }, // その他Document
    { wch: 30 }, // 仕様
    { wch: 14 }, // 単価
    { wch: 10 }, // 耐用年数
    { wch: 22 }, // メンテナンスサイクル
    { wch: 10 }, // ステータス
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '資産マスタ');
  XLSX.writeFile(wb, fileName || 'SHIP資産マスタ.xlsx');
}

export function parseAssetsFromExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          resolve({ assets: [], errors: ['データ行がありません'] });
          return;
        }

        const headerRow = rows[0].map((h) => String(h).trim());
        const assets: AssetMaster[] = [];
        const errors: string[] = [];

        // ヘッダーのインデックスマッピング
        const colIndex = (name: string) => headerRow.indexOf(name);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.every((cell) => !cell && cell !== 0)) continue; // 空行スキップ

          const rowNum = i + 1;
          const getValue = (colName: string): string => {
            const idx = colIndex(colName);
            if (idx === -1) return '';
            return row[idx] != null ? String(row[idx]).trim() : '';
          };

          // 必須項目チェック
          const missingFields: string[] = [];
          for (const field of REQUIRED_FIELDS) {
            if (!getValue(field)) {
              missingFields.push(field);
            }
          }
          if (missingFields.length > 0) {
            errors.push(`${rowNum}行目: 必須項目が未入力です（${missingFields.join(', ')}）`);
            continue;
          }

          const unitPrice = Number(getValue('単価'));
          const depreciationYears = Number(getValue('耐用年数'));
          const maintenanceCycle = Number(getValue('メンテナンスサイクル(月)'));
          const statusValue = getValue('ステータス');
          const status: 'active' | 'inactive' =
            statusValue === 'inactive' ? 'inactive' : 'active';

          const now = new Date().toISOString();
          assets.push({
            id: '', // IDは後で自動採番
            classificationCode: getValue('類別コード'),
            classificationName: getValue('類別名称'),
            jmdnSubCategory: getValue('JMDN中分類名'),
            generalName: getValue('一般的名称'),
            jmdnCode: getValue('JMDNコード'),
            tradeName: getValue('販売名'),
            manufacturer: getValue('製造販売業者等'),
            packageInsert: getValue('添付文書'),
            assetMasterId: getValue('資産マスタID'),
            category: getValue('Category'),
            largeClass: getValue('大分類'),
            mediumClass: getValue('中分類'),
            item: getValue('品目'),
            maker: getValue('メーカー'),
            model: getValue('型式'),
            packageInsertDocument: getValue('添付文書Document'),
            catalogDocument: getValue('カタログDocument'),
            otherDocument: getValue('その他Document'),
            specification: getValue('仕様'),
            unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
            depreciationYears: isNaN(depreciationYears) ? 0 : depreciationYears,
            maintenanceCycle: isNaN(maintenanceCycle) ? 0 : maintenanceCycle,
            status,
            createdAt: now,
            updatedAt: now,
          });
        }

        resolve({ assets, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsArrayBuffer(file);
  });
}

export function assignAssetIds(
  newAssets: AssetMaster[],
  existingAssets: AssetMaster[]
): AssetMaster[] {
  // 既存IDから最大番号を取得
  let maxNum = 0;
  for (const a of existingAssets) {
    const match = a.id.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return newAssets.map((asset, i) => ({
    ...asset,
    id: `ASSET${String(maxNum + i + 1).padStart(3, '0')}`,
  }));
}

export function downloadAssetTemplate(): void {
  const data = [HEADERS];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 22 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '資産マスタ');
  XLSX.writeFile(wb, 'SHIP資産マスタ_テンプレート.xlsx');
}
