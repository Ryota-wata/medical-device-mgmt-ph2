import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 2段階権限モデル 1段目: SHIPシステム管理者 → 施設に対する機能ON/OFF
 *
 * キー: facilityName × permissionUnitId（PU-NNNN）
 * 値: enabled (true=施設で機能を提供, false=施設全体で利用不可)
 *
 * 既定値（エントリ無し）の解釈:
 *   - 既定で全機能 ON（=施設で利用可能）として扱う。
 *   - OFF にした場合のみエントリを保存。
 *
 * runtime 認可: `lib/utils/permissions.ts` の FEATURE_TO_PU マッピングを通じて、
 *               旧 FeatureId ベースの canAccess/canView 等から参照される。
 */
export interface FacilityFeatureSetting {
  facilityName: string;
  permissionUnitId: string;
  enabled: boolean;
}

interface FacilityFeatureState {
  settings: FacilityFeatureSetting[];
  setSetting: (facilityName: string, permissionUnitId: string, enabled: boolean) => void;
  getSetting: (facilityName: string, permissionUnitId: string) => boolean;
  resetFacility: (facilityName: string) => void;
  copyFromFacility: (sourceFacility: string, targetFacility: string) => void;
}

export const useFacilityFeatureStore = create<FacilityFeatureState>()(
  persist(
    (set, get) => ({
      settings: [],

      setSetting: (facilityName, permissionUnitId, enabled) => {
        set((state) => {
          const filtered = state.settings.filter(
            (s) => !(s.facilityName === facilityName && s.permissionUnitId === permissionUnitId)
          );
          if (enabled) {
            return { settings: filtered };
          }
          filtered.push({ facilityName, permissionUnitId, enabled: false });
          return { settings: filtered };
        });
      },

      getSetting: (facilityName, permissionUnitId) => {
        const entry = get().settings.find(
          (s) => s.facilityName === facilityName && s.permissionUnitId === permissionUnitId
        );
        if (!entry) return true;
        return entry.enabled;
      },

      resetFacility: (facilityName) => {
        set((state) => ({
          settings: state.settings.filter((s) => s.facilityName !== facilityName),
        }));
      },

      copyFromFacility: (sourceFacility, targetFacility) => {
        set((state) => {
          const withoutTarget = state.settings.filter((s) => s.facilityName !== targetFacility);
          const sourceSettings = state.settings
            .filter((s) => s.facilityName === sourceFacility)
            .map((s) => ({ ...s, facilityName: targetFacility }));
          return { settings: [...withoutTarget, ...sourceSettings] };
        });
      },
    }),
    {
      name: 'facility-feature-storage',
    }
  )
);
