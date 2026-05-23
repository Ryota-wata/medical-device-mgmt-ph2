import { useState, useMemo, useCallback } from 'react';
import { Asset } from '@/lib/types';
import type { ColumnDef } from '@/lib/constants/assetColumns';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface UseColumnFeaturesProps {
  columns: ColumnDef[];
  assets: Asset[];
  baseFilteredAssets: Asset[];
}

export function useColumnFeatures({ columns, assets, baseFilteredAssets }: UseColumnFeaturesProps) {
  // ソート関連の状態
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // カラムフィルター関連の状態
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});
  const [openFilterColumn, setOpenFilterColumn] = useState<string | null>(null);

  // カラム順序の状態
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map(col => col.key));
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // カラムフィルターとソートを適用した最終的な資産リスト
  const finalFilteredAssets = useMemo(() => {
    let result = [...baseFilteredAssets];

    // カラムフィルターを適用
    Object.entries(columnFilters).forEach(([colKey, values]) => {
      if (values.length > 0) {
        result = result.filter(asset => {
          const cellValue = String((asset as any)[colKey] ?? '');
          return values.includes(cellValue);
        });
      }
    });

    // ソートを適用
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key] ?? '';
        const bValue = (b as any)[sortConfig.key] ?? '';

        // 数値として比較可能か確認
        const aNum = typeof aValue === 'number' ? aValue : parseFloat(aValue);
        const bNum = typeof bValue === 'number' ? bValue : parseFloat(bValue);

        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // 文字列として比較
        const aStr = String(aValue);
        const bStr = String(bValue);
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr, 'ja');
        } else {
          return bStr.localeCompare(aStr, 'ja');
        }
      });
    }

    return result;
  }, [baseFilteredAssets, columnFilters, sortConfig]);

  // カラムのユニーク値を取得（フィルター用）
  const getColumnUniqueValues = useCallback((colKey: string) => {
    const values = new Set<string>();
    assets.forEach(asset => {
      const value = String((asset as any)[colKey] ?? '');
      if (value) values.add(value);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [assets]);

  // ソートハンドラー
  const handleSort = useCallback((colKey: string) => {
    setSortConfig(prev => {
      if (prev?.key === colKey) {
        if (prev.direction === 'asc') {
          return { key: colKey, direction: 'desc' };
        } else {
          return null; // ソート解除
        }
      }
      return { key: colKey, direction: 'asc' };
    });
  }, []);

  // カラムフィルターのトグル
  const toggleColumnFilter = useCallback((colKey: string, value: string) => {
    setColumnFilters(prev => {
      const current = prev[colKey] || [];
      if (current.includes(value)) {
        const newValues = current.filter(v => v !== value);
        if (newValues.length === 0) {
          const { [colKey]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [colKey]: newValues };
      } else {
        return { ...prev, [colKey]: [...current, value] };
      }
    });
  }, []);

  // カラムフィルターのクリア
  const clearColumnFilter = useCallback((colKey: string) => {
    setColumnFilters(prev => {
      const { [colKey]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // カラムフィルターの全選択
  const selectAllColumnFilter = useCallback((colKey: string, values: string[]) => {
    setColumnFilters(prev => ({ ...prev, [colKey]: [...values] }));
  }, []);

  // ドラッグ&ドロップハンドラー
  const handleDragStart = useCallback((colKey: string) => {
    setDraggedColumn(colKey);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetColKey: string) => {
    e.preventDefault();
    setColumnOrder(prev => {
      const currentDragged = draggedColumn;
      if (!currentDragged || currentDragged === targetColKey) return prev;

      const newOrder = [...prev];
      const draggedIndex = newOrder.indexOf(currentDragged);
      const targetIndex = newOrder.indexOf(targetColKey);
      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, currentDragged);
      }
      return newOrder;
    });
  }, [draggedColumn]);

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
  }, []);

  // 並び替えられたカラム
  const orderedColumns = useMemo(() => {
    return columnOrder
      .map(key => columns.find(col => col.key === key))
      .filter((col): col is ColumnDef => col !== undefined);
  }, [columnOrder, columns]);

  return {
    // ソート
    sortConfig,
    handleSort,
    // フィルター
    columnFilters,
    openFilterColumn,
    setOpenFilterColumn,
    getColumnUniqueValues,
    toggleColumnFilter,
    clearColumnFilter,
    selectAllColumnFilter,
    // ドラッグ&ドロップ
    draggedColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    // 結果
    orderedColumns,
    finalFilteredAssets,
  };
}
