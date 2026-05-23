/**
 * ユーザー・認証関連の型定義
 */

/**
 * ユーザー情報
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  hospital?: string;
  department?: string;
  section?: string;
  /** 役職 */
  position?: string;
  /** 担当者名 */
  contactPerson?: string;
  /** 連絡先（電話番号等） */
  phone?: string;
  /** コンサル: 担当施設 / 事務担当者: 閲覧可能な他施設 */
  accessibleFacilities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ユーザーロール（17種）
 *
 * システム:
 * - system_admin: システム管理者
 *
 * 組織デフォルト:
 * - org_default_1: 企業・選択肢1
 * - org_default_2: 企業・選択肢2
 * - org_default_3: 企業・選択肢3
 * - org_default_4: 企業・選択肢4
 *
 * 病院:
 * - hospital_sys_admin: 病院システム管理者
 * - hospital_office: 事務
 * - hospital_dept_head: 部署責任者
 * - hospital_me: ME担当
 * - hospital_doctor_nurse: 医師看護師
 *
 * 専用:
 * - rimo_hospital: リモ病院用
 * - estimate_staff: 見積登録担当者
 * - consignment_staff: 委託スタッフ
 * - lending_warehouse: 貸出倉庫
 * - inspection_mobile: 点検専用モバイル
 * - transport_mobile: 搬送スタッフモバイル
 * - vendor_receiving_mobile: 業者検収モバイル
 */
export type UserRole =
  // システム
  | 'system_admin'
  // 組織デフォルト
  | 'org_default_1'
  | 'org_default_2'
  | 'org_default_3'
  | 'org_default_4'
  // 病院
  | 'hospital_sys_admin'
  | 'hospital_office'
  | 'hospital_dept_head'
  | 'hospital_me'
  | 'hospital_doctor_nurse'
  // 専用
  | 'rimo_hospital'
  | 'estimate_staff'
  | 'consignment_staff'
  | 'lending_warehouse'
  | 'inspection_mobile'
  | 'transport_mobile'
  | 'vendor_receiving_mobile';

/**
 * ロールの日本語ラベル
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  system_admin: 'システム管理者',
  org_default_1: '企業・選択肢1',
  org_default_2: '企業・選択肢2',
  org_default_3: '企業・選択肢3',
  org_default_4: '企業・選択肢4',
  hospital_sys_admin: '病院システム管理者',
  hospital_office: '事務',
  hospital_dept_head: '部署責任者',
  hospital_me: 'ME担当',
  hospital_doctor_nurse: '医師看護師',
  rimo_hospital: 'リモ病院用',
  estimate_staff: '見積登録担当者',
  consignment_staff: '委託スタッフ',
  lending_warehouse: '貸出倉庫',
  inspection_mobile: '点検専用モバイル',
  transport_mobile: '搬送スタッフモバイル',
  vendor_receiving_mobile: '業者検収モバイル',
};

/**
 * ロールカテゴリ
 */
export type RoleCategory = 'system' | 'org_default' | 'hospital' | 'dedicated';

/**
 * ロールカテゴリの日本語ラベル
 */
export const ROLE_CATEGORY_LABELS: Record<RoleCategory, string> = {
  system: 'システム',
  org_default: '組織デフォルト',
  hospital: '病院',
  dedicated: '専用',
};

/**
 * ロールをカテゴリ別にグループ化
 */
export const ROLE_CATEGORIES: Record<RoleCategory, UserRole[]> = {
  system: ['system_admin'],
  org_default: ['org_default_1', 'org_default_2', 'org_default_3', 'org_default_4'],
  hospital: ['hospital_sys_admin', 'hospital_office', 'hospital_dept_head', 'hospital_me', 'hospital_doctor_nurse'],
  dedicated: ['rimo_hospital', 'estimate_staff', 'consignment_staff', 'lending_warehouse', 'inspection_mobile', 'transport_mobile', 'vendor_receiving_mobile'],
};

/**
 * ロールのカテゴリを取得
 */
export function getRoleCategory(role: UserRole): RoleCategory {
  if (role === 'system_admin') return 'system';
  if (role.startsWith('org_default_')) return 'org_default';
  if (role.startsWith('hospital_')) return 'hospital';
  return 'dedicated';
}

/**
 * ユーザー種別（SHIP/病院）
 * メールアドレスに基づいて判定される
 */
export type UserType = 'ship' | 'hospital';

/**
 * メールアドレスからユーザー種別を判定
 * @param email - ユーザーのメールアドレス
 * @returns 'hospital' (メールアドレスに@hospitalが含まれる場合) または 'ship' (それ以外)
 */
export function getUserType(email: string): UserType {
  return email.includes('@hospital') ? 'hospital' : 'ship';
}

/**
 * ロールがSHIP側（システム管理者・組織デフォルト）かどうか
 */
export function isShipRole(role: UserRole): boolean {
  return role === 'system_admin' || isOrgDefaultRole(role);
}

/**
 * ロールが病院側かどうか
 */
export function isHospitalRole(role: UserRole): boolean {
  const category = getRoleCategory(role);
  return category === 'hospital' || category === 'dedicated';
}

/**
 * 組織デフォルトロールかどうか
 */
export function isOrgDefaultRole(role: UserRole): boolean {
  return role.startsWith('org_default_');
}

/**
 * 専用ロールかどうか
 */
export function isDedicatedRole(role: UserRole): boolean {
  return getRoleCategory(role) === 'dedicated';
}

/**
 * モバイル専用ロールかどうか
 */
export function isMobileRole(role: UserRole): boolean {
  return role === 'inspection_mobile' || role === 'transport_mobile' || role === 'vendor_receiving_mobile';
}

/**
 * ログイン情報
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * 認証状態
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
