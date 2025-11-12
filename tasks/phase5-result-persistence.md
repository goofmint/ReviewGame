# Phase 5: レビュー結果の永続化とシェア機能の強化 - 詳細設計

## 概要

Phase 5では、レビュー結果をCloudflare KVに永続保存し、ユニークなURLでアクセスできるようにします。
また、OGP対応によりSNSでのシェア時に画像とメタ情報が表示されるようにします。

## 目次

1. [データ構造](#データ構造)
2. [API仕様](#api仕様)
3. [ルート設計](#ルート設計)
4. [KV操作](#kv操作)
5. [国際化対応](#国際化対応)
6. [セキュリティ](#セキュリティ)

---

## データ構造

### SavedResult型

```typescript
interface SavedResult {
  id: string;               // UUID v4（URLパスとKVキーに直接使用）
  score: number;            // 0-100
  language: string;         // プログラミング言語
  level: number;            // レベル番号
  feedback: string;         // LLMフィードバック
  strengths: string[];      // 良かった点
  improvements: string[];   // 改善点
  imageUrl: string;         // OG画像のR2 URL
  timestamp: number;        // UNIX timestamp（ミリ秒）
  createdAt: string;        // ISO 8601形式の日時
}
```

### SaveResultRequest型

```typescript
interface SaveResultRequest {
  score: number;
  language: string;
  level: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  imageUrl: string;
}
```

### SaveResultResponse型

```typescript
interface SaveResultResponse {
  success: boolean;
  resultId: string;         // 生成されたUUID
  resultUrl: string;        // 結果ページのURL
}
```

---

## API仕様

### POST /api/save-result

レビュー結果を保存して、ユニークなURLを生成します。

#### リクエスト

**エンドポイント**: `POST /api/save-result`

**Content-Type**: `application/json`

**ボディ**:
```typescript
{
  score: number;           // 0-100の整数
  language: string;        // "javascript" | "python" | "flutter"
  level: number;           // 1以上の整数
  feedback: string;        // 最大5000文字
  strengths: string[];     // 配列、各要素最大500文字
  improvements: string[];  // 配列、各要素最大500文字
  imageUrl: string;        // R2画像のURL（HTTPSのみ）
}
```

#### バリデーション

- **score**: 0〜100の整数
- **language**: 許可されたリスト（`problems.ts`の`availableLanguages`から取得）
- **level**: 1以上の整数
- **feedback**: 空でない文字列、5000文字以内
- **strengths**: 配列、1〜10要素、各要素500文字以内
- **improvements**: 配列、1〜10要素、各要素500文字以内
- **imageUrl**: 有効なHTTPS URL、R2ドメインのみ許可

#### レスポンス

**成功時 (200 OK)**:
```typescript
{
  success: true,
  resultId: string,        // UUID v4
  resultUrl: string        // 完全なURL（例: https://example.com/result/uuid）
}
```

**エラー時**:
- `400 Bad Request`: バリデーションエラー
  ```typescript
  { error: string }
  ```
- `500 Internal Server Error`: KV書き込みエラー
  ```typescript
  { error: string }
  ```

#### 処理フロー

1. リクエストボディをバリデーション
2. UUID v4を生成
3. `SavedResult`オブジェクトを作成（タイムスタンプ付与）
4. Cloudflare KVに保存（キー: UUID、値: JSON文字列、有効期限: なし）
5. 結果URLを生成して返却

---

## ルート設計

### GET /result/:id

保存されたレビュー結果を表示します。

#### URLパラメータ

- **id**: UUID v4形式の文字列
  - パターン: `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

#### レスポンス

**成功時 (200 OK)**:
- HTML: 結果表示ページ
- データ: `SavedResult`型のJSON

**エラー時**:
- `404 Not Found`: UUIDが無効、またはKVにデータが存在しない

#### OGPメタタグ

結果ページには以下のOGPタグを動的に設定します：

```typescript
{
  title: `Code Review Game - ${score}点獲得！`,
  "og:title": `Code Review Game - ${score}点獲得！`,
  "og:description": `${language} Level ${level}でスコア${score}点を獲得しました`,
  "og:image": imageUrl,
  "og:url": `https://example.com/result/${id}`,
  "og:type": "website",
  "twitter:card": "summary_large_image",
  "twitter:image": imageUrl,
  "twitter:title": `Code Review Game - ${score}点獲得！`,
  "twitter:description": `${language} Level ${level}でスコア${score}点を獲得`
}
```

#### UI要素

結果ページには以下の要素を表示します：

**含む要素**:
- スコア表示（大きく中央）
- 言語とレベル
- フィードバックテキスト
- 良かった点（リスト）
- 改善点（リスト）
- 「挑戦する」リンク（トップページ `/` へ遷移）

**含まない要素**:
- Next Level ボタン
- Try Again ボタン
- Share your result! セクション
- Share ボタン
- Back to Level Selection リンク
- Back to Language Selection リンク

---

## KV操作

### キー命名規則

- **形式**: UUIDをそのまま使用（プレフィックスなし）
- **例**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### 保存

```typescript
interface KVPutOptions {
  // 有効期限なし（永続保存）
}

// 実装イメージ
await RESULTS_KV.put(uuid, JSON.stringify(savedResult));
```

### 取得

```typescript
// 実装イメージ
const resultJson = await RESULTS_KV.get(uuid);
if (resultJson) {
  const result: SavedResult = JSON.parse(resultJson);
}
```

### エラーハンドリング

```typescript
try {
  await RESULTS_KV.put(uuid, value);
} catch (error) {
  console.error('KV put error:', error);
  // 500エラーを返却
}
```

### キャッシング

- Cloudflare Workers KVは自動的にエッジでキャッシュされる
- 追加のキャッシング設定は不要
- 読み取りは高速（エッジロケーション）
- 書き込みは最終的一貫性（eventual consistency）

---

## 国際化対応

### 翻訳が必要な要素

結果ページの以下の要素を多言語対応します：

#### 日本語 (ja)

```typescript
{
  result: {
    title: "Code Review Game - {score}点獲得！",
    score: "{score}点",
    feedback: "フィードバック",
    strengths: "良かった点",
    improvements: "改善点",
    challenge: "挑戦する",
    notFound: "結果が見つかりませんでした"
  }
}
```

#### 英語 (en)

```typescript
{
  result: {
    title: "Code Review Game - {score} points!",
    score: "{score} points",
    feedback: "Feedback",
    strengths: "Strengths",
    improvements: "Improvements",
    challenge: "Start Challenge",
    notFound: "Result not found"
  }
}
```

### i18n実装方針

- 既存の`app/i18n.ts`設定を活用
- `app/locales/ja.ts`と`app/locales/en.ts`に翻訳を追加
- ブラウザの言語設定に応じて表示言語を自動切り替え
- `useTranslation()`フックで翻訳文字列を取得

### OGPタグの言語

**選択肢1**: 常に日本語で固定
- シェア先が主に日本のユーザー想定の場合

**選択肢2**: ユーザーの言語設定に応じて動的生成
- グローバル展開を想定する場合
- loaderでユーザーの言語を検出し、適切な言語のOGPタグを生成

---

## セキュリティ

### データ保護

- **個人情報**: 一切含まない（ゲームの評価結果のみ）
- **ユーザー識別情報**: 保存しない
- **IPアドレス**: 記録しない

### バリデーション

#### 入力検証

- スコア範囲チェック（0〜100）
- 言語の許可リスト確認
- レベル範囲チェック（1以上）
- 文字列長制限
- 配列要素数制限
- URL形式検証（HTTPS、R2ドメイン）

#### UUID検証

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!id || !UUID_REGEX.test(id)) {
  throw new Response('Not Found', { status: 404 });
}
```

### XSS対策

- Reactのデフォルトエスケープ機能を活用
- フィードバックテキストのサニタイゼーション
- ユーザー入力を直接HTMLに挿入しない

### データサイズ制限

- 合計サイズ: 最大10KB程度
- feedback: 最大5000文字
- strengths/improvements: 各要素最大500文字

### UUID生成

- UUID v4を使用（暗号学的に安全な乱数生成）
- 推測不可能性を確保
- 衝突の可能性は極めて低い

---

## 実装チェックリスト

### バックエンド

- [ ] `app/types/result.ts`にデータ型を定義
- [ ] `app/routes/api.save-result.tsx`を実装
- [ ] `app/routes/result.$id.tsx`を実装
- [ ] バリデーション関数を実装
- [ ] KV操作のエラーハンドリング
- [ ] UUID生成ユーティリティ

### フロントエンド

- [ ] 結果ページのUIコンポーネント実装
- [ ] i18n翻訳の追加（ja/en）
- [ ] OGPメタタグの動的生成
- [ ] 404エラーページの対応

### インフラ

- [ ] `wrangler.toml`にKVバインディング追加
- [ ] Cloudflare KV namespaceの作成
- [ ] 本番環境とプレビュー環境の設定

### テスト

- [ ] 結果保存APIのテスト
- [ ] 結果表示ページのテスト
- [ ] バリデーションのテスト
- [ ] UUID検証のテスト
- [ ] 国際化のテスト
- [ ] OGPタグの確認

### 統合

- [ ] ShareButtonから結果保存APIを呼び出し
- [ ] 保存成功後に結果URLを使用
- [ ] ツイートテキストに結果URLを含める
- [ ] エラー時のフォールバック処理

---

## 環境設定

### wrangler.toml

```toml
# Phase 5: 結果保存用のKVバインディング
[[kv_namespaces]]
binding = "RESULTS_KV"
id = "your-kv-namespace-id"              # 本番環境のKV ID
preview_id = "your-preview-kv-namespace-id"  # プレビュー環境のKV ID
```

### KV namespace作成コマンド

```bash
# 本番環境
wrangler kv:namespace create "RESULTS_KV"

# プレビュー環境
wrangler kv:namespace create "RESULTS_KV" --preview
```

---

## 今後の拡張

### オプション機能

1. **結果の検索機能**
   - スコア順、日付順でのソート
   - 言語・レベルでのフィルタリング

2. **結果の統計情報**
   - 全体の平均スコア
   - 言語別・レベル別の平均

3. **結果の削除機能**
   - ユーザーによる削除要求
   - 管理者による削除

4. **結果の有効期限**
   - 古い結果の自動削除（例: 90日後）
   - KVのストレージコスト削減

5. **結果のアーカイブ**
   - R2への長期保存
   - KVからR2への移行
