# Phase 5: レビュー結果の保存とシェア機能

## 1. 概要

レビュー結果を永続化し、ユニークなURLで共有できる機能を実装します。各結果には専用のOGP画像が付与され、SNSでのシェア時に魅力的な表示を実現します。

## 2. 要件

### 2.1 機能要件

- レビュー結果をユニークURLで保存・共有
- 結果ページ専用のOGP画像を表示
- 簡略版の結果ページ（「挑戦する」リンクでトップページへ遷移）
- 既存の結果画面からの「Share your result!」ボタンで結果保存

### 2.2 非機能要件

- URLは推測困難な形式（UUID v4使用）
- OGP画像の高速配信（Cloudflare R2 + CDN）
- 結果データの永続化（Cloudflare KV）
- レスポンスタイム: 500ms以内

## 3. アーキテクチャ設計

### 3.1 データストレージ

#### Cloudflare KV（結果データ）

```typescript
// Key: `result:{uuid}`
interface SavedResult {
  id: string;
  score: number;
  language: string;
  level: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  imageUrl: string;
  createdAt: number;
  locale: string;
}
```

#### Cloudflare R2（OGP画像）

すでに `generateShareImage` にて実装済。

### 3.2 URL設計

```
# 既存ルート
/                           # 言語選択（トップページ）
/:lang                      # レベル選択
/:lang/:level               # 問題・レビュー画面
/:lang/:level/result        # 評価結果画面（既存）
# 新規ルート
/results/:id                # 保存済み結果の表示ページ
```

既存のシェアボタンを押した際のアクションで、KVへの保存を行う。画像保存部分はすでに実装済。
KVへの保存後、Xへのシェアリンクを開く。

```
コードレビューゲーム powered by #CodeRabbit にて XX点を獲得しました！
言語： Flutter
レベル： 2

https://review-game.goofmint.workers.dev/results/{uuid}
```

### 3.3 データフロー

```
[評価結果画面]
    ↓ ユーザーが「Share your result!」クリック
[POST /api/results/save]
    ↓ 1. UUID生成
    ↓ 2. OGP画像生成（R2に保存）
    ↓ 3. 結果データ保存（KV）
    ↓ 4. 保存URL返却
    ↓ 5. XのシェアURLへリダイレクト
[GET /results/:id]
    ↓ 1. KVから結果データ取得
    ↓ 2. meta tagにOGP画像設定
    ↓ 3. 結果ページレンダリング
[保存済み結果ページ表示]
```

## 4. コンポーネント設計

### 4.1 新規コンポーネント

#### `SavedResultView.tsx`

保存済み結果を表示する簡略版コンポーネント

```typescript
interface SavedResultViewProps {
  result: SavedResult;
}
```

**表示内容:**
- スコア（大きく表示）
- 言語・レベル情報
- フィードバック
- 良かった点（strengths）
- 改善点（improvements）
- 「挑戦する」ボタン（→ トップページ）

**表示しない要素:**
- Next Level ボタン
- Try Again ボタン
- Back to Level Selection ボタン
- Back to Language Selection ボタン
- Share your result! ボタン（既に保存済みのため）

#### `ShareResultButton.tsx`

結果保存・シェアボタンコンポーネント

```typescript
interface ShareResultButtonProps {
  result: EvaluationResult;
  language: string;
  level: number;
}
```

**機能:**
- クリックで結果保存API呼び出し
- 保存完了後、URLをクリップボードにコピー
- トースト通知でフィードバック
- Web Share API対応（モバイル）

### 4.2 既存コンポーネントの修正

#### `ResultView.tsx`

- `ShareResultButton` コンポーネントを追加
- 既存のShareボタンを置き換え

## 5. API設計

### 5.1 結果保存API

**エンドポイント:** `POST /api/results/save`

**リクエスト:**
```typescript
{
  score: number;
  language: string;
  level: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}
```

**レスポンス:**
```typescript
{
  id: string;          // UUID
  url: string;         // 結果ページのURL
  imageUrl: string;    // OGP画像のURL
}
```

**処理フロー:**
1. UUID v4生成
2. OGP画像生成・R2アップロード
3. 結果データをKVに保存（TTL: 1年）
4. 保存URLを返却

### 5.2 結果取得API

**エンドポイント:** `GET /results/:id`

**処理フロー:**
1. KVから `result:{id}` 取得
2. 存在しない場合は404
3. OGP meta tagを設定
4. SavedResultViewをレンダリング

**OGP meta tag:**
```html
<meta property="og:title" content="Code Review Game - {score}点獲得！" />
<meta property="og:description" content="{language} Level {level}" />
<meta property="og:image" content="{imageUrl}" />
<meta property="og:url" content="{resultUrl}" />
<meta name="twitter:card" content="summary_large_image" />
```

## 6. OGP画像生成仕様

### 6.1 画像デザイン

既存のシェア画像生成ロジック（`app/utils/imageGenerator.ts`）を再利用

### 6.2 生成タイミング

結果保存API呼び出し時に生成し、R2に保存（実装済）

## 7. データ構造

### 7.1 KVキー構造

```
result:{uuid}  → SavedResult object
```

### 7.2 R2ファイル構造

実装済。

## 8. セキュリティ考慮事項

### 8.1 UUID生成

- UUID v4使用（推測困難）
- 暗号学的に安全な乱数生成器使用

### 8.2 レート制限

- IP単位: 10リクエスト/分
- Cloudflare Workers の Rate Limiting API使用

### 8.3 入力バリデーション

- スコア: 0-100の整数
- 言語: 許可リスト検証
- レベル: 1以上の整数
- フィードバック・strengths・improvements: XSS対策（エスケープ）

### 8.4 アクセス制御

- 結果ページ: 誰でもアクセス可能（URLを知っている場合）
- 削除機能なし

## 9. パフォーマンス最適化

### 9.1 キャッシング戦略

**OGP画像:**
- Cloudflare CDN経由で配信
- Cache-Control: max-age=31536000（1年）
- Immutable指定

**結果データ:**
- KVから直接取得（エッジでキャッシュ）
- SSRでレンダリング

### 9.2 画像最適化

- PNG形式（高品質）
- サイズ: 1200x630px（最適サイズ）
- 圧縮レベル: 中程度

## 10. エラーハンドリング

### 10.1 結果保存エラー

- KV書き込み失敗 → 503 Service Unavailable
- R2アップロード失敗 → リトライ3回、失敗時503
- UUID衝突 → 再生成（最大3回）

### 10.2 結果取得エラー

- 存在しないID → 404 Not Found
- KV取得失敗 → 503 Service Unavailable
- 画像取得失敗 → フォールバック画像表示

### 10.3 ユーザーフィードバック

- トースト通知でエラー表示
- リトライボタン提供
- エラーメッセージは日本語・英語対応（i18n）

## 11. テスト戦略

### 11.1 単体テスト

- UUID生成関数
- 結果データバリデーション
- OGP画像生成ロジック

### 11.2 統合テスト

- 結果保存API（正常系・異常系）
- 結果取得（存在する/しない）
- OGP画像取得

### 11.3 E2Eテスト

- 結果画面で「Share」クリック → URL生成
- 生成されたURLにアクセス → 結果表示
- OGP画像がX/Twitter等で正しく表示

## 12. 実装順序

### Step 1: データストレージセットアップ
- `wrangler.jsonc` にKVバインディング追加
- R2バケット設定確認

### Step 2: 結果保存API実装
- `app/routes/api.results.save.tsx` 作成
- UUID生成ロジック
- KV保存ロジック
- OGP画像生成・R2アップロード

### Step 3: 結果ページ実装
- `app/routes/results.$id.tsx` 作成
- `SavedResultView.tsx` コンポーネント作成
- OGP meta tag設定

### Step 4: 既存画面への統合
- `ShareResultButton.tsx` コンポーネント作成
- `ResultView.tsx` に統合

### Step 5: エラーハンドリング・バリデーション
- 入力バリデーション追加
- エラーハンドリング実装
- トースト通知実装

### Step 6: テスト実装
- 単体テスト
- 統合テスト
- E2Eテスト

### Step 7: パフォーマンス最適化
- キャッシュヘッダー設定
- 画像圧縮最適化

## 13. 設定変更

### 13.1 `wrangler.jsonc`

```jsonc
{
  // 既存設定...

  "kv_namespaces": [
    {
      "binding": "REVIEW_RESULTS",
      "id": "your-kv-namespace-id",
      "preview_id": "your-preview-kv-namespace-id"
    }
  ],

  "r2_buckets": [
    {
      "binding": "SHARE_IMAGES",
      "bucket_name": "review-game-share-images",
      "preview_bucket_name": "review-game-share-images-preview"
    }
  ]
}
```

### 13.2 環境変数

```bash
# .dev.vars
BASE_URL=http://localhost:5173
R2_PUBLIC_URL=https://your-r2-public-url.com
```

## 14. モニタリング・運用

### 14.1 メトリクス

- 結果保存成功率
- 結果ページアクセス数
- OGP画像配信数
- API応答時間

### 14.2 ログ

- 結果保存時: ID、言語、レベル、スコア
- エラー発生時: エラー内容、スタックトレース
- パフォーマンス: API処理時間

### 14.3 アラート

- KV書き込み失敗率 > 5%
- R2アップロード失敗率 > 5%
- API応答時間 > 1秒

## 15. 将来の拡張性

### 15.1 機能拡張案

- 結果削除機能（ユーザー本人のみ）
- 結果一覧ページ（人気の結果）
- ランキング機能
- コメント機能

### 15.2 技術的拡張

- KVからDurable Objectsへの移行（リアルタイム更新）
- 画像フォーマット最適化（WebP対応）
- 多言語OGP画像対応

## 16. リリース計画

### 16.1 段階的リリース

1. **Beta版（開発環境）**
   - 基本機能のテスト
   - パフォーマンス検証

2. **Preview版（プレビュー環境）**
   - 実データでのテスト
   - OGP画像の表示確認（X/Twitter等）

3. **本番リリース**
   - 段階的ロールアウト（10% → 50% → 100%）
   - モニタリング強化

### 16.2 ロールバック計画

- KVへの書き込みエラー時: 旧機能にフォールバック
- 画像生成失敗時: デフォルト画像使用
- 完全なロールバック: 環境変数でフィーチャーフラグ制御

## 17. 参考資料

- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [UUID RFC 4122](https://tools.ietf.org/html/rfc4122)
