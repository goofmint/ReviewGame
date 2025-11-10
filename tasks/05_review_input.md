# タスク05: レビュー入力機能

## 概要
ユーザーがコードレビューを入力し、送信できる機能を実装する。

## 目的
- レビュー内容を入力するテキストエリアを提供
- 入力内容のバリデーション
- 送信ボタンと送信処理

## コンポーネント構成

```typescript
// app/components/ReviewInput.tsx

interface ReviewInputProps {
  onSubmit: (review: string) => void;
  isSubmitting?: boolean;
  minLength?: number;
}

interface ReviewInputState {
  content: string;
  error: string | null;
}

// レビュー入力用のテキストエリア
// 文字数カウンター表示
// バリデーションエラーメッセージ
// 送信ボタン（ローディング状態対応）
```

## データ構造

```typescript
// app/types/review.ts

interface UserReview {
  content: string;
  submittedAt: Date;
}

interface ReviewValidation {
  isValid: boolean;
  errors: string[];
}
```

## バリデーション

```typescript
// app/utils/validation.ts

interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

interface ReviewValidationRules {
  minLength: number;      // 最小文字数（Phase 1 デフォルト: 10）
  maxLength: number;      // 最大文字数（Phase 1 デフォルト: 5000）
  required: boolean;      // 必須チェック（Phase 1 デフォルト: true）
}

// Phase 1 のデフォルトバリデーションルール
const DEFAULT_VALIDATION_RULES: ReviewValidationRules = {
  minLength: 10,
  maxLength: 5000,
  required: true
};

// レビュー内容のバリデーションを実行
// rules が指定されない場合は DEFAULT_VALIDATION_RULES を使用
// エラーメッセージを返す
export function validateReview(
  content: string,
  rules: ReviewValidationRules = DEFAULT_VALIDATION_RULES
): ReviewValidation;

// 実装の説明：
// - content が空文字列で required が true の場合: エラー「レビューを入力してください」
// - content.length < minLength の場合: エラー「レビューは{minLength}文字以上入力してください」
// - content.length > maxLength の場合: エラー「レビューは{maxLength}文字以内で入力してください」
// - すべてのチェックに合格: { isValid: true, errors: [] }
```

## フォーム処理

```typescript
// app/routes/$lang.$level.tsx での実装

interface ActionData {
  review?: UserReview;
  errors?: string[];
}

// action 関数でフォーム送信を処理
// Phase 1 では送信されたレビューを受け取り
// 結果画面にリダイレクト（または結果を表示）
```

## UI要素

### テキストエリア
- 複数行入力可能
- 自動リサイズまたは固定高さ
- プレースホルダー: 「コードの問題点を指摘してください...」

### 文字数カウンター
- 現在の文字数 / 最大文字数
- 最小文字数未満の場合は警告色で表示

### 送信ボタン
- バリデーション失敗時は無効化
- 送信中はローディングインジケーター表示
- ラベル: 「レビューを提出」

### エラーメッセージ
- バリデーションエラーをテキストエリア下部に表示
- 赤色のテキストで目立たせる

## 状態管理

```typescript
// React の useState で管理
const [reviewContent, setReviewContent] = useState<string>('');
const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
const [validationError, setValidationError] = useState<string | null>(null);

// リアルタイムバリデーション
// フォーム送信処理
// ローディング状態の管理
```

## 送信フロー

1. ユーザーがレビューを入力
2. 送信ボタンをクリック
3. クライアント側でバリデーション実行
4. バリデーション成功→ フォーム送信
5. サーバー側で再度バリデーション
6. Phase 1 では送信されたデータを次の画面に渡す（評価はタスク06）

## スタイリング

### テキストエリア
- 境界線: 1px solid グレー
- フォーカス時: ボーダー色を青に変更
- パディング: 16px
- フォントサイズ: 16px（読みやすいサイズ）

### 文字数カウンター
- 右下に配置
- 小さめのフォントサイズ（12px）
- グレーのテキスト

### 送信ボタン
- プライマリカラー（青または言語のアクセントカラー）
- ホバー時に明度を変更
- 無効時はグレーアウト

## 実装の注意点

1. **バリデーション**: クライアント・サーバー両方で実施
2. **UX**: リアルタイムで文字数をカウント
3. **エラーハンドリング**: 分かりやすいエラーメッセージ
4. **アクセシビリティ**: ラベル、エラーメッセージのARIA属性

## Phase 1での簡略化

- 送信後の処理は最小限（結果画面への遷移のみ）
- LLM評価は次のタスク（タスク06）で実装
- 入力内容はフォームで次の画面に渡す

## 検証項目

- [ ] テキストエリアに文字入力ができる
- [ ] 文字数カウンターがリアルタイム更新される
- [ ] 最小文字数未満で送信ボタンが無効化される
- [ ] バリデーションエラーが適切に表示される
- [ ] 送信時にローディング状態が表示される
- [ ] 送信後に適切な画面遷移が行われる
