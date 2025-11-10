# クイックスタートガイド

最速でCloudflare Pagesにデプロイする手順です。

## 🚀 5分でデプロイ

### ステップ1: Cloudflare情報を取得

```bash
# 1. Cloudflareにログイン
npx wrangler login

# 2. Account IDを確認
npx wrangler whoami
```

**以下をメモ：**
- Account ID: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### ステップ2: API Tokenを作成

1. https://dash.cloudflare.com/profile/api-tokens にアクセス
2. **Create Token** → **Edit Cloudflare Workers** テンプレートを選択
3. Token をコピー（一度しか表示されません！）

### ステップ3: GitHubシークレットを設定

GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** で以下を追加：

```
CLOUDFLARE_ACCOUNT_ID = あなたのAccount ID
CLOUDFLARE_API_TOKEN = 作成したAPI Token
```

### ステップ4: 初回デプロイ（ローカルから）

```bash
# ビルド
npm install
npm run build

# Cloudflare Pagesプロジェクトを作成
npx wrangler pages deploy build/client --project-name=review-game
```

### ステップ5: コードをプッシュ

```bash
git add .
git commit -m "Setup deployment"
git push origin main
```

これで完了！GitHub Actionsが自動的にデプロイします。

---

## 📦 次にやること

### LLM連携を有効化

Cloudflareダッシュボード → **Workers & Pages** → **review-game** → **Settings** → **Environment variables**

```
LLM_API_KEY = your_openai_or_anthropic_key
GAME_URL = https://review-game.pages.dev
```

### R2バケットを設定（シェア機能用）

```bash
# R2バケットを作成
npx wrangler r2 bucket create review-game-share-images

# 公開アクセスを有効化（ダッシュボードから）
```

詳細は **DEPLOYMENT.md** を参照してください。

---

## 🔍 デプロイ確認

- GitHub Actions: https://github.com/あなたのユーザー名/ReviewGame/actions
- Cloudflare: https://dash.cloudflare.com/ → Workers & Pages → review-game
- デプロイURL: https://review-game.pages.dev

---

## ❓ トラブル時

```bash
# ローカルでビルドテスト
npm run build

# ローカルで動作確認
npm run start

# 型チェック
npm run typecheck

# テスト実行
npm run test
```

それでも解決しない場合は **DEPLOYMENT.md** の「トラブルシューティング」セクションを参照してください。
