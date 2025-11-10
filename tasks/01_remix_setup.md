# タスク01: Remixプロジェクトのセットアップ

## 概要
Cloudflare Workers上で動作するRemixプロジェクトの基本構成を構築する。

## 目的
- Remix + TypeScript + Tailwind CSSの開発環境を整備
- Cloudflare Workersへのデプロイ設定を完了
- 基本的なルーティング構造を確立

## プロジェクト構成

```
ReviewGame/
├── app/
│   ├── routes/
│   │   └── _index.tsx          # トップページ（言語選択）
│   ├── components/             # 共通コンポーネント
│   ├── utils/                  # ユーティリティ関数
│   ├── types/                  # 型定義
│   ├── data/                   # データファイル
│   ├── styles/                 # グローバルスタイル
│   ├── entry.client.tsx
│   ├── entry.server.tsx
│   └── root.tsx
├── public/
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── wrangler.toml
```

## 必要なパッケージ

```typescript
// package.json の依存関係
interface Dependencies {
  "@remix-run/cloudflare": string;
  "@remix-run/react": string;
  "react": string;
  "react-dom": string;
}

interface DevDependencies {
  "@remix-run/dev": string;
  "@types/react": string;
  "@types/react-dom": string;
  "typescript": string;
  "tailwindcss": string;
  "vite": string;
  "wrangler": string;
}
```

## 設定ファイル

### wrangler.toml
Cloudflare Workers の設定。互換性日付、ルートファイル、環境変数のバインディングを定義。

### vite.config.ts
Remix プラグインの設定。Cloudflare Workers向けのサーバープリセットを指定。

### tailwind.config.ts
Tailwind CSSの設定。コンテンツパスに `./app/**/*.{ts,tsx}` を指定。

### tsconfig.json
TypeScript設定。`strict: true`、パスエイリアス `~/*` を `./app/*` にマッピング。

## ルートコンポーネント

```typescript
// app/root.tsx
interface RootLayoutProps {
  children: React.ReactNode;
}

// HTMLドキュメント構造を定義
// Tailwind CSSの読み込み
// メタタグ、リンクタグの設定
// エラーバウンダリの実装
```

## 開発コマンド

```json
{
  "scripts": {
    "dev": "remix vite:dev",
    "build": "remix vite:build",
    "preview": "wrangler pages dev",
    "deploy": "wrangler pages deploy ./build/client",
    "typecheck": "tsc"
  }
}
```

## 実装の注意点

1. **Cloudflare Workers互換性**: Node.js標準ライブラリは使用不可。Cloudflare互換のAPIのみ使用
2. **バンドルサイズ**: Workers の1MBサイズ制限に注意
3. **環境変数**: wrangler.toml で定義し、`context.env` 経由でアクセス
4. **型安全性**: すべてのコンポーネントとユーティリティで厳密な型定義を適用

## 検証項目

- [ ] `npm run dev` でローカル開発サーバーが起動
- [ ] `npm run build` でエラーなくビルド完了
- [ ] `npm run preview` でWorkers環境でのプレビューが動作
- [ ] TypeScriptの型チェックがパス
- [ ] Tailwind CSSのスタイルが適用される
