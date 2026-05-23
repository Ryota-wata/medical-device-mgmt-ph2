// カラム定義の型
export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  defaultVisible?: boolean;
  group?: string;
}

// 資産テーブルのカラム定義
export const ASSET_COLUMNS: ColumnDef[] = [
  // 基本情報
  { key: 'facility', label: '施設名', width: '200px', defaultVisible: true, group: 'basic' },

  // 共通マスタ（SHIP部署マスタ連携）
  { key: 'shipDivision', label: '部門名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'shipDepartment', label: '部署名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'roomClass1', label: '諸室区分①', width: '140px', defaultVisible: true, group: 'commonMaster' },
  { key: 'roomClass2', label: '諸室区分②', width: '140px', defaultVisible: true, group: 'commonMaster' },

  // 設置情報
  { key: 'divisionId', label: '部門ID', width: '80px', defaultVisible: false, group: 'location' },
  { key: 'departmentId', label: '部署ID', width: '80px', defaultVisible: false, group: 'location' },
  { key: 'roomId', label: '諸室ID', width: '80px', defaultVisible: false, group: 'location' },
  { key: 'building', label: '棟', width: '100px', defaultVisible: true, group: 'location' },
  { key: 'floor', label: '階', width: '80px', defaultVisible: true, group: 'location' },
  { key: 'department', label: '部門', width: '120px', defaultVisible: true, group: 'location' },
  { key: 'section', label: '部署', width: '120px', defaultVisible: true, group: 'location' },
  { key: 'roomName', label: '室名', width: '150px', defaultVisible: true, group: 'location' },
  { key: 'installationLocation', label: '設置場所', width: '150px', defaultVisible: false, group: 'location' },

  // 識別情報
  { key: 'qrCode', label: 'QRコード', width: '150px', defaultVisible: true, group: 'identity' },
  { key: 'assetNo', label: '台帳番号', width: '150px', defaultVisible: true, group: 'identity' },
  { key: 'managementDept', label: '管理部署', width: '120px', defaultVisible: false, group: 'identity' },
  { key: 'managementNo', label: '管理機器番号', width: '150px', defaultVisible: false, group: 'identity' },
  { key: 'equipmentNo', label: '備品番号', width: '120px', defaultVisible: false, group: 'identity' },
  { key: 'serialNumber', label: 'シリアルNo.', width: '150px', defaultVisible: false, group: 'identity' },

  // 資産分類
  { key: 'assetMasterId', label: '資産マスタID', width: '120px', defaultVisible: false, group: 'classification' },
  { key: 'category', label: 'Category', width: '120px', defaultVisible: false, group: 'classification' },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: true, group: 'classification' },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: true, group: 'classification' },
  { key: 'detailCategory', label: '明細区分', width: '100px', defaultVisible: false, group: 'classification' },
  { key: 'item', label: '個体管理品目', width: '180px', defaultVisible: true, group: 'classification' },

  // 機器仕様
  { key: 'name', label: '個体管理名称', width: '200px', defaultVisible: false, group: 'specification' },
  { key: 'maker', label: 'メーカー名', width: '150px', defaultVisible: true, group: 'specification' },
  { key: 'model', label: '型式', width: '150px', defaultVisible: true, group: 'specification' },
  { key: 'width', label: 'W', width: '80px', defaultVisible: false, group: 'specification' },
  { key: 'depth', label: 'D', width: '80px', defaultVisible: false, group: 'specification' },
  { key: 'height', label: 'H', width: '80px', defaultVisible: false, group: 'specification' },

  // 取得情報（現有品調査由来）
  { key: 'purchaseDate', label: '購入年月日', width: '120px', defaultVisible: false, group: 'acquisition' },
  { key: 'lease', label: 'リース', width: '80px', defaultVisible: false, group: 'acquisition' },
  { key: 'rental', label: '貸出品', width: '80px', defaultVisible: false, group: 'acquisition' },

  // その他
  { key: 'remarks', label: '備考', width: '200px', defaultVisible: false, group: 'other' },
  { key: 'photos', label: '写真', width: '80px', defaultVisible: false, group: 'other' },

  // 契約情報（編集画面用）
  { key: 'contractName', label: '契約･見積名称', width: '180px', defaultVisible: false, group: 'contract' },
  { key: 'contractNo', label: '契約番号（契約単位）', width: '180px', defaultVisible: false, group: 'contract' },
  { key: 'quotationNo', label: '見積番号', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'contractDate', label: '契約･発注日', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'deliveryDate', label: '納品日', width: '120px', defaultVisible: false, group: 'contract' },
  { key: 'inspectionDate', label: '検収日', width: '120px', defaultVisible: false, group: 'contract' },

  // リース詳細（編集画面用）
  { key: 'leaseStartDate', label: 'リース開始日', width: '120px', defaultVisible: false, group: 'leaseDetail' },
  { key: 'leaseEndDate', label: 'リース終了日', width: '120px', defaultVisible: false, group: 'leaseDetail' },

  // 財務情報（編集画面用）
  { key: 'acquisitionCost', label: '取得価格', width: '120px', defaultVisible: false, group: 'financial' },
  { key: 'assetInfo', label: '資産情報', width: '200px', defaultVisible: false, group: 'financial' },

  // 耐用年数（編集画面用）
  { key: 'legalServiceLife', label: '耐用年数（法定）', width: '140px', defaultVisible: false, group: 'lifespan' },
  { key: 'recommendedServiceLife', label: '使用年数（メーカー推奨）', width: '180px', defaultVisible: false, group: 'lifespan' },
  { key: 'endOfService', label: 'End of service：販売終了', width: '180px', defaultVisible: false, group: 'lifespan' },
  { key: 'endOfSupport', label: 'End of support：メンテ終了', width: '180px', defaultVisible: false, group: 'lifespan' },
];

// ============================
// 編集リスト（リモデル申請）用カラム定義
// Excel「原本リスト・編集分析リスト」の行1「編集リスト(リ)」で○マークが付いた58列に準拠
// ============================

export const REMODEL_COLUMNS: ColumnDef[] = [
  // ── 処理方針（リモデル時のみ） ──
  { key: 'purchaseCategory', label: '処理方針', width: '110px', defaultVisible: true, group: 'decision' },

  // ── 共通部署マスタ ──
  { key: 'commonDivision', label: '共通部門名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'commonDepartment', label: '共通部署名', width: '120px', defaultVisible: true, group: 'commonMaster' },
  { key: 'roomCategory1', label: '諸室区分①', width: '140px', defaultVisible: true, group: 'commonMaster' },
  { key: 'roomCategory2', label: '諸室区分②', width: '140px', defaultVisible: true, group: 'commonMaster' },

  // ── 設置ID ──
  { key: 'divisionId', label: '部門ID', width: '80px', defaultVisible: false, group: 'locationId' },
  { key: 'departmentId', label: '部署ID', width: '80px', defaultVisible: false, group: 'locationId' },
  { key: 'roomId', label: '諸室ID', width: '80px', defaultVisible: false, group: 'locationId' },

  // ── 設置情報（現） ──
  { key: 'currentBuilding', label: '棟', width: '100px', defaultVisible: true, group: 'currentLocation' },
  { key: 'currentFloor', label: '階', width: '80px', defaultVisible: true, group: 'currentLocation' },
  { key: 'currentDivision', label: '部門名', width: '120px', defaultVisible: true, group: 'currentLocation' },
  { key: 'currentDepartment', label: '部署名', width: '120px', defaultVisible: true, group: 'currentLocation' },
  { key: 'currentRoom', label: '室名', width: '150px', defaultVisible: true, group: 'currentLocation' },

  // ── 設置情報（新） ──
  { key: 'newBuilding', label: '棟', width: '100px', defaultVisible: true, group: 'newLocation' },
  { key: 'newFloor', label: '階', width: '80px', defaultVisible: true, group: 'newLocation' },
  { key: 'newDivision', label: '部門名', width: '120px', defaultVisible: true, group: 'newLocation' },
  { key: 'newDepartment', label: '部署名', width: '120px', defaultVisible: true, group: 'newLocation' },
  { key: 'newRoom', label: '室名', width: '150px', defaultVisible: true, group: 'newLocation' },

  // ── 識別情報 ──
  { key: 'serialNo', label: 'シリアル番号', width: '130px', defaultVisible: true, group: 'identification' },
  { key: 'fixedAssetNo', label: '固定資産番号', width: '130px', defaultVisible: true, group: 'identification' },
  { key: 'meNo', label: 'ME管理機器番号', width: '130px', defaultVisible: true, group: 'identification' },
  { key: 'qrCode', label: 'QRコード', width: '120px', defaultVisible: true, group: 'identification' },

  // ── 品目情報❶（資産マスタ） ──
  { key: 'assetMasterId', label: '資産マスタID', width: '130px', defaultVisible: true, group: 'assetMaster' },
  { key: 'category', label: 'カテゴリ', width: '120px', defaultVisible: true, group: 'assetMaster' },
  { key: 'largeClass', label: '大分類', width: '150px', defaultVisible: true, group: 'assetMaster' },
  { key: 'mediumClass', label: '中分類', width: '150px', defaultVisible: true, group: 'assetMaster' },

  // ── 品目情報❷ ──
  { key: 'itemType', label: '明細区分', width: '90px', defaultVisible: true, group: 'itemInfo' },
  { key: 'parentItem', label: '明細親機', width: '120px', defaultVisible: true, group: 'itemInfo' },
  { key: 'itemName', label: '品目名', width: '180px', defaultVisible: true, group: 'itemInfo' },
  { key: 'manufacturer', label: 'メーカー名', width: '140px', defaultVisible: true, group: 'itemInfo' },
  { key: 'model', label: '型式', width: '140px', defaultVisible: true, group: 'itemInfo' },
  { key: 'quantity', label: '数量', width: '60px', defaultVisible: true, group: 'itemInfo' },
  { key: 'unit', label: '単位', width: '60px', defaultVisible: true, group: 'itemInfo' },
  { key: 'managementDept', label: '管理部署', width: '120px', defaultVisible: true, group: 'itemInfo' },

  // ── 品目情報❸（原本事後登録） ──
  { key: 'deviceType', label: '機器種別', width: '120px', defaultVisible: true, group: 'itemInfoExtra' },
  { key: 'assetGroupName', label: '資産グループ名称', width: '150px', defaultVisible: true, group: 'itemInfoExtra' },
  { key: 'purpose', label: '使用目的', width: '150px', defaultVisible: true, group: 'itemInfoExtra' },
  { key: 'remarks', label: '備考', width: '200px', defaultVisible: true, group: 'itemInfoExtra' },

  // ── 申請情報（リモ） ──
  { key: 'applicationType', label: '申請種別', width: '100px', defaultVisible: true, group: 'applicationInfo' },
  { key: 'fiscalYear', label: '執行年度', width: '100px', defaultVisible: true, group: 'applicationInfo' },
  { key: 'priority', label: '優先順位', width: '80px', defaultVisible: true, group: 'applicationInfo' },
  { key: 'systemConnection', label: 'システム接続', width: '110px', defaultVisible: true, group: 'applicationInfo' },
  { key: 'systemTarget', label: 'システム接続先', width: '130px', defaultVisible: true, group: 'applicationInfo' },

  // ── 要望情報 ──
  { key: 'wish1Manufacturer', label: '①要望メーカー', width: '140px', defaultVisible: true, group: 'wishInfo' },
  { key: 'wish1Model', label: '①要望型式', width: '140px', defaultVisible: true, group: 'wishInfo' },
  { key: 'wish2Manufacturer', label: '②要望メーカー', width: '140px', defaultVisible: false, group: 'wishInfo' },
  { key: 'wish2Model', label: '②要望型式', width: '140px', defaultVisible: false, group: 'wishInfo' },
  { key: 'wish3Manufacturer', label: '③要望メーカー', width: '140px', defaultVisible: false, group: 'wishInfo' },
  { key: 'wish3Model', label: '③要望型式', width: '140px', defaultVisible: false, group: 'wishInfo' },

  // ── 見積情報 ──
  { key: 'rfqNo', label: '見積依頼No.', width: '130px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'rfqGroupName', label: '見積グループ名', width: '150px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'quotationPhase', label: '見積フェーズ', width: '100px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'quotationDate', label: '見積日付', width: '110px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'accountCategory', label: '会計区分', width: '100px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'listPriceUnit', label: '定価単価', width: '100px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'listPriceTotal', label: '定価金額', width: '100px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'quotationPriceUnit', label: '見積単価', width: '100px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'quotationPriceExTax', label: '見積金額（税別）', width: '120px', defaultVisible: true, group: 'quotationInfo' },
  { key: 'quotationPriceInTax', label: '見積金額（税込）', width: '120px', defaultVisible: true, group: 'quotationInfo' },
];

// 編集リスト用グループラベル・色定義
export const REMODEL_COLUMN_GROUPS: { id: string; label: string; color: string }[] = [
  { id: 'decision', label: '処理方針', color: '#27ae60' },
  { id: 'commonMaster', label: '共通部署マスタ', color: '#6c757d' },
  { id: 'locationId', label: '設置ID', color: '#495057' },
  { id: 'currentLocation', label: '設置情報（現）', color: '#0d6efd' },
  { id: 'newLocation', label: '設置情報（新）', color: '#0d6efd' },
  { id: 'identification', label: '識別情報', color: '#198754' },
  { id: 'assetMaster', label: '品目情報❶', color: '#198754' },
  { id: 'itemInfo', label: '品目情報❷', color: '#198754' },
  { id: 'itemInfoExtra', label: '品目情報❸', color: '#6f42c1' },
  { id: 'applicationInfo', label: '申請情報', color: '#e67e22' },
  { id: 'wishInfo', label: '要望情報', color: '#e67e22' },
  { id: 'quotationInfo', label: '見積情報', color: '#8e44ad' },
];

// リモデル編集リスト用カラムプリセット
export const REMODEL_COLUMN_PRESETS: { id: string; label: string; columns: string[] }[] = [
  {
    id: 'all',
    label: '全カラム',
    columns: [], // 空 = 全て表示
  },
  {
    id: 'hearing',
    label: 'ヒアリング用',
    columns: ['commonDivision', 'commonDepartment', 'currentRoom', 'newRoom', 'itemName', 'manufacturer', 'model', 'quantity', 'remarks'],
  },
  {
    id: 'rfq',
    label: '見積依頼用',
    columns: ['rfqNo', 'rfqGroupName', 'itemName', 'manufacturer', 'model', 'quotationPriceExTax', 'quotationPriceInTax'],
  },
];

// ユーティリティ関数: カラムのラベルを上書き
export function overrideColumnLabels(
  columns: ColumnDef[],
  overrides: Record<string, string>
): ColumnDef[] {
  return columns.map(col =>
    overrides[col.key] ? { ...col, label: overrides[col.key] } : col
  );
}
