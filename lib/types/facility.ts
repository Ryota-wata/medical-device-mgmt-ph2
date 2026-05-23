/**
 * 施設情報マスタの型定義
 */

/**
 * 施設マスタデータ
 */
export interface FacilityData {
  buildings: string[];
  divisions: string[];
  sectionsByDivision: Record<string, string[]>;
  roomRangesBySection: Record<string, string[]>;
}

/**
 * 部門情報
 */
export interface Department {
  id: string;
  name: string;
  sections: Section[];
}

/**
 * 部署情報
 */
export interface Section {
  id: string;
  name: string;
  departmentId: string;
}

/**
 * 建物情報
 */
export interface Building {
  id: string;
  name: string;
  floors: string[];
}

/**
 * 施設情報の定数
 */
export const FACILITY_CONSTANTS = {
  buildings: ['本館', '新館', '東棟', '西棟', '診療棟'],
  divisions: ['内科', '外科', '手術部', '放射線科', '検査科', '薬剤部', '事務部'],
  sectionsByDivision: {
    '内科': ['循環器内科', '消化器内科', '呼吸器内科'],
    '外科': ['一般外科', '整形外科', '脳神経外科'],
    '手術部': ['中央手術室', 'ICU', 'HCU'],
    '放射線科': ['X線撮影室', 'CT室', 'MRI室'],
    '検査科': ['検体検査室', '生理検査室', '病理検査室']
  },
  roomRangesBySection: {
    '循環器内科': ['外来診察室', '病棟', '処置室'],
    '中央手術室': ['手術室1', '手術室2', '手術室3', 'リカバリー室'],
    'X線撮影室': ['一般撮影室', 'ポータブル撮影室', 'TV撮影室'],
    'CT室': ['CT1号機室', 'CT2号機室', '操作室']
  }
} as const;
