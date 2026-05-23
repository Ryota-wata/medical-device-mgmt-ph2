/**
 * 資産マスタとの突き合わせ画面の型定義
 */

export interface AIRecommendation {
  category: string;
  major: string;
  middle: string;
  item: string;
  manufacturer: string;
  model: string;
}

/** SHIP資産マスタ紐づけデータ */
export interface LinkedMasterData {
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  manufacturer: string;
  model: string;
}

export const emptyLinkedMasterData: LinkedMasterData = {
  category: '',
  majorCategory: '',
  middleCategory: '',
  item: '',
  manufacturer: '',
  model: '',
};

export interface MatchingData {
  id: number;
  fixedAssetNo: string;
  managementDeviceNo: string;
  department: string;
  section: string;
  roomName: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
  originalItemName: string;
  manufacturer: string;
  model: string;
  quantityUnit: string;
  inspectionDate: string;
  linked: LinkedMasterData;
  aiRecommendation: AIRecommendation;
  aiApplied: boolean;
  status: 'pending' | 'completed';
}

export interface AssetMatchingFilters {
  department: string;
  section: string;
  category: string;
  majorCategory: string;
  middleCategory: string;
  item: string;
}
