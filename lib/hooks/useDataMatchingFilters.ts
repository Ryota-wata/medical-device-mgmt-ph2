/**
 * データ突合画面のフィルター機能を提供するカスタムフック
 *
 * フィルター共通ルール (CLAUDE.md §6):
 * 1. 子フィルター選択時に親フィルターを自動設定
 * 2. 親フィルター変更時に子フィルターをクリア
 * 3. 子フィルターのオプションは親に連動
 *
 * 階層構造:
 * - 部署系: department → section
 * - 資産系: category → majorCategory → middleCategory → item
 */

import { useMemo, useState, useCallback } from 'react';
import { SurveyData, DataMatchingFilters } from '@/lib/types/data-matching';

interface UseDataMatchingFiltersProps {
  data: SurveyData[];
}

interface UseDataMatchingFiltersReturn {
  filters: DataMatchingFilters;
  setFilters: (newFilters: Partial<DataMatchingFilters>) => void;
  filteredData: SurveyData[];
  departmentOptions: string[];
  sectionOptions: string[];
  categoryOptions: string[];
  majorCategoryOptions: string[];
  middleCategoryOptions: string[];
  itemOptions: string[];
  manufacturerOptions: string[];
  modelOptions: string[];
  resetFilters: () => void;
}

const INITIAL_FILTERS: DataMatchingFilters = {
  category: '',
  department: '',
  section: '',
  majorCategory: '',
  middleCategory: '',
  item: '',
  manufacturer: '',
  model: '',
  matchingStatus: '全て',
  keyword: ''
};

export function useDataMatchingFilters({
  data
}: UseDataMatchingFiltersProps): UseDataMatchingFiltersReturn {
  const [filters, setFiltersState] = useState<DataMatchingFilters>(INITIAL_FILTERS);

  // ── オプション生成（親に連動して子を絞り込み） ──

  // 部門オプション（全データから）
  const departmentOptions = useMemo(() => {
    return Array.from(new Set(data.map(d => d.department))).filter(Boolean).sort();
  }, [data]);

  // 部署オプション（選択された部門に基づいて絞り込み）
  const sectionOptions = useMemo(() => {
    let source = data;
    if (filters.department) {
      source = source.filter(d => d.department === filters.department);
    }
    return Array.from(new Set(source.map(d => d.section))).filter(Boolean).sort();
  }, [data, filters.department]);

  // カテゴリオプション（全データから）
  const categoryOptions = useMemo(() => {
    return Array.from(new Set(data.map(d => d.category))).filter(Boolean).sort();
  }, [data]);

  // 大分類オプション（選択されたカテゴリに基づいて絞り込み）
  const majorCategoryOptions = useMemo(() => {
    let source = data;
    if (filters.category) {
      source = source.filter(d => d.category === filters.category);
    }
    return Array.from(new Set(source.map(d => d.majorCategory))).filter(Boolean).sort();
  }, [data, filters.category]);

  // 中分類オプション（選択されたカテゴリ・大分類に基づいて絞り込み）
  const middleCategoryOptions = useMemo(() => {
    let source = data;
    if (filters.category) {
      source = source.filter(d => d.category === filters.category);
    }
    if (filters.majorCategory) {
      source = source.filter(d => d.majorCategory === filters.majorCategory);
    }
    return Array.from(new Set(source.map(d => d.middleCategory))).filter(Boolean).sort();
  }, [data, filters.category, filters.majorCategory]);

  // 品目オプション（選択されたカテゴリ・大分類・中分類に基づいて絞り込み）
  const itemOptions = useMemo(() => {
    let source = data;
    if (filters.category) {
      source = source.filter(d => d.category === filters.category);
    }
    if (filters.majorCategory) {
      source = source.filter(d => d.majorCategory === filters.majorCategory);
    }
    if (filters.middleCategory) {
      source = source.filter(d => d.middleCategory === filters.middleCategory);
    }
    return Array.from(new Set(source.map(d => d.item))).filter(Boolean).sort();
  }, [data, filters.category, filters.majorCategory, filters.middleCategory]);

  // メーカーオプション
  const manufacturerOptions = useMemo(() => {
    return Array.from(new Set(data.map(d => d.manufacturer).filter((v): v is string => !!v))).sort();
  }, [data]);

  // 型式オプション
  const modelOptions = useMemo(() => {
    return Array.from(new Set(data.map(d => d.model).filter((v): v is string => !!v))).sort();
  }, [data]);

  // ── フィルター設定（親自動選択・子クリアロジック付き） ──
  const setFilters = useCallback((newFilters: Partial<DataMatchingFilters>) => {
    setFiltersState(prev => {
      const updated = { ...prev, ...newFilters };

      // ── 子→親の自動設定 ──

      // 品目選択時 → 中分類・大分類・カテゴリを自動設定
      if ('item' in newFilters && updated.item) {
        const match = data.find(d => d.item === updated.item);
        if (match) {
          if (!updated.middleCategory) updated.middleCategory = match.middleCategory;
          if (!updated.majorCategory) updated.majorCategory = match.majorCategory;
          if (!updated.category) updated.category = match.category;
        }
      }

      // 中分類選択時 → 大分類・カテゴリを自動設定
      if ('middleCategory' in newFilters && updated.middleCategory) {
        const match = data.find(d => d.middleCategory === updated.middleCategory);
        if (match) {
          if (!updated.majorCategory) updated.majorCategory = match.majorCategory;
          if (!updated.category) updated.category = match.category;
        }
      }

      // 大分類選択時 → カテゴリを自動設定
      if ('majorCategory' in newFilters && updated.majorCategory) {
        const match = data.find(d => d.majorCategory === updated.majorCategory);
        if (match) {
          if (!updated.category) updated.category = match.category;
        }
      }

      // 部署選択時 → 部門を自動設定
      if ('section' in newFilters && updated.section) {
        const match = data.find(d => d.section === updated.section);
        if (match) {
          if (!updated.department) updated.department = match.department;
        }
      }

      // ── 親→子のクリア ──

      // カテゴリ変更時 → 大分類・中分類・品目を検証、無効ならクリア
      if ('category' in newFilters && newFilters.category !== prev.category) {
        if (updated.majorCategory) {
          const valid = data.some(d => d.category === updated.category && d.majorCategory === updated.majorCategory);
          if (!valid) { updated.majorCategory = ''; updated.middleCategory = ''; updated.item = ''; }
        }
        if (updated.middleCategory) {
          const valid = data.some(d => d.category === updated.category && d.middleCategory === updated.middleCategory);
          if (!valid) { updated.middleCategory = ''; updated.item = ''; }
        }
        if (updated.item) {
          const valid = data.some(d => d.category === updated.category && d.item === updated.item);
          if (!valid) { updated.item = ''; }
        }
      }

      // 大分類変更時 → 中分類・品目を検証、無効ならクリア
      if ('majorCategory' in newFilters && newFilters.majorCategory !== prev.majorCategory) {
        if (updated.middleCategory) {
          const valid = data.some(d => d.majorCategory === updated.majorCategory && d.middleCategory === updated.middleCategory);
          if (!valid) { updated.middleCategory = ''; updated.item = ''; }
        }
        if (updated.item) {
          const valid = data.some(d => d.majorCategory === updated.majorCategory && d.item === updated.item);
          if (!valid) { updated.item = ''; }
        }
      }

      // 中分類変更時 → 品目を検証、無効ならクリア
      if ('middleCategory' in newFilters && newFilters.middleCategory !== prev.middleCategory) {
        if (updated.item) {
          const valid = data.some(d => d.middleCategory === updated.middleCategory && d.item === updated.item);
          if (!valid) { updated.item = ''; }
        }
      }

      // 部門変更時 → 部署を検証、無効ならクリア
      if ('department' in newFilters && newFilters.department !== prev.department) {
        if (updated.section) {
          const valid = data.some(d => d.department === updated.department && d.section === updated.section);
          if (!valid) { updated.section = ''; }
        }
      }

      return updated;
    });
  }, [data]);

  // ── フィルタリング ──
  const filteredData = useMemo(() => {
    let filtered = data;

    if (filters.department) filtered = filtered.filter(d => d.department === filters.department);
    if (filters.section) filtered = filtered.filter(d => d.section === filters.section);
    if (filters.category) filtered = filtered.filter(d => d.category === filters.category);
    if (filters.majorCategory) filtered = filtered.filter(d => d.majorCategory === filters.majorCategory);
    if (filters.middleCategory) filtered = filtered.filter(d => d.middleCategory === filters.middleCategory);
    if (filters.item) filtered = filtered.filter(d => d.item === filters.item);
    if (filters.manufacturer) filtered = filtered.filter(d => d.manufacturer === filters.manufacturer);
    if (filters.model) filtered = filtered.filter(d => d.model === filters.model);
    if (filters.matchingStatus && filters.matchingStatus !== '全て') {
      filtered = filtered.filter(d => d.matchingStatus === filters.matchingStatus);
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(d =>
        d.qrCode?.toLowerCase().includes(keyword) ||
        d.assetNo?.toLowerCase().includes(keyword) ||
        d.item?.toLowerCase().includes(keyword) ||
        d.manufacturer?.toLowerCase().includes(keyword) ||
        d.model?.toLowerCase().includes(keyword) ||
        d.memo?.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }, [data, filters]);

  const resetFilters = useCallback(() => {
    setFiltersState(INITIAL_FILTERS);
  }, []);

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
    manufacturerOptions,
    modelOptions,
    resetFilters
  };
}
