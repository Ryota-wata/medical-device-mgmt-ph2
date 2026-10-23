/**
 * 顧客ワイヤーと連携用アダプタの対応表（scripts/sync-wireframes.mjs が読む）。
 *
 * key       : 正本フォルダからの相対パスから、版数（_v1.2）と拡張子を除いたもの。
 *             版が上がってファイル名が変わっても同じ key で対応付く。
 * adapter   : public/wireframe-bridge/adapters/ 配下のファイル名
 * globals   : アダプタが前提にしているワイヤー側のグローバル名。
 *             新しい版でこれが消えていたら、同期時に警告を出す。
 *
 * 手順 4 でワイヤーごとに追加していく。
 */
export const WIREFRAME_ADAPTERS = [
  {
    key: '原本リスト（申請）/原本リスト/操作UI_原本・編集リスト・棚卸_統合',
    adapter: 'original-list-integrated.js',
    globals: ['ORG', 'APPS', 'SCR', 'MODE', 'initRow', 'now', 'openOrg'],
  },
  {
    key: '共通マスタ/施設マスタ/操作UI_施設マスタ',
    adapter: 'facility-master.js',
    globals: ['setRole', 'go', 'openEdit', 'toggleMemo'],
  },
];
