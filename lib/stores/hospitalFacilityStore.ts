import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  HospitalFacilityMaster,
  HospitalFacilityStatus,
  HospitalInfo,
  FacilityMapping,
  CurrentLocationKey,
} from '@/lib/types/hospitalFacility';
import { initialHospitalFacilities } from '@/lib/data/initialHospitalFacilities';


interface HospitalFacilityState {
  // 病院リスト
  hospitals: HospitalInfo[];
  // 個別部署マスタ
  facilities: HospitalFacilityMaster[];

  // 病院操作
  setHospitals: (hospitals: HospitalInfo[]) => void;
  addHospital: (hospital: HospitalInfo) => void;
  updateHospital: (id: string, updates: Partial<HospitalInfo>) => void;
  deleteHospital: (id: string) => void;
  getHospitalById: (id: string) => HospitalInfo | undefined;

  // 施設マスタ操作
  setFacilities: (facilities: HospitalFacilityMaster[]) => void;
  addFacility: (facility: HospitalFacilityMaster) => void;
  updateFacility: (id: string, updates: Partial<HospitalFacilityMaster>) => void;
  deleteFacility: (id: string) => void;
  getFacilityById: (id: string) => HospitalFacilityMaster | undefined;

  // 検索・フィルター
  getFacilitiesByHospitalId: (hospitalId: string) => HospitalFacilityMaster[];
  searchFacilities: (hospitalId: string, query: string) => HospitalFacilityMaster[];

  // マッピング機能
  getMappingByCurrentLocation: (key: CurrentLocationKey) => FacilityMapping | undefined;
  getNewLocationByCurrentLocation: (key: CurrentLocationKey) => { floor: string; department: string; section: string; roomName: string } | undefined;

  // リモデル完了処理
  completeRemodel: (hospitalId: string, facilityIds: string[]) => void;
  swapToNewLocation: (facilityId: string) => void;

  // 統計
  getHospitalStats: (hospitalId: string) => { total: number; mapped: number; completed: number };

  // ID生成
  generateFacilityId: () => string;
  generateHospitalId: () => string;
}

export const useHospitalFacilityStore = create<HospitalFacilityState>()(
  persist(
    (set, get) => ({
      hospitals: [],
      facilities: initialHospitalFacilities,

      // 病院操作
      setHospitals: (hospitals) => set({ hospitals }),

      addHospital: (hospital) => set((state) => ({
        hospitals: [...state.hospitals, hospital]
      })),

      updateHospital: (id, updates) => set((state) => ({
        hospitals: state.hospitals.map((h) =>
          h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
        )
      })),

      deleteHospital: (id) => set((state) => ({
        hospitals: state.hospitals.filter((h) => h.id !== id),
        facilities: state.facilities.filter((f) => f.hospitalId !== id)
      })),

      getHospitalById: (id) => get().hospitals.find((h) => h.id === id),

      // 施設マスタ操作
      setFacilities: (facilities) => set({ facilities }),

      addFacility: (facility) => set((state) => ({
        facilities: [...state.facilities, facility]
      })),

      updateFacility: (id, updates) => set((state) => ({
        facilities: state.facilities.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
        )
      })),

      deleteFacility: (id) => set((state) => ({
        facilities: state.facilities.filter((f) => f.id !== id)
      })),

      getFacilityById: (id) => get().facilities.find((f) => f.id === id),

      // 検索・フィルター
      getFacilitiesByHospitalId: (hospitalId) =>
        get().facilities.filter((f) => f.hospitalId === hospitalId),

      searchFacilities: (hospitalId, query) => {
        const lowerQuery = query.toLowerCase();
        return get().facilities.filter((f) =>
          f.hospitalId === hospitalId &&
          (f.oldShipDivision.toLowerCase().includes(lowerQuery) ||
           f.oldShipDepartment.toLowerCase().includes(lowerQuery) ||
           f.oldShipRoomCategory.toLowerCase().includes(lowerQuery) ||
           f.oldFloor.toLowerCase().includes(lowerQuery) ||
           f.oldDepartment.toLowerCase().includes(lowerQuery) ||
           f.oldSection.toLowerCase().includes(lowerQuery) ||
           f.oldRoomName.toLowerCase().includes(lowerQuery) ||
           f.newShipDivision.toLowerCase().includes(lowerQuery) ||
           f.newShipDepartment.toLowerCase().includes(lowerQuery) ||
           f.newShipRoomCategory.toLowerCase().includes(lowerQuery) ||
           f.newFloor.toLowerCase().includes(lowerQuery) ||
           f.newDepartment.toLowerCase().includes(lowerQuery) ||
           f.newSection.toLowerCase().includes(lowerQuery) ||
           f.newRoomName.toLowerCase().includes(lowerQuery))
        );
      },

      // マッピング機能
      getMappingByCurrentLocation: (key) => {
        const facility = get().facilities.find((f) =>
          f.hospitalId === key.hospitalId &&
          f.oldFloor === key.floor &&
          f.oldDepartment === key.department &&
          f.oldSection === key.section &&
          f.oldRoomName === key.roomName
        );
        if (!facility) return undefined;
        return {
          currentLocation: {
            shipDivision: facility.oldShipDivision,
            shipDepartment: facility.oldShipDepartment,
            shipRoomCategory: facility.oldShipRoomCategory,
            floor: facility.oldFloor,
            department: facility.oldDepartment,
            section: facility.oldSection,
            roomName: facility.oldRoomName,
          },
          newLocation: {
            shipDivision: facility.newShipDivision,
            shipDepartment: facility.newShipDepartment,
            shipRoomCategory: facility.newShipRoomCategory,
            floor: facility.newFloor,
            department: facility.newDepartment,
            section: facility.newSection,
            roomName: facility.newRoomName,
          },
        };
      },

      getNewLocationByCurrentLocation: (key) => {
        const mapping = get().getMappingByCurrentLocation(key);
        if (!mapping) return undefined;
        return {
          floor: mapping.newLocation.floor,
          department: mapping.newLocation.department,
          section: mapping.newLocation.section,
          roomName: mapping.newLocation.roomName,
        };
      },

      // リモデル完了処理
      completeRemodel: (hospitalId, facilityIds) => {
        set((state) => ({
          facilities: state.facilities.map((f) =>
            f.hospitalId === hospitalId && facilityIds.includes(f.id)
              ? { ...f, status: 'completed' as HospitalFacilityStatus, updatedAt: new Date().toISOString() }
              : f
          )
        }));
        // 病院のステータス更新
        const stats = get().getHospitalStats(hospitalId);
        if (stats.total === stats.completed) {
          get().updateHospital(hospitalId, { remodelStatus: 'completed' });
        }
      },

      // 新居→現状への切り替え（単一施設）
      swapToNewLocation: (facilityId) => set((state) => ({
        facilities: state.facilities.map((f) =>
          f.id === facilityId
            ? {
                ...f,
                oldShipDivision: f.newShipDivision,
                oldShipDepartment: f.newShipDepartment,
                oldShipRoomCategory: f.newShipRoomCategory,
                oldBuilding: f.newBuilding,
                oldFloor: f.newFloor,
                oldDepartment: f.newDepartment,
                oldSection: f.newSection,
                oldRoomName: f.newRoomName,
                newShipDivision: '',
                newShipDepartment: '',
                newShipRoomCategory: '',
                newBuilding: '',
                newFloor: '',
                newDepartment: '',
                newSection: '',
                newRoomName: '',
                newRoomCount: '',
                status: 'completed' as HospitalFacilityStatus,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      })),

      // 統計
      getHospitalStats: (hospitalId) => {
        const facilities = get().getFacilitiesByHospitalId(hospitalId);
        return {
          total: facilities.length,
          mapped: facilities.filter((f) => f.status === 'mapped' || f.status === 'completed').length,
          completed: facilities.filter((f) => f.status === 'completed').length,
        };
      },

      // ID生成
      generateFacilityId: () => {
        const facilities = get().facilities;
        const maxId = facilities.reduce((max, f) => {
          const num = parseInt(f.id.replace('HF', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `HF${String(maxId + 1).padStart(5, '0')}`;
      },

      generateHospitalId: () => {
        const hospitals = get().hospitals;
        const maxId = hospitals.reduce((max, h) => {
          const num = parseInt(h.id.replace('HOSP', ''), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        return `HOSP${String(maxId + 1).padStart(3, '0')}`;
      },
    }),
    {
      name: 'hospital-facility-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<HospitalFacilityState>;
        // 既存データが空、存在しない、または新フィールド(shipRoomCategory2)が無いデータがある場合は初期データを使用
        const hasValidData = persisted.facilities &&
          persisted.facilities.length > 0 &&
          persisted.facilities.every(f =>
            f.oldFloor !== undefined &&
            f.oldRoomName !== undefined &&
            f.shipRoomCategory2 !== undefined
          );
        return {
          ...currentState,
          ...persisted,
          facilities: hasValidData ? persisted.facilities! : initialHospitalFacilities,
        };
      },
    }
  )
);
