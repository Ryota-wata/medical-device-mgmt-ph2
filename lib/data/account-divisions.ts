/**
 * 会計区分マスタ
 *
 * 出典: category-registration の CATEGORY_OPTIONS（17項目）を共通化したもの。
 * 修理 / 廃棄 / 保守契約 の見積登録 UI で「会計区分」select の選択肢として使用（REQ-082 / REQ-099 残部）。
 */
export interface AccountDivisionOption {
  value: string;
  label: string;
}

export const ACCOUNT_DIVISIONS: AccountDivisionOption[] = [
  { value: '01', label: '01 医療機器' },
  { value: '02', label: '02 医療用具' },
  { value: '03', label: '03 鋼製小物' },
  { value: '04', label: '04 什器備品' },
  { value: '05', label: '05 家電製品' },
  { value: '06', label: '06 その他器械備品' },
  { value: '07', label: '07 情報機器' },
  { value: '08', label: '08 ソフトウェア' },
  { value: '09', label: '09 車両他' },
  { value: '10', label: '10 放射線同位元素' },
  { value: '11', label: '11 建物' },
  { value: '12', label: '12 建物付帯設備' },
  { value: '13', label: '13 その他' },
  { value: '14', label: '14 器械保守料' },
  { value: '15', label: '15 修繕費' },
  { value: '16', label: '16 器械賃借料' },
  { value: '17', label: '17 材料費' },
];
