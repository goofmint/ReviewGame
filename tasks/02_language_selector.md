# タスク02: 言語選択画面

## 概要
アプリケーションの最初の画面として、学習したいプログラミング言語を選択するUIを実装する。

## 目的
- JavaScript、Python、Flutterの3言語から選択可能にする（Phase 1）
- 将来的に言語を追加できる拡張性のある設計
- 視覚的に分かりやすいカード形式のUIを提供
- 選択後、該当言語のレベル選択画面に遷移

## 画面構成

```
┌─────────────────────────────────────────┐
│      Code Review Game                   │
│                                         │
│   プログラミング言語を選択してください    │
│                                         │
│  ┌───────┐  ┌───────┐  ┌───────┐      │
│  │  JS   │  │Python │  │Flutter│      │
│  │  🟨   │  │  🐍   │  │  💙   │      │
│  │       │  │       │  │       │      │
│  └───────┘  └───────┘  └───────┘      │
│                                         │
└─────────────────────────────────────────┘
```

## ルート定義

```typescript
// app/routes/_index.tsx

interface LanguageCardProps {
  language: Language;
  icon: string;
  displayName: string;
  color: string;
}

// 言語選択ページのメインコンポーネント
// 3つの言語カードを表示
// クリック時に /$lang へ遷移
```

## コンポーネント構成

```typescript
// app/components/LanguageSelector.tsx

// Phase 1 では3言語のみ定義
// 将来的には string 型に変更し、動的に言語を追加可能にする
type Language = 'javascript' | 'python' | 'flutter';

interface LanguageSelectorProps {
  onSelect?: (language: Language) => void;
}

interface LanguageOption {
  id: Language;
  displayName: string;
  icon: string;
  color: string;
  description: string;
}

// 3つの言語カードをグリッド表示
// ホバー時のアニメーション効果
// クリックで選択処理を実行
```

```typescript
// app/components/LanguageCard.tsx

interface LanguageCardProps {
  language: Language;
  displayName: string;
  icon: string;
  color: string;
  description: string;
  onClick: () => void;
}

// 個別の言語カード
// カラーテーマを動的に適用
// ホバー効果とトランジション
```

## データ定義

```typescript
// app/data/languages.ts

interface LanguageConfig {
  id: Language;
  displayName: string;
  icon: string;
  color: string;
  description: string;
}

// Phase 1: JavaScript、Python、Flutter の設定を定義
// 各言語のカラーテーマ、アイコン、説明文を含む
// 将来的には problems.ts から availableLanguages を読み込み動的に生成可能
```

## スタイリング

### レイアウト
- グリッドレイアウト（3カラム、レスポンシブ）
- カード間の均等なスペース配分
- 中央寄せ配置

### カードデザイン
- 角丸のカードUI
- 言語ごとの背景グラデーション
- ホバー時の拡大効果（scale: 1.05）
- スムーズなトランジション

### カラーテーマ
- JavaScript: 黄色系（#F7DF1E）
- Python: 青緑系（#3776AB）
- Flutter: 青系（#02569B）

## ナビゲーション

```typescript
// useNavigate を使用した遷移
// 選択言語を URL パラメータとして渡す
// 遷移先: /$lang （例: /javascript）
```

## 状態管理

この画面では永続的な状態管理は不要。クリック時に即座に遷移する。

## 実装の注意点

1. **アクセシビリティ**: キーボード操作対応、適切なARIAラベル
2. **レスポンシブ**: モバイルでは縦積みレイアウト（1カラム）
3. **パフォーマンス**: 画像の代わりに絵文字またはSVGアイコンを使用
4. **SEO**: メタタグで適切なページタイトルと説明を設定
5. **拡張性**: 将来的に新しい言語を追加しやすい設計を考慮

## 検証項目

- [ ] 3つの言語カードが正しく表示される
- [ ] カードのホバーアニメーションが動作
- [ ] クリックで正しい言語のページに遷移
- [ ] モバイル表示で縦積みレイアウトになる
- [ ] キーボードでの操作が可能
