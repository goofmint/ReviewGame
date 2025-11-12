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
  language: string;         // プログラミング言語（"javascript" | "python" | "flutter"）
  level: number;            // レベル番号
  locale: string;           // 表示言語（"ja" | "en"）- 保存時のロケールを記録
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
  language: string;         // プログラミング言語
  level: number;
  locale: string;           // 保存時のロケール（"ja" | "en"）
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

**重要**: このAPIは直接fetch()で呼ぶのではなく、**`useFetcher()`** を使用して呼び出します。

#### リクエスト

**エンドポイント**: `POST /api/save-result`

**Content-Type**: `application/json`

**呼び出し方法**: `useFetcher()` を使用

**ボディ**:
```typescript
{
  score: number;           // 0-100の整数
  language: string;        // "javascript" | "python" | "flutter"
  level: number;           // 1以上の整数
  locale: string;          // "ja" | "en" - 保存時のロケール
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
- **locale**: "ja" または "en"
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

#### useFetcherでの呼び出し例

```typescript
// クライアントサイド（例：ShareButtonコンポーネント）
import { useFetcher } from '@remix-run/react';

const fetcher = useFetcher<SaveResultResponse>();

// 結果を保存
const saveResult = async (data: SaveResultRequest) => {
  fetcher.submit(
    data,
    {
      method: 'POST',
      action: '/api/save-result',
      encType: 'application/json'
    }
  );
};

// レスポンスの処理
useEffect(() => {
  if (fetcher.data?.success) {
    const { resultUrl } = fetcher.data;
    // resultUrlを使ってXシェア
  }
}, [fetcher.data]);
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

**重要**:
- URLには**ロケールを含めません**（`/:locale/result/:id` ではなく `/result/:id`）
- 結果ページの表示言語は**保存時の言語で固定**
- ユーザーによる言語切り替えは不要

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

### 基本方針

結果ページは**保存時の言語で固定表示**します：

- **翻訳は不要**: 日本語で挑戦した場合は日本語のみ、英語で挑戦した場合は英語のみ表示
- **URLにロケールなし**: `/result/:id`（`/:locale/result/:id`ではない）
- **言語切り替えなし**: ユーザーによる言語切り替え機能は提供しない

### 保存時の言語の記録

```typescript
interface SavedResult {
  // ...
  locale: string;  // "ja" | "en" - 保存時のロケールを記録
  // ...
}
```

### 表示時の処理

1. KVから`SavedResult`を取得
2. `locale`フィールドを読み取り
3. そのロケールで固定表示（`i18n.changeLanguage(result.locale)`）
4. UIテキストは既存のi18n設定を使用

### 必要な翻訳リソース

既存の翻訳リソースを活用：

```typescript
// app/locales/ja.ts
{
  result: {
    title: "Code Review Game - {score}点獲得！",
    feedback: "フィードバック",
    strengths: "良かった点",
    improvements: "改善点",
    challenge: "挑戦する",
    notFound: "結果が見つかりませんでした"
  }
}

// app/locales/en.ts
{
  result: {
    title: "Code Review Game - {score} points!",
    feedback: "Feedback",
    strengths: "Strengths",
    improvements: "Improvements",
    challenge: "Start Challenge",
    notFound: "Result not found"
  }
}
```

### OGPタグの言語

OGPタグも**保存時の言語で固定**：

```typescript
// loaderで取得したlocaleに基づいてOGPタグを生成
const ogTitle = locale === 'ja'
  ? `Code Review Game - ${score}点獲得！`
  : `Code Review Game - ${score} points!`;
```

---

## セキュリティ

### データ保護

- **個人情報**: 一切含まない（ゲームの評価結果のみ）
- **ユーザー識別情報**: 保存しない
- **IPアドレス**: 記録しない

### レート制限

**実装方法**: KVベースの固定ウィンドウカウンター

#### 仕様
- **制限**: 5リクエスト/分（IPアドレスベース）
- **KVキー**: `ratelimit:save-result:${ipAddress}`
- **TTL**: 60秒
- **カウント方法**: インクリメント＋TTL設定

#### 実装例

```typescript
// app/utils/rateLimit.ts
interface RateLimitConfig {
  limit: number;           // 最大リクエスト数
  windowSeconds: number;   // 時間ウィンドウ（秒）
}

async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= config.limit) {
    return { allowed: false, remaining: 0 };
  }

  // インクリメント
  await kv.put(key, (count + 1).toString(), {
    expirationTtl: config.windowSeconds
  });

  return { allowed: true, remaining: config.limit - count - 1 };
}

// 使用例（api.save-result.tsxで）
const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
const rateLimitKey = `ratelimit:save-result:${clientIp}`;
const rateLimitConfig = { limit: 5, windowSeconds: 60 };

const { allowed, remaining } = await checkRateLimit(
  context.env.RESULTS_KV,
  rateLimitKey,
  rateLimitConfig
);

if (!allowed) {
  return json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0'
      }
    }
  );
}
```

#### 考慮事項
- **Eventual Consistency**: KVは最終的一貫性のため、完全な保証はできない
- **代替案**: より厳密な制限が必要な場合はDurable Objectsを使用
- **IP取得**: Cloudflareの`CF-Connecting-IP`ヘッダーを使用

### XSS対策

**実装方法**: サーバーサイドでのサニタイゼーション + Reactのデフォルトエスケープ

#### 使用ライブラリ
- **サーバーサイド**: `sanitize-html` (npm package)
- **バージョン**: `^2.11.0` 以上
- **インストール**: `npm install sanitize-html @types/sanitize-html`

#### サニタイゼーション対象フィールド
- `feedback`
- `strengths`（配列の各要素）
- `improvements`（配列の各要素）

#### 実装例

```typescript
// app/utils/sanitize.ts
import sanitizeHtml from 'sanitize-html';

interface SanitizeOptions {
  allowedTags: string[];
  allowedAttributes: Record<string, string[]>;
  maxLength: number;
}

const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  allowedTags: [], // HTMLタグを一切許可しない（プレーンテキストのみ）
  allowedAttributes: {},
  maxLength: 5000
};

export function sanitizeText(text: string, maxLength: number = 5000): string {
  // 1. 長さチェック
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
  }

  // 2. HTMLサニタイゼーション（全タグ削除）
  const sanitized = sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape'
  });

  // 3. 追加のエスケープ（念のため）
  return sanitized
    .replace(/[<>]/g, '') // 残った<>を削除
    .trim();
}

export function sanitizeArray(
  items: string[],
  maxItems: number = 10,
  maxItemLength: number = 500
): string[] {
  // 配列長チェック
  const limitedItems = items.slice(0, maxItems);

  // 各要素をサニタイゼーション
  return limitedItems.map(item => sanitizeText(item, maxItemLength));
}

// 使用例（api.save-result.tsxで）
import { sanitizeText, sanitizeArray } from '~/utils/sanitize';

const sanitizedData = {
  ...body,
  feedback: sanitizeText(body.feedback, 5000),
  strengths: sanitizeArray(body.strengths, 10, 500),
  improvements: sanitizeArray(body.improvements, 10, 500)
};
```

#### クライアントサイド
- **Reactのデフォルト**: JSX内での`{variable}`はデフォルトでエスケープされる
- **dangerouslySetInnerHTML**: 絶対に使用しない
- **追加対策**: サーバーから受け取ったデータも信頼せず、表示時にエスケープ

### CSRF対策

**実装方法**: SameSite Cookie + Cloudflare管理の保護

#### 戦略

**プライマリ**: SameSite Cookie属性のみに依存
- `/api/save-result` はステートレスなPOSTエンドポイント
- 認証不要（誰でも結果を保存可能）
- Cookieベースの認証を使用していない

**理由**:
1. **認証不要**: このエンドポイントはユーザー認証を必要としない
2. **スパム対策**: レート制限で対応
3. **データの性質**: 個人情報を含まない公開データ
4. **Cloudflare保護**: Cloudflare Workersが自動的に一部のCSRF攻撃を軽減

#### 実装不要な理由

```typescript
// このエンドポイントはCSRFトークンを必要としない理由：
// 1. セッションCookieを使用していない
// 2. 認証トークンを使用していない
// 3. ユーザー固有のデータを変更しない
// 4. 公開データの作成のみ（誰でも実行可能）
```

#### 代替案（より厳密な保護が必要な場合）

**オプション1**: Custom Header検証

```typescript
// クライアント側
fetcher.submit(data, {
  method: 'POST',
  action: '/api/save-result',
  headers: {
    'X-Requested-With': 'XMLHttpRequest' // カスタムヘッダー
  }
});

// サーバー側（api.save-result.tsx）
export async function action({ request }: ActionFunctionArgs) {
  // CSRFチェック（オプション）
  const requestedWith = request.headers.get('X-Requested-With');
  if (requestedWith !== 'XMLHttpRequest') {
    return json({ error: 'Invalid request' }, { status: 403 });
  }
  // ... 通常の処理
}
```

**オプション2**: Originヘッダー検証

```typescript
export async function action({ request }: ActionFunctionArgs) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://review-game.com', 'http://localhost:3000'];

  if (origin && !allowedOrigins.includes(origin)) {
    return json({ error: 'Invalid origin' }, { status: 403 });
  }
  // ... 通常の処理
}
```

#### 実装推奨

現時点では**CSRF対策は不要**ですが、将来的にユーザー認証を追加する場合は以下を実装：
- SameSite=Strict または Lax Cookie
- Double Submit Cookie パターン
- または、Anti-CSRF トークン

### バリデーション

#### 入力検証

```typescript
// app/utils/validation.ts
import { availableLanguages } from '~/data/problems';

interface ValidationError {
  field: string;
  message: string;
}

export function validateSaveResultRequest(body: any): {
  valid: boolean;
  errors: ValidationError[];
} {
  const errors: ValidationError[] = [];

  // スコア
  if (typeof body.score !== 'number' || body.score < 0 || body.score > 100) {
    errors.push({ field: 'score', message: 'Score must be between 0 and 100' });
  }

  // 言語
  if (!body.language || !availableLanguages.includes(body.language)) {
    errors.push({ field: 'language', message: 'Invalid language' });
  }

  // レベル
  if (typeof body.level !== 'number' || body.level < 1) {
    errors.push({ field: 'level', message: 'Level must be 1 or greater' });
  }

  // ロケール
  if (!body.locale || !['ja', 'en'].includes(body.locale)) {
    errors.push({ field: 'locale', message: 'Locale must be "ja" or "en"' });
  }

  // feedback
  if (!body.feedback || typeof body.feedback !== 'string' || body.feedback.length > 5000) {
    errors.push({ field: 'feedback', message: 'Feedback must be a string (max 5000 chars)' });
  }

  // strengths
  if (!Array.isArray(body.strengths) || body.strengths.length < 1 || body.strengths.length > 10) {
    errors.push({ field: 'strengths', message: 'Strengths must be an array (1-10 items)' });
  } else {
    body.strengths.forEach((item: any, index: number) => {
      if (typeof item !== 'string' || item.length > 500) {
        errors.push({ field: `strengths[${index}]`, message: 'Each strength must be a string (max 500 chars)' });
      }
    });
  }

  // improvements
  if (!Array.isArray(body.improvements) || body.improvements.length < 1 || body.improvements.length > 10) {
    errors.push({ field: 'improvements', message: 'Improvements must be an array (1-10 items)' });
  } else {
    body.improvements.forEach((item: any, index: number) => {
      if (typeof item !== 'string' || item.length > 500) {
        errors.push({ field: `improvements[${index}]`, message: 'Each improvement must be a string (max 500 chars)' });
      }
    });
  }

  // imageUrl
  if (!body.imageUrl || typeof body.imageUrl !== 'string') {
    errors.push({ field: 'imageUrl', message: 'Image URL is required' });
  } else {
    try {
      const url = new URL(body.imageUrl);
      if (url.protocol !== 'https:') {
        errors.push({ field: 'imageUrl', message: 'Image URL must use HTTPS' });
      }
      // R2ドメインのチェック（環境変数から取得）
      const r2Domain = process.env.R2_PUBLIC_URL || '';
      if (r2Domain && !body.imageUrl.startsWith(r2Domain)) {
        errors.push({ field: 'imageUrl', message: 'Image URL must be from R2 bucket' });
      }
    } catch (e) {
      errors.push({ field: 'imageUrl', message: 'Invalid image URL format' });
    }
  }

  // 総ペイロードサイズチェック
  const payloadSize = new Blob([JSON.stringify(body)]).size;
  if (payloadSize > 32768) { // 32KB
    errors.push({ field: 'payload', message: 'Total payload size exceeds 32KB' });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

#### UUID検証

```typescript
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

// 使用例（result.$id.tsxで）
if (!id || !isValidUUID(id)) {
  throw new Response('Not Found', { status: 404 });
}
```

### データサイズ制限

**総ペイロードサイズ**: 最大32KB

**フィールドごとの上限**:
- **feedback**: 最大5,000文字（UTF-8で約10KB）
- **strengths**: 配列、1〜10要素、各要素最大500文字（最大10要素 × 500文字 = 5,000文字、約10KB）
- **improvements**: 配列、1〜10要素、各要素最大500文字（最大10要素 × 500文字 = 5,000文字、約10KB）
- **その他メタデータ**: 約1-2KB（id, score, language, level, locale, imageUrl, timestamp, createdAt）

**計算根拠**:
- feedback: 5,000文字 × 2バイト（UTF-8平均） = 10KB
- strengths: 10要素 × 500文字 × 2バイト = 10KB
- improvements: 10要素 × 500文字 × 2バイト = 10KB
- メタデータ: 1-2KB
- **合計**: 約31-32KB

バリデーション時にJSON.stringify()後のバイト数が32KB（32,768バイト）以下であることを確認します。

### UUID生成

- UUID v4を使用（暗号学的に安全な乱数生成）
- 推測不可能性を確保
- 衝突の可能性は極めて低い

---

## 実装チェックリスト

### バックエンド

- [ ] `app/types/result.ts`にデータ型を定義（`locale`フィールドを含む）
- [ ] `app/utils/rateLimit.ts`にレート制限関数を実装（KVベース、5req/min）
- [ ] `app/utils/sanitize.ts`にサニタイゼーション関数を実装（sanitize-html使用）
- [ ] `app/utils/validation.ts`にバリデーション関数を実装（32KBチェック含む）
- [ ] `app/routes/api.save-result.tsx`を実装（actionのみ）
  - レート制限チェック
  - バリデーション
  - サニタイゼーション
  - UUID生成
  - KV保存
- [ ] `app/routes/result.$id.tsx`を実装（loaderとcomponent）
  - UUID検証
  - KV取得
  - ロケール固定表示
- [ ] KV操作のエラーハンドリング
- [ ] `sanitize-html`パッケージをインストール（`^2.11.0`）

### フロントエンド

- [ ] 結果ページのUIコンポーネント実装
- [ ] `useFetcher()`を使った結果保存呼び出し
- [ ] 保存時のロケール取得と送信
- [ ] 結果ページでロケール固定表示（`i18n.changeLanguage()`）
- [ ] i18n翻訳の追加（ja/en）- 既存リソース活用
- [ ] OGPメタタグの動的生成（ロケールに応じて）
- [ ] 404エラーページの対応

### インフラ

- [ ] `wrangler.toml`にKVバインディング追加
- [ ] Cloudflare KV namespaceの作成
- [ ] 本番環境とプレビュー環境の設定

### テスト

- [ ] 結果保存APIのテスト
  - [ ] 正常系（有効なデータ）
  - [ ] バリデーションエラー（各フィールド）
  - [ ] ペイロードサイズ超過（>32KB）
  - [ ] レート制限（6回目のリクエストで429）
  - [ ] XSS攻撃（`<script>`タグなど）
- [ ] 結果表示ページのテスト
  - [ ] 正常系（有効なUUID）
  - [ ] 無効なUUID（404）
  - [ ] 存在しないUUID（404）
  - [ ] ロケール固定表示（ja/en）
- [ ] サニタイゼーションのテスト
  - [ ] HTMLタグの除去
  - [ ] 特殊文字のエスケープ
  - [ ] 長さ制限の適用
- [ ] UUID検証のテスト
  - [ ] 有効なUUID v4
  - [ ] 無効な形式
  - [ ] 他のバージョン（v1, v5）
- [ ] 国際化のテスト
  - [ ] 日本語で保存→日本語で表示
  - [ ] 英語で保存→英語で表示
- [ ] OGPタグの確認
  - [ ] 日本語ロケールの場合
  - [ ] 英語ロケールの場合
  - [ ] 画像URLの正しさ

### 統合

- [ ] ShareButtonで`useFetcher()`を使って結果保存APIを呼び出し
- [ ] 保存リクエストに現在のロケールを含める
- [ ] 保存成功後に結果URLを使用
- [ ] ツイートテキストに結果URLを含める
- [ ] エラー時のフォールバック処理（結果URLなしでシェア）

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
