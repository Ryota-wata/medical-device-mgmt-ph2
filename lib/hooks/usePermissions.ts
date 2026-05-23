/**
 * 権限チェック用カスタムフック
 */

import { useMemo } from 'react';
import {
  useAuthStore,
  useFacilityGroupStore,
  useFacilityFeatureStore,
  useUserFeatureStore,
} from '../stores';
import { isShipRole, isHospitalRole, getRoleCategory } from '../types/user';
import type { SharingDataType } from '../types/facilityGroup';
import type { RoleCategory } from '../types/user';
import {
  FeatureId,
  MainButtonId,
  PermissionLevel,
  getPermissionLevel,
  canAccess,
  canView,
  canEdit,
  canCreate,
  hasFullAccess,
  isMainButtonVisible,
  getVisibleMainButtons,
  canAccessFacility,
  createStoreBackedOverride,
} from '../utils/permissions';

export interface UsePermissionsReturn {
  /** ユーザーのロール */
  role: string | null;
  /** 機能に対する権限レベルを取得 */
  getPermission: (featureId: FeatureId) => PermissionLevel;
  /** 機能にアクセス可能か */
  canAccess: (featureId: FeatureId) => boolean;
  /** 機能を閲覧可能か */
  canView: (featureId: FeatureId) => boolean;
  /** 機能を編集可能か */
  canEdit: (featureId: FeatureId) => boolean;
  /** 機能で作成可能か */
  canCreate: (featureId: FeatureId) => boolean;
  /** フルアクセス権限があるか */
  hasFullAccess: (featureId: FeatureId) => boolean;
  /** メイン画面ボタンが表示可能か */
  isMainButtonVisible: (buttonId: MainButtonId) => boolean;
  /** 表示可能なメイン画面ボタン一覧 */
  visibleMainButtons: MainButtonId[];
  /** 施設にアクセス可能か */
  canAccessFacility: (facilityName: string) => boolean;
  /** system_admin ロールか */
  isAdmin: boolean;
  /** SHIP側ロールか（system_admin, org_default_*） */
  isShipUser: boolean;
  /** 病院側ロールか（hospital_*, dedicated_*） */
  isHospitalUser: boolean;
  /** 施設管理者か（hospital_sys_admin） */
  isFacilityAdmin: boolean;
  /** ロールカテゴリ */
  roleCategory: RoleCategory | null;
  /** 他施設の共有データにアクセスできるか */
  canAccessSharedData: (facilityName: string, dataType: SharingDataType) => boolean;
}

export function usePermissions(): UsePermissionsReturn {
  const user = useAuthStore((s) => s.user);
  const selectedFacility = useAuthStore((s) => s.selectedFacility);
  // zustand のメソッド参照は stable なので useMemo の deps では検知できない。
  // state 配列そのものを購読することで設定変更時に getOverride を再生成する。
  const facilitySettings = useFacilityFeatureStore((s) => s.settings);
  const userSettings = useUserFeatureStore((s) => s.settings);
  const getFacilitySetting = useFacilityFeatureStore((s) => s.getSetting);
  const getUserSetting = useUserFeatureStore((s) => s.getSetting);
  const canShareData = useFacilityGroupStore((s) => s.canShareData);
  const role = user?.role ?? null;
  // 新 2段階権限モデル（facilityFeatureStore + userFeatureStore）を旧 GetOverrideFn 互換のクロージャに包む。
  // FEATURE_TO_PU マッピングが定義された FeatureId のみ override が効き、それ以外は PERMISSION_MATRIX の
  // ロール別デフォルトに従う。settings 配列を deps に入れることで OFF/ON 切替が下流に伝播する。
  const getOverride = useMemo(
    () => createStoreBackedOverride(user?.id, getFacilitySetting, getUserSetting),
    [user?.id, getFacilitySetting, getUserSetting, facilitySettings, userSettings],
  );

  return useMemo(() => {
    // ロールがない場合はすべて不可
    if (!role) {
      return {
        role: null,
        getPermission: () => 'X' as PermissionLevel,
        canAccess: () => false,
        canView: () => false,
        canEdit: () => false,
        canCreate: () => false,
        hasFullAccess: () => false,
        isMainButtonVisible: () => false,
        visibleMainButtons: [],
        canAccessFacility: () => false,
        isAdmin: false,
        isShipUser: false,
        isHospitalUser: false,
        isFacilityAdmin: false,
        roleCategory: null,
        canAccessSharedData: () => false,
      };
    }

    const isAdmin = role === 'system_admin';
    const isShipUserFlag = isShipRole(role);
    const isHospitalUserFlag = isHospitalRole(role);
    const isFacilityAdmin = role === 'hospital_sys_admin';
    const roleCategory = getRoleCategory(role);

    // 施設名（オーバーライドチェック用）
    const facility = selectedFacility ?? undefined;

    return {
      role,
      getPermission: (featureId: FeatureId) => getPermissionLevel(featureId, role, facility, getOverride),
      canAccess: (featureId: FeatureId) => canAccess(featureId, role, facility, getOverride),
      canView: (featureId: FeatureId) => canView(featureId, role, facility, getOverride),
      canEdit: (featureId: FeatureId) => canEdit(featureId, role, facility, getOverride),
      canCreate: (featureId: FeatureId) => canCreate(featureId, role, facility, getOverride),
      hasFullAccess: (featureId: FeatureId) => hasFullAccess(featureId, role, facility, getOverride),
      isMainButtonVisible: (buttonId: MainButtonId) => isMainButtonVisible(buttonId, role),
      visibleMainButtons: getVisibleMainButtons(role),
      canAccessFacility: (facilityName: string) =>
        canAccessFacility(role, facilityName, user?.hospital, user?.accessibleFacilities),
      isAdmin,
      isShipUser: isShipUserFlag,
      isHospitalUser: isHospitalUserFlag,
      isFacilityAdmin,
      roleCategory,
      canAccessSharedData: (facilityName: string, dataType: SharingDataType) => {
        const myFacility = selectedFacility ?? user?.hospital ?? '';
        if (!myFacility) return false;
        return canShareData(myFacility, facilityName, dataType);
      },
    };
  }, [role, user?.hospital, user?.accessibleFacilities, selectedFacility, getOverride, canShareData]);
}
