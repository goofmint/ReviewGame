# Phase 4: 国際化対応（i18n Support）

## 1. 概要

コードレビューゲームを多言語対応し、日本語と英語の両方で利用できるようにします。
UI、問題コンテンツ、LLM評価、シェア画像のすべてを国際化します。

## 2. 対応言語

**初期対応言語**:
- 日本語 (ja)
- 英語 (en)

**将来的な拡張**:
- 中国語 (zh)
- 韓国語 (ko)
- その他の言語（翻訳ファイルを追加するだけで対応可能）

## 3. UIの国際化

### 3.1 i18nライブラリの選定

**推奨: remix-i18next**
- Remixとの統合が容易
- react-i18nextベース（業界標準）
- サーバーサイド/クライアントサイド両対応
- Cloudflare Workers対応

**代替案: next-intl**
- よりモダンなAPI
- ただしRemixとの統合が要カスタマイズ

### 3.2 翻訳ファイルの構造

```
public/
  locales/
    ja/
      common.json       # 共通UI（ボタン、ラベル等）
      game.json         # ゲーム固有のテキスト
      feedback.json     # フィードバックメッセージ
    en/
      common.json
      game.json
      feedback.json
```

### 3.3 翻訳キーの例

```json
// locales/ja/common.json
{
  "nav": {
    "home": "ホーム",
    "back": "戻る"
  },
  "button": {
    "submit": "送信",
    "retry": "もう一度挑戦",
    "next": "次のレベルへ",
    "share": "Xでシェア"
  },
  "language": {
    "javascript": "JavaScript",
    "python": "Python",
    "flutter": "Flutter"
  }
}

// locales/en/common.json
{
  "nav": {
    "home": "Home",
    "back": "Back"
  },
  "button": {
    "submit": "Submit",
    "retry": "Try Again",
    "next": "Next Level",
    "share": "Share on X"
  },
  "language": {
    "javascript": "JavaScript",
    "python": "Python",
    "flutter": "Flutter"
  }
}
```

### 3.4 言語切り替え機能

- **言語選択UI**: ヘッダーに言語切り替えドロップダウンを配置
- **永続化**: Cookieに言語設定を保存
- **初期言語の検出**:
  1. Cookieに保存された言語
  2. ブラウザの`Accept-Language`ヘッダー
  3. デフォルト: 英語

### 3.5 コンポーネントでの使用例

```typescript
// 最小限のコード例
import { useTranslation } from 'react-i18next';

function SubmitButton() {
  const { t } = useTranslation('common');
  return <button>{t('button.submit')}</button>;
}
```

## 4. 問題ファイルの多言語化

### 4.1 新しいディレクトリ構造

```
problems/
  ja/                    # 日本語の問題
    javascript/
      level1.md
      level2.md
      level3.md
    python/
      level1.md
      level2.md
      level3.md
    flutter/
      level1.md
      level2.md
      level3.md
  en/                    # 英語の問題
    javascript/
      level1.md
      level2.md
      level3.md
    python/
      level1.md
      level2.md
      level3.md
    flutter/
      level1.md
      level2.md
      level3.md
```

**重要な変更点**:
- 最上位階層に言語コード (`ja/`, `en/`) を配置
- その下に従来通りプログラミング言語ディレクトリ
- 各言語で同じレベル構成を持つ

### 4.2 問題ファイルのメタデータ拡張

```markdown
---
title: "Level 1: Basic Bug Detection"
difficulty: 1
language: javascript
locale: en                    # 追加: 問題ファイルの言語
translationKey: "js-level1"   # 追加: 翻訳連携用キー（オプション）
---

# Requirements

Implement a function to validate user age.
- Age must be an integer between 0 and 150
- Throw an error for invalid values

# Code

\`\`\`javascript
function validateAge(age) {
  if (age < 0) {
    throw new Error('Age must be 0 or greater');
  }
  return true;
}
\`\`\`

# Evaluation Criteria

LLM evaluation criteria:
- Missing upper bound check (150 or less)
- Missing type validation (number, integer)
- Missing specific improvement suggestions
- Insufficient error handling
```

### 4.3 ビルドスクリプトの変更

**変更内容**:
1. `problems/` の最上位で言語コード (`ja/`, `en/`) を検出
2. 各言語ごとにプログラミング言語を検出
3. 出力データ構造を変更:

```typescript
// 変更前
problems[programmingLang][level] = { ... }

// 変更後
problems[locale][programmingLang][level] = { ... }
```

**生成されるファイル例**:
```typescript
// app/data/problems.ts
export const problems = {
  ja: {
    javascript: {
      1: { title: "レベル1...", ... },
      2: { ... }
    },
    python: { ... }
  },
  en: {
    javascript: {
      1: { title: "Level 1...", ... },
      2: { ... }
    },
    python: { ... }
  }
} as const;

export const availableLocales = ["ja", "en"] as const;
export const availableLanguages = ["javascript", "python", "flutter"] as const;
```

## 5. LLMレスポンスの多言語対応

### 5.1 プロンプトの多言語化

**アプローチ**: 評価リクエスト時に言語を指定し、LLMに対応言語でレスポンスを求める

**プロンプトテンプレート（英語版）**:
```
You are an experienced code reviewer. Please evaluate a junior engineer's code review.

【Problem Requirements】
{requirements}

【Code Under Review】
{code}

【Junior Engineer's Review】
{userReview}

【Evaluation Task】
Analyze the code and requirements above, and evaluate the junior engineer's review based on the following criteria:

1. Accuracy (40 points): Correctly identified actual issues in the code
2. Completeness (30 points): Did not miss important issues
3. Clarity (20 points): Explained issues clearly and constructively
4. Practicality (10 points): Provided specific improvement suggestions

Return the evaluation in JSON format:
{
  "score": 0-100,
  "feedback": "Overall feedback in English",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"]
}

IMPORTANT: Return all text fields (feedback, strengths, improvements) in English.
```

### 5.2 プロンプト管理

**ファイル構造**:
```
app/
  prompts/
    ja/
      evaluate.txt      # 日本語評価プロンプト
    en/
      evaluate.txt      # 英語評価プロンプト
```

**または翻訳ファイルに含める**:
```json
// locales/ja/prompts.json
{
  "evaluate": {
    "system": "あなたは経験豊富なコードレビューアです...",
    "instruction": "上記のコードと要件を分析し...",
    "output_instruction": "重要: feedback、strengths、improvementsのすべてのテキストフィールドを日本語で返してください。"
  }
}
```

### 5.3 評価APIの変更

```typescript
// 最小限の例
interface EvaluateRequest {
  userReview: string;
  problemData: Problem;
  locale: string;        // 追加: "ja" or "en"
}

// プロンプトを言語に応じて選択
const prompt = getEvaluationPrompt(locale);
```

## 6. シェア画像の多言語対応

### 6.1 画像内テキストの翻訳

**翻訳が必要な要素**:
- タイトル: "Code Review Game" → "コードレビューゲーム"
- スコア表示: "{score}点" → "{score} pts"
- サブテキスト: "{language} - レベル {level}" → "{language} - Level {level}"

**翻訳ファイル**:
```json
// locales/ja/share.json
{
  "image": {
    "title": "コードレビューゲーム",
    "score_label": "{{score}}点",
    "subtitle": "{{language}} - レベル {{level}}"
  },
  "tweet": {
    "template": "#CodeRabbit コードレビューゲームで{{score}}点を獲得しました！\n言語: {{language}} | レベル: {{level}}\n\n{{gameUrl}}"
  }
}

// locales/en/share.json
{
  "image": {
    "title": "Code Review Game",
    "score_label": "{{score}} pts",
    "subtitle": "{{language}} - Level {{level}}"
  },
  "tweet": {
    "template": "I scored {{score}} points on #CodeRabbit Code Review Game!\nLanguage: {{language}} | Level: {{level}}\n\n{{gameUrl}}"
  }
}
```

### 6.2 画像生成APIの変更

```typescript
// 最小限の例
interface ShareImageRequest {
  score: number;
  language: string;
  level: number;
  locale: string;        // 追加: "ja" or "en"
}
```

### 6.3 R2ファイルパスの変更

```
変更前: share/{language}/{level}/{timestamp}.png
変更後: share/{locale}/{language}/{level}/{timestamp}.png
```

## 7. ルーティングと言語管理

### 7.1 URLパスの設計

**オプション1: パスベース（推奨）**
```
/ja                      # 日本語トップページ
/ja/javascript           # 日本語 JavaScript選択
/ja/javascript/1         # 日本語 JavaScript Level 1
/en                      # 英語トップページ
/en/javascript           # 英語 JavaScript選択
/en/javascript/1         # 英語 JavaScript Level 1
```

**メリット**:
- SEO に有利
- URLで言語が明確
- 共有時に言語が保持される

**ルート構造**:
```
app/routes/
  _index.tsx                    # リダイレクト: / → /ja or /en
  $locale._index.tsx            # 言語選択画面
  $locale.$lang._index.tsx      # レベル選択画面
  $locale.$lang.$level.tsx      # 問題画面
  api.evaluate.tsx              # 評価API
  api.share-image.tsx           # シェア画像API
```

**オプション2: Cookieベース（シンプル）**
- URLはそのまま: `/`, `/javascript`, `/javascript/1`
- Cookieで言語を管理
- リロード時も言語が保持される

### 7.2 言語検出ロジック

```typescript
// 最小限の疑似コード
function detectLocale(request: Request): string {
  // 1. URLパスから検出（オプション1の場合）
  const pathLocale = extractLocaleFromPath(request.url);
  if (pathLocale) return pathLocale;

  // 2. Cookieから検出
  const cookieLocale = getCookie(request, 'locale');
  if (cookieLocale) return cookieLocale;

  // 3. Accept-Languageヘッダーから検出
  const headerLocale = parseAcceptLanguage(request.headers.get('Accept-Language'));
  if (headerLocale) return headerLocale;

  // 4. デフォルト
  return 'en';
}
```

## 8. データ型の変更

### 8.1 Problem型の拡張

```typescript
interface Problem {
  title: string;
  difficulty: number;
  language: string;        // プログラミング言語（javascript, python, etc.）
  locale: string;          // 追加: 問題の言語（ja, en）
  requirements: string;
  code: string;
  evaluationCriteria?: string;
}
```

### 8.2 ProgressState型の拡張

```typescript
interface ProgressState {
  locale: string;          // 追加: 現在の言語設定
  [language: string]: {
    [level: number]: {
      unlocked: boolean;
      bestScore?: number;
      attempts: number;
    }
  }
}
```

**注意**: 言語を切り替えても進捗は共有（同じコードをレビューするため）

## 9. 実装の優先順位

### Step 1: 基盤整備
- [ ] remix-i18nextのセットアップ
- [ ] 翻訳ファイルの作成（ja/en）
- [ ] 言語検出ロジックの実装
- [ ] 言語切り替えUIの追加

### Step 2: 問題ファイルの多言語化
- [ ] ディレクトリ構造の変更 (`problems/ja/`, `problems/en/`)
- [ ] ビルドスクリプトの更新（多言語対応）
- [ ] 既存の日本語問題を `problems/ja/` に移動
- [ ] 英語版問題ファイルの作成
- [ ] データ型の更新

### Step 3: UIの翻訳
- [ ] 言語選択画面の翻訳
- [ ] レベル選択画面の翻訳
- [ ] 問題表示画面の翻訳
- [ ] 結果画面の翻訳
- [ ] ボタン・ラベル等の翻訳

### Step 4: LLM評価の多言語対応
- [ ] 評価プロンプトの多言語化
- [ ] 評価APIのロケール対応
- [ ] LLMレスポンスの言語指定

### Step 5: シェア機能の多言語対応
- [ ] 画像生成の多言語化
- [ ] ツイートテンプレートの多言語化
- [ ] R2パス構造の変更

### Step 6: テストと最適化
- [ ] 各言語での動作確認
- [ ] 翻訳の品質確認
- [ ] パフォーマンステスト
- [ ] SEO最適化（hreflang等）

## 10. 技術スタック

### 新規追加
- **remix-i18next**: Remix用i18nライブラリ
- **i18next**: 国際化フレームワーク（コア）
- **react-i18next**: React統合

### 設定例

```typescript
// 最小限の設定例（疑似コード）
// i18next.server.ts
import { createInstance } from 'i18next';

const i18n = createInstance({
  supportedLngs: ['ja', 'en'],
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'game', 'feedback', 'share']
});
```

## 11. SEO考慮事項

### 11.1 hreflangタグ

```html
<!-- 日本語ページ -->
<link rel="alternate" hreflang="ja" href="https://example.com/ja/javascript/1" />
<link rel="alternate" hreflang="en" href="https://example.com/en/javascript/1" />
<link rel="alternate" hreflang="x-default" href="https://example.com/en/javascript/1" />
```

### 11.2 OGタグの多言語化

```html
<!-- 日本語ページ -->
<meta property="og:title" content="コードレビューゲーム - JavaScript レベル1" />
<meta property="og:locale" content="ja_JP" />
<meta property="og:locale:alternate" content="en_US" />
```

## 12. 翻訳管理のベストプラクティス

### 12.1 翻訳キーの命名規則
- ネームスペースを活用: `common.button.submit`, `game.level.title`
- 複数形対応: `game.level.count_one`, `game.level.count_other`
- 変数は明確に: `{{count}} items`, `{{username}}さん`

### 12.2 翻訳の品質管理
- ネイティブスピーカーによるレビュー
- 文脈を考慮した翻訳（直訳を避ける）
- 文化的な違いへの配慮（例: "Level"は日本語でも"レベル"が自然）

### 12.3 将来の拡張
- **翻訳管理プラットフォーム**: Lokalize, Crowdin等の導入を検討
- **コミュニティ翻訳**: ユーザーによる翻訳貢献の仕組み
- **自動翻訳の活用**: DeepL API等で初期翻訳を生成し、人手で修正

## 13. パフォーマンス考慮事項

### 13.1 バンドルサイズ
- 翻訳ファイルは使用する言語のみロード
- Code Splittingで言語ごとに分割

### 13.2 キャッシング
- 翻訳ファイルはCDNでキャッシュ
- 言語設定はCookieで永続化（サーバーリクエスト削減）

### 13.3 Cloudflare Workers最適化
- 言語検出はエッジで実行（低レイテンシ）
- 地域に応じたデフォルト言語の設定

## 14. マイグレーション計画

### 14.1 既存データの移行

**問題ファイル**:
```bash
# 既存の構造
problems/javascript/level1.md
problems/python/level1.md

# 新しい構造
problems/ja/javascript/level1.md  # 既存ファイルをコピー
problems/en/javascript/level1.md  # 新規作成（翻訳）
```

**移行スクリプト**:
```bash
# 疑似コード
mkdir -p problems/ja
mv problems/javascript problems/ja/
mv problems/python problems/ja/
mv problems/flutter problems/ja/

# 英語版はマニュアルまたは翻訳ツールで作成
mkdir -p problems/en
# ... 英語版問題ファイルを作成
```

### 14.2 ユーザー進捗の互換性
- 既存のLocalStorageデータは維持
- 言語切り替え後も進捗は共有
- スキーマバージョニングで将来の変更に対応

## 15. テスト戦略

### 15.1 単体テスト
- 翻訳キーの存在確認
- 言語検出ロジックのテスト
- プロンプト生成のテスト

### 15.2 統合テスト
- 各言語でのフルフロー確認
- 言語切り替えの動作確認
- LLM評価の多言語動作確認

### 15.3 E2Eテスト
- 日本語フロー: 言語選択 → 問題解答 → 評価 → シェア
- 英語フロー: 同上
- 言語切り替えフロー: ja → en → ja

---

## 付録: i18next設定例（最小限）

```typescript
// app/i18n.ts
import { RemixI18Next } from 'remix-i18next';

export const i18n = new RemixI18Next({
  detection: {
    supportedLanguages: ['ja', 'en'],
    fallbackLanguage: 'en',
    cookie: {
      name: 'locale',
      sameSite: 'lax',
      path: '/',
      maxAge: 31536000 // 1年
    }
  },
  i18next: {
    defaultNS: 'common',
    ns: ['common', 'game', 'feedback', 'share']
  }
});
```

```typescript
// app/root.tsx（一部）
export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18n.getLocale(request);
  return json({ locale });
}
```

```typescript
// app/routes/$locale._index.tsx
import { useTranslation } from 'react-i18next';

export default function LanguageSelector() {
  const { t } = useTranslation('common');

  return (
    <h1>{t('game.selectLanguage')}</h1>
  );
}
```

---

このドキュメントに基づいて実装を進めることで、段階的かつ確実に国際化対応を実現できます。
