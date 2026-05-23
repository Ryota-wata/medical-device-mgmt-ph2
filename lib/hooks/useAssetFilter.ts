import { useState, useEffect, useMemo, useCallback } from 'react';
import { Asset } from '@/lib/types';
import { useMasterStore } from '@/lib/stores';

interface AssetFilters {
  facility: string;
  building: string;
  floor: string;
  department: string;
  section: string;
  category: string;
  largeClass: string;
  mediumClass: string;
  item: string;
  keyword: string;
}

/**
 * 資産フィルターフック
 *
 * フィルター共通ルール:
 * 1. プルダウンは曖昧検索（SearchableSelect）を使用
 * 2. 子フィルター選択時に親フィルターを自動選択
 * 3. 親フィルター変更時に子フィルターをクリア
 *
 * 階層構造:
 * - 部署系: department → section
 * - 資産系: category → largeClass → mediumClass → item
 */
export function useAssetFilter(initialAssets: Asset[]) {
  const { facilities, assets: assetMasters } = useMasterStore();

  // フィルター状態
  const [filters, setFiltersState] = useState<AssetFilters>({
    facility: '',
    building: '',
    floor: '',
    department: '',
    section: '',
    category: '',
    largeClass: '',
    mediumClass: '',
    item: '',
    keyword: '',
  });

  // フィルタリングされた資産
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>(initialAssets);

  // 施設オプション（施設マスタから取得）
  const facilityOptions = useMemo(() => {
    const uniqueFacilities = Array.from(new Set(facilities.map(f => f.facilityName)));
    return uniqueFacilities.filter(Boolean) as string[];
  }, [facilities]);

  // 部署オプション（部署マスタから取得）
  const departmentOptions = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(facilities.map(f => f.department)));
    return uniqueDepartments.filter(Boolean) as string[];
  }, [facilities]);

  // 部門オプション（選択された部署に基づく）
  const sectionOptions = useMemo(() => {
    if (filters.department) {
      const filtered = facilities.filter(f => f.department === filters.department);
      const uniqueSections = Array.from(new Set(filtered.map(f => f.section)));
      return uniqueSections.filter(Boolean) as string[];
    }
    const uniqueSections = Array.from(new Set(facilities.map(f => f.section)));
    return uniqueSections.filter(Boolean) as string[];
  }, [facilities, filters.department]);

  // カテゴリーオプション（資産マスタから取得）
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean) as string[];
  }, [assetMasters]);

  // 大分類オプション（選択されたカテゴリーに基づく）
  const largeClassOptions = useMemo(() => {
    if (filters.category) {
      const filtered = assetMasters.filter(a => a.category === filters.category);
      const uniqueLargeClasses = Array.from(new Set(filtered.map(a => a.largeClass)));
      return uniqueLargeClasses.filter(Boolean) as string[];
    }
    const uniqueLargeClasses = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueLargeClasses.filter(Boolean) as string[];
  }, [assetMasters, filters.category]);

  // 中分類オプション（選択された大分類に基づく）
  const mediumClassOptions = useMemo(() => {
    let filtered = assetMasters;
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(a => a.largeClass === filters.largeClass);
    }
    const uniqueMediumClasses = Array.from(new Set(filtered.map(a => a.mediumClass)));
    return uniqueMediumClasses.filter(Boolean) as string[];
  }, [assetMasters, filters.category, filters.largeClass]);

  // 品目オプション（選択された中分類に基づく）
  const itemOptions = useMemo(() => {
    let filtered = assetMasters;
    if (filters.category) {
      filtered = filtered.filter(a => a.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(a => a.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(a => a.mediumClass === filters.mediumClass);
    }
    const uniqueItems = Array.from(new Set(filtered.map(a => a.item)));
    return uniqueItems.filter(Boolean) as string[];
  }, [assetMasters, filters.category, filters.largeClass, filters.mediumClass]);

  // 棟オプション
  const buildingOptions = useMemo(() => {
    const uniqueBuildings = Array.from(new Set(facilities.map(f => f.building)));
    return uniqueBuildings.filter(Boolean) as string[];
  }, [facilities]);

  // 階オプション
  const floorOptions = useMemo(() => {
    const uniqueFloors = Array.from(new Set(facilities.map(f => f.floor)));
    return uniqueFloors.filter(Boolean) as string[];
  }, [facilities]);

  /**
   * フィルター設定（親自動選択・子クリアロジック付き）
   *
   * - 子フィルター選択時: 親フィルターを自動設定
   * - 親フィルター変更時: 子フィルターをクリア
   */
  const setFilters = useCallback((newFilters: Partial<AssetFilters> | ((prev: AssetFilters) => AssetFilters)) => {
    setFiltersState(prev => {
      const updated = typeof newFilters === 'function' ? newFilters(prev) : { ...prev, ...newFilters };

      // 部門選択時に部署を自動設定
      if (updated.section && !updated.department) {
        const facility = facilities.find(f => f.section === updated.section);
        if (facility && facility.department) {
          updated.department = facility.department;
        }
      }

      // 部署変更時に部門をクリア（親が変わったら子をリセット）
      if (typeof newFilters !== 'function' && 'department' in newFilters && newFilters.department !== prev.department) {
        // 部署が変更された場合、部門が新しい部署に属さない場合はクリア
        if (updated.section) {
          const validSection = facilities.find(f =>
            f.department === updated.department && f.section === updated.section
          );
          if (!validSection) {
            updated.section = '';
          }
        }
      }

      // 品目選択時に親を自動設定
      if (updated.item && (!updated.mediumClass || !updated.largeClass || !updated.category)) {
        const asset = assetMasters.find(a => a.item === updated.item);
        if (asset) {
          if (!updated.mediumClass) updated.mediumClass = asset.mediumClass;
          if (!updated.largeClass) updated.largeClass = asset.largeClass;
          if (!updated.category) updated.category = asset.category;
        }
      }

      // 中分類選択時に親を自動設定
      if (updated.mediumClass && (!updated.largeClass || !updated.category)) {
        const asset = assetMasters.find(a => a.mediumClass === updated.mediumClass);
        if (asset) {
          if (!updated.largeClass) updated.largeClass = asset.largeClass;
          if (!updated.category) updated.category = asset.category;
        }
      }

      // 大分類選択時に親を自動設定
      if (updated.largeClass && !updated.category) {
        const asset = assetMasters.find(a => a.largeClass === updated.largeClass);
        if (asset) {
          updated.category = asset.category;
        }
      }

      // カテゴリー変更時に子をクリア
      if (typeof newFilters !== 'function' && 'category' in newFilters && newFilters.category !== prev.category) {
        // カテゴリーが変更された場合、子フィルターが新しいカテゴリーに属さない場合はクリア
        if (updated.largeClass) {
          const validLargeClass = assetMasters.find(a =>
            a.category === updated.category && a.largeClass === updated.largeClass
          );
          if (!validLargeClass) {
            updated.largeClass = '';
            updated.mediumClass = '';
            updated.item = '';
          }
        }
      }

      // 大分類変更時に子をクリア
      if (typeof newFilters !== 'function' && 'largeClass' in newFilters && newFilters.largeClass !== prev.largeClass) {
        if (updated.mediumClass) {
          const validMediumClass = assetMasters.find(a =>
            a.largeClass === updated.largeClass && a.mediumClass === updated.mediumClass
          );
          if (!validMediumClass) {
            updated.mediumClass = '';
            updated.item = '';
          }
        }
      }

      // 中分類変更時に子をクリア
      if (typeof newFilters !== 'function' && 'mediumClass' in newFilters && newFilters.mediumClass !== prev.mediumClass) {
        if (updated.item) {
          const validItem = assetMasters.find(a =>
            a.mediumClass === updated.mediumClass && a.item === updated.item
          );
          if (!validItem) {
            updated.item = '';
          }
        }
      }

      return updated;
    });
  }, [facilities, assetMasters]);

  // フィルターの適用
  useEffect(() => {
    let filtered = initialAssets;

    if (filters.facility) {
      filtered = filtered.filter(asset => asset.facility === filters.facility);
    }
    if (filters.building) {
      filtered = filtered.filter(asset => asset.building === filters.building);
    }
    if (filters.floor) {
      filtered = filtered.filter(asset => asset.floor === filters.floor);
    }
    if (filters.department) {
      filtered = filtered.filter(asset => asset.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(asset => asset.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(asset => asset.category === filters.category);
    }
    if (filters.largeClass) {
      filtered = filtered.filter(asset => asset.largeClass === filters.largeClass);
    }
    if (filters.mediumClass) {
      filtered = filtered.filter(asset => asset.mediumClass === filters.mediumClass);
    }
    if (filters.item) {
      filtered = filtered.filter(asset => asset.item === filters.item);
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name?.toLowerCase().includes(kw) ||
        asset.qrCode?.toLowerCase().includes(kw) ||
        asset.maker?.toLowerCase().includes(kw) ||
        asset.model?.toLowerCase().includes(kw) ||
        asset.item?.toLowerCase().includes(kw)
      );
    }

    setFilteredAssets(filtered);
  }, [filters, initialAssets]);

  return {
    filters,
    setFilters,
    filteredAssets,
    facilityOptions,
    categoryOptions,
    largeClassOptions,
    mediumClassOptions,
    itemOptions,
    buildingOptions,
    floorOptions,
    departmentOptions,
    sectionOptions,
  };
}
