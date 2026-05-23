import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FacilityGroup, SharingDataType } from '../types/facilityGroup';

interface FacilityGroupState {
  groups: FacilityGroup[];
  /** グループを追加 */
  addGroup: (name: string) => string;
  /** グループを削除 */
  deleteGroup: (groupId: string) => void;
  /** グループ名を更新 */
  updateGroupName: (groupId: string, name: string) => void;
  /** グループに施設を追加 */
  addFacilityToGroup: (groupId: string, facilityId: string) => void;
  /** グループから施設を削除 */
  removeFacilityFromGroup: (groupId: string, facilityId: string) => void;
  /** 共有データ種別を設定 */
  setSharing: (groupId: string, dataType: SharingDataType, enabled: boolean) => void;
  /** 施設が所属するグループを取得 */
  getGroupsForFacility: (facilityId: string) => FacilityGroup[];
  /** 2施設間でデータ共有可能か判定 */
  canShareData: (sourceFacility: string, targetFacility: string, dataType: SharingDataType) => boolean;
}

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `fg-${Date.now()}-${idCounter}`;
}

export const useFacilityGroupStore = create<FacilityGroupState>()(
  persist(
    (set, get) => ({
      groups: [],

      addGroup: (name) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newGroup: FacilityGroup = {
          id,
          name,
          facilityIds: [],
          sharing: { asset: false, estimate: false, history: false },
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        return id;
      },

      deleteGroup: (groupId) => {
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        }));
      },

      updateGroupName: (groupId, name) => {
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, name, updatedAt: new Date().toISOString() } : g
          ),
        }));
      },

      addFacilityToGroup: (groupId, facilityId) => {
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            if (g.facilityIds.includes(facilityId)) return g;
            return { ...g, facilityIds: [...g.facilityIds, facilityId], updatedAt: new Date().toISOString() };
          }),
        }));
      },

      removeFacilityFromGroup: (groupId, facilityId) => {
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return { ...g, facilityIds: g.facilityIds.filter((f) => f !== facilityId), updatedAt: new Date().toISOString() };
          }),
        }));
      },

      setSharing: (groupId, dataType, enabled) => {
        set((state) => ({
          groups: state.groups.map((g) => {
            if (g.id !== groupId) return g;
            return { ...g, sharing: { ...g.sharing, [dataType]: enabled }, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      getGroupsForFacility: (facilityId) => {
        return get().groups.filter((g) => g.facilityIds.includes(facilityId));
      },

      canShareData: (sourceFacility, targetFacility, dataType) => {
        if (sourceFacility === targetFacility) return true;
        return get().groups.some(
          (g) =>
            g.facilityIds.includes(sourceFacility) &&
            g.facilityIds.includes(targetFacility) &&
            g.sharing[dataType]
        );
      },
    }),
    {
      name: 'facility-group-storage',
    }
  )
);
