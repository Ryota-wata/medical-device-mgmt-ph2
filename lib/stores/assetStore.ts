import { create } from 'zustand';
import { Asset, RemodelApplication, AssetMasterData } from '../types';
import { initialOriginalAssets } from '@/lib/data/initialOriginalAssets';

// 原本資産一覧データ（顧客Excel「サンプルリスト」シートから781件を読込）
const initialAssets: Asset[] = initialOriginalAssets;

interface AssetStore {
  assets: Asset[];
  selectedAsset: Asset | null;
  remodelApplications: RemodelApplication[];
  assetMasterData: AssetMasterData[];
  isLoading: boolean;

  // 資産検索
  searchAssets: (filters: any) => Promise<Asset[]>;
  setSelectedAsset: (asset: Asset | null) => void;
  getAssets: () => Asset[];

  // リモデル申請
  loadRemodelApplications: () => Promise<void>;
  addRemodelApplication: (application: RemodelApplication) => void;

  // 資産マスタ
  loadAssetMaster: () => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: initialAssets,
  selectedAsset: null,
  remodelApplications: [],
  assetMasterData: [],
  isLoading: false,

  searchAssets: async (filters: any) => {
    set({ isLoading: true });
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // 初期データからフィルタリング
      let results = initialAssets;
      if (filters.building) results = results.filter(a => a.building.includes(filters.building));
      if (filters.floor) results = results.filter(a => a.floor.includes(filters.floor));
      if (filters.department) results = results.filter(a => a.department.includes(filters.department));
      if (filters.section) results = results.filter(a => a.section.includes(filters.section));
      if (filters.category) results = results.filter(a => a.category.includes(filters.category));
      if (filters.largeClass) results = results.filter(a => a.largeClass.includes(filters.largeClass));
      if (filters.mediumClass) results = results.filter(a => a.mediumClass.includes(filters.mediumClass));
      set({ isLoading: false });
      return results;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setSelectedAsset: (asset: Asset | null) => {
    set({ selectedAsset: asset });
  },

  getAssets: () => get().assets,

  loadRemodelApplications: async () => {
    set({ isLoading: true });
    try {
      // TODO: 実際のAPIコールに置き換える
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockApplications: RemodelApplication[] = [];
      set({ remodelApplications: mockApplications, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addRemodelApplication: (application: RemodelApplication) => {
    set((state) => ({
      remodelApplications: [...state.remodelApplications, application]
    }));
  },

  loadAssetMaster: async () => {
    set({ isLoading: true });
    try {
      // TODO: 実際のAPIコールに置き換える
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockMasterData: AssetMasterData[] = [];
      set({ assetMasterData: mockMasterData, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
