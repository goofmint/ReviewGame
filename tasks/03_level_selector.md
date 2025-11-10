# タスク03: レベル選択画面

## 概要
選択した言語の学習レベルを選択するUIを実装する。Phase 1ではレベル1のみ有効。

## 目的
- レベル1を選択可能にする
- レベル2、3は実装せず、グレーアウト表示（将来の拡張を示唆）
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
│  ┌──────────────┐ (グレーアウト)       │
│  │  Level 2  🔒 │                      │
│  │  ⭐⭐        │                      │
│  └──────────────┘                      │
│                                         │
│  ┌──────────────┐ (グレーアウト)       │
│  │  Level 3  🔒 │                      │
│  │  ⭐⭐⭐      │                      │
│  └──────────────┘                      │
└─────────────────────────────────────────┘
```

## ルート定義

```typescript
// app/routes/$lang._index.tsx

interface LevelSelectorPageProps {
  params: {
    lang: Language;
  };
}

// loader で言語パラメータを検証
// 不正な言語の場合は404またはリダイレクト
// レベル選択画面を表示
```

## コンポーネント構成

```typescript
// app/components/LevelSelector.tsx

type Level = 1 | 2 | 3;

interface LevelSelectorProps {
  language: Language;
  onSelectLevel?: (level: Level) => void;
}

interface LevelInfo {
  level: Level;
  title: string;
  difficulty: number; // 星の数 (1-3)
  description: string;
  unlocked: boolean;
}

// レベル1-3のカードを縦に表示
// レベル1のみクリック可能
// レベル2、3はロック表示
```

```typescript
// app/components/LevelCard.tsx

interface LevelCardProps {
  level: Level;
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

## データ定義

```typescript
// app/data/levels.ts

interface LevelConfig {
  level: Level;
  title: string;
  difficulty: number;
  description: string;
}

// Phase 1 では Level 1 の情報のみ定義
// {
//   level: 1,
//   title: "基本的なバグ発見",
//   difficulty: 1,
//   description: "コードの基本的な問題を見つけよう"
// }
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
- レベル1: 明るい背景、アクティブな状態
- レベル2、3: グレーアウト、ロックアイコン表示
- 難易度を星の数で表現

### カラーテーマ
- 言語選択で選んだ言語のアクセントカラーを使用
- ロック状態: グレースケール

## 実装の注意点

1. **URL検証**: 無効な言語パラメータの場合は404ページへ
2. **Phase 1の制約**: レベル2、3のUIは表示するが、クリック不可
3. **将来の拡張性**: ProgressState の型定義を用意し、実装は後回し
4. **戻るナビゲーション**: 直感的な戻るボタンの配置

## 検証項目

- [ ] URLパラメータから正しく言語を取得
- [ ] レベル1のカードがアクティブ状態で表示
- [ ] レベル2、3がグレーアウト表示
- [ ] レベル1をクリックで問題画面に遷移
- [ ] 戻るボタンで言語選択画面に戻る
- [ ] 不正な言語パラメータで適切にエラー処理
