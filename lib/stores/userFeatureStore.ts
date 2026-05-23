import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 2段階権限モデル 2段目: 施設内システム管理者 → ユーザーに対する機能ON/OFF
 *
 * キー: userId × facilityName × permissionUnitId（PU-NNNN）
 * 値: enabled (true=ユーザーが機能を利用可能, false=ユーザーで明示的にOFF)
 *
 * 適用条件:
 *   - 当該機能の managementLevel='ユーザー' のときのみ有効
 *   - 1段目（facilityFeatureStore）で施設レベルOFFの機能は本ストアの値に関わらずユーザーもOFF
 *
 * 既定値（エントリ無し）の解釈:
 *   - 1段目が ON なら ユーザーも ON
 *   - 1段目が OFF なら ユーザーも OFF
 *
 * runtime 認可: `lib/utils/permissions.ts` の FEATURE_TO_PU マッピングを通じて、
 *               旧 FeatureId ベースの canAccess/canView 等から参照される。
 */
export interface UserFeatureSetting {
  userId: string;
  facilityName: string;
  permissionUnitId: string;
  enabled: boolean;
}

interface UserFeatureState {
  settings: UserFeatureSetting[];
  setSetting: (userId: string, facilityName: string, permissionUnitId: string, enabled: boolean) => void;
  getSetting: (userId: string, facilityName: string, permissionUnitId: string) => boolean | undefined;
  resetUserFacility: (userId: string, facilityName: string) => void;
}

export const useUserFeatureStore = create<UserFeatureState>()(
  persist(
    (set, get) => ({
      settings: [],

      setSetting: (userId, facilityName, permissionUnitId, enabled) => {
        set((state) => {
          const filtered = state.settings.filter(
            (s) =>
              !(
                s.userId === userId &&
                s.facilityName === facilityName &&
                s.permissionUnitId === permissionUnitId
              )
          );
          if (enabled) {
            return { settings: filtered };
          }
          filtered.push({ userId, facilityName, permissionUnitId, enabled: false });
          return { settings: filtered };
        });
      },

      getSetting: (userId, facilityName, permissionUnitId) => {
        const entry = get().settings.find(
          (s) =>
            s.userId === userId &&
            s.facilityName === facilityName &&
            s.permissionUnitId === permissionUnitId
        );
        if (!entry) return undefined;
        return entry.enabled;
      },

      resetUserFacility: (userId, facilityName) => {
        set((state) => ({
          settings: state.settings.filter(
            (s) => !(s.userId === userId && s.facilityName === facilityName)
          ),
        }));
      },
    }),
    {
      name: 'user-feature-storage',
    }
  )
);
