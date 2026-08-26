# Ph2 開発見積 — 見積対象画面一覧（棚卸）

> 作成日: 2026-08-26 / 対象リポ: `medical-device-mgmt-ph2`
> 目的: **作業（WBS）単位ではなく画面単位で見積依頼する**ための対象画面確定

## 1. 背景と方針

### なぜ画面単位に切り替えるか

細粒度の WBS で見積依頼したところ工数が積み上がった。原因は主に次の2点と推定する。

1. **共通部品の重複計上** — 検索ペイン・一覧テーブル・Excel出力・権限制御などを画面ごとに「設計/実装/単体テスト」で刻むと、実際は1回作れば済むものが画面数ぶん積まれる
2. **不確実性バッファの多重計上** — 作業行が細かいほど、各行にベンダー側のリスクバッファが乗る

対策として、**見積単位を「作業」から「画面」に変更**し、あわせて「共通部品は先に1回だけ計上 → 各画面はその差分」という積算構造をこちら側から提示する。

### 見積依頼パッケージの構成（最終形）

| 渡すもの | 中身 | 状態 |
|---|---|---|
| 画面カタログ（Webで実際に触れる） | 画面ID・区分・ペルソナ・規模・モックURL | 本書 = その元データ |
| 画面別 見積用仕様メモ | 項目数 / 一覧列数 / アクション数 / 帳票・Excel出力 / 外部連携 / 想定件数 | 未（Step 3） |
| 共通部品リスト | 再利用部品を明示し二重計上を潰す | 未（Step 5） |
| 見積記入フォーマット | 画面ID × (設計/実装/テスト) の人日を書くだけの表 | 未（Step 4） |

### 顧客提供 HTML ワイヤーフレームの扱い

後日、顧客から HTML ワイヤーフレームが提供される予定。受領後は `public/wireframes/` に配置し、カタログ画面から参照して「モック実装版」と「顧客ワイヤー版」を並べて提示できるようにする（Step 6）。受入れ口を先に用意しておけば、受領後は差し替えるだけで済む。

---

## 2. 前提: Ph1 / Ph2 リポの統合について

本棚卸は「**Ph1 機能と Ph2 機能を統合した1つのモック**」を前提として、Ph1 由来画面も見積対象に含めて全数を掲載している。

### リポジトリの現状（2026-08-26 時点の実測）

| 項目 | 実測値 |
|---|---|
| Ph2 リポの画面数（page ルート） | **80** |
| Ph1 リポ (GitHub HEAD) の画面数 | **63** |
| Ph2 でのみ存在する画面 | **18**（Ph2 新規実装分） |
| Ph1 でのみ存在する画面 | **1**（`/ship-user-management`） |
| Ph2 が Ph1 から分岐した時点 | 2026-05-23（commit `2d8a9f9` 相当）|
| Ph1 がそれ以降に進んだコミット数 | **109 commits / 261 ファイル変更** |

**両リポの git 履歴は非共有**（Ph2 は 5/23 時点のコピーから 9 commits）。したがって統合は単純な merge ではなく、下記の取り込み作業が必要になる。

### 統合に必要な作業（これ自体も見積・工数の対象）

1. Ph1 が 5/23 以降に変更した 261 ファイルのうち、Ph2 側で未反映の差分を取り込む（影響ルートは §4 参照）
2. `/ship-user-management` を Ph2 側へ取り込む
3. Ph2 側で改修済みの Ph1 由来画面（`/main`, `/login`, `/quotation-data-box/rfq-process`）の競合解消

> **注意**: 現行の `CLAUDE.md` §0 は「Ph1 リポへの書込み絶対禁止」「Ph2 → Ph1 の逆流禁止」を定めている。統合を Ph1 リポ側で行う方針であれば、**このルールの改訂が先に必要**。本セッションは Ph1 リポに対して読取り専用アクセスしか持たない。

---

## 3. 見積対象画面一覧

**規模区分の判定基準（客観指標）**: モック実装の実装行数（`page.tsx` + 同階層 `*.tsx` + `components/*.tsx`）

- **大** = 800行以上 / **中** = 300〜799行 / **小** = 300行未満

**ID について**: `EST-nnn` は本見積依頼のための通し番号。D12-mock-plan.md 由来の `S1`〜`S20` とは別体系のため、混同を避ける目的で分けている（対応する S 番号は「画面名」列に併記）。

行数はあくまでモックの実装量であり本番実装工数そのものではないが、画面間の**相対的な重さ**を示す再現可能な指標として、見積依頼時にベンダーへ併せて提示する。

### 3-0. 規模内訳サマリ

| 区分 | 大 | 中 | 小 | 計 |
|---|---:|---:|---:|---:|
| Ph2 新規・改修 | 1 | 10 | 9 | **20** |
| Ph1 由来 | 16 | 25 | 19 | **60** |
| **合計** | **17** | **35** | **28** | **80** |

### 3-1. Ph2 新規・Ph2 改修画面（20画面）

| ID | ルート | 画面名 | ペルソナ | モック行数 | 規模 | 備考 |
|---|---|---|---|---:|:---:|---|
| EST-001 | `/login` | ログイン（Microsoft SSO風） | 共通 | 243 | 小 | S20: ペルソナバッジ追加 |
| EST-002 | `/main` | メインメニュー / 個体管理リスト | 共通 | 1070 | 大 | Ph2でメニュー再編・実績データ検索導線追加 |
| EST-003 | `/dashboard-hospital` | S1 病院職員用ダッシュボード | 病院 | 367 | 中 | 区分2 |
| EST-004 | `/ledger-applications` | S3/S4 電帳法対応 申請一覧＋高度検索ペイン | 共通 | 495 | 中 | 区分1 |
| EST-005 | `/quotation-list` | S5 取得見積一覧 | 共通 | 484 | 中 | 区分1 |
| EST-006 | `/performance-search` | 実績データ検索（ハブ） | 共通 | 199 | 小 | 区分1・顧客項目2 |
| EST-007 | `/performance-search/single` | 実績データ 単一検索 | 共通 | 253 | 小 | 区分1 |
| EST-008 | `/performance-search/multi` | 実績データ 複合検索 | 共通 | 222 | 小 | 区分1 |
| EST-009 | `/performance-search/group` | 実績データ グループ検索 | 共通 | 218 | 小 | 区分1 |
| EST-010 | `/performance-search/documents` | 実績データ 書類検索 | 共通 | 207 | 小 | 区分1 |
| EST-011 | `/performance-search/applications-pending` | 未執行申請一覧 | 共通 | 203 | 小 | 区分1 |
| EST-012 | `/ph2` | Ph2機能カタログ（索引） | 共通 | 272 | 小 | 見積カタログの原型 |
| EST-013 | `/ph2-excel-exports` | S6-S9 Excel出力センター | 共通 | 289 | 小 | 区分3 |
| EST-014 | `/ph2-asset-master-columns` | S13 資産マスタ カラム設定 | SHIP | 516 | 中 | 区分5 |
| EST-015 | `/ph2-remodel-close` | S14 リモデル管理＋クローズ確認 | 共通 | 792 | 中 | 区分5 |
| EST-016 | `/ph2-step5-allocation` | S15 STEP⑤ 個体登録・金額按分 | 共通 | 408 | 中 | 区分5 |
| EST-017 | `/ph2-borrowing-dept-picker` | S16 貸出時 部署選択ピッカー | 病院 | 317 | 中 | 区分5 |
| EST-018 | `/ph2-inventory-4step` | S17 棚卸 4段階運用 | 病院 | 404 | 中 | 区分5 |
| EST-019 | `/ph2-inspection-daily` | S18 点検管理タブ 日常点検併載 | 病院 | 467 | 中 | 区分5 |
| EST-020 | `/proxy-quotation` | S19 代理見積登録 | SHIP | 393 | 中 | 区分2/認証 |

### 3-2. Ph1 由来画面（60画面）

| ID | ルート | 画面名 | ペルソナ | モック行数 | 規模 | 備考 |
|---|---|---|---|---:|:---:|---|
| EST-021 | `/` (root) | ルートリダイレクト | 共通 | 5 | 小 | 画面ではない（/login へ転送） |
| EST-022 | `/password-reset` | パスワードリセット | 共通 | 111 | 小 |  |
| EST-023 | `/facility-select` | 施設選択 | 共通 | 135 | 小 |  |
| EST-024 | `/asset-detail` | 資産詳細 | 共通 | 573 | 中 |  |
| EST-025 | `/asset-import` | 資産インポート | SHIP | 422 | 中 |  |
| EST-026 | `/asset-master` | 資産マスタ | SHIP | 457 | 中 |  |
| EST-027 | `/asset-matching` | 資産マッチング | SHIP | 840 | 大 |  |
| EST-028 | `/asset-search-result` | 資産検索結果 | 共通 | 782 | 中 |  |
| EST-029 | `/asset-survey-integrated` | 現有資産調査（統合登録） | SHIP | 614 | 中 |  |
| EST-030 | `/survey-location` | 現有資産調査 ロケーション | SHIP | 234 | 小 |  |
| EST-031 | `/daily-inspection` | 日常点検 | 病院 | 814 | 大 |  |
| EST-032 | `/periodic-inspection` | 定期点検 | 病院 | 1088 | 大 |  |
| EST-033 | `/inspection-prep` | 点検準備・実施 | 病院 | 175 | 小 |  |
| EST-034 | `/inspection-result` | 点検結果 | 病院 | 607 | 中 |  |
| EST-035 | `/inventory` | 棚卸し | 病院 | 1575 | 大 |  |
| EST-036 | `/offline-prep` | オフライン準備（マスタDL） | 病院 | 175 | 小 |  |
| EST-037 | `/data-matching` | データマッチング | SHIP | 1749 | 大 |  |
| EST-038 | `/disposal-task` | 廃棄タスク・廃棄発注書 | 共通 | 1593 | 大 |  |
| EST-039 | `/history` | 登録履歴 | 共通 | 331 | 中 |  |
| EST-040 | `/hospital-facility-master` | 病院施設マスタ | 病院 | 1343 | 大 |  |
| EST-041 | `/facility-group-management` | 施設グループ管理 | SHIP | 315 | 中 |  |
| EST-042 | `/lending-available` | 貸出可能機器閲覧 | 病院 | 188 | 小 |  |
| EST-043 | `/lending-checkout` | 貸出・返却 | 病院 | 772 | 中 |  |
| EST-044 | `/maintenance-quote-registration` | 保守見積登録 | 共通 | 1400 | 大 |  |
| EST-045 | `/maker-maintenance-result` | メーカー保守実績 | 共通 | 703 | 中 |  |
| EST-046 | `/permission-management` | 権限管理 | SHIP | 372 | 中 |  |
| EST-047 | `/user-management` | ユーザー管理 | SHIP | 1075 | 大 |  |
| EST-048 | `/user-permission-management` | ユーザー権限管理 | SHIP | 360 | 中 |  |
| EST-049 | `/qr-issue` | QRコード発行 | 病院 | 303 | 中 |  |
| EST-050 | `/qr-print` | QRコード印刷プレビュー | 病院 | 243 | 小 |  |
| EST-051 | `/quotation-management` | 見積管理 | 共通 | 184 | 小 |  |
| EST-052 | `/quotation-processing` | 見積処理 | 共通 | 736 | 中 |  |
| EST-053 | `/registration-edit` | 登録・編集（写真一覧含む） | 共通 | 1477 | 大 |  |
| EST-054 | `/remodel-application` | リモデル申請 | 共通 | 3163 | 大 |  |
| EST-055 | `/repair-request` | 修理申請 | 病院 | 728 | 中 |  |
| EST-056 | `/repair-task` | 修理申請管理（タスク） | 共通 | 2774 | 大 |  |
| EST-057 | `/ship-asset-master` | SHIP資産マスタ | SHIP | 673 | 中 |  |
| EST-058 | `/ship-department-master` | SHIP部門マスタ | SHIP | 411 | 中 |  |
| EST-059 | `/ship-facility-master` | SHIP施設マスタ | SHIP | 316 | 中 |  |
| EST-060 | `/vendor-master` | 業者マスタ | SHIP | 260 | 小 |  |
| EST-061 | `/quotation-data-box` | 見積データボックス（ハブ／タブ群） | 共通 | 12510 | 大 | 最大画面。タブ多数のため要分割見積 |
| EST-062 | `/quotation-data-box/asset-provisional-registration` | 資産仮登録 | 共通 | 1222 | 大 |  |
| EST-063 | `/quotation-data-box/asset-registration` | 資産登録 | 共通 | 443 | 中 |  |
| EST-064 | `/quotation-data-box/category-registration` | 区分登録 | 共通 | 234 | 小 |  |
| EST-065 | `/quotation-data-box/inspection-registration` | 点検登録 | 共通 | 475 | 中 |  |
| EST-066 | `/quotation-data-box/inspection-requests` | 点検依頼 | 共通 | 38 | 小 | スタブ（38行） |
| EST-067 | `/quotation-data-box/item-ai-matching` | 品目AIマッチング | SHIP | 378 | 中 |  |
| EST-068 | `/quotation-data-box/lending-management` | 貸出管理 | 共通 | 38 | 小 | スタブ（38行） |
| EST-069 | `/quotation-data-box/maintenance-contracts` | 保守契約管理 | 共通 | 38 | 小 | スタブ（38行） |
| EST-070 | `/quotation-data-box/ocr-confirm` | OCR確認 | 共通 | 393 | 中 |  |
| EST-071 | `/quotation-data-box/order-registration` | 発注登録 | 共通 | 1349 | 大 |  |
| EST-072 | `/quotation-data-box/price-allocation` | 金額按分 | 共通 | 291 | 小 |  |
| EST-073 | `/quotation-data-box/purchase-management` | 購買管理（検収登録） | 共通 | 754 | 中 |  |
| EST-074 | `/quotation-data-box/purchase-quotations` | 購入見積 | 共通 | 18 | 小 | スタブ（18行） |
| EST-075 | `/quotation-data-box/registration-confirm` | 登録確認 | 共通 | 309 | 中 |  |
| EST-076 | `/quotation-data-box/remodel-dashboard` | リモデルダッシュボード | 共通 | 262 | 小 |  |
| EST-077 | `/quotation-data-box/remodel-management` | リモデル管理 | 共通 | 279 | 小 |  |
| EST-078 | `/quotation-data-box/repair-requests` | 修理依頼 | 共通 | 742 | 中 |  |
| EST-079 | `/quotation-data-box/rfq-process` | 見積依頼プロセス（RFQ） | 共通 | 1265 | 大 | Ph2でOutlook連携追加 |
| EST-080 | `/quotation-data-box/transfer-management` | 移動管理 | 共通 | 36 | 小 | スタブ（36行） |

---

## 4. Ph1 → Ph2 未統合差分（統合作業の見積対象）

Ph1 リポが 2026-05-23（Ph2 分岐時点）以降に変更した画面領域。統合モックを1本化する際、これらの差分取り込みが必要になる。

**影響ルート（34領域）**:

`/asset-import` `/asset-master` `/asset-matching` `/asset-search-result` `/asset-survey-integrated` `/disposal-task` `/facility-group-management` `/facility-select` `/hospital-facility-master` `/inventory` `/lending-available` `/main` `/maintenance-quote-registration` `/maker-maintenance-result` `/permission-management` `/quotation-data-box`（＋配下 10 サブルート） `/registration-edit` `/remodel-application` `/repair-task` `/ship-asset-master` `/ship-user-management` `/survey-location` `/user-management` `/user-permission-management`

**あわせて `lib/` `components/` で 19 ファイルが変更されている**（共通部品の変更＝全画面に波及しうる）。

### 競合が想定される画面（Ph1・Ph2 双方で改修済み）

| ルート | Ph2 側の改修内容 | 対応方針 |
|---|---|---|
| `/main` | メニュー再編・実績データ検索導線追加・Ph1/Ph2 バッジ | 手動マージ必須 |
| `/login` | Microsoft SSO 風・ペルソナバッジ | 手動マージ必須 |
| `/quotation-data-box/rfq-process` | Outlook 連携（OutlookComposeModal） | 手動マージ必須 |

---

## 5. モック未実装の Ph2 画面（要追加実装）

| Sコード | 画面名 | 区分 | 状態 |
|---|---|---|---|
| **S2** | SHIP（コンサル）用ダッシュボード | 区分2 | **未実装**。`/dashboard-hospital` の対になる画面で、ペルソナ分離の肝。優先度高 |
| S10 / S11 / S12 | 不明 | — | D12-mock-plan.md（Ph1 リポのローカル `docs/ph2/`、GitHub 未push）に定義。**要提供** |

> `docs/ph2/` は Ph1 リポの GitHub には push されていないため、本セッションからは参照不可。S10〜S12 の特定には D12-mock-plan.md の内容提供が必要。

---

## 6. 共通部品リスト（1回のみ計上する対象）

見積依頼時に「これらは全画面で共有される既存資産であり、画面ごとに再実装しない」と明示するための一覧。

### 共通 UI コンポーネント

| 部品 | 用途 | 利用画面数の目安 |
|---|---|---|
| `components/ui/SearchableSelect.tsx` | 曖昧検索対応プルダウン（全フィルターの標準） | 全フィルター画面 |
| `components/search/AdvancedSearchPanel.tsx` | 高度検索ペイン（電帳法準拠） | 区分1 全画面 |
| `components/layouts/Header.tsx` / `AppHeader.tsx` / `MainLayout.tsx` | 共通ヘッダ・レイアウト | 全画面 |
| `components/ui/Modal.tsx` / `ConfirmDialog.tsx` / `Toast.tsx` / `EmptyState.tsx` | 共通ダイアログ・通知・空状態 | 全画面 |
| `components/ui/ColumnSettingsModal.tsx` | 表示カラム設定 | 一覧系全画面 |
| `components/modals/ExcelExportModal.tsx` | Excel 出力ダイアログ | 区分3 全画面 |
| `components/modals/MenuChoiceModal.tsx` | メニュー分岐モーダル | メインメニュー |
| `components/modals/OutlookComposeModal.tsx` | Outlook 連携（区分4） | RFQ 他 |
| `components/dashboard/DashboardCard.tsx` | ダッシュボードカード | S1 / S2 |

### 共通フック / ユーティリティ

| 部品 | 用途 |
|---|---|
| `lib/hooks/useAssetFilter.ts` | 階層フィルター連動（category → 大分類 → 中分類 → 品目） |
| `lib/hooks/useAssetTable.ts` | 一覧テーブル共通ロジック |
| `lib/hooks/usePermissions.ts` / `lib/utils/permissions.ts` | 権限制御 |
| `lib/hooks/useColumnFeatures.ts` | 表示カラム制御 |
| `lib/hooks/useResponsive.ts` | レスポンシブ分岐 |
| `lib/utils/excel-*.ts`（5本） | Excel 出力基盤 |
| `lib/utils/asset-hierarchy.ts` | 資産階層マスタ解決 |

### 状態管理（Zustand ストア 22本）

`applicationStore` `assetStore` `authStore` `disposalApplicationStore` `editListStore` `facilityFeatureStore` `facilityGroupStore` `hospitalFacilityStore` `individualStore` `inspectionStore` `ledgerApplicationStore` `lendingStore` `maintenanceContractStore` `masterStore` `orderStore` `purchaseApplicationStore` `quotationStore` `remodelProjectStore` `repairRequestStore` `rfqGroupStore` `userFeatureStore` `userStore`

> **見積依頼時の記載例**: 「共通部品（UIコンポーネント 9種 / フック・ユーティリティ 12種 / ストア 22本）は共通基盤として一括計上とし、各画面の見積にはその再実装を含めないこと」

---

## 7. 次のステップ

| # | ステップ | 成果物 | 状態 |
|---|---|---|---|
| 1 | 見積対象画面の棚卸 | 本書 `docs/estimation/screen-list.md` | **完了** |
| 2 | 不足画面のモック実装 | S2 SHIP用ダッシュボード ほか | 未着手 |
| 3 | 画面別 見積用仕様メモの付与 | 各画面の項目数・アクション・I/O | 未着手 |
| 4 | 見積用カタログ画面 `/ph2-estimation` の新設 | ベンダーがこれだけ見れば見積できる画面 | 未着手 |
| 5 | 共通部品カタログの整備 | §6 を画面化・根拠資料化 | 未着手 |
| 6 | 顧客 HTML ワイヤーフレームの受入れ口 | `public/wireframes/` + カタログからの参照 | 未着手 |

### 先に決める必要がある事項

1. **Ph1 / Ph2 統合の実施場所** — Ph1 リポ側に統合する方針であれば `CLAUDE.md` §0（Ph1 書込み禁止・逆流禁止）の改訂が前提
2. **S10〜S12 の特定** — D12-mock-plan.md の内容提供が必要
3. **見積対象範囲** — Ph1 由来 60 画面を見積対象に含めるか、Ph2 新規 20 画面＋統合作業のみとするか
