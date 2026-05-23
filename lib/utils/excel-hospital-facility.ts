import * as XLSX from 'xlsx';
import { HospitalFacilityMaster } from '@/lib/types/hospitalFacility';

const HEADERS = [
  'ID',
  '病院ID',
  '病院名',
  '旧_SHIP部門',
  '旧_SHIP部署',
  '旧_SHIP諸室区分①',
  '諸室区分②',
  '部門ID',
  '部署ID',
  '諸室ID',
  '新_棟',
  '新_フロア',
  '新_部門',
  '新_部署',
  '新_室名称',
  '新_室数',
  '旧_棟',
  '旧_フロア',
  '旧_部門',
  '旧_部署',
  '旧_室名称',
  '新_SHIP部門',
  '新_SHIP部署',
  '新_SHIP諸室区分',
];

const REQUIRED_FIELDS = ['病院ID', '病院名', '旧_フロア', '旧_部門', '旧_室名称'] as const;

interface ParseResult {
  facilities: HospitalFacilityMaster[];
  errors: string[];
}

function facilityToRow(f: HospitalFacilityMaster): (string | number)[] {
  return [
    f.id,
    f.hospitalId,
    f.hospitalName,
    f.oldShipDivision,
    f.oldShipDepartment,
    f.oldShipRoomCategory,
    f.shipRoomCategory2,
    f.divisionId,
    f.departmentId,
    f.roomId,
    f.newBuilding,
    f.newFloor,
    f.newDepartment,
    f.newSection,
    f.newRoomName,
    f.newRoomCount,
    f.oldBuilding,
    f.oldFloor,
    f.oldDepartment,
    f.oldSection,
    f.oldRoomName,
    f.newShipDivision,
    f.newShipDepartment,
    f.newShipRoomCategory,
  ];
}

export function exportFacilitiesToExcel(
  facilities: HospitalFacilityMaster[],
  fileName?: string,
): void {
  const data = [HEADERS, ...facilities.map(facilityToRow)];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 12 },  // ID
    { wch: 20 },  // 病院ID
    { wch: 20 },  // 病院名
    { wch: 14 },  // 旧_SHIP部門
    { wch: 14 },  // 旧_SHIP部署
    { wch: 16 },  // 旧_SHIP諸室区分①
    { wch: 16 },  // 諸室区分②
    { wch: 10 },  // 部門ID
    { wch: 10 },  // 部署ID
    { wch: 10 },  // 諸室ID
    { wch: 10 },  // 新_棟
    { wch: 10 },  // 新_フロア
    { wch: 14 },  // 新_部門
    { wch: 14 },  // 新_部署
    { wch: 16 },  // 新_室名称
    { wch: 8 },   // 新_室数
    { wch: 10 },  // 旧_棟
    { wch: 10 },  // 旧_フロア
    { wch: 14 },  // 旧_部門
    { wch: 14 },  // 旧_部署
    { wch: 16 },  // 旧_室名称
    { wch: 14 },  // 新_SHIP部門
    { wch: 14 },  // 新_SHIP部署
    { wch: 16 },  // 新_SHIP諸室区分
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '個別部署マスタ');
  XLSX.writeFile(wb, fileName || '個別部署マスタ.xlsx');
}

export function parseFacilitiesFromExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          resolve({ facilities: [], errors: ['データ行がありません'] });
          return;
        }

        const headerRow = rows[0].map((h) => String(h).trim());
        const facilities: HospitalFacilityMaster[] = [];
        const errors: string[] = [];

        const colIndex = (name: string) => headerRow.indexOf(name);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.every((cell) => !cell && cell !== 0)) continue;

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

          const newFloor = getValue('新_フロア');
          const newDepartment = getValue('新_部門');
          const newSection = getValue('新_部署');
          const newRoomName = getValue('新_室名称');
          const newShipDivision = getValue('新_SHIP部門');
          const newShipDepartment = getValue('新_SHIP部署');
          const newShipRoomCategory = getValue('新_SHIP諸室区分');

          // status自動判定: 新側7フィールドすべて入力済み → mapped、それ以外 → draft
          const allNewFilled = [
            newFloor, newDepartment, newSection, newRoomName,
            newShipDivision, newShipDepartment, newShipRoomCategory,
          ].every((v) => v !== '');
          const status = allNewFilled ? 'mapped' : 'draft';

          const now = new Date().toISOString();
          facilities.push({
            id: '',
            hospitalId: getValue('病院ID'),
            hospitalName: getValue('病院名'),
            oldShipDivision: getValue('旧_SHIP部門'),
            oldShipDepartment: getValue('旧_SHIP部署'),
            oldShipRoomCategory: getValue('旧_SHIP諸室区分①'),
            shipRoomCategory2: getValue('諸室区分②'),
            divisionId: getValue('部門ID'),
            departmentId: getValue('部署ID'),
            roomId: getValue('諸室ID'),
            newBuilding: getValue('新_棟'),
            newFloor,
            newDepartment,
            newSection,
            newRoomName,
            newRoomCount: getValue('新_室数'),
            oldBuilding: getValue('旧_棟'),
            oldFloor: getValue('旧_フロア'),
            oldDepartment: getValue('旧_部門'),
            oldSection: getValue('旧_部署'),
            oldRoomName: getValue('旧_室名称'),
            newShipDivision,
            newShipDepartment,
            newShipRoomCategory,
            status,
            createdAt: now,
            updatedAt: now,
          });
        }

        resolve({ facilities, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsArrayBuffer(file);
  });
}

export function assignFacilityIds(
  newFacilities: HospitalFacilityMaster[],
  existingFacilities: HospitalFacilityMaster[],
): HospitalFacilityMaster[] {
  let maxNum = 0;
  for (const f of existingFacilities) {
    const match = f.id.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return newFacilities.map((facility, i) => ({
    ...facility,
    id: `HF${String(maxNum + i + 1).padStart(5, '0')}`,
  }));
}

export function downloadFacilityTemplate(): void {
  const data = [HEADERS];
  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!cols'] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '個別部署マスタ');
  XLSX.writeFile(wb, '個別部署マスタ_テンプレート.xlsx');
}
