import { Asset } from '@/lib/types';

// マスタデータ
export const DEPARTMENT_LIST = ['外科', '内科', '小児科', '病棟', '検査科', '放射線科', 'リハビリテーション科', '事務局'];
export const SECTION_LIST = ['手術室', '診察室', '病棟', '検査室', 'CT室', 'MRI室', '理学療法室', '総務課'];
export const BUILDING_LIST = ['本館', '東館', '西館', '別館', '新館'];

export function generateMockAssets(targetFacilities: string[]): Asset[] {
  const assets: Asset[] = [];
  const facilitiesList = targetFacilities.length > 0 ? targetFacilities : [''];
  let no = 1;

  facilitiesList.forEach((facilityName) => {
    const countPerFacility = Math.ceil(20 / facilitiesList.length);
    for (let i = 0; i < countPerFacility && no <= 20; i++) {
      const deptIndex = (no - 1) % DEPARTMENT_LIST.length;
      assets.push({
        qrCode: `QR-2025-${String(no).padStart(4, '0')}`,
        no: no,
        facility: facilityName,
        building: BUILDING_LIST[(no - 1) % BUILDING_LIST.length],
        floor: `${((no - 1) % 5) + 1}F`,
        department: DEPARTMENT_LIST[deptIndex],
        section: SECTION_LIST[deptIndex],
        category: '医療機器',
        largeClass: '手術関連機器',
        mediumClass: no % 2 === 0 ? '電気メス 双極' : 'CT関連',
        item: `品目${no}`,
        name: `サンプル製品${no}`,
        maker: '医療機器',
        model: `MODEL-${no}`,
        quantity: 1,
        width: 500 + no * 10,
        depth: 600 + no * 10,
        height: 700 + no * 10,
        assetNo: `10605379-${String(no).padStart(3, '0')}`,
        managementNo: `${1338 + no}`,
        roomClass1: '手術室',
        roomClass2: 'OP室',
        roomName: `手術室${String.fromCharCode(65 + (no - 1) % 26)}`,
        installationLocation: `手術室${String.fromCharCode(65 + (no - 1) % 26)}-中央`,
        assetInfo: '資産台帳登録済',
        quantityUnit: '1台',
        serialNumber: `SN-2024-${String(no).padStart(3, '0')}`,
        contractName: `医療機器購入契約2024-${String(no).padStart(2, '0')}`,
        contractNo: `C-2024-${String(no).padStart(4, '0')}`,
        quotationNo: `Q-2024-${String(no).padStart(4, '0')}`,
        contractDate: '2024-01-10',
        deliveryDate: '2024-01-20',
        inspectionDate: '2024-01-25',
        lease: no % 3 === 0 ? 'あり' : 'なし',
        rental: no % 5 === 0 ? 'あり' : 'なし',
        leaseStartDate: no % 3 === 0 ? '2024-01-01' : '',
        leaseEndDate: no % 3 === 0 ? '2029-12-31' : '',
        acquisitionCost: 1000000 * no,
        legalServiceLife: '6年',
        recommendedServiceLife: '8年',
        endOfService: '2032-12-31',
        endOfSupport: '2035-12-31',
        // 作業用フィールド（初期値は空）
        rfqNo: '',
        rfqGroupName: '',
        rfqVendor: '',
        rfqAmount: '',
      });
      no++;
    }
  });
  return assets;
}
