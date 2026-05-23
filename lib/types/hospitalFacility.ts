/**
 * 病院別個別部署マスタの型定義
 *
 * リモデル（病院移転新築）時に使用する施設マッピング情報
 * - 現状の設置場所と新居の設置場所を管理
 * - SHIP部署マスタ（DepartmentMaster）と連携し、SHIP体系の対応付けを行う
 * - リモデル完了後、新居の設置場所が現状の設置場所となる
 */

/**
 * 個別部署マスタレコード
 */
export interface HospitalFacilityMaster {
  id: string;
  hospitalId: string;           // 病院ID
  hospitalName: string;         // 病院名（表示用）

  // 共通部署マスタ連携
  oldShipDivision: string;      // 共通部門名 (Col2)
  oldShipDepartment: string;    // 共通部署名 (Col3)
  oldShipRoomCategory: string;  // 諸室区分① (Col4)
  shipRoomCategory2: string;    // 諸室区分② (Col5)

  // 必要な病院用
  divisionId: string;           // 部門ID (Col6)
  departmentId: string;         // 部署ID (Col7)
  roomId: string;               // 諸室ID (Col8)

  // 新病院
  newBuilding: string;          // 棟 (Col9)
  newFloor: string;             // 階 (Col10)
  newDepartment: string;        // 部門名 (Col11)
  newSection: string;           // 部署名 (Col12)
  newRoomName: string;          // 室名 (Col13)
  newRoomCount: string;         // 室数 (Col14)

  // 現病院
  oldBuilding: string;          // 棟 (Col15)
  oldFloor: string;             // 階 (Col16)
  oldDepartment: string;        // 部門名 (Col17)
  oldSection: string;           // 部署名 (Col18)
  oldRoomName: string;          // 室名 (Col19)

  // SHIPマッピング（新側にも共通部署マスタ連携を保持）
  newShipDivision: string;      // 共通部門名（新）
  newShipDepartment: string;    // 共通部署名（新）
  newShipRoomCategory: string;  // 諸室区分①（新）

  // 管理情報
  status: HospitalFacilityStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * 個別部署マスタのステータス
 */
export type HospitalFacilityStatus =
  | 'draft'       // 下書き（マッピング未完了）
  | 'mapped'      // マッピング完了（リモデル申請可能）
  | 'completed';  // リモデル完了（新居が現状になった）

/**
 * 病院情報（個別部署マスタの親）
 */
export interface HospitalInfo {
  id: string;
  name: string;
  remodelStatus: RemodelProjectStatus;
  facilityCount: number;        // 施設マスタ件数
  completedCount: number;       // 完了件数
  createdAt: string;
  updatedAt: string;
}

/**
 * リモデルプロジェクトのステータス
 */
export type RemodelProjectStatus =
  | 'preparing'     // 準備中（施設マスタ作成中）
  | 'in_progress'   // 進行中（申請受付中）
  | 'completed';    // 完了（全申請完了）

/**
 * 施設マッピング検索結果
 */
export interface FacilityMapping {
  currentLocation: {
    shipDivision: string;
    shipDepartment: string;
    shipRoomCategory: string;
    floor: string;
    department: string;
    section: string;
    roomName: string;
  };
  newLocation: {
    shipDivision: string;
    shipDepartment: string;
    shipRoomCategory: string;
    floor: string;
    department: string;
    section: string;
    roomName: string;
  };
}

/**
 * 個別部署マスタのフィルター
 */
export interface HospitalFacilityFilter {
  hospitalId?: string;
  oldFloor?: string;
  oldDepartment?: string;
  newFloor?: string;
  newDepartment?: string;
  status?: HospitalFacilityStatus;
}

/**
 * 現状から新居の設置場所を取得するためのキー
 */
export interface CurrentLocationKey {
  hospitalId: string;
  floor: string;
  department: string;
  section: string;
  roomName: string;
}

/**
 * リモデル完了処理（新居→現状への切り替え）
 */
export interface RemodelCompletionData {
  hospitalId: string;
  facilityIds: string[];        // 完了対象の施設マスタID
  completedAt: string;
  completedBy: string;
}
