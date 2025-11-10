# ReviewGame

コードレビューのスキルを楽しく学習できるゲーム形式のWebアプリケーション。

## 🎮 概要

様々なプログラミング言語のコードに対してレビューを行い、AI（LLM）による評価を受けて得点を獲得し、レベルアップしていくゲームです。

**対応言語:**
- JavaScript
- Python
- Flutter (Dart)

## 🚀 クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーを起動
npm run dev
```

http://localhost:5173 でアプリケーションにアクセスできます。

## 📚 ドキュメント

- **[クイックスタート](QUICKSTART.md)** - 5分でCloudflareにデプロイ
- **[デプロイメントガイド](DEPLOYMENT.md)** - 詳細なデプロイ手順
- **[設計書](CLAUDE.md)** - プロジェクトの基本設計

## 🛠️ 技術スタック

- **Framework**: Remix
- **Runtime**: Cloudflare Workers
- **Hosting**: Cloudflare Pages
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **AI**: LLM (OpenAI/Anthropic)
- **Storage**: Cloudflare R2

## 📦 スクリプト

```bash
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run start      # ローカルでプレビュー
npm run typecheck  # 型チェック
npm run test       # テスト実行
```

## 🎯 機能

- ✅ 言語選択（JavaScript, Python, Flutter）
- ✅ レベル別の問題
- ✅ AIによるレビュー評価
- ✅ スコアリングとフィードバック
- ✅ 進捗管理（ローカルストレージ）
- 🔄 シェア機能（実装予定）

## 📝 新しい問題の追加

`problems/`ディレクトリにMarkdownファイルを追加するだけで、自動的に問題が追加されます。

```markdown
---
title: "レベル1: 基本的なバグ発見"
difficulty: 1
language: javascript
---

# 要件
...

# コード
...
```

## 🚀 デプロイ

GitHub Actionsで自動デプロイが設定されています。

詳細は [QUICKSTART.md](QUICKSTART.md) または [DEPLOYMENT.md](DEPLOYMENT.md) を参照してください。

## 📄 ライセンス

MIT
