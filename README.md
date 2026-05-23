# 医療機器管理システム - Ph2 画面モック

## 概要

医療機器管理システム **Ph2** の画面モック（提案資料 D12 の実装）。

- **テーマ**: Ph1 で取得・管理したデータを **どう出力・どう表示するか** を提案
- **スコープ**: pptx 概要説明資料 スライド89 の Ph2 5大区分すべて
- **対象**: 顧客（SHIP / 病院）レビュー用 + 設計フェーズへの入力

## 関連リポジトリ

- **Ph1 リポ（凍結中）**: `/Users/watanaberyouta/workspace/medical-device-mgmt/`
  - 総合テスト仕様書作成中。**書込み禁止**
- **本リポ（Ph2）**: `/Users/watanaberyouta/workspace/medical-device-mgmt-ph2/`
  - 2026-05-23 に Ph1 から派生

## 技術スタック

- Next.js 16 (App Router) + React 19
- TypeScript / ESLint
- Tailwind CSS 4
- Zustand 5
- 静的書き出し（`output: 'export'`） → GitHub Pages 公開

## セットアップ

```bash
npm install
npm run dev      # ローカル開発 (http://localhost:3000)
npm run build    # 静的書き出し (out/)
```

## GitHub Pages 公開

- リポ名: `medical-device-mgmt-ph2`
- 本番 basePath: `/medical-device-mgmt-ph2`
- `.github/workflows/deploy.yml` で `main` ブランチ push 時に自動デプロイ
- 公開URL: `https://<github-user-or-org>.github.io/medical-device-mgmt-ph2/`

## ディレクトリ構成

```
app/                  # Next.js App Router の各画面
components/           # 共有コンポーネント
lib/
  ├ types/            # 型定義
  ├ stores/           # Zustand Store
  ├ data/             # 初期データ・サンプルデータ
  └ hooks/            # カスタムフック
public/               # 静的アセット
design/               # Figma 反映用（必要時に参照）
scripts/              # 開発支援スクリプト
```

## CLAUDE.md

詳細な開発ルールは `CLAUDE.md` を参照。特に重要なのは:
- **Ph1 リポは読み取りのみ。書込み禁止**
- Ph2 ドキュメントは Ph1 リポの `docs/ph2/` を正本（参照のみ）
- GitHub Pages 公開 URL を顧客へ共有可能な状態で維持

## Ph2 の主要な参照資料（Ph1 リポ内）

| 資料 | 場所 |
|---|---|
| Ph2 マスタープラン | `docs/ph2/PH2-MASTER-PLAN.md` |
| Ph2 QA表 (顧客回答取込済) | `docs/ph2/PH2-MASTER-PLAN.xlsx` Sheet4 |
| 要件定義マニュアル | `docs/ph2/requirements-manual/要件定義マニュアル.pdf` |
| 提案資料 (D11) | `docs/ph2/proposal/D11-proposal.md` |
| モック実装計画 (D12) | `docs/ph2/proposal/D12-mock-plan.md` |
| 概要説明資料 (顧客SHIP) | `docs/資産管理システム概要説明資料.pptx` |
