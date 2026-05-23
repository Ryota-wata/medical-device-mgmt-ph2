import { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset } from '@/lib/types';
import type { ColumnDef } from '@/lib/constants/assetColumns';

// ブックマーク型定義
export interface ColumnBookmark {
  id: string;
  label: string;
  columns: Record<string, boolean>;
  isDefault?: boolean;
}

const BOOKMARK_STORAGE_KEY = 'remodel-column-bookmarks';

export function useAssetTable(columns: ColumnDef[]) {
  // カラム表示状態
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.key] = col.defaultVisible ?? false;
    });
    return initial;
  });

  // カラム幅の状態管理
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = { checkbox: 50 };
    columns.forEach((col) => {
      initial[col.key] = parseInt(col.width || '150');
    });
    return initial;
  });

  // リサイズ中の状態管理
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // ブックマーク管理
  const [bookmarks, setBookmarks] = useState<ColumnBookmark[]>(() => {
    if (typeof window === 'undefined') return getDefaultBookmarks(columns);
    try {
      const stored = localStorage.getItem(BOOKMARK_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnBookmark[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return getDefaultBookmarks(columns);
  });

  const [activeBookmarkId, setActiveBookmarkId] = useState<string>('all');

  // ブックマークをlocalStorageに永続化
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarks));
    } catch { /* ignore */ }
  }, [bookmarks]);

  // ブックマーク保存
  const saveBookmark = useCallback((label: string) => {
    const id = `bm-${Date.now()}`;
    const newBookmark: ColumnBookmark = {
      id,
      label,
      columns: { ...visibleColumns },
    };
    setBookmarks(prev => [...prev, newBookmark]);
    setActiveBookmarkId(id);
  }, [visibleColumns]);

  // ブックマーク削除
  const deleteBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (activeBookmarkId === bookmarkId) {
      setActiveBookmarkId('all');
      // 全カラムに戻す
      const allVisible: Record<string, boolean> = {};
      columns.forEach(col => { allVisible[col.key] = col.defaultVisible !== false; });
      setVisibleColumns(allVisible);
    }
  }, [activeBookmarkId, columns]);

  // ブックマーク読み込み
  const loadBookmark = useCallback((bookmarkId: string) => {
    setActiveBookmarkId(bookmarkId);
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    // 'all' ブックマーク（columns空 = defaultVisible基準）
    const isEmpty = Object.keys(bookmark.columns).length === 0 ||
      Object.values(bookmark.columns).every(v => v);
    if (bookmark.id === 'all' || isEmpty) {
      const allVisible: Record<string, boolean> = {};
      columns.forEach(col => { allVisible[col.key] = col.defaultVisible !== false; });
      setVisibleColumns(allVisible);
    } else {
      // ブックマークに存在しないカラムはfalseにする
      const newVisible: Record<string, boolean> = {};
      columns.forEach(col => {
        newVisible[col.key] = bookmark.columns[col.key] ?? false;
      });
      setVisibleColumns(newVisible);
    }
  }, [bookmarks, columns]);

  // カラム表示切り替え
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // カラム手動変更時はブックマークとの同期を解除
    setActiveBookmarkId('');
  };

  // 全選択
  const handleSelectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    columns.forEach((col) => {
      newState[col.key] = true;
    });
    setVisibleColumns(newState);
    setActiveBookmarkId('');
  };

  // 全解除
  const handleDeselectAllColumns = () => {
    const newState: Record<string, boolean> = {};
    columns.forEach((col) => {
      newState[col.key] = false;
    });
    setVisibleColumns(newState);
    setActiveBookmarkId('');
  };

  // カラムリサイズのハンドラー
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(columnKey);
    setResizeStartX(e.clientX);
    setResizeStartWidth(columnWidths[columnKey]);
  };

  // リサイズ処理
  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth]);

  // セルの値を取得
  const getCellValue = (asset: Asset, key: string): any => {
    if (key === 'acquisitionCost' && asset.acquisitionCost) {
      return `¥${asset.acquisitionCost.toLocaleString()}`;
    }
    if (key === 'rfqAmount' && (asset as any).rfqAmount) {
      const amount = (asset as any).rfqAmount;
      if (typeof amount === 'number') {
        return `¥${amount.toLocaleString()}`;
      }
      return amount;
    }
    if (key === 'photos') {
      const photos = asset.photos;
      return (photos && photos.length > 0) ? `${photos.length}枚` : '-';
    }
    return (asset as any)[key] ?? '-';
  };

  return {
    visibleColumns,
    setVisibleColumns,
    columnWidths,
    resizingColumn,
    toggleColumnVisibility,
    handleSelectAllColumns,
    handleDeselectAllColumns,
    handleResizeStart,
    getCellValue,
    // ブックマーク
    bookmarks,
    activeBookmarkId,
    saveBookmark,
    deleteBookmark,
    loadBookmark,
  };
}

// デフォルトブックマーク生成
function getDefaultBookmarks(columns: ColumnDef[]): ColumnBookmark[] {
  const allCols: Record<string, boolean> = {};
  columns.forEach(col => { allCols[col.key] = col.defaultVisible !== false; });

  const makeCols = (keys: string[]): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    columns.forEach(col => { result[col.key] = keys.includes(col.key); });
    return result;
  };

  return [
    { id: 'all', label: '全カラム', columns: allCols, isDefault: true },
    {
      id: 'hearing',
      label: 'ヒアリング用',
      columns: makeCols(['purchaseCategory', 'executionFiscalYear', 'shipDivision', 'shipDepartment', 'newRoomName', 'item', 'maker', 'model', 'quantity', 'comment']),
      isDefault: true,
    },
    {
      id: 'equipment',
      label: '設備条件用',
      columns: makeCols(['purchaseCategory', 'newRoomName', 'assetMasterId', 'item', 'maker', 'model', 'width', 'depth', 'height']),
      isDefault: true,
    },
    {
      id: 'rfq',
      label: '見積依頼用',
      columns: makeCols(['purchaseCategory', 'rfqNo', 'rfqGroupName', 'item', 'maker', 'model', 'estimatedAmount', 'rfqVendor']),
      isDefault: true,
    },
  ];
}
