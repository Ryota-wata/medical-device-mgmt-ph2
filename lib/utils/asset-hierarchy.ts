/**
 * 資産の親子関係（階層構造）を処理するユーティリティ
 */

import { AssetMaster } from '@/lib/types/master';

type EditableField = 'majorCategory' | 'middleCategory' | 'item' | 'manufacturer' | 'model';

interface HierarchyFields {
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer: string;
  model: string;
}

/**
 * フィールド値の変更時に親フィールドを自動更新
 *
 * 階層構造: 大分類 → 中分類 → 品目 → メーカー → 型式
 * 子フィールドを選択すると、親フィールドが自動的に設定される
 *
 * @param field - 変更するフィールド名
 * @param value - 新しい値
 * @param currentData - 現在の編集データ（HierarchyFields を満たすオブジェクト）
 * @param assetMasters - 資産マスタデータ
 * @returns 更新すべきフィールドと値のオブジェクト
 */
export function updateFieldWithParents(
  field: EditableField,
  value: string,
  currentData: HierarchyFields,
  assetMasters: AssetMaster[]
): Partial<HierarchyFields> {
  let updates: Partial<HierarchyFields> = { [field]: value };

  // 空の値の場合は、そのフィールドのみ更新
  if (!value) {
    return updates;
  }

  // 選択された値に一致する資産を検索
  const matchingAssets = assetMasters.filter(asset => {
    if (field === 'model') return asset.model === value;
    if (field === 'manufacturer') return asset.maker === value;
    if (field === 'item') return asset.item === value;
    if (field === 'middleCategory') return asset.mediumClass === value;
    if (field === 'majorCategory') return asset.largeClass === value;
    return false;
  });

  // 一致する資産が見つからない場合は、そのフィールドのみ更新
  if (matchingAssets.length === 0) {
    return updates;
  }

  const asset = matchingAssets[0];

  // 型式が選択された場合、全ての親を自動設定
  if (field === 'model') {
    updates = {
      ...updates,
      manufacturer: asset.maker,
      item: asset.item,
      middleCategory: asset.mediumClass,
      majorCategory: asset.largeClass
    };
  }
  // メーカーが選択された場合、品目以上を自動設定
  else if (field === 'manufacturer') {
    // 現在の型式とも一致する資産を優先的に選択
    const specificAsset = matchingAssets.find(a =>
      !currentData.model || a.model === currentData.model
    ) || asset;
    updates = {
      ...updates,
      item: specificAsset.item,
      middleCategory: specificAsset.mediumClass,
      majorCategory: specificAsset.largeClass
    };
  }
  // 品目が選択された場合、中分類と大分類を自動設定
  else if (field === 'item') {
    updates = {
      ...updates,
      middleCategory: asset.mediumClass,
      majorCategory: asset.largeClass
    };
  }
  // 中分類が選択された場合、大分類を自動設定
  else if (field === 'middleCategory') {
    updates = {
      ...updates,
      majorCategory: asset.largeClass
    };
  }

  return updates;
}
