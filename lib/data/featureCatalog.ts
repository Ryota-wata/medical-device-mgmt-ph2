/**
 * Phase2 機能カタログ（施設マスタ MS-102「権限設定」で、施設ごとに利用・実施主体・担当管理組織を決める単位）
 *
 * 正本: ship_sams-project apps/api/alembic/versions/0147_phase2_feature_catalog.py の _FEATURES_AFTER
 *       （顧客「マスタ定義書_v4.7.xlsx」02_機能一覧 準拠。42 機能。施設ごとに設定するのは 32 機能）
 * 顧客ワイヤー（操作UI_施設マスタ v3.3）は旧カタログ（C70 タスク管理 12 機能など）のままだが、
 * 機能の一覧は正本側の最新に合わせる。画面の構成・操作はワイヤーに合わせる。
 *
 * モックの画面表示の可否（lib/data/permission-units.ts の PU と usePermissions）とは、まだつないでいない。
 */

export type FeatureSubject = '病院' | 'SHIP' | '両方';

export interface FeatureCategory {
  code: string;
  name: string;
}

export interface FeatureDefinition {
  code: string;
  name: string;
  category: string;
  /** 施設ごとに選べる実施主体。空配列は施設ごとの設定対象外（施設に依存しない機能・両側とも管理者専用の機能など） */
  subjectOptions: FeatureSubject[];
}

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  { code: 'C20', name: '監査' },
  { code: 'C30', name: '原本リスト（申請・登録）' },
  { code: 'C40', name: '現場業務（モバイル）' },
  { code: 'C50', name: '編集リスト（リモデル）' },
  { code: 'C60', name: '編集リスト（ルーティン）' },
  { code: 'C71', name: '購入管理' },
  { code: 'C90', name: 'データ検索（他施設）' },
  { code: 'CA1', name: '資産マスタ' },
  { code: 'CA2', name: '施設マスタ' },
  { code: 'CA3', name: '施設グループ' },
  { code: 'CA4', name: 'SHIP部署マスタ' },
  { code: 'CA5', name: '個別部署マスタ' },
  { code: 'CA6', name: 'SHIPユーザーマスタ' },
  { code: 'CA7', name: '個別ユーザーマスタ' },
  { code: 'CA8', name: '個別業者マスタ' },
  { code: 'CB0', name: '個体管理リスト作成' },
];

type GrantType = 'DISTRIBUTED' | 'ADMIN_ONLY' | 'SAMS_ONLY' | 'NOT_APPLICABLE';

/** [機能コード, 機能名, カテゴリ, 病院側の付与方式, SHIP側の付与方式]（正本の並びのまま） */
const FEATURES_SOURCE: [string, string, string, GrantType, GrantType][] = [
  ['F-20-09', '監査ログ参照', 'C20', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-30-01', '原本リスト・カード・カルテの閲覧', 'C30', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-30-02', '原本の価格カラムの閲覧', 'C30', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-30-03', '原本の事務操作（レコード追加・インライン編集・元に戻す・施設列）', 'C30', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-30-04', '申請（新規・更新・増設・移動・廃棄・修理・取り下げ）', 'C30', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-30-05', '登録（点検登録・貸出登録・各種契約登録）', 'C30', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-30-06', 'カルテの訂正モード（識別・設置・品目の書き換え・理由必須）', 'C30', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-40-07', 'QRコード発行（ラベル発行・QR事後発行）', 'C40', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-50-01', 'リモデル編集リストの閲覧（編集フォルダ・版・カード・カルテ）', 'C50', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-50-05', 'リモデル編集（作成・計画行・申請区分・Data Link・Excel取込／出力・見積グループ作成・移転完了・削除）', 'C50', 'NOT_APPLICABLE', 'DISTRIBUTED'],
  ['F-50-02', 'リモデル購入管理：申請受付（却下・保留・編集リストへ追加）', 'C50', 'NOT_APPLICABLE', 'DISTRIBUTED'],
  ['F-50-06', 'リモデル購入管理：見積依頼・見積登録（STEP①〜⑥）', 'C50', 'NOT_APPLICABLE', 'DISTRIBUTED'],
  ['F-50-03', 'リモデル 発注登録・納品日登録', 'C50', 'NOT_APPLICABLE', 'DISTRIBUTED'],
  ['F-50-04', 'リモデル 検収登録', 'C50', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-50-07', 'リモデル 資産登録（原本への登録・取得価額の強制変更）', 'C50', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-50-08', 'リモデル取得見積の閲覧（見積グループの内容・見積Link）', 'C50', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-60-01', 'ルーティン編集リストの閲覧（編集フォルダ・カード・カルテ）', 'C60', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-60-03', 'ルーティン編集（作成＝原本コピー・編集・Data Link・Excel取込／出力・見積グループ作成・削除）', 'C60', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-71-01', '購入タスクの閲覧（購入管理リスト・申請内容・見積グループの内容・Excel出力）', 'C71', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-71-02', '申請受付（却下・保留・編集リストへ追加）', 'C71', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-71-03', '見積依頼・見積登録（STEP①〜⑥）', 'C71', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-71-04', '発注登録・納品日登録', 'C71', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-71-05', '検収登録', 'C71', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-71-06', '資産登録（原本への登録・取得価額の強制変更）', 'C71', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-B0-01', '現有品調査（マスタDL・部署選択・商品登録・履歴）', 'CB0', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-B0-02', '現調修正（写真確認・資産マスタ紐づけ・識別番号）', 'CB0', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-B0-03', '台帳取込・資産マスタ紐づけ', 'CB0', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-B0-04', '突合・統合・突合結果一覧・原本リストへ送る', 'CB0', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-A1-01', '資産マスタの閲覧・ドキュメント取得（病院向け参照画面）', 'CA1', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-A1-02', '資産マスタの編集（登録・分類/品目/メーカー・カラム管理・取込・表示順・付け替え）', 'CA1', 'SAMS_ONLY', 'SAMS_ONLY'],
  ['F-A2-01', '施設マスタ 一覧・施設情報の閲覧（枠内施設）', 'CA2', 'NOT_APPLICABLE', 'ADMIN_ONLY'],
  ['F-A2-02', '施設マスタの登録・編集・権限設定・管理者登録・代理ログイン［この施設で開く］', 'CA2', 'SAMS_ONLY', 'SAMS_ONLY'],
  ['F-A3-01', '施設グループの編成・開示設定', 'CA3', 'SAMS_ONLY', 'SAMS_ONLY'],
  ['F-A4-01', 'SHIP部署マスタ 一覧・編集', 'CA4', 'SAMS_ONLY', 'SAMS_ONLY'],
  ['F-A5-01', '個別部署マスタ 一覧・編集・Excel取込・Excel出力（SHIP部署マスタの選択肢を含む）', 'CA5', 'ADMIN_ONLY', 'DISTRIBUTED'],
  ['F-A6-01', 'SHIPユーザー 編集（一覧・登録・編集・担当施設・権限・ブックマーク・招待・削除（未招待）・管理組織を移す・Excel出力）', 'CA6', 'NOT_APPLICABLE', 'ADMIN_ONLY'],
  ['F-A6-03', 'SHIPユーザー 閲覧（一覧・基本情報・担当施設・実効権限の確認）', 'CA6', 'NOT_APPLICABLE', 'DISTRIBUTED'],
  ['F-A7-01', '個別ユーザー 編集（一覧・登録・編集・権限・ブックマーク・招待・削除（未招待）・Excel取込・Excel出力）', 'CA7', 'ADMIN_ONLY', 'ADMIN_ONLY'],
  ['F-A7-03', '個別ユーザー 閲覧（一覧・基本情報・実効権限の確認）', 'CA7', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-A8-01', '個別業者マスタ 編集（一覧・登録・編集・担当者・Excel取込）', 'CA8', 'ADMIN_ONLY', 'DISTRIBUTED'],
  ['F-A8-02', '個別業者マスタ 閲覧（会社情報・担当者情報）', 'CA8', 'DISTRIBUTED', 'DISTRIBUTED'],
  ['F-90-01', 'グループ施設のデータ検索', 'C90', 'DISTRIBUTED', 'NOT_APPLICABLE'],
];

/** 正本 0137 で施設の提供候補に入ったマスタ機能の実施主体（_MASTER_SUBJECT_OPTIONS） */
const MASTER_SUBJECT_OPTIONS: Record<string, FeatureSubject[]> = {
  'F-A5-01': ['SHIP'],
  'F-A8-01': ['SHIP'],
  'F-A7-03': ['病院', 'SHIP', '両方'],
  'F-A8-02': ['病院', 'SHIP', '両方'],
};

/** 正本 0147 の _subject_options_after() と同じ規則 */
function subjectOptionsOf(code: string, category: string, hospital: GrantType): FeatureSubject[] {
  if (category.startsWith('CA') || category === 'C90') return MASTER_SUBJECT_OPTIONS[code] ?? [];
  return hospital === 'NOT_APPLICABLE' ? ['SHIP'] : ['病院', 'SHIP', '両方'];
}

export const FEATURES: FeatureDefinition[] = FEATURES_SOURCE.map(([code, name, category, hospital]) => ({
  code,
  name,
  category,
  subjectOptions: subjectOptionsOf(code, category, hospital),
}));

/** 前提となる機能（[機能, 前提機能]）。前提を OFF にすると依存する機能も使えない */
export const FEATURE_PREREQUISITES: [string, string][] = [
  ['F-30-02', 'F-30-01'], ['F-30-03', 'F-30-01'], ['F-30-04', 'F-30-01'], ['F-30-05', 'F-30-01'], ['F-30-06', 'F-30-01'],
  ['F-50-02', 'F-50-01'], ['F-50-03', 'F-50-06'], ['F-50-05', 'F-50-01'], ['F-50-06', 'F-50-01'], ['F-50-07', 'F-50-04'],
  ['F-50-08', 'F-50-01'], ['F-60-03', 'F-60-01'], ['F-71-02', 'F-71-01'], ['F-71-03', 'F-71-01'], ['F-71-04', 'F-71-03'],
  ['F-71-05', 'F-71-04'], ['F-71-06', 'F-71-05'], ['F-A1-02', 'F-A1-01'], ['F-A2-02', 'F-A2-01'], ['F-A6-01', 'F-A6-03'],
  ['F-A7-01', 'F-A7-03'], ['F-A8-01', 'F-A8-02'], ['F-B0-02', 'F-B0-01'], ['F-B0-04', 'F-B0-03'],
];

/** 施設ごとに設定できる機能（正本の「施設の提供候補 P」。32 機能） */
export const CONFIGURABLE_FEATURES = FEATURES.filter((f) => f.subjectOptions.length > 0);
