# タスク03: レベル選択画面

## 概要
選択した言語の学習レベルを選択するUIを実装する。Phase 1ではレベル1のみ有効。レベル数は動的に検出され、ファイル追加だけで拡張可能。

## 目的
- 利用可能なレベルを動的に表示
- Phase 1ではレベル1のみ実装（将来的には自動的に増加）
- レベルの追加はMarkdownファイルを追加するだけ
- 選択後、問題表示画面に遷移

## 画面構成

```
┌─────────────────────────────────────────┐
│  ← Back     JavaScript                  │
│                                         │
│     レベルを選択してください             │
│                                         │
│  ┌──────────────┐                      │
│  │  Level 1     │                      │
│  │  ⭐          │                      │
│  │  基本的なバグ発見│                   │
│  │  [開始]       │                      │
│  └──────────────┘                      │
│                                         │
│  （Phase 1ではレベル1のみ）              │
│  （将来的にlevel2.md, level3.md等を     │
│   追加すると自動的に表示される）         │
└─────────────────────────────────────────┘
```

## ルート定義

```typescript
// app/routes/$lang._index.tsx

interface LevelSelectorPageProps {
  params: {
    lang: string;
  };
}

interface LoaderData {
  language: string;
  availableLevels: number[]; // 利用可能なレベルのリスト
  problems: Record<number, Problem>; // レベルごとの問題情報
}

// loader で言語パラメータを検証
// problems データから利用可能なレベルを取得
// 不正な言語の場合は404またはリダイレクト
// レベル選択画面を表示
```

## コンポーネント構成

```typescript
// app/components/LevelSelector.tsx

interface LevelSelectorProps {
  language: string;
  availableLevels: number[]; // 動的に取得されたレベルリスト
  problems: Record<number, Problem>; // レベルごとの問題情報
  onSelectLevel?: (level: number) => void;
}

interface LevelInfo {
  level: number;
  title: string;
  difficulty: number; // 星の数（問題のdifficultyフィールドから取得）
  description: string;
  unlocked: boolean;
}

// availableLevels を元に動的にカードを生成
// Phase 1 ではレベル1のみ表示
// 将来的にはレベル数が自動的に増える
```

```typescript
// app/components/LevelCard.tsx

interface LevelCardProps {
  level: number;
  title: string;
  difficulty: number;
  description: string;
  unlocked: boolean;
  bestScore?: number;
  onClick: () => void;
}

// 個別のレベルカード
// ロック状態に応じた表示切り替え
// スコア情報の表示（達成済みの場合）
```

## データ取得

```typescript
// app/data/problems.ts から動的に取得

import { problems } from '~/data/problems';

// 指定言語の利用可能なレベルを取得
export function getAvailableLevels(language: string): number[] {
  const langProblems = problems[language];
  if (!langProblems) return [];

  return Object.keys(langProblems)
    .map(Number)
    .sort((a, b) => a - b);
}

// 指定言語の全問題を取得
export function getLanguageProblems(language: string): Record<number, Problem> {
  return problems[language] || {};
}

// Phase 1 では JavaScript の level1.md のみ存在
// 将来的に level2.md, level3.md を追加すると自動的に検出される
```

## ナビゲーション

```typescript
// 戻るボタン: / に遷移（言語選択画面）
// レベル選択: /$lang/$level に遷移（例: /javascript/1）
```

## 状態管理

```typescript
// app/utils/storage.ts

interface ProgressState {
  [language: string]: {
    [level: number]: {
      unlocked: boolean;
      bestScore?: number;
      attempts: number;
    };
  };
}

// Phase 1 では Local Storage は使用しない
// すべてのレベル1は常に unlocked: true
// 将来的な拡張のためのインタフェース定義のみ
```

## スタイリング

### レイアウト
- 縦方向の単一カラムレイアウト
- カード間の適度なスペース
- 中央寄せ配置

### カードデザイン
- アンロック済みレベル: 明るい背景、アクティブな状態
- ロック中レベル: グレーアウト、ロックアイコン表示
- 難易度を星の数で表現（Problem の difficulty フィールドから取得）

### カラーテーマ
- 言語選択で選んだ言語のアクセントカラーを使用
- ロック状態: グレースケール

## 実装の注意点

1. **URL検証**: 無効な言語パラメータの場合は404ページへ
2. **動的レベル検出**: problems データから利用可能なレベルを取得
3. **Phase 1の制約**: レベル1のみ表示（問題ファイルがレベル1のみのため）
4. **拡張性**: 新しいレベルは Markdown ファイルを追加するだけで自動認識
5. **将来の拡張性**: ProgressState の型定義を用意し、実装は後回し
6. **戻るナビゲーション**: 直感的な戻るボタンの配置

## 検証項目

- [ ] URLパラメータから正しく言語を取得
- [ ] problems データから利用可能なレベルを動的に取得
- [ ] Phase 1 ではレベル1のカードのみ表示
- [ ] レベル1をクリックで問題画面に遷移
- [ ] 戻るボタンで言語選択画面に戻る
- [ ] 不正な言語パラメータで適切にエラー処理
- [ ] 将来的に level2.md を追加した場合、自動的にレベル2が表示される
