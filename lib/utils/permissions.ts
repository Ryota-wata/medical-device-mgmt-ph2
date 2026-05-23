/**
 * ロール別権限定義
 *
 * 権限レベル:
 * - F: フルアクセス（全操作可能）
 * - W: 閲覧 + 編集
 * - R: 閲覧のみ
 * - C: 作成 + 自分の申請の閲覧
 * - X: アクセス不可
 */

import { UserRole } from '../types';

export type PermissionLevel = 'F' | 'W' | 'R' | 'C' | 'X';

/**
 * 機能ID一覧（Excelマッピング表準拠）
 */
export type FeatureId =
  // ユーザー管理
  | 'user_facility_access'
  | 'user_management'
  // 認証/認可
  | 'auth_login'
  | 'facility_select'
  | 'facility_select_all'
  // 原本リスト（■メニュー: 資産閲覧・申請）
  | 'original_list_view'
  | 'original_price_column'
  | 'original_list_edit'
  | 'original_application'
  // 保守・点検／貸出／修理申請（■メニュー）
  | 'daily_inspection'
  | 'lending_checkout'
  | 'repair_application'
  | 'application_status'
  // 棚卸し（■メニュー）
  | 'inventory_field'
  | 'inventory_office'
  // リモデルメニュー（■メニュー）
  | 'remodel_edit_list'
  | 'remodel_purchase'
  | 'remodel_order'
  | 'remodel_acceptance'
  | 'remodel_quotation'
  // 編集リスト・通常（■メニュー）
  | 'normal_edit_list'
  | 'ship_column'
  // タスク管理（■メニュー）
  | 'normal_purchase'
  | 'normal_order'
  | 'normal_acceptance'
  | 'normal_quotation'
  | 'transfer_disposal'
  | 'repair_management'
  | 'maintenance_contract'
  | 'inspection_management'
  | 'periodic_inspection'
  | 'lending_management'
  // QRコード（■メニュー）
  | 'qr_issue'
  | 'qr_scan'
  // データ閲覧・自施設（■メニュー）
  | 'own_asset_master_view'
  | 'own_user_master'
  | 'own_asset_list'
  | 'own_price_column'
  | 'own_estimate'
  | 'own_data_history'
  // データ閲覧・他施設（■メニュー）
  | 'other_asset_list'
  | 'other_price_column'
  | 'other_estimate'
  | 'other_data_history'
  // マスタ管理（■メニュー）
  | 'asset_master_list'
  | 'facility_master_list'
  | 'dept_vendor_master_list'
  | 'asset_master_edit'
  | 'facility_master_edit'
  | 'ship_dept_master_edit'
  | 'hospital_dept_master_edit'
  | 'vendor_master_edit'
  // 個体管理リスト作成
  | 'existing_survey'
  | 'survey_data_edit'
  | 'asset_ledger_import'
  | 'survey_ledger_matching';

/**
 * メイン画面ボタンID
 */
export type MainButtonId =
  | 'asset_list'
  | 'edit_list'
  | 'purchase_management'
  | 'maintenance_inspection'
  | 'lending_management'
  | 'repair_request'
  | 'asset_survey'
  | 'inventory'
  | 'master_management'
  | 'quotation_management'
  | 'user_management';

/**
 * 17ロール分の権限定義ヘルパー
 * 順序: system_admin, org_default_1, org_default_2, org_default_3, org_default_4,
 *       hospital_sys_admin, hospital_office, hospital_dept_head, hospital_me, hospital_doctor_nurse,
 *       rimo_hospital, estimate_staff, consignment_staff, lending_warehouse, inspection_mobile, transport_mobile, vendor_receiving_mobile
 */
function pm(levels: [
  PermissionLevel, // system_admin
  PermissionLevel, // org_default_1
  PermissionLevel, // org_default_2
  PermissionLevel, // org_default_3
  PermissionLevel, // org_default_4
  PermissionLevel, // hospital_sys_admin
  PermissionLevel, // hospital_office
  PermissionLevel, // hospital_dept_head
  PermissionLevel, // hospital_me
  PermissionLevel, // hospital_doctor_nurse
  PermissionLevel, // rimo_hospital
  PermissionLevel, // estimate_staff
  PermissionLevel, // consignment_staff
  PermissionLevel, // lending_warehouse
  PermissionLevel, // inspection_mobile
  PermissionLevel, // transport_mobile
  PermissionLevel, // vendor_receiving_mobile
]): Record<UserRole, PermissionLevel> {
  return {
    system_admin: levels[0],
    org_default_1: levels[1],
    org_default_2: levels[2],
    org_default_3: levels[3],
    org_default_4: levels[4],
    hospital_sys_admin: levels[5],
    hospital_office: levels[6],
    hospital_dept_head: levels[7],
    hospital_me: levels[8],
    hospital_doctor_nurse: levels[9],
    rimo_hospital: levels[10],
    estimate_staff: levels[11],
    consignment_staff: levels[12],
    lending_warehouse: levels[13],
    inspection_mobile: levels[14],
    transport_mobile: levels[15],
    vendor_receiving_mobile: levels[16],
  };
}

/**
 * 権限マトリクス（17ロール対応 / Excelマッピング表準拠）
 * ●→F(sysAdmin)/W, ー/空白→X, ON→W or R, OFF→X, ▲→W, ■→W
 */
const PERMISSION_MATRIX: Record<FeatureId, Record<UserRole, PermissionLevel>> = {
  //                                           sysAdm org1  org2  org3  org4  hSysAd hOff  hDpHd hME   hDrNr rimo  estSt conSt lendW insMb trMob vndMb

  // ── ユーザー管理 ──
  user_facility_access:              pm(['F',   'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  user_management:                   pm(['F',   'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── 認証/認可 ──
  auth_login:                        pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W']),
  facility_select:                   pm(['X',   'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  facility_select_all:               pm(['X',   'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X']),

  // ── 原本リスト（■資産閲覧・申請） ──
  original_list_view:                pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'W',  'X',  'X',  'X',  'X']),
  original_price_column:             pm(['F',   'W',  'W',  'W',  'W',  'R',  'R',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  original_list_edit:                pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  original_application:              pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),

  // ── 保守・点検／貸出／修理申請 ──
  daily_inspection:                  pm(['F',   'W',  'X',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X',  'W',  'X',  'X']),
  lending_checkout:                  pm(['F',   'X',  'X',  'X',  'X',  'X',  'X',  'W',  'W',  'W',  'X',  'X',  'W',  'W',  'X',  'W',  'X']),
  repair_application:                pm(['F',   'X',  'X',  'X',  'X',  'W',  'W',  'C',  'C',  'C',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  application_status:                pm(['F',   'X',  'X',  'X',  'X',  'W',  'W',  'R',  'R',  'R',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── 棚卸し ──
  inventory_field:                   pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'W',  'X',  'X',  'X',  'X']),
  inventory_office:                  pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── リモデルメニュー ──
  remodel_edit_list:                 pm(['F',   'W',  'W',  'W',  'X',  'X',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X',  'X']),
  remodel_purchase:                  pm(['F',   'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X']),
  remodel_order:                     pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  remodel_acceptance:                pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'W']),
  remodel_quotation:                 pm(['F',   'W',  'X',  'W',  'X',  'W',  'W',  'X',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X']),

  // ── 編集リスト（通常） ──
  normal_edit_list:                  pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  ship_column:                       pm(['F',   'W',  'X',  'W',  'X',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── タスク管理 ──
  normal_purchase:                   pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X']),
  normal_order:                      pm(['F',   'W',  'X',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  normal_acceptance:                 pm(['F',   'W',  'X',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'W']),
  normal_quotation:                  pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X']),
  transfer_disposal:                 pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  repair_management:                 pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  maintenance_contract:              pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  inspection_management:             pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  periodic_inspection:               pm(['F',   'W',  'X',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'W',  'X',  'X']),
  lending_management:                pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'W',  'X']),

  // ── QRコード ──
  qr_issue:                          pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  qr_scan:                           pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── データ閲覧（自施設） ──
  own_asset_master_view:             pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  own_user_master:                   pm(['F',   'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  own_asset_list:                    pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  own_price_column:                  pm(['F',   'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  own_estimate:                      pm(['F',   'X',  'X',  'X',  'X',  'X',  'X',  'W',  'W',  'X',  'X',  'W',  'W',  'X',  'X',  'X',  'X']),
  own_data_history:                  pm(['F',   'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── データ閲覧（他施設） ──
  other_asset_list:                  pm(['F',   'W',  'W',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  other_price_column:                pm(['F',   'W',  'X',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  other_estimate:                    pm(['F',   'X',  'X',  'X',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X']),
  other_data_history:                pm(['F',   'W',  'X',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── マスタ管理 ──
  asset_master_list:                 pm(['F',   'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  facility_master_list:              pm(['F',   'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  dept_vendor_master_list:           pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  asset_master_edit:                 pm(['F',   'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  facility_master_edit:              pm(['F',   'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  ship_dept_master_edit:             pm(['F',   'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  hospital_dept_master_edit:         pm(['F',   'W',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  vendor_master_edit:                pm(['F',   'W',  'X',  'X',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),

  // ── 個体管理リスト作成 ──
  existing_survey:                   pm(['F',   'W',  'X',  'X',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  survey_data_edit:                  pm(['F',   'W',  'X',  'X',  'X',  'W',  'W',  'W',  'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X']),
  asset_ledger_import:               pm(['F',   'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
  survey_ledger_matching:            pm(['F',   'W',  'X',  'X',  'X',  'W',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X',  'X']),
};

/**
 * メイン画面ボタン表示ヘルパー
 */
function bv(vals: [
  boolean, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean,
  boolean, boolean, boolean, boolean, boolean, boolean, boolean,
]): Record<UserRole, boolean> {
  return {
    system_admin: vals[0],
    org_default_1: vals[1],
    org_default_2: vals[2],
    org_default_3: vals[3],
    org_default_4: vals[4],
    hospital_sys_admin: vals[5],
    hospital_office: vals[6],
    hospital_dept_head: vals[7],
    hospital_me: vals[8],
    hospital_doctor_nurse: vals[9],
    rimo_hospital: vals[10],
    estimate_staff: vals[11],
    consignment_staff: vals[12],
    lending_warehouse: vals[13],
    inspection_mobile: vals[14],
    transport_mobile: vals[15],
    vendor_receiving_mobile: vals[16],
  };
}

/**
 * メイン画面ボタン表示マトリクス（17ロール対応）
 */
const MAIN_BUTTON_VISIBILITY: Record<MainButtonId, Record<UserRole, boolean>> = {
  //                                      sysAdm org1  org2  org3  org4  hSysAd hOff  hDpHd hME   hDrNr rimo  estSt conSt lendW insMb trMob vndMb
  asset_list:              bv([true,  true, true, true, true, true, true, true, true, true, true, true, false, false, false, false, false]),
  edit_list:               bv([true,  true, false,false,false,false,false,false,false,false,false,false,false, false, false, false, false]),
  purchase_management:     bv([true,  true, true, false,false,true, true, true, false,false,false,true, false, false, false, false, false]),
  maintenance_inspection:  bv([true,  false,false,false,false,true, true, true, true, false,false,false,false, false, true,  false, false]),
  lending_management:      bv([true,  false,false,false,false,true, true, true, true, true, false,false,false, true,  false, false, false]),
  repair_request:          bv([true,  false,false,false,false,true, true, true, true, true, false,false,false, false, false, false, false]),
  asset_survey:            bv([true,  true, false,false,false,true, true, true, true, false,false,false,false, false, false, false, false]),
  inventory:               bv([true,  true, false,false,false,true, true, true, true, true, false,false,false, false, false, false, false]),
  master_management:       bv([true,  true, false,false,false,true, false,false,false,false,false,false,false, false, false, false, false]),
  user_management:         bv([true,  false,false,false,false,true, false,false,false,false,false,false,false, false, false, false, false]),
  quotation_management:    bv([true,  true, true, false,false,true, true, false,false,false,false,true, false, false, false, false, false]),
};

/**
 * デフォルトの権限レベルを取得（PERMISSION_MATRIX から直接取得）
 */
export function getDefaultPermissionLevel(featureId: FeatureId, role: UserRole): PermissionLevel {
  return PERMISSION_MATRIX[featureId]?.[role] ?? 'X';
}

/**
 * 機能に対する権限レベルを取得
 * facilityName が指定された場合、オーバーライド設定を考慮する
 */
export function getPermissionLevel(
  featureId: FeatureId,
  role: UserRole,
  facilityName?: string,
  getOverride?: (facilityName: string, role: UserRole, featureId: FeatureId) => boolean | undefined
): PermissionLevel {
  const defaultLevel = PERMISSION_MATRIX[featureId]?.[role] ?? 'X';

  // system_admin はオーバーライド不可（常にデフォルト権限）
  if (role === 'system_admin') return defaultLevel;

  // facilityName と getOverride が指定されている場合、オーバーライドを確認
  if (facilityName && getOverride) {
    const override = getOverride(facilityName, role, featureId);
    if (override === false) return 'X';
  }

  return defaultLevel;
}

/** オーバーライド取得関数の型 */
type GetOverrideFn = (facilityName: string, role: UserRole, featureId: FeatureId) => boolean | undefined;

/**
 * FeatureId → PermissionUnitId[] の対応表（実利用される FeatureId のみ網羅）
 *
 * 用途: 新 2段階権限モデル（facilityFeatureStore × userFeatureStore × PU-NNNN）の
 *       施設/ユーザー OFF 設定を旧 FeatureId の判定に橋渡しするための最小マッピング層。
 *
 * 解釈: 当該 FeatureId は「対応 PU のうち少なくとも1つが ON のとき利用可能」。
 *       全 PU が OFF（施設または当該ユーザーで）なら、デフォルト権限を 'X' に上書きする。
 *       マッピングが無い FeatureId は新ストアの影響を受けない（=デフォルト権限のまま）。
 *
 * 注記: PU と FeatureId の粒度差・仕様未確定（permission-mock-mapping.yaml v0.2 機械化対象）
 *       のため、ここでは実画面で `canAccess`/`isMainButtonVisible` 経由参照される FeatureId のみ列挙する。
 *
 * 粒度差の補足:
 *   `normal_purchase` のように 1 FeatureId が複数の PU（行表示制御）に対応するケースは、
 *   「タスク管理画面の入口判定（広いゲート）」として扱う。配下の各行（申請受付/発注/検収/見積管理）の
 *   表示制御は、本マッピングではなくタスク管理画面側で個別に PU を見る設計を前提とする。
 *   よって 1 つでも ON の PU があれば本ゲートはデフォルト権限を返し、
 *   ALL OFF（=その画面で何も操作する権限が無いユーザー）のときだけ画面入口自体を X に落とす。
 */
export const FEATURE_TO_PU: Partial<Record<FeatureId, string[]>> = {
  normal_purchase: ['PU-0026', 'PU-0027', 'PU-0028', 'PU-0029'],
  qr_issue: ['PU-0014'],
  facility_master_list: ['PU-0039'],
  asset_master_list: ['PU-0036'],
  hospital_dept_master_edit: ['PU-0044', 'PU-0045'],
  existing_survey: ['PU-0015'],
  vendor_master_edit: ['PU-0046', 'PU-0047'],
};

/** 新ストア参照のシグネチャ（hook 側でクロージャを渡す） */
export type GetFacilityFeatureFn = (facilityName: string, permissionUnitId: string) => boolean;
export type GetUserFeatureFn = (userId: string, facilityName: string, permissionUnitId: string) => boolean | undefined;

/**
 * 新ストアの ON/OFF 状態を旧 GetOverrideFn シグネチャに橋渡しするファクトリ。
 *
 * - 当該 FeatureId にマッピングが無い場合: undefined（=デフォルト適用）
 * - マッピング先 PU の全てが OFF の場合: false（=デフォルトを X に上書き）
 * - 1つでも ON の PU があれば: undefined（=デフォルト適用）
 *
 * 評価則:
 *   施設レベル OFF → そのユーザーの対応 PU は OFF
 *   施設レベル ON + ユーザーレベル明示 OFF → そのユーザーの対応 PU は OFF
 *   施設レベル ON + ユーザーレベル未設定 → そのユーザーの対応 PU は ON
 *
 * userId 未設定時の挙動:
 *   ログイン直後で user.id が未確定の極短い瞬間や SHIP 系ロールで施設未選択時に呼ばれる可能性がある。
 *   このとき 1段目（施設レベル）の状態だけで判定する: 施設 ON ならその PU を ON 扱い。
 *   `system_admin` は呼出側 `getPermissionLevel` で override を無視するため、ここでは特別扱い不要。
 *
 * 旧 localStorage キー (`permission-override-storage` / `user-permission-override-storage`) は
 * 本リファクタ以降参照しない。ブラウザに残る場合があるが runtime 動作に影響なし。
 */
export function createStoreBackedOverride(
  userId: string | undefined,
  getFacilityFeature: GetFacilityFeatureFn,
  getUserFeature: GetUserFeatureFn,
): GetOverrideFn {
  return (facilityName, _role, featureId) => {
    const puIds = FEATURE_TO_PU[featureId];
    if (!puIds || puIds.length === 0) return undefined;
    const allOff = puIds.every((puId) => {
      const facilityOn = getFacilityFeature(facilityName, puId);
      if (!facilityOn) return true;
      if (!userId) return false;
      const userExplicit = getUserFeature(userId, facilityName, puId);
      return userExplicit === false;
    });
    return allOff ? false : undefined;
  };
}

/**
 * 機能にアクセス可能かどうか（X以外ならアクセス可能）
 */
export function canAccess(featureId: FeatureId, role: UserRole, facilityName?: string, getOverride?: GetOverrideFn): boolean {
  return getPermissionLevel(featureId, role, facilityName, getOverride) !== 'X';
}

/**
 * 機能を閲覧可能かどうか（R, C, W, F のいずれか）
 */
export function canView(featureId: FeatureId, role: UserRole, facilityName?: string, getOverride?: GetOverrideFn): boolean {
  const level = getPermissionLevel(featureId, role, facilityName, getOverride);
  return ['R', 'C', 'W', 'F'].includes(level);
}

/**
 * 機能を編集可能かどうか（W, F のいずれか）
 */
export function canEdit(featureId: FeatureId, role: UserRole, facilityName?: string, getOverride?: GetOverrideFn): boolean {
  const level = getPermissionLevel(featureId, role, facilityName, getOverride);
  return ['W', 'F'].includes(level);
}

/**
 * 機能で作成可能かどうか（C, W, F のいずれか）
 */
export function canCreate(featureId: FeatureId, role: UserRole, facilityName?: string, getOverride?: GetOverrideFn): boolean {
  const level = getPermissionLevel(featureId, role, facilityName, getOverride);
  return ['C', 'W', 'F'].includes(level);
}

/**
 * フルアクセス権限があるかどうか
 */
export function hasFullAccess(featureId: FeatureId, role: UserRole, facilityName?: string, getOverride?: GetOverrideFn): boolean {
  return getPermissionLevel(featureId, role, facilityName, getOverride) === 'F';
}

/**
 * メイン画面のボタンが表示可能かどうか
 */
export function isMainButtonVisible(buttonId: MainButtonId, role: UserRole): boolean {
  return MAIN_BUTTON_VISIBILITY[buttonId]?.[role] ?? false;
}

/**
 * 表示可能なメイン画面ボタンの一覧を取得
 */
export function getVisibleMainButtons(role: UserRole): MainButtonId[] {
  return (Object.keys(MAIN_BUTTON_VISIBILITY) as MainButtonId[]).filter(
    (buttonId) => isMainButtonVisible(buttonId, role)
  );
}

/**
 * ユーザーが施設にアクセス可能かどうか
 */
export function canAccessFacility(
  role: UserRole,
  facilityName: string,
  userHospital?: string,
  accessibleFacilities?: string[]
): boolean {
  // system_admin は全施設アクセス可能
  if (role === 'system_admin') return true;

  // 組織デフォルトロールは担当施設のみ
  if (isOrgDefaultRole(role)) {
    if (!accessibleFacilities || accessibleFacilities.length === 0) return false;
    if (accessibleFacilities.includes('全施設')) return true;
    return accessibleFacilities.includes(facilityName);
  }

  // 病院側ロールは所属施設のみ
  return userHospital === facilityName;
}

function isOrgDefaultRole(role: UserRole): boolean {
  return role.startsWith('org_default_');
}
