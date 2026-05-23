/**
 * 資産マスタとの突き合わせ画面のフィルター機能を提供するカスタムフック
 */

import { useMemo, useState } from 'react';
import { MatchingData, AssetMatchingFilters } from '@/lib/types/asset-matching';
import { AssetMaster } from '@/lib/types/master';
import { FACILITY_CONSTANTS } from '@/lib/types/facility';

interface UseAssetMatchingFiltersProps {
  data: MatchingData[];
  assetMasters: AssetMaster[];
}

interface UseAssetMatchingFiltersReturn {
  filters: AssetMatchingFilters;
  setFilters: React.Dispatch<React.SetStateAction<AssetMatchingFilters>>;
  filteredData: MatchingData[];
  departmentOptions: string[];
  sectionOptions: string[];
  categoryOptions: string[];
  majorCategoryOptions: string[];
  middleCategoryOptions: string[];
  itemOptions: string[];
  resetFilters: () => void;
}

/**
 * 資産マスタとの突き合わせ画面のフィルター機能を提供
 *
 * @param data - フィルタリング対象のマッチングデータ
 * @param assetMasters - 資産マスタデータ（フィルターオプション生成に使用）
 * @returns フィルター状態、設定関数、フィルタリング済みデータ、各種オプション
 */
export function useAssetMatchingFilters({
  data,
  assetMasters
}: UseAssetMatchingFiltersProps): UseAssetMatchingFiltersReturn {
  const [filters, setFilters] = useState<AssetMatchingFilters>({
    department: '',
    section: '',
    category: '',
    majorCategory: '',
    middleCategory: '',
    item: ''
  });

  // 部門オプション（施設マスタから取得）
  const departmentOptions = useMemo(() => [...FACILITY_CONSTANTS.divisions], []);

  // 部署オプション（選択された部門に応じて動的に生成）
  const sectionOptions = useMemo(() => {
    if (!filters.department) return [];
    const sections = FACILITY_CONSTANTS.sectionsByDivision[filters.department as keyof typeof FACILITY_CONSTANTS.sectionsByDivision];
    return sections ? [...sections] : [];
  }, [filters.department]);

  // カテゴリオプション（資産マスタから一意の値を抽出）
  const categoryOptions = useMemo(() => {
    const uniqueCategories = Array.from(new Set(assetMasters.map(a => a.category)));
    return uniqueCategories.filter(Boolean);
  }, [assetMasters]);

  // 大分類オプション（資産マスタから一意の値を抽出）
  const majorCategoryOptions = useMemo(() => {
    const uniqueMajorCategories = Array.from(new Set(assetMasters.map(a => a.largeClass)));
    return uniqueMajorCategories.filter(Boolean);
  }, [assetMasters]);

  // 中分類オプション（資産マスタから一意の値を抽出）
  const middleCategoryOptions = useMemo(() => {
    const uniqueMiddleCategories = Array.from(new Set(assetMasters.map(a => a.mediumClass)));
    return uniqueMiddleCategories.filter(Boolean);
  }, [assetMasters]);

  // 品目オプション（資産マスタから一意の値を抽出）
  const itemOptions = useMemo(() => {
    const uniqueItems = Array.from(new Set(assetMasters.map(a => a.item)));
    return uniqueItems.filter(Boolean);
  }, [assetMasters]);

  // フィルタリングされたデータ
  const filteredData = useMemo(() => {
    let filtered = data;

    if (filters.department) {
      filtered = filtered.filter(d => d.department === filters.department);
    }
    if (filters.section) {
      filtered = filtered.filter(d => d.section === filters.section);
    }
    if (filters.category) {
      filtered = filtered.filter(d => d.linked.category === filters.category);
    }
    if (filters.majorCategory) {
      filtered = filtered.filter(d => d.linked.majorCategory === filters.majorCategory);
    }
    if (filters.middleCategory) {
      filtered = filtered.filter(d => d.linked.middleCategory === filters.middleCategory);
    }
    if (filters.item) {
      filtered = filtered.filter(d => d.linked.item === filters.item);
    }

    return filtered;
  }, [data, filters]);

  // フィルターをリセット
  const resetFilters = () => {
    setFilters({
      department: '',
      section: '',
      category: '',
      majorCategory: '',
      middleCategory: '',
      item: ''
    });
  };

  return {
    filters,
    setFilters,
    filteredData,
    departmentOptions,
    sectionOptions,
    categoryOptions,
    majorCategoryOptions,
    middleCategoryOptions,
    itemOptions,
    resetFilters
  };
}
