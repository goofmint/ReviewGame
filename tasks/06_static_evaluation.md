# タスク06: 静的な結果表示

## 概要
Phase 1では、LLM評価を実装せず、ユーザーのレビュー送信後に入力内容を確認する静的な結果画面を実装する。

## 目的
- ユーザーが入力したレビューを確認表示
- 簡易メッセージで送信完了を通知
- 次のアクション（再挑戦、言語選択に戻る）を提供

## 画面構成

```
┌─────────────────────────────────────────┐
│  レビュー送信完了                        │
│                                         │
│  ✓ レビューを送信しました               │
│                                         │
│  【送信したレビュー】                    │
│  ┌───────────────────────────────────┐ │
│  │ [ユーザーが入力したレビュー内容]    │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ※ Phase 2でLLM評価機能を実装予定      │
│                                         │
│  [もう一度挑戦]  [言語選択に戻る]       │
└─────────────────────────────────────────┘
```

## ルート定義

```typescript
// app/routes/$lang.$level.result.tsx

interface ResultPageProps {
  params: {
    lang: string;
    level: string;
  };
}

interface LoaderData {
  userReview: string;
  language: string;
  level: number;
}

// action から送信されたレビューを受け取る
// Phase 1 では入力内容の確認表示のみ
```

## コンポーネント構成

```typescript
// app/components/ResultView.tsx

interface ResultViewProps {
  userReview: string;
  language: string;
  level: number;
  onRetry: () => void;
  onBackToLanguages: () => void;
}

// 結果表示のメインコンテナ
// ユーザーレビューを表示
// 送信完了メッセージを表示
// アクションボタンを配置
```

```typescript
// app/components/ReviewDisplay.tsx

interface ReviewDisplayProps {
  content: string;
  title: string;
}

// レビュー内容を表示するコンポーネント
// プレーンテキスト表示
// 改行を保持
```

## データフロー

```typescript
// レビュー送信からの流れ

// 1. タスク05のフォームで送信
interface ReviewSubmission {
  content: string;
  language: string;
  level: number;
}

// 2. action で受信
// Phase 1 では評価せず、そのまま結果画面へリダイレクト

// 3. 結果画面で表示
interface ResultData {
  userReview: string;
}
```

## スタイリング

### レイアウト
- 単一カラム、中央寄せ
- 送信完了アイコンとメッセージ
- ユーザーレビューを表示
- 十分な余白で読みやすく

### 成功メッセージ
- チェックマークアイコン（✓）
- 緑色のテキスト
- 大きめのフォントサイズ

### レビューボックス
- 白背景のカード
- 境界線と角丸
- 内部パディング: 24px
- 改行を保持したプレーンテキスト表示

### 注意書き
- 小さめのフォントサイズ
- グレーのテキスト
- 「Phase 2で評価機能実装予定」を表示

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

## 実装の注意点

1. **Phase 1の簡略化**: スコアリングなし、LLM評価なし
2. **シンプルな表示**: 入力内容の確認のみ
3. **状態のリセット**: 「もう一度挑戦」で入力内容をクリア
4. **将来の拡張**: Phase 2でEvaluationResultを表示する準備

## Phase 2への準備

### インタフェース定義

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

### テキストサニタイゼーション（セキュリティ境界）

```typescript
// app/utils/sanitize.ts

// 使用ライブラリ: DOMPurify (https://github.com/cure53/DOMPurify)
// または isomorphic-dompurify (サーバーサイド対応版)
import DOMPurify from 'isomorphic-dompurify';

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
}

// Phase 2 でのデフォルト設定
const DEFAULT_SANITIZE_OPTIONS: SanitizeOptions = {
  // 許可するHTMLタグ（安全なフォーマット用タグのみ）
  allowedTags: [
    'p',      // 段落
    'br',     // 改行
    'strong', // 太字
    'em',     // イタリック
    'ul',     // 順序なしリスト
    'ol',     // 順序ありリスト
    'li',     // リスト項目
    'code',   // インラインコード
    'pre',    // コードブロック
  ],
  // 許可する属性（なし）
  allowedAttributes: {}
};

// 明示的に禁止する要素（XSS対策）
const FORBIDDEN_ELEMENTS = [
  'script',   // スクリプト実行
  'iframe',   // 外部コンテンツ埋め込み
  'object',   // プラグイン実行
  'embed',    // 外部リソース埋め込み
  'link',     // 外部スタイルシート
  'style',    // インラインスタイル
  'base',     // ベースURL変更
  'form',     // フォーム送信
  'input',    // ユーザー入力
  'button',   // ボタン
];

// 明示的に禁止する属性（XSS対策）
const FORBIDDEN_ATTRIBUTES = [
  /^on/,      // すべてのイベントハンドラ（onclick, onload, etc.）
  'href',     // リンク（フィッシング対策）
  'src',      // 外部リソース読み込み
  'data',     // データ属性
  'action',   // フォームアクション
  'formaction', // フォームアクション
];

/**
 * LLM出力をサニタイズして安全なHTMLに変換
 *
 * セキュリティ境界：
 * - LLMの出力は信頼できないユーザー入力として扱う
 * - XSS攻撃を防ぐため、危険なタグと属性をすべて除去
 * - DOMPurify を使用して確実にサニタイズ
 *
 * @param html - サニタイズ対象のHTML文字列
 * @param options - カスタムサニタイズオプション
 * @returns サニタイズされた安全なHTML文字列
 */
export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = DEFAULT_SANITIZE_OPTIONS
): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: options.allowedTags,
    ALLOWED_ATTR: [], // 属性は一切許可しない
    FORBID_TAGS: FORBIDDEN_ELEMENTS,
    FORBID_ATTR: FORBIDDEN_ATTRIBUTES,
  });
}

/**
 * プレーンテキストをHTMLエスケープ
 * Phase 1 でのユーザーレビュー表示に使用
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 実装の注意点：
// 1. Phase 1 ではプレーンテキスト表示のみ（escapeHtml を使用）
// 2. Phase 2 でLLM出力を表示する際は必ず sanitizeHtml を使用
// 3. サニタイゼーションはサーバーサイドとクライアントサイド両方で実施
// 4. DOMPurify のバージョンは常に最新に保つ（脆弱性対策）
```

## 検証項目

- [ ] ユーザーが入力したレビューが正しく表示される
- [ ] 送信完了メッセージが表示される
- [ ] 改行が保持されて表示される
- [ ] 「もう一度挑戦」ボタンで問題画面に戻る
- [ ] 「言語選択に戻る」ボタンでトップページに戻る
- [ ] モバイル表示でレイアウトが崩れない
