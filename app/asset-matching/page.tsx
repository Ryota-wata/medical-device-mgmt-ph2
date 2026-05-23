'use client';

import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useResponsive } from '@/lib/hooks/useResponsive';
import { useMasterStore } from '@/lib/stores';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { MatchingData, LinkedMasterData, emptyLinkedMasterData } from '@/lib/types/asset-matching';
import { assetMatchingSampleData } from '@/lib/data/asset-matching-sample';
import { useAssetMatchingFilters } from '@/lib/hooks/useAssetMatchingFilters';
import { updateFieldWithParents } from '@/lib/utils/asset-hierarchy';
import { exportAssetMatchingToExcel } from '@/lib/utils/excel-asset-matching';

export default function AssetMatchingPage() {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const { assets: assetMasters } = useMasterStore();
  const [selectedAll, setSelectedAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingLinked, setEditingLinked] = useState<LinkedMasterData | null>(null);
  const [data, setData] = useState(assetMatchingSampleData);

  const {
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
  } = useAssetMatchingFilters({ data, assetMasters });

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // 作業中データがあるか判定
  const hasWorkInProgress = data.some(r =>
    r.linked.category || r.linked.majorCategory || r.linked.middleCategory ||
    r.linked.item || r.linked.manufacturer || r.linked.model
  ) || data.length < assetMatchingSampleData.length || editingRow !== null;

  // ブラウザのリロード・閉じる操作からの離脱を保護
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasWorkInProgress) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasWorkInProgress]);

  const handleBack = () => {
    if (hasWorkInProgress) {
      setShowLeaveConfirm(true);
    } else {
      router.push('/main');
    }
  };

  const handleLeaveWithSave = () => {
    alert('作業内容を一時保存しました。次回アクセス時に続きから作業できます。');
    setShowLeaveConfirm(false);
    router.push('/main');
  };

  const handleLeaveWithoutSave = () => {
    setShowLeaveConfirm(false);
    router.push('/main');
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedAll(checked);
    if (checked) {
      setSelectedRows(new Set(filteredData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const toggleRowSelection = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleEditMode = (id: number) => {
    if (editingRow === id) {
      setEditingRow(null);
      setEditingLinked(null);
    } else {
      const row = data.find(r => r.id === id);
      if (row) {
        setEditingRow(id);
        setEditingLinked({ ...row.linked });
      }
    }
  };

  // 編集時のフィールド変更ハンドラ（親子関係の自動選択）
  const handleEditFieldChange = (field: 'majorCategory' | 'middleCategory' | 'item' | 'manufacturer' | 'model', value: string) => {
    if (!editingLinked) return;
    const updates = updateFieldWithParents(field, value, editingLinked, assetMasters);
    setEditingLinked({ ...editingLinked, ...updates });
  };

  // AI判定を採用 → linked にコピー
  const handleApplyAIRecommendation = (rowId: number) => {
    const row = data.find(r => r.id === rowId);
    if (!row) return;

    if (editingRow === rowId && editingLinked) {
      if (row.aiApplied) {
        // 解除
        setEditingLinked({ ...emptyLinkedMasterData });
        setData(data.map(r => r.id === rowId ? { ...r, aiApplied: false } : r));
      } else {
        // 採用 → editingLinked に反映
        const newLinked: LinkedMasterData = {
          category: row.aiRecommendation.category,
          majorCategory: row.aiRecommendation.major,
          middleCategory: row.aiRecommendation.middle,
          item: row.aiRecommendation.item,
          manufacturer: row.aiRecommendation.manufacturer,
          model: row.aiRecommendation.model,
        };
        setEditingLinked(newLinked);
        setData(data.map(r => r.id === rowId ? { ...r, aiApplied: true } : r));
      }
    } else {
      // 編集中でない場合は直接 data を更新
      setData(data.map(r => {
        if (r.id !== rowId) return r;
        if (r.aiApplied) {
          return { ...r, linked: { ...emptyLinkedMasterData }, aiApplied: false };
        }
        return {
          ...r,
          linked: {
            category: r.aiRecommendation.category,
            majorCategory: r.aiRecommendation.major,
            middleCategory: r.aiRecommendation.middle,
            item: r.aiRecommendation.item,
            manufacturer: r.aiRecommendation.manufacturer,
            model: r.aiRecommendation.model,
          },
          aiApplied: true
        };
      }));
    }
  };

  const handleOpenAssetMaster = () => {
    const width = 1400;
    const height = 900;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    window.open(
      `${basePath}/asset-master`,
      'AssetMasterWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // 資産マスタからのメッセージを受信
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'ASSET_SELECTED' && editingLinked && editingRow !== null) {
        const assetMasters = event.data.assets as any[];
        const scope = event.data.scope as 'all' | 'toMaker' | 'toItem';

        if (assetMasters.length > 0) {
          const master = assetMasters[0];

          let updatedLinked: LinkedMasterData;

          switch (scope) {
            case 'toItem':
              updatedLinked = {
                ...editingLinked,
                category: master.category || editingLinked.category,
                majorCategory: master.largeClass || editingLinked.majorCategory,
                middleCategory: master.mediumClass || editingLinked.middleCategory,
                item: master.item || editingLinked.item,
                manufacturer: '',
                model: '',
              };
              break;
            case 'toMaker':
              updatedLinked = {
                ...editingLinked,
                category: master.category || editingLinked.category,
                majorCategory: master.largeClass || editingLinked.majorCategory,
                middleCategory: master.mediumClass || editingLinked.middleCategory,
                item: master.item || editingLinked.item,
                manufacturer: master.maker || editingLinked.manufacturer,
                model: '',
              };
              break;
            case 'all':
            default:
              updatedLinked = {
                ...editingLinked,
                category: master.category || editingLinked.category,
                majorCategory: master.largeClass || editingLinked.majorCategory,
                middleCategory: master.mediumClass || editingLinked.middleCategory,
                item: master.item || editingLinked.item,
                manufacturer: master.maker || editingLinked.manufacturer,
                model: master.model || editingLinked.model,
              };
              break;
          }

          setEditingLinked(updatedLinked);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [editingLinked, editingRow]);

  const saveEdit = () => {
    if (!editingLinked || editingRow === null) return;
    setData(data.map(row =>
      row.id === editingRow ? { ...row, linked: { ...editingLinked } } : row
    ));
    setEditingRow(null);
    setEditingLinked(null);
  };

  const confirmRow = (id: number) => {
    if (confirm(`No.${id} のレコードを確定しますか？\n確定後、このレコードは画面から削除されます。`)) {
      setData(data.filter(r => r.id !== id));
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const bulkConfirmSelected = () => {
    if (selectedRows.size === 0) {
      alert('確定する項目を選択してください');
      return;
    }
    if (confirm(`選択した${selectedRows.size}件のレコードを一括確定しますか？\n確定後、これらのレコードは画面から削除されます。`)) {
      setData(data.filter(row => !selectedRows.has(row.id)));
      setSelectedRows(new Set());
      setSelectedAll(false);
    }
  };

  const completeMatching = () => {
    if (data.length > 0) {
      // 未確定の項目がある場合は一時保存確認モーダルを表示
      setShowLeaveConfirm(true);
    } else {
      alert('突き合わせが完了しました');
      router.push('/main');
    }
  };

  const totalCount = assetMatchingSampleData.length;
  const remainingCount = data.length;

  if (isMobile) {
    return (
      <div className="p-4 bg-[#FAFAFA] min-h-dvh">
        <div className="mb-4 text-center text-lg font-bold">
          資産台帳とマスタの突き合わせ
        </div>
        <div className="text-[#DA0000] mb-4 text-sm text-center">
          この画面はデスクトップ表示に最適化されています
        </div>
        <button
          onClick={handleBack}
          className="w-full py-3 bg-[#4A4A4A] text-white border-none rounded-lg cursor-pointer text-base"
        >
          戻る
        </button>
      </div>
    );
  }

  // 固定列の累積left位置（px）: チェックボックス(36) + No.(40) + 台帳データ6列
  const stickyLeft = {
    checkbox: 0,
    no: 36,
    department: 76,
    section: 166,
    itemName: 276,
    maker: 426,
    model: 556,
    qty: 676,
  };

  const thBase = 'py-2 px-1.5 border-b-2 border-[#E1E1E1] whitespace-nowrap text-[11px]';
  const tdBase = 'p-2 border-b border-[#E1E1E1] whitespace-nowrap';

  return (
    <div className="flex flex-col min-h-dvh bg-[#FAFAFA]">
      {/* Header - Pattern B */}
      <header className="bg-[#FAFAFA] border-b border-[#E1E1E1] px-6 py-4">
        <div className="flex justify-between items-center max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-[#4A4A4A] bg-white border border-[#E1E1E1] rounded-lg cursor-pointer hover:bg-[#FAFAFA] transition-colors"
              aria-label="戻る"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              戻る
            </button>
            <h1 className="text-2xl font-bold text-[#4A4A4A] m-0 text-balance">
              資産台帳とマスタの突き合わせ
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#8A8A8A] font-semibold">残：</span>
              <span className="text-[#4A4A4A] font-semibold">{remainingCount}件</span>
              <span className="text-[#E1E1E1]">|</span>
              <span className="text-[#8A8A8A] font-semibold">完：</span>
              <span className="text-[#008C1D] font-semibold">{totalCount - remainingCount}件</span>
              <span className="text-[#8A8A8A]">/ {totalCount}件</span>
            </div>
            <button
              onClick={completeMatching}
              className="px-5 py-2.5 bg-white text-[#008C1D] border border-[#008C1D] rounded-lg cursor-pointer text-sm font-semibold hover:bg-[#EBF5EE]"
            >
              突き合わせ完了
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border-b border-[#E1E1E1] px-6 py-3">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center gap-3">
          <div className="flex gap-2.5 flex-1 items-end">
            <div className="flex-[0_0_130px]">
              <SearchableSelect
                label="共通部門"
                value={filters.department}
                onChange={(value) => setFilters({...filters, department: value, section: ''})}
                options={departmentOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="200px"
              />
            </div>
            <div className="flex-[0_0_140px]">
              <SearchableSelect
                label="共通部署"
                value={filters.section}
                onChange={(value) => setFilters({...filters, section: value})}
                options={sectionOptions}
                placeholder="全て"
                isMobile={isMobile}
                disabled={!filters.department}
                dropdownMinWidth="250px"
              />
            </div>
            <div className="flex-[0_0_120px]">
              <SearchableSelect
                label="Category"
                value={filters.category}
                onChange={(value) => setFilters({...filters, category: value})}
                options={categoryOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="200px"
              />
            </div>
            <div className="flex-[0_0_150px]">
              <SearchableSelect
                label="大分類"
                value={filters.majorCategory}
                onChange={(value) => setFilters({...filters, majorCategory: value})}
                options={majorCategoryOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="300px"
              />
            </div>
            <div className="flex-[0_0_150px]">
              <SearchableSelect
                label="中分類"
                value={filters.middleCategory}
                onChange={(value) => setFilters({...filters, middleCategory: value})}
                options={middleCategoryOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="300px"
              />
            </div>
            <div className="flex-[0_0_150px]">
              <SearchableSelect
                label="品目"
                value={filters.item}
                onChange={(value) => setFilters({...filters, item: value})}
                options={itemOptions}
                placeholder="全て"
                isMobile={isMobile}
                dropdownMinWidth="400px"
              />
            </div>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-[#4A4A4A] text-white border-none rounded cursor-pointer text-[13px] font-semibold whitespace-nowrap h-[38px] hover:bg-[#4A4A4A]"
            >
              リセット
            </button>
            <button
              onClick={() => exportAssetMatchingToExcel(filteredData)}
              className="px-4 py-2 bg-[#008C1D] text-white border-none rounded cursor-pointer text-[13px] font-semibold whitespace-nowrap h-[38px] hover:bg-[#008C1D]"
            >
              Excel出力
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex gap-3 mb-4">
            <button
              onClick={bulkConfirmSelected}
              className="px-5 py-2.5 bg-[#008C1D] text-white border-none rounded cursor-pointer text-sm font-semibold flex items-center gap-2 hover:bg-[#008C1D]"
            >
              <Check size={16} strokeWidth={2.5} aria-hidden /> 選択項目を一括確定
            </button>
            <button
              onClick={handleOpenAssetMaster}
              disabled={editingRow === null}
              className={`px-5 py-2.5 text-white border-none rounded text-sm font-semibold flex items-center gap-2 ${
                editingRow !== null
                  ? 'bg-[#4A4A4A] cursor-pointer opacity-100 hover:bg-[#4A4A4A]'
                  : 'bg-[#E1E1E1] cursor-not-allowed opacity-70'
              }`}
            >
              資産マスタを別ウィンドウで開く
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                {/* 1段目: グループヘッダー */}
                <tr className="bg-[#FAFAFA]">
                  <th
                    rowSpan={2}
                    className="p-2 border-b-2 border-[#E1E1E1] text-center sticky z-[4] bg-[#FAFAFA]"
                    style={{ left: stickyLeft.checkbox }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAll}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th
                    rowSpan={2}
                    className="p-2 border-b-2 border-[#E1E1E1] whitespace-nowrap sticky z-[4] bg-[#FAFAFA]"
                    style={{ left: stickyLeft.no }}
                  >
                    No.
                  </th>
                  <th
                    className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] font-semibold sticky z-[4]"
                    style={{ left: stickyLeft.department }}
                  >
                    台帳データ
                  </th>
                  <th
                    className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] sticky z-[4]"
                    style={{ left: stickyLeft.section }}
                  ></th>
                  <th
                    className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] sticky z-[4]"
                    style={{ left: stickyLeft.itemName }}
                  ></th>
                  <th
                    className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] sticky z-[4]"
                    style={{ left: stickyLeft.maker }}
                  ></th>
                  <th
                    className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] sticky z-[4]"
                    style={{ left: stickyLeft.model }}
                  ></th>
                  <th
                    className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] sticky z-[4] border-r-2 border-r-[#E1E1E1]"
                    style={{ left: stickyLeft.qty }}
                  ></th>
                  <th colSpan={7} className="p-2 border-b border-[#E1E1E1] bg-[#FDF1E5] font-semibold">
                    AI判定（推薦）
                  </th>
                  <th colSpan={6} className="p-2 border-b border-[#E1E1E1] bg-[#EBF5EE] font-semibold">
                    SHIP資産マスタ紐づけ
                  </th>
                  <th colSpan={2} className="p-2 border-b border-[#E1E1E1] sticky right-0 bg-[#FAFAFA] z-[4]">
                    操作
                  </th>
                </tr>
                {/* 2段目: 個別カラムヘッダー */}
                <tr className="bg-[#FAFAFA]">
                  {/* 台帳データ（sticky） */}
                  <th
                    className={`${thBase} sticky z-[3] bg-[#EBF5EE] min-w-[90px]`}
                    style={{ left: stickyLeft.department }}
                  >
                    共通部門
                  </th>
                  <th
                    className={`${thBase} sticky z-[3] bg-[#EBF5EE] min-w-[110px]`}
                    style={{ left: stickyLeft.section }}
                  >
                    共通部署
                  </th>
                  <th
                    className={`${thBase} sticky z-[3] bg-[#EBF5EE] min-w-[150px]`}
                    style={{ left: stickyLeft.itemName }}
                  >
                    品目名(原)
                  </th>
                  <th
                    className={`${thBase} sticky z-[3] bg-[#EBF5EE] min-w-[130px]`}
                    style={{ left: stickyLeft.maker }}
                  >
                    メーカー名(原)
                  </th>
                  <th
                    className={`${thBase} sticky z-[3] bg-[#EBF5EE] min-w-[120px]`}
                    style={{ left: stickyLeft.model }}
                  >
                    型式(原)
                  </th>
                  <th
                    className={`${thBase} sticky z-[3] bg-[#EBF5EE] min-w-[50px] border-r-2 border-r-[#E1E1E1]`}
                    style={{ left: stickyLeft.qty }}
                  >
                    数量
                  </th>
                  {/* AI判定（推薦） */}
                  <th className={`${thBase} text-center`}>採用</th>
                  <th className={thBase}>category</th>
                  <th className={`${thBase} min-w-[120px]`}>大分類</th>
                  <th className={`${thBase} min-w-[120px]`}>中分類</th>
                  <th className={`${thBase} min-w-[150px]`}>品目</th>
                  <th className={thBase}>メーカー名</th>
                  <th className={thBase}>型式</th>
                  {/* SHIP資産マスタ紐づけ */}
                  <th className={thBase}>category</th>
                  <th className={`${thBase} min-w-[120px]`}>大分類</th>
                  <th className={`${thBase} min-w-[120px]`}>中分類</th>
                  <th className={`${thBase} min-w-[150px]`}>品目</th>
                  <th className={thBase}>メーカー名</th>
                  <th className={thBase}>型式</th>
                  {/* 操作 */}
                  <th className={`${thBase} sticky right-[60px] bg-[#FAFAFA] z-[2] min-w-[60px] text-center`}>
                    編集
                  </th>
                  <th className={`${thBase} sticky right-0 bg-[#FAFAFA] z-[2] min-w-[60px] text-center`}>
                    確定
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => {
                  const isEditing = editingRow === row.id;
                  const displayLinked = isEditing && editingLinked ? editingLinked : row.linked;

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="bg-white">
                        {/* チェックボックス（sticky） */}
                        <td
                          className={`${tdBase} text-center sticky z-[2] bg-white`}
                          style={{ left: stickyLeft.checkbox }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRows.has(row.id)}
                            onChange={() => toggleRowSelection(row.id)}
                          />
                        </td>
                        <td
                          className={`${tdBase} sticky z-[2] bg-white`}
                          style={{ left: stickyLeft.no }}
                        >
                          {index + 1}
                        </td>

                        {/* 台帳データ（読み取り専用・sticky） */}
                        <td
                          className={`${tdBase} sticky z-[2] bg-[#EBF5EE]`}
                          style={{ left: stickyLeft.department }}
                        >
                          {row.department}
                        </td>
                        <td
                          className={`${tdBase} sticky z-[2] bg-[#EBF5EE]`}
                          style={{ left: stickyLeft.section }}
                        >
                          {row.section}
                        </td>
                        <td
                          className={`${tdBase} sticky z-[2] bg-[#EBF5EE] min-w-[150px]`}
                          style={{ left: stickyLeft.itemName }}
                        >
                          {row.originalItemName}
                        </td>
                        <td
                          className={`${tdBase} sticky z-[2] bg-[#EBF5EE]`}
                          style={{ left: stickyLeft.maker }}
                        >
                          {row.manufacturer}
                        </td>
                        <td
                          className={`${tdBase} sticky z-[2] bg-[#EBF5EE]`}
                          style={{ left: stickyLeft.model }}
                        >
                          {row.model}
                        </td>
                        <td
                          className={`${tdBase} sticky z-[2] bg-[#EBF5EE] border-r-2 border-r-[#E1E1E1]`}
                          style={{ left: stickyLeft.qty }}
                        >
                          {row.quantityUnit}
                        </td>

                        {/* AI判定（推薦）（読み取り専用 + 採用ボタン） */}
                        <td className={`${tdBase} bg-[#FAFAFA] text-center`}>
                          <button
                            onClick={() => handleApplyAIRecommendation(row.id)}
                            className={`px-2 py-1 text-[11px] text-white border-none rounded cursor-pointer whitespace-nowrap ${
                              row.aiApplied ? 'bg-[#DA0000] hover:bg-[#DA0000]' : 'bg-[#4A4A4A] hover:bg-[#4A4A4A]'
                            }`}
                          >
                            {row.aiApplied ? '解除' : '採用'}
                          </button>
                        </td>
                        <td className={`${tdBase} bg-[#FAFAFA]`}>{row.aiRecommendation.category}</td>
                        <td className={`${tdBase} bg-[#FAFAFA] min-w-[120px]`}>{row.aiRecommendation.major}</td>
                        <td className={`${tdBase} bg-[#FAFAFA] min-w-[120px]`}>{row.aiRecommendation.middle}</td>
                        <td className={`${tdBase} bg-[#FAFAFA] min-w-[150px]`}>{row.aiRecommendation.item}</td>
                        <td className={`${tdBase} bg-[#FAFAFA]`}>{row.aiRecommendation.manufacturer}</td>
                        <td className={`${tdBase} bg-[#FAFAFA]`}>{row.aiRecommendation.model}</td>

                        {/* SHIP資産マスタ紐づけ（編集対象） */}
                        <td className={`${tdBase} ${isEditing ? 'bg-[#FAFAFA]' : 'bg-[#EBF5EE]'}`}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.category}
                              onChange={(value) => setEditingLinked({ ...editingLinked, category: value })}
                              options={categoryOptions}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="200px"
                            />
                          ) : (
                            displayLinked.category
                          )}
                        </td>
                        <td className={`${tdBase} min-w-[120px] ${isEditing ? 'bg-[#FAFAFA]' : 'bg-[#EBF5EE]'}`}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.majorCategory}
                              onChange={(value) => handleEditFieldChange('majorCategory', value)}
                              options={majorCategoryOptions}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.majorCategory
                          )}
                        </td>
                        <td className={`${tdBase} min-w-[120px] ${isEditing ? 'bg-[#FAFAFA]' : 'bg-[#EBF5EE]'}`}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.middleCategory}
                              onChange={(value) => handleEditFieldChange('middleCategory', value)}
                              options={middleCategoryOptions}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.middleCategory
                          )}
                        </td>
                        <td className={`${tdBase} min-w-[150px] ${isEditing ? 'bg-[#FAFAFA]' : 'bg-[#EBF5EE]'}`}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.item}
                              onChange={(value) => handleEditFieldChange('item', value)}
                              options={Array.from(new Set(assetMasters.map(a => a.item))).filter(Boolean)}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="400px"
                            />
                          ) : (
                            displayLinked.item
                          )}
                        </td>
                        <td className={`${tdBase} ${isEditing ? 'bg-[#FAFAFA]' : 'bg-[#EBF5EE]'}`}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.manufacturer}
                              onChange={(value) => handleEditFieldChange('manufacturer', value)}
                              options={Array.from(new Set(assetMasters.map(a => a.maker))).filter(Boolean)}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.manufacturer
                          )}
                        </td>
                        <td className={`${tdBase} ${isEditing ? 'bg-[#FAFAFA]' : 'bg-[#EBF5EE]'}`}>
                          {isEditing && editingLinked ? (
                            <SearchableSelect
                              label=""
                              value={editingLinked.model}
                              onChange={(value) => handleEditFieldChange('model', value)}
                              options={Array.from(new Set(assetMasters.map(a => a.model))).filter(Boolean)}
                              placeholder="選択"
                              isMobile={isMobile}
                              dropdownMinWidth="300px"
                            />
                          ) : (
                            displayLinked.model
                          )}
                        </td>

                        {/* 操作 */}
                        <td className={`${tdBase} sticky right-[60px] bg-white z-[1] min-w-[60px] text-center`}>
                          {isEditing ? (
                            <button
                              onClick={() => toggleEditMode(row.id)}
                              className="px-2 py-1 text-xs bg-[#FAFAFA] border border-[#E1E1E1] rounded cursor-pointer whitespace-nowrap hover:bg-[#E1E1E1]"
                            >
                              キャンセル
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleEditMode(row.id)}
                              className="px-2 py-1 text-xs bg-[#EBF5EE] border-none rounded cursor-pointer whitespace-nowrap hover:bg-[#EBF5EE]"
                            >
                              編集
                            </button>
                          )}
                        </td>
                        <td className={`${tdBase} sticky right-0 bg-white z-[1] min-w-[60px] text-center`}>
                          {isEditing ? (
                            <button
                              onClick={saveEdit}
                              className="px-2 py-1 text-xs bg-[#4A4A4A] text-white border-none rounded cursor-pointer whitespace-nowrap font-semibold hover:bg-[#4A4A4A]"
                            >
                              保存
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmRow(row.id)}
                              className="px-2 py-1 text-xs bg-[#EBF5EE] text-[#146E2E] border-none rounded cursor-pointer whitespace-nowrap font-semibold hover:bg-[#008C1D]"
                            >
                              確定
                            </button>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {/* 一時保存確認モーダル */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-xl p-8 max-w-[480px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="m-0 mb-4 text-lg text-[#4A4A4A] text-balance">
              作業内容の一時保存
            </h3>
            <p className="m-0 mb-6 text-sm text-[#8A8A8A] leading-relaxed text-pretty">
              突き合わせ作業の途中です。作業内容を一時保存してメイン画面に戻りますか？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-6 py-2.5 bg-white border border-[#E1E1E1] rounded-lg cursor-pointer text-sm text-[#8A8A8A] hover:bg-[#FAFAFA]"
              >
                作業を続ける
              </button>
              <button
                onClick={handleLeaveWithoutSave}
                className="px-6 py-2.5 bg-white border border-[#DA0000] rounded-lg cursor-pointer text-sm text-[#DA0000] hover:bg-[#FDF1E5]"
              >
                保存せず戻る
              </button>
              <button
                onClick={handleLeaveWithSave}
                className="px-6 py-2.5 bg-[#4A4A4A] text-white border-none rounded-lg cursor-pointer text-sm font-semibold hover:bg-[#4A4A4A]"
              >
                一時保存して戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
