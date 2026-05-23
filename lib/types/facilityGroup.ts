/**
 * 施設グループ定義
 * 複数施設間でのデータ共有を管理する
 */

export interface FacilityGroup {
  id: string;
  name: string;
  facilityIds: string[];
  sharing: {
    /** 資産データ共有 */
    asset: boolean;
    /** 見積データ共有 */
    estimate: boolean;
    /** データ履歴共有 */
    history: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type SharingDataType = 'asset' | 'estimate' | 'history';
