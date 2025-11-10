# タスク04: 問題表示画面

## 概要
コードレビュー問題を表示し、ユーザーがレビューを入力できる画面を実装する。Phase 1ではJavaScript Level 1の問題のみ対応。

## 目的
- 要件、コード、レビュー入力エリアを3カラムで表示
- コードにシンタックスハイライトと行番号を表示
- レビュー内容を入力できるテキストエリアを提供

## 画面構成

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back  JavaScript - Level 1                               │
├──────────────┬─────────────────┬──────────────────────────┤
│              │                 │                          │
│  【要件】    │  【コード】      │  【レビュー入力】        │
│              │                 │                          │
│  ユーザーの  │  1 function ... │  ┌────────────────────┐ │
│  年齢を検証  │  2 if (age ...) │  │                    │ │
│  する関数... │  3   throw ...  │  │ ここにレビューを    │ │
│              │  4 }            │  │ 入力してください    │ │
│              │  5 return true  │  │                    │ │
│              │  6 }            │  │                    │ │
│              │                 │  └────────────────────┘ │
│              │                 │  [レビューを提出]        │
└──────────────┴─────────────────┴──────────────────────────┘
```

## ルート定義

```typescript
// app/routes/$lang.$level.tsx

interface ProblemPageProps {
  params: {
    lang: Language;
    level: string; // "1", "2", "3"
  };
}

interface LoaderData {
  problem: Problem;
  language: Language;
  level: number;
}

// loader で問題データを読み込み
// Phase 1 では javascript/level1 のみ対応
// それ以外の場合は404またはメッセージ表示
```

## コンポーネント構成

```typescript
// app/components/ProblemView.tsx

interface ProblemViewProps {
  problem: Problem;
  language: Language;
  level: number;
}

// 3カラムレイアウトのメインコンテナ
// RequirementsDisplay、CodeDisplay、ReviewInput を配置
// レスポンシブ対応（モバイルでは縦積み）
```

```typescript
// app/components/RequirementsDisplay.tsx

interface RequirementsDisplayProps {
  requirements: string;
}

// 要件を表示するコンポーネント
// Markdown または プレーンテキストでの表示
// スクロール可能な領域
```

```typescript
// app/components/CodeDisplay.tsx

interface CodeDisplayProps {
  code: string;
  language: Language;
  onLineClick?: (lineNumber: number) => void;
}

// コードを行番号付きで表示
// シンタックスハイライト（Phase 1では後回し可）
// 各行をクリック可能に（Phase 1では未実装）
```

## データ構造

```typescript
// app/types/problem.ts

interface Problem {
  title: string;
  difficulty: 1 | 2 | 3;
  language: string; // 拡張可能にするため string 型
  requirements: string;
  code: string;
  evaluationCriteria?: string; // LLM評価の参考情報（オプション）
}

// Phase 1 では静的データとして定義
```

```typescript
// app/data/problems.ts

// Phase 1 では JavaScript Level 1 のみ
const JAVASCRIPT_LEVEL_1: Problem = {
  title: "レベル1: 基本的なバグ発見",
  difficulty: 1,
  language: "javascript",
  requirements: `ユーザーの年齢を検証する関数を実装してください。
- 年齢は0以上150以下の整数である必要がある
- 不正な値の場合はエラーを投げる`,
  code: `function validateAge(age) {
  if (age < 0) {
    throw new Error('年齢は0以上である必要があります');
  }
  return true;
}`,
  evaluationCriteria: `LLMがユーザーのレビューを評価する際の基準：
- 上限チェック（150以下）の欠如を指摘できているか
- 型チェック（数値型、整数）の欠如を指摘できているか
- 具体的な改善提案を提示できているか
- エラーハンドリングの不足を指摘できているか`
};

// 問題データを取得する関数
export function getProblem(language: string, level: number): Problem | null;
```

## スタイリング

### レイアウト
- デスクトップ: 3カラムグリッド（1:1.5:1.5 の比率）
- タブレット: 縦積み2カラム（要件+コード / レビュー入力）
- モバイル: 完全縦積み

### 要件表示
- 白背景のカード
- 適度なパディング
- 境界線で区切り

### コード表示
- モノスペースフォント
- 行番号の表示（グレー、右寄せ）
- コード部分は左パディング
- 背景色: 薄いグレー（#f5f5f5）

### レビュー入力
- 広めのテキストエリア（最小高さ300px）
- リサイズ可能
- プレースホルダーテキスト

## 実装の注意点

1. **Phase 1の制約**: JavaScript Level 1 以外はメッセージ表示のみ
2. **シンタックスハイライト**: Phase 1では未実装でも可（モノスペース表示のみ）
3. **行クリック機能**: インタフェース定義のみ、実装は後回し
4. **データソース**: 静的な定数として定義、ファイル読み込みは不要

## 検証項目

- [ ] JavaScript Level 1 の問題が正しく表示される
- [ ] 3カラムレイアウトが正しく表示される
- [ ] コードに行番号が表示される
- [ ] レビュー入力エリアに文字入力ができる
- [ ] モバイル表示で縦積みレイアウトになる
- [ ] 他の言語/レベルにアクセスした場合の適切な処理
