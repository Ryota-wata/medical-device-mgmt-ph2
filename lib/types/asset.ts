/**
 * 資産データの型定義
 */

/**
 * 資産検索結果の型
 */
export interface Asset {
  qrCode: string;
  no: number;
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  name: string;
  maker: string;
  model: string;
  quantity: number;
  width: number | string;
  depth: number | string;
  height: number | string;
  photos?: string[];

  // 共通マスタ（SHIP部署マスタ連携）
  shipDivision?: string; // SHIP部門名
  shipDepartment?: string; // SHIP部署名
  roomClass1?: string; // 諸室区分①
  roomClass2?: string; // 諸室区分②

  // 設置情報ID
  divisionId?: string; // 部門ID
  departmentId?: string; // 部署ID
  roomId?: string; // 諸室ID

  // 識別情報
  ledgerNo?: string; // 台帳番号
  managementDept?: string; // 管理部署
  equipmentNo?: string; // 備品番号（現有品調査）
  serialNumber?: string; // シリアル番号

  // 資産分類
  assetMasterId?: string; // 資産マスタID
  detailCategory?: string; // 明細区分

  // 追加フィールド（個体管理対応）
  assetNo?: string; // 固定資産番号
  managementNo?: string; // 管理機器番号
  roomName?: string; // 諸室名称
  installationLocation?: string; // 設置場所
  assetInfo?: string; // 資産情報
  quantityUnit?: string; // 数量／単位

  // 調査情報（現有品調査由来）
  purchaseDate?: string; // 購入年月日
  remarks?: string; // 備考
  contractName?: string; // 契約･見積名称
  contractNo?: string; // 契約番号（契約単位）
  quotationNo?: string; // 見積番号
  contractDate?: string; // 契約･発注日
  deliveryDate?: string; // 納品日
  inspectionDate?: string; // 検収日
  lease?: string; // リース
  rental?: string; // 借用
  leaseStartDate?: string; // リース開始日
  leaseEndDate?: string; // リース終了日
  acquisitionCost?: number; // 取得価格
  legalServiceLife?: string; // 耐用年数（法定）
  recommendedServiceLife?: string; // 使用年数（メーカー推奨）
  endOfService?: string; // End of service：販売終了
  endOfSupport?: string; // End of support：メンテ終了

  // 作業用フィールド（見積依頼関連）
  rfqNo?: string; // 見積依頼No.
  rfqGroupName?: string; // グループ名称
  rfqVendor?: string; // 見積業者
  rfqAmount?: number | string; // 見積金額

  // 資産分類（追加）
  parentItem?: string; // 明細親機

  // 購入申請情報
  applicationCategory?: string; // 申請種別（要望区分）
  applicationNo?: string; // 申請No.
  applicationDate?: string; // 申請日
  applicationReason?: string; // 申請理由
  desiredDeliveryDate?: string; // 希望納期
  applicantName?: string; // 申請者
  applicantDepartment?: string; // 申請部署
  priority?: string; // 優先順位
  applicationItem?: string; // 申請品目
  requestItem1?: string; // 要望①品目
  requestMaker1?: string; // 要望①メーカー
  requestModel1?: string; // 要望①型式
  requestItem2?: string; // 要望②品目
  requestMaker2?: string; // 要望②メーカー
  requestModel2?: string; // 要望②型式
  requestItem3?: string; // 要望③品目
  requestMaker3?: string; // 要望③メーカー
  requestModel3?: string; // 要望③型式
  usagePurpose?: string; // 使用症例・用途
  caseCount?: string; // 件数
  caseCountUnit?: string; // 単位（件数）
  comment?: string; // コメント
  attachedFiles?: string[]; // 添付ファイル
  currentConnectionStatus?: string; // ネットワーク接続
  currentConnectionDestination?: string; // 現在の接続先
  requestConnectionStatus?: string; // ネットワーク接続要望
  requestConnectionDestination?: string; // 要望接続先

  // 見積・積算
  estimatedAmount?: number | string; // 積算金額（税別）
  estimatedBasis?: string; // 積算根拠
  annualUpdateRequest?: string; // 年度更新要望

  // 廃棄申請情報
  disposalApplicationDate?: string; // 廃棄申請日
  disposalApplicationNo?: string; // 廃棄申請No.
  disposalComment?: string; // コメント（廃棄）

  // 移動申請情報
  transferApplicationDate?: string; // 移動申請日
  transferApplicationNo?: string; // 移動申請No.
  transferDivision?: string; // 部門名（移動先）
  transferDepartment?: string; // 部署名（移動先）
  transferRoomName?: string; // 室名（移動先）
  transferParentItem?: string; // 明細親機（移動先）
  transferComment?: string; // コメント（移動）

  // (新)設置情報（リモデル用）
  newBuilding?: string; // 新棟
  newFloor?: string; // 新階
  newDepartment?: string; // 新部門
  newSection?: string; // 新部署
  newRoomName?: string; // 新室名
  newDivision?: string; // 新部門名（編集リスト用）
  newRoom?: string; // 新室名（編集リスト用）

  // リモデル区分
  purchaseCategory?: '新規' | '更新' | '移設' | '増設' | '廃棄予定';
  executionFiscalYear?: string; // 執行希望年度
  updateSourceNo?: number; // 更新元レコードNo.

  sourceType?: 'base' | 'added'; // レコードソース（原本 or 追加）

  // ── 編集リスト(リ)用フィールド（Excel○マーク58列対応） ──

  // 共通部署マスタ
  commonDivision?: string; // 共通部門名
  commonDepartment?: string; // 共通部署名
  roomCategory1?: string; // 諸室区分①
  roomCategory2?: string; // 諸室区分②

  // 設置情報（現）
  currentBuilding?: string;
  currentFloor?: string;
  currentDivision?: string;
  currentDepartment?: string;
  currentRoom?: string;

  // 識別情報
  serialNo?: string; // シリアル番号
  fixedAssetNo?: string; // 固定資産番号
  meNo?: string; // ME管理機器番号

  // 品目情報
  itemType?: string; // 明細区分
  itemName?: string; // 品目名
  manufacturer?: string; // メーカー名
  unit?: string; // 単位
  deviceType?: string; // 機器種別
  assetGroupName?: string; // 資産グループ名称
  purpose?: string; // 使用目的

  // 申請情報
  applicationType?: string; // 申請種別
  fiscalYear?: string; // 執行年度
  systemConnection?: string; // システム接続
  systemTarget?: string; // システム接続先

  // 要望情報
  wish1Manufacturer?: string;
  wish1Model?: string;
  wish2Manufacturer?: string;
  wish2Model?: string;
  wish3Manufacturer?: string;
  wish3Model?: string;

  // 見積情報
  quotationPhase?: string;
  quotationDate?: string;
  accountCategory?: string; // 会計区分
  listPriceUnit?: number; // 定価単価
  listPriceTotal?: number; // 定価金額
  quotationPriceUnit?: number; // 見積単価
  quotationPriceExTax?: number; // 見積金額（税別）
  quotationPriceInTax?: number; // 見積金額（税込）
}

/**
 * リモデル申請データの型
 */
export interface RemodelApplication {
  no: number;
  facility: string;
  // 移動前の情報
  department1: string;
  section1: string;
  roomCat1: string;
  roomCat2: string;
  // 識別情報
  qrCode: string;
  fixedAssetNo: string;
  manageDeviceNo: string;
  floor: string;
  // 設置部署
  department2: string;
  section2: string;
  roomName: string;
  // 資産分類
  category: string;
  largeClass: string;
  mediumClass: string;
  individualName: string;
  // メーカー・型式
  maker1: string;
  model1: string;
  maker2: string;
  model2: string;
  // 数量・寸法
  quantityUnit: string;
  quantity: number;
  width: number | string;
  depth: number | string;
  height: number | string;
  serialNo: string;
  // 設置情報
  installPlace: string;
  assetInfo: string;
  // 契約情報
  contractName: string;
  contractNo: string;
  quotationNo: string;
  contractDate: string;
  deliveryDate: string;
  // 検査情報
  inspectionDate1: string;
  inspectionDate2: string;
  // リース情報
  lease: string;
  rental: string;
  leaseStart: string;
  leaseEnd: string;
  // 価格・耐用年数
  acquisitionPrice: string;
  usefulLifeLegal: string;
  usefulLifeMaker: string;
  endOfService: string;
  endOfSupport: string;
  // 写真
  photos?: string[];
}

/**
 * 資産マスタデータの型
 */
export interface AssetMasterData {
  id: number;
  category: string;
  largeClass: string;
  mediumClass: string;
  individualItem: string;
  maker: string;
  model: string;
}
