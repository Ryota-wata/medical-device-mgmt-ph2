/**
 * 権限管理単位（52件）
 *
 * 正本: docs/specifications/permissions/権限管理について.xlsx
 * 自動生成元: docs/coverage/phase-d/roles.yaml（generated_at: 2026-05-06）
 *
 * 2段階権限モデル:
 *   - managementLevel='施設' : SHIPシステム管理者が /permission-management で施設単位ON/OFFを決定。
 *     施設レベルでOFFのものは当該施設の全ユーザーで使用不可（user-permission-management でも触れない）。
 *   - managementLevel='ユーザー' : SHIPシステム管理者が施設レベルでON/OFFを決定したうえで、
 *     施設内システム管理者が /user-permission-management で各ユーザーに対するON/OFFを再設定可能。
 */

export type ManagementLevel = '施設' | 'ユーザー';
export type PermissionElementType = '画面' | 'ボタン' | 'カラム' | 'モーダル' | 'モーダル ボタン';

export interface PermissionUnit {
  id: string;
  displayName: string;
  managementLevel: ManagementLevel;
  screenName: string;
  elementType: PermissionElementType;
  /** 機能カテゴリ（画面分類）。UIのrowSpanグループ化に使用 */
  category: string;
  /** 権限ONのときに何が利用可能になるかを説明する文。権限管理画面のテーブルに表示する */
  switchContent: string;
}

/** 画面分類カテゴリ（roles.yaml の screen_name から手動マッピング） */
function categorize(screenName: string): string {
  if (screenName.includes('資産一覧') || screenName.includes('資産カルテ')) return '資産閲覧';
  if (screenName.includes('日常点検')) return '点検';
  if (screenName.includes('貸出') || screenName.includes('返却')) return '貸出・返却';
  if (screenName.includes('修正申請') || screenName.includes('修理')) return '修理申請';
  if (screenName.includes('棚卸')) return '棚卸し';
  if (screenName.includes('QR')) return 'QRコード';
  if (screenName.includes('現有品調査') || screenName.includes('登録履歴') || screenName.includes('調査場所') || screenName.includes('オフライン準備')) return '現有品調査';
  if (screenName.includes('資産台帳') || screenName.includes('データ突合') || screenName.includes('固定資産台帳')) return '資産台帳・突合';
  if (screenName.includes('編集リスト')) return '編集リスト';
  if (screenName.includes('タスク管理')) return 'タスク管理';
  if (screenName.includes('SHIP資産マスタ') || screenName.includes('資産マスタ')) return '資産マスタ';
  if (screenName.includes('SHIP施設マスタ') || screenName.includes('施設マスタ')) return '施設マスタ';
  if (screenName.includes('SHIP部署マスタ') || screenName.includes('個別部署マスタ')) return '部署マスタ';
  if (screenName.includes('業者マスタ')) return '業者マスタ';
  if (screenName.includes('ユーザー一覧')) return 'ユーザー管理';
  if (screenName.includes('施設グループ')) return '施設グループ';
  return 'その他';
}

const RAW_UNITS: Omit<PermissionUnit, 'category'>[] = [
  { id: 'PU-0001', displayName: '資産一覧・カルテ閲覧', managementLevel: 'ユーザー', screenName: '資産一覧画面', elementType: '画面', switchContent: '原本一覧画面の利用可否を制御する' },
  { id: 'PU-0002', displayName: '資産一覧 / 新規・更新・増設・移動・廃棄', managementLevel: 'ユーザー', screenName: '資産一覧画面', elementType: 'ボタン', switchContent: '新規 / 更新 / 増設 / 移動 / 廃棄機能が利用できる' },
  { id: 'PU-0003', displayName: '資産一覧 / 点検管理登録', managementLevel: 'ユーザー', screenName: '資産一覧画面', elementType: 'ボタン', switchContent: '点検管理登録機能が利用できる' },
  { id: 'PU-0004', displayName: '資産一覧 / 保守契約登録', managementLevel: 'ユーザー', screenName: '資産一覧画面', elementType: 'ボタン', switchContent: '保守契約登録機能が利用できる' },
  { id: 'PU-0005', displayName: '資産一覧 / 管理部署編集', managementLevel: 'ユーザー', screenName: '資産一覧画面', elementType: 'ボタン', switchContent: '管理部署編集機能が利用できる' },
  { id: 'PU-0006', displayName: '資産カルテ / 原本編集', managementLevel: 'ユーザー', screenName: '資産カルテ画面', elementType: 'ボタン', switchContent: '編集機能が利用できる' },
  { id: 'PU-0007', displayName: '資産一覧・カルテ / 原本価格情報', managementLevel: 'ユーザー', screenName: '資産一覧画面 資産カルテ画面', elementType: 'カラム', switchContent: '原本リスト、カード、カルテで価格列を表示する' },
  { id: 'PU-0008', displayName: '日常点検・オフライン準備', managementLevel: 'ユーザー', screenName: '日常点検実施画面', elementType: '画面', switchContent: '日常点検実施画面の利用可否を制御する' },
  { id: 'PU-0009', displayName: '貸出・返却', managementLevel: 'ユーザー', screenName: '貸出可能機器閲覧', elementType: '画面', switchContent: '貸出対象の閲覧導線を表示する' },
  { id: 'PU-0010', displayName: '貸出・返却 / 使用中 & 使用済み', managementLevel: '施設', screenName: '貸出・返却画面', elementType: '画面', switchContent: '貸出返却画面の使用中モーダル & ボタン、使用済みモーダル & ボタンの利用可否を制御する。Trueとした場合、貸出⇒返却 / 使用中⇒使用済み⇒返却 という遷移が可能になる。Falseとした場合、貸出⇒返却 という遷移になる' },
  { id: 'PU-0011', displayName: '修理申請', managementLevel: 'ユーザー', screenName: '修正申請画面', elementType: '画面', switchContent: '修理申請画面の利用可否を制御する' },
  { id: 'PU-0012', displayName: '棚卸し', managementLevel: 'ユーザー', screenName: '棚卸し画面', elementType: '画面', switchContent: '棚卸し画面の利用可否を制御する' },
  { id: 'PU-0013', displayName: '棚卸し / 完了', managementLevel: 'ユーザー', screenName: '棚卸し画面', elementType: 'モーダル ボタン', switchContent: '棚卸し完了操作の利用可否を制御する' },
  { id: 'PU-0014', displayName: 'QRコード発行', managementLevel: 'ユーザー', screenName: 'QRコード発行画面 QRコード印刷画面', elementType: '画面', switchContent: 'QR 発行画面 / ボタンを表示し実行できる' },
  { id: 'PU-0015', displayName: '現有品調査', managementLevel: 'ユーザー', screenName: '現有品調査画面 登録履歴表示画面', elementType: '画面', switchContent: '現有品調査画面の利用可否を制御する' },
  { id: 'PU-0016', displayName: '現有品調査内容修正', managementLevel: 'ユーザー', screenName: '現有品調査内容修正画面', elementType: '画面', switchContent: '現有品調査内容修正画面の利用可否を制御する' },
  { id: 'PU-0017', displayName: '資産台帳取込登録', managementLevel: 'ユーザー', screenName: '資産台帳取込画面', elementType: '画面', switchContent: '台帳取込画面の利用可否を制御する' },
  { id: 'PU-0018', displayName: 'データ突合', managementLevel: 'ユーザー', screenName: 'データ突合画面', elementType: '画面', switchContent: '現調台帳突合せ画面を表示し実行できる' },
  { id: 'PU-0019', displayName: '編集リスト（リモデル）', managementLevel: 'ユーザー', screenName: '編集リスト画面（リモデル）', elementType: '画面', switchContent: '編集リスト画面の利用可否を制御する' },
  { id: 'PU-0020', displayName: '編集リスト（通常）', managementLevel: 'ユーザー', screenName: '編集リスト画面（通常）', elementType: '画面', switchContent: '分析作業導線 / 操作を表示する' },
  { id: 'PU-0021', displayName: 'リモデル購入管理 / 申請受付～見積登録', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面のリモデル管理タブに表示される見積登録の行を利用制御する' },
  { id: 'PU-0022', displayName: 'リモデル購入管理 / 発注登録～資産登録', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面のリモデル管理タブに表示される発注登録～資産登録の行を利用制御する' },
  { id: 'PU-0023', displayName: 'リモデル購入管理 / 検収登録', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面のリモデル管理タブに表示される検収登録の行を利用制御する' },
  { id: 'PU-0024', displayName: 'DataLINK / SHIP表示列(リモデル)', managementLevel: 'ユーザー', screenName: '編集リスト画面（リモデル）', elementType: 'カラム', switchContent: 'リモデル編集リスト内で SHIP 列を表示する' },
  { id: 'PU-0025', displayName: 'DataLINK / SHIP表示列(通常)', managementLevel: 'ユーザー', screenName: '編集リスト画面（通常）', elementType: 'カラム', switchContent: '通常編集リスト内で SHIP 列を表示する' },
  { id: 'PU-0026', displayName: '通常購入管理 / 申請受付～見積登録', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の購入管理タブに表示される見積依頼の行を利用制御する' },
  { id: 'PU-0027', displayName: '通常購入管理 / 発注登録～仮資産登録', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の購入管理タブに表示される発注登録～仮資産登録の行を利用制御する' },
  { id: 'PU-0028', displayName: '通常購入管理 / 検収登録', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の購入管理タブに表示される検収登録の行を利用制御する' },
  { id: 'PU-0029', displayName: '通常購入管理 / 見積管理', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の購入管理タブに表示される見積登録の行を利用制御する' },
  { id: 'PU-0030', displayName: '移動・廃棄管理', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の移動・廃棄管理タブを利用制御する' },
  { id: 'PU-0031', displayName: '修理管理', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の修理管理タブを利用制御する' },
  { id: 'PU-0032', displayName: '保守契約管理', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の保守管理タブを利用制御する' },
  { id: 'PU-0033', displayName: '点検管理', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の点検管理タブを利用制御する' },
  { id: 'PU-0034', displayName: '貸出管理（タスク管理）', managementLevel: 'ユーザー', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の貸出管理タブを利用制御する' },
  { id: 'PU-0035', displayName: '通常購入管理 / SHIP依頼機能', managementLevel: '施設', screenName: 'タスク管理画面', elementType: '画面', switchContent: 'タスク管理画面の購入管理タブに表示されるSHIPへ一括依頼ボタンを利用制御する' },
  { id: 'PU-0036', displayName: '資産マスタ / 一覧', managementLevel: 'ユーザー', screenName: 'SHIP資産マスタ画面', elementType: '画面', switchContent: 'SHIP資産マスタ画面の利用可否を制御する' },
  { id: 'PU-0037', displayName: '資産マスタ / 新規作成・編集', managementLevel: 'ユーザー', screenName: 'SHIP資産マスタ画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
  { id: 'PU-0038', displayName: '資産マスタ / SHIP表示列', managementLevel: 'ユーザー', screenName: 'SHIP資産マスタ画面', elementType: 'カラム', switchContent: '通常編集リスト内で SHIP 列を表示する' },
  { id: 'PU-0039', displayName: '施設マスタ / 一覧', managementLevel: 'ユーザー', screenName: 'SHIP施設マスタ画面', elementType: '画面', switchContent: 'SHIP施設マスタ画面の利用可否を制御する' },
  { id: 'PU-0040', displayName: '施設マスタ / 新規作成・編集', managementLevel: 'ユーザー', screenName: 'SHIP施設マスタ画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
  { id: 'PU-0041', displayName: '施設提供機能 / 編集', managementLevel: 'ユーザー', screenName: 'SHIP施設マスタ画面', elementType: 'モーダル', switchContent: 'SHIP施設マスタ画面の編集画面で、その施設にどの機能を提供するか制御する' },
  { id: 'PU-0042', displayName: 'SHIP部署マスタ 一覧', managementLevel: 'ユーザー', screenName: 'SHIP部署マスタ画面', elementType: '画面', switchContent: 'SHIP部署マスタ画面の利用可否を制御する' },
  { id: 'PU-0043', displayName: 'SHIP部署マスタ 新規作成・編集', managementLevel: 'ユーザー', screenName: 'SHIP部署マスタ画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
  { id: 'PU-0044', displayName: '個別部署マスタ 一覧', managementLevel: 'ユーザー', screenName: '個別部署マスタ画面', elementType: '画面', switchContent: '個別部署マスタ画面の利用可否を制御する' },
  { id: 'PU-0045', displayName: '個別部署マスタ 新規作成・編集', managementLevel: 'ユーザー', screenName: '個別部署マスタ画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
  { id: 'PU-0046', displayName: '業者マスタ 一覧', managementLevel: 'ユーザー', screenName: '業者マスタ画面', elementType: '画面', switchContent: '業者マスタ画面の利用可否を制御する' },
  { id: 'PU-0047', displayName: '業者マスタ 新規作成・編集', managementLevel: 'ユーザー', screenName: '業者マスタ画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
  { id: 'PU-0048', displayName: 'ユーザー 一覧', managementLevel: 'ユーザー', screenName: 'ユーザー一覧画面', elementType: '画面', switchContent: 'ユーザー管理画面の利用可否を制御する' },
  { id: 'PU-0049', displayName: 'ユーザー 新規作成・編集', managementLevel: 'ユーザー', screenName: 'ユーザー一覧画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
  { id: 'PU-0050', displayName: '担当施設 編集', managementLevel: 'ユーザー', screenName: 'ユーザー一覧画面', elementType: 'モーダル', switchContent: 'ユーザー管理画面の編集画面に含まれる担当施設設定 UI を制御する' },
  { id: 'PU-0051', displayName: '施設グループ 一覧', managementLevel: 'ユーザー', screenName: '施設グループ一覧画面', elementType: '画面', switchContent: '施設グループ管理画面の利用可否を制御する' },
  { id: 'PU-0052', displayName: '施設グループ 新規作成・編集', managementLevel: 'ユーザー', screenName: '施設グループ一覧画面', elementType: 'モーダル', switchContent: '編集 / 新規作成モーダルを表示する' },
];

export const PERMISSION_UNITS: PermissionUnit[] = RAW_UNITS.map((u) => ({
  ...u,
  category: categorize(u.screenName),
}));

/** 画面分類カテゴリの表示順（UI でのrowSpanグループ化順序） */
export const PERMISSION_CATEGORY_ORDER = [
  '資産閲覧',
  '点検',
  '貸出・返却',
  '修理申請',
  '棚卸し',
  'QRコード',
  '現有品調査',
  '資産台帳・突合',
  '編集リスト',
  'タスク管理',
  '資産マスタ',
  '施設マスタ',
  '部署マスタ',
  '業者マスタ',
  'ユーザー管理',
  '施設グループ',
  'その他',
] as const;

/** カテゴリ → 該当 PermissionUnit[] の Map */
export function getPermissionUnitsByCategory(): Record<string, PermissionUnit[]> {
  const map: Record<string, PermissionUnit[]> = {};
  for (const cat of PERMISSION_CATEGORY_ORDER) {
    map[cat] = [];
  }
  for (const u of PERMISSION_UNITS) {
    if (!map[u.category]) map[u.category] = [];
    map[u.category].push(u);
  }
  return map;
}

/** PermissionUnit を id で検索 */
export function findPermissionUnit(id: string): PermissionUnit | undefined {
  return PERMISSION_UNITS.find((u) => u.id === id);
}
