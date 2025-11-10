# タスク06: 静的な評価（お手本表示）

## 概要
Phase 1では、LLM評価を実装せず、ユーザーのレビュー送信後にお手本レビューを表示する静的な結果画面を実装する。

## 目的
- ユーザーが入力したレビューを表示
- お手本レビューを表示して比較可能にする
- 次のアクション（再挑戦、言語選択に戻る）を提供

## 画面構成

```
┌─────────────────────────────────────────┐
│  レビュー結果                           │
│                                         │
│  【あなたのレビュー】                    │
│  ┌───────────────────────────────────┐ │
│  │ [ユーザーが入力したレビュー内容]    │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  【お手本レビュー】                      │
│  ┌───────────────────────────────────┐ │
│  │ 1. **上限チェックの欠如**: ...     │ │
│  │ 2. **型チェックの欠如**: ...       │ │
│  │ 3. **改善提案**: ...               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [もう一度挑戦]  [言語選択に戻る]       │
└─────────────────────────────────────────┘
```

## ルート定義

```typescript
// app/routes/$lang.$level.result.tsx

interface ResultPageProps {
  params: {
    lang: Language;
    level: string;
  };
}

interface LoaderData {
  userReview: string;
  modelReview: string;
  problem: Problem;
}

// action から送信されたレビューを受け取る
// お手本レビューを取得
// 両方を表示する結果画面を返す
```

## コンポーネント構成

```typescript
// app/components/ResultView.tsx

interface ResultViewProps {
  userReview: string;
  modelReview: string;
  language: Language;
  level: number;
  onRetry: () => void;
  onBackToLanguages: () => void;
}

// 結果表示のメインコンテナ
// ユーザーレビューとお手本レビューを並べて表示
// アクションボタンを配置
```

```typescript
// app/components/ReviewComparison.tsx

interface ReviewComparisonProps {
  userReview: string;
  modelReview: string;
}

interface ReviewSection {
  title: string;
  content: string;
  type: 'user' | 'model';
}

// 2つのレビューを比較表示
// 読みやすいフォーマット
// お手本レビューはMarkdown形式で表示
```

## データフロー

```typescript
// レビュー送信からの流れ

// 1. タスク05のフォームで送信
interface ReviewSubmission {
  content: string;
  language: Language;
  level: number;
}

// 2. action で受信
// Phase 1 では評価せず、そのまま結果画面へ

// 3. 結果画面で表示
interface ResultData {
  userReview: string;
  modelReview: string;
}
```

## スタイリング

### レイアウト
- 単一カラム、中央寄せ
- ユーザーレビューとお手本レビューを縦に配置
- 十分な余白で読みやすく

### レビューボックス
- ユーザーレビュー: 薄い青背景
- お手本レビュー: 薄い緑背景
- 境界線と角丸
- 内部パディング: 24px

### テキスト表示
- ユーザーレビュー: プレーンテキスト、改行を保持
- お手本レビュー: Markdownレンダリング（太字、リスト対応）

### アクションボタン
- 2つのボタンを横並び配置
- 「もう一度挑戦」: プライマリカラー
- 「言語選択に戻る」: セカンダリカラー（グレー系）

## ナビゲーション

```typescript
// もう一度挑戦ボタン
// → /$lang/$level に戻る（問題画面をリセット）

// 言語選択に戻るボタン
// → / に遷移（トップページ）
```

## Markdownレンダリング

```typescript
// app/utils/markdown.ts

interface MarkdownRenderOptions {
  allowedTags?: string[];
  sanitize?: boolean;
}

// お手本レビューをMarkdownからHTMLに変換
// サニタイゼーション処理
// 安全なタグのみ許可（<strong>, <em>, <ul>, <li>, <code> など）
export function renderMarkdown(markdown: string): string;
```

## 実装の注意点

1. **Phase 1の簡略化**: スコアリングなし、LLM評価なし
2. **比較の視認性**: ユーザーレビューとお手本を明確に区別
3. **Markdown処理**: XSS対策のためサニタイゼーション必須
4. **状態のリセット**: 「もう一度挑戦」で入力内容をクリア

## Phase 2への準備

```typescript
// 将来的に実装するインタフェース（Phase 1では未使用）

interface EvaluationResult {
  score: number;              // 0-100
  feedback: string;           // LLMによるフィードバック
  strengths: string[];        // 良かった点
  improvements: string[];     // 改善点
  passed: boolean;            // 70点以上かどうか
}

// Phase 2 でこの構造を返すAPIを実装
// Phase 1 では定義のみ、実装なし
```

## 検証項目

- [ ] ユーザーが入力したレビューが正しく表示される
- [ ] お手本レビューがフォーマットされて表示される
- [ ] お手本のMarkdownが正しくレンダリングされる
- [ ] 「もう一度挑戦」ボタンで問題画面に戻る
- [ ] 「言語選択に戻る」ボタンでトップページに戻る
- [ ] モバイル表示でレイアウトが崩れない
