# Cloudflare Pages デプロイ手順

このドキュメントでは、GitHub ActionsでReview GameをCloudflare Pagesにデプロイする手順を説明します。

## 前提条件

- Cloudflareアカウント（無料プランでOK）
- GitHubリポジトリ
- Node.js 20以上がローカルにインストール済み

---

## 1. Cloudflareアカウントの設定

### 1.1 Cloudflareアカウントの作成
1. [Cloudflare](https://dash.cloudflare.com/sign-up)でアカウントを作成
2. ダッシュボードにログイン

### 1.2 Account IDの取得
1. Cloudflareダッシュボードの右側にある**Account ID**をコピー
2. または、URL `https://dash.cloudflare.com/<YOUR_ACCOUNT_ID>` から確認できます

### 1.3 API Tokenの作成
1. Cloudflareダッシュボードで **My Profile** → **API Tokens** に移動
2. **Create Token** をクリック
3. **Edit Cloudflare Workers** テンプレートを使用、または以下の権限でカスタムトークンを作成：
   - **Account** - **Cloudflare Pages** - **Edit**
4. トークンを作成し、安全な場所にコピー（一度しか表示されません）

---

## 2. Cloudflare Pagesプロジェクトの作成

### 2.1 プロジェクトの初期化
最初のデプロイをローカルから実行して、Cloudflare Pagesプロジェクトを作成します。

```bash
# 依存関係のインストール
npm install

# ビルド
npm run build

# Wranglerでログイン
npx wrangler login

# Pagesプロジェクトを作成してデプロイ
npx wrangler pages deploy build/client --project-name=review-game
```

> **注意**: プロジェクト名は`wrangler.toml`の`name`と一致させてください。

---

## 3. GitHubシークレットの設定

### 3.1 リポジトリのSecretsに追加
1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリックして以下を追加：

#### CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: CloudflareダッシュボードからコピーしたAccount ID

#### CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: 先ほど作成したAPI Token

---

## 4. GitHub Actionsワークフローの確認

`.github/workflows/deploy.yml` ファイルが正しく配置されているか確認します。

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    name: Deploy to Cloudflare Pages
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm run test

      - name: Build problems data
        run: npm run prebuild

      - name: Build application
        run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: review-game
          directory: build/client
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.head_ref || github.ref_name }}
```

---

## 5. デプロイの実行

### 5.1 自動デプロイ（推奨）
1. コードをコミットして`main`ブランチにプッシュ
   ```bash
   git add .
   git commit -m "Setup GitHub Actions deployment"
   git push origin main
   ```

2. GitHub Actionsが自動的に実行されます
3. **Actions** タブで進行状況を確認

### 5.2 手動デプロイ（ローカルから）
緊急時やテスト時にローカルからデプロイする場合：

```bash
# ビルド
npm run build

# デプロイ
npx wrangler pages deploy build/client --project-name=review-game
```

---

## 6. 環境変数の設定（オプション）

LLM APIやR2バケットを使用する場合、Cloudflare Pages側で環境変数を設定します。

### 6.1 Cloudflareダッシュボードから設定
1. Cloudflareダッシュボード → **Workers & Pages** → **review-game** に移動
2. **Settings** → **Environment variables** をクリック
3. 以下の環境変数を追加：

#### Production環境
- `LLM_API_KEY`: LLM APIのキー（例：OpenAI、Anthropic）
- `R2_PUBLIC_URL`: R2バケットの公開URL
- `GAME_URL`: 本番環境のURL（例：https://review-game.pages.dev）

#### Preview環境（オプション）
同様にPreview環境用の変数を設定できます。

---

## 7. R2バケットの設定（シェア画像機能用）

### 7.1 R2バケットの作成
1. Cloudflareダッシュボード → **R2** に移動
2. **Create bucket** をクリック
3. バケット名：`review-game-share-images`
4. ロケーション：自動選択でOK

### 7.2 公開アクセスの設定
1. 作成したバケットをクリック
2. **Settings** → **Public access** を有効化
3. **Public bucket URL**をコピー（例：https://pub-xxx.r2.dev）
4. この URLを`R2_PUBLIC_URL`環境変数に設定

### 7.3 wrangler.tomlにバインディング追加
```toml
[[r2_buckets]]
binding = "SHARE_IMAGES"
bucket_name = "review-game-share-images"
preview_bucket_name = "review-game-share-images-preview"
```

---

## 8. デプロイ後の確認

### 8.1 デプロイURLの確認
1. GitHub Actionsの実行ログから、またはCloudflareダッシュボードからデプロイURLを確認
2. デフォルトURL：`https://review-game.pages.dev`
3. カスタムドメインの設定も可能

### 8.2 動作確認
- [ ] トップページ（言語選択）が表示される
- [ ] レベル選択画面に遷移できる
- [ ] 問題が表示される
- [ ] レビュー送信が動作する
- [ ] 結果画面が表示される

---

## 9. トラブルシューティング

### デプロイが失敗する場合

#### ケース1: API Tokenのエラー
```
Error: Authentication error
```
- CLOUDFLARE_API_TOKENが正しく設定されているか確認
- トークンの権限（Cloudflare Pages - Edit）を確認

#### ケース2: プロジェクトが見つからない
```
Error: Project not found
```
- Cloudflare Pagesでプロジェクトが作成されているか確認
- `projectName`が正しいか確認（wrangler.tomlのnameと一致）

#### ケース3: ビルドエラー
```
Error: Build failed
```
- ローカルで`npm run build`が成功するか確認
- Node.jsのバージョンを確認（20以上必要）
- `problems/`ディレクトリに問題ファイルが存在するか確認

### ログの確認方法
1. GitHub Actions: **Actions** タブ → 失敗したワークフローをクリック
2. Cloudflare: **Workers & Pages** → **review-game** → **Deployments** → ログを確認

---

## 10. カスタムドメインの設定（オプション）

### 10.1 カスタムドメインの追加
1. Cloudflareダッシュボード → **Workers & Pages** → **review-game**
2. **Custom domains** → **Set up a custom domain**
3. ドメイン名を入力（例：review-game.example.com）
4. DNS設定が自動的に追加されます

### 10.2 SSL/TLS設定
- CloudflareがSSL証明書を自動発行します
- HTTPSが自動的に有効化されます

---

## 11. プレビューデプロイ（Pull Request）

Pull Requestを作成すると、自動的にプレビュー環境がデプロイされます。

1. ブランチを作成してPull Requestを開く
2. GitHub Actionsが自動実行
3. プレビューURLがPRのコメントに表示されます
4. 変更内容を本番環境に影響を与えずにテスト可能

---

## 12. 継続的デプロイのフロー

```
┌──────────────┐
│ コード変更    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ git push     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ GitHub Actions起動   │
│ - Type check         │
│ - Tests              │
│ - Build              │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Cloudflare Pages     │
│ デプロイ             │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 本番環境に反映       │
│ https://review-game  │
│   .pages.dev         │
└──────────────────────┘
```

---

## まとめ

これでGitHub ActionsによるCloudflare Pagesへの自動デプロイが完了しました！

**次のステップ：**
1. コードをプッシュして自動デプロイを確認
2. 環境変数を設定してLLM連携を有効化
3. R2バケットを設定してシェア機能を有効化
4. カスタムドメインを設定（オプション）

**参考リンク：**
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions for Cloudflare Pages](https://github.com/cloudflare/pages-action)
