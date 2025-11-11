# Phase 3: UX改善機能 詳細設計

## 1. 概要

Phase 3では、ユーザー体験を向上させるための6つの機能を実装します：

1. **コード/要件クリック時の自動入力** - レビュー作成を効率化
2. **シンタックスハイライト** - コードの可読性向上
3. **アニメーション・トランジション** - スムーズな画面遷移
4. **レスポンシブデザイン最適化** - モバイル対応の改善
5. **ローディング状態表示** - ユーザーへのフィードバック強化
6. **Xシェア機能** - SNS連携によるバイラル性向上

---

## 2. コード/要件クリック時の自動入力

### 2.1 目的
ユーザーがコードの特定行や要件項目をクリックすると、レビュー入力エリアに参照テキストを自動挿入し、レビュー作成を効率化します。

### 2.2 インタフェース定義

```typescript
// app/types/auto-insert.ts

interface ClickableElement {
  type: 'code' | 'requirement';
  lineNumber?: number;
  text: string;
  requirementIndex?: number;
}

interface AutoInsertTemplate {
  prefix: string;
  content: string;
  suffix: string;
}

interface AutoInsertService {
  /**
   * クリック可能な要素からテンプレートテキストを生成
   * @param element - クリックされた要素
   * @returns 生成されたテンプレート
   */
  generateTemplate(element: ClickableElement): AutoInsertTemplate;

  /**
   * テキストエリアに自動挿入
   * @param currentText - 現在のテキスト
   * @param template - 挿入するテンプレート
   * @param cursorPosition - 現在のカーソル位置
   * @returns 新しいテキストと新しいカーソル位置
   */
  insertTemplate(
    currentText: string,
    template: AutoInsertTemplate,
    cursorPosition: number
  ): { newText: string; newCursorPosition: number };
}
```

### 2.3 実装フロー
1. CodeDisplayコンポーネント内の各行にクリックハンドラを設定
2. クリック時、行番号と行内容を取得
3. テンプレート生成：`「コードの{行番号}行目: {行の内容}\n」`
4. ReviewInputコンポーネントのテキストエリアに挿入
5. カーソル位置を挿入テキストの末尾に移動

### 2.4 テンプレート例
- コードクリック時：`「コードの15行目: if (age < 0) に関して、」`
- 要件クリック時：`「要件「年齢は0以上150以下の整数である必要がある」について、」`

---

## 3. シンタックスハイライト

### 3.1 目的
プログラミング言語に応じたシンタックスハイライトを適用し、コードの可読性を向上させます。

### 3.2 インタフェース定義

```typescript
// app/types/syntax-highlight.ts

interface HighlightConfig {
  language: string;
  theme: 'light' | 'dark';
  showLineNumbers: boolean;
  highlightLines?: number[];
}

interface HighlightedCode {
  html: string;
  className: string;
}

interface SyntaxHighlighter {
  /**
   * コードにシンタックスハイライトを適用
   * @param code - 対象コード
   * @param config - ハイライト設定
   * @returns ハイライト済みHTML
   */
  highlight(code: string, config: HighlightConfig): HighlightedCode;

  /**
   * サポートされている言語のリストを取得
   * @returns サポート言語の配列
   */
  getSupportedLanguages(): string[];
}
```

### 3.3 実装方針
- ライブラリ：`react-syntax-highlighter`を使用
- テーマ：`tomorrow`（ライトモード）/ `tomorrow-night`（ダークモード対応時）
- 対応言語：JavaScript、Python、Dart（Flutter）
- 行番号表示：常に有効
- クリック可能性：ハイライト適用後も各行にクリックイベントを維持

### 3.4 コンポーネント統合
- CodeDisplayコンポーネントに統合
- 既存のクリック機能との共存を保証
- パフォーマンス最適化：コード変更時のみ再計算

---

## 4. アニメーション・トランジション

### 4.1 目的
画面遷移やUI要素の変化をスムーズにし、プロフェッショナルな印象を与えます。

### 4.2 インタフェース定義

```typescript
// app/types/animation.ts

interface TransitionConfig {
  duration: number; // ミリ秒
  easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number;
}

interface AnimationPreset {
  fadeIn: TransitionConfig;
  fadeOut: TransitionConfig;
  slideInLeft: TransitionConfig;
  slideInRight: TransitionConfig;
  slideInUp: TransitionConfig;
  scaleIn: TransitionConfig;
}

interface AnimationService {
  /**
   * プリセットアニメーションを取得
   * @param presetName - プリセット名
   * @returns トランジション設定
   */
  getPreset(presetName: keyof AnimationPreset): TransitionConfig;

  /**
   * カスタムアニメーションを生成
   * @param config - カスタム設定
   * @returns CSSクラス名
   */
  createCustomAnimation(config: TransitionConfig): string;
}
```

### 4.3 適用箇所
1. **ページ遷移**：fadeIn（300ms）
   - 言語選択 → レベル選択
   - レベル選択 → 問題画面
   - 問題画面 → 結果画面

2. **カード表示**：slideInUp（400ms、stagger 100ms）
   - 言語カード
   - レベルカード

3. **ボタンホバー**：scaleIn（200ms）
   - 全ボタン要素

4. **モーダル表示**：fadeIn + scaleIn（250ms）
   - 結果モーダル
   - ローディングモーダル

5. **フィードバック表示**：slideInLeft（300ms）
   - 評価結果のstrengths/improvements

### 4.4 実装方針
- Tailwind CSSのtransitionユーティリティを活用
- Framer Motionの導入（オプション：複雑なアニメーションの場合）
- パフォーマンス考慮：`transform`と`opacity`のみ使用（GPUアクセラレーション）

---

## 5. レスポンシブデザイン最適化

### 5.1 目的
モバイル・タブレット・デスクトップの各デバイスで最適な表示を実現します。

### 5.2 インタフェース定義

```typescript
// app/types/responsive.ts

interface Breakpoint {
  name: 'mobile' | 'tablet' | 'desktop';
  minWidth: number;
  maxWidth?: number;
}

interface ResponsiveLayout {
  columns: number;
  gap: number;
  padding: number;
  fontSize: {
    base: number;
    heading: number;
    code: number;
  };
}

interface ResponsiveService {
  /**
   * 現在のブレークポイントを取得
   * @param windowWidth - ウィンドウ幅
   * @returns ブレークポイント情報
   */
  getCurrentBreakpoint(windowWidth: number): Breakpoint;

  /**
   * ブレークポイントに応じたレイアウト設定を取得
   * @param breakpoint - ブレークポイント
   * @returns レイアウト設定
   */
  getLayoutConfig(breakpoint: Breakpoint): ResponsiveLayout;
}
```

### 5.3 ブレークポイント定義
```typescript
const breakpoints = {
  mobile: { minWidth: 0, maxWidth: 767 },
  tablet: { minWidth: 768, maxWidth: 1023 },
  desktop: { minWidth: 1024 }
};
```

### 5.4 レイアウト調整

#### 5.4.1 問題画面レイアウト
- **Desktop（1024px以上）**：3カラム（要件 | コード | レビュー入力）
- **Tablet（768-1023px）**：2カラム（要件+コード | レビュー入力）
- **Mobile（767px以下）**：1カラム縦積み（要件 → コード → レビュー入力）

#### 5.4.2 カードグリッド
- **Desktop**：3カラムグリッド（言語選択、レベル選択）
- **Tablet**：2カラムグリッド
- **Mobile**：1カラムグリッド

#### 5.4.3 フォントサイズ
- **コード表示**：Desktop 14px / Tablet 13px / Mobile 12px
- **見出し**：Desktop 24px / Tablet 20px / Mobile 18px
- **本文**：Desktop 16px / Tablet 15px / Mobile 14px

### 5.5 タッチ操作最適化
- ボタンのタップ領域：最小44x44px
- スワイプジェスチャー：戻る/進む（オプション）
- ピンチズーム：コード表示エリアで有効化

---

## 6. ローディング状態表示

### 6.1 目的
LLM評価などの非同期処理中にユーザーへフィードバックを提供し、待機時間のUXを改善します。

### 6.2 インタフェース定義

```typescript
// app/types/loading.ts

interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
}

interface LoadingConfig {
  type: 'spinner' | 'progress' | 'skeleton';
  message: string;
  cancelable?: boolean;
  onCancel?: () => void;
}

interface LoadingService {
  /**
   * ローディング状態を開始
   * @param config - ローディング設定
   * @returns ローディングID
   */
  startLoading(config: LoadingConfig): string;

  /**
   * ローディング進捗を更新
   * @param loadingId - ローディングID
   * @param progress - 進捗（0-100）
   */
  updateProgress(loadingId: string, progress: number): void;

  /**
   * ローディング状態を終了
   * @param loadingId - ローディングID
   */
  stopLoading(loadingId: string): void;
}
```

### 6.3 ローディング種類

#### 6.3.1 スピナー（Spinner）
- 用途：LLM評価、画像生成など不定期処理
- 表示：回転アニメーション + メッセージ
- 位置：画面中央オーバーレイ
- メッセージ例：
  - 「レビューを評価中...」
  - 「シェア画像を生成中...」

#### 6.3.2 プログレスバー（Progress）
- 用途：複数ステップの処理（オプション）
- 表示：横棒プログレスバー + 進捗率
- 位置：モーダル内またはインライン

#### 6.3.3 スケルトンスクリーン（Skeleton）
- 用途：問題データ読み込み
- 表示：コンテンツの形状を模したプレースホルダー
- 位置：実際のコンテンツ表示位置

### 6.4 適用箇所
1. **レビュー評価**：スピナー（メッセージ：「レビューを評価中...」）
2. **シェア画像生成**：スピナー（メッセージ：「シェア画像を生成中...」）
3. **問題データ読み込み**：スケルトンスクリーン（コード・要件エリア）
4. **ページ遷移**：フェードアウト/フェードイン（短時間の場合は非表示）

### 6.5 タイムアウト処理
```typescript
interface TimeoutConfig {
  duration: number; // ミリ秒
  onTimeout: () => void;
  message: string;
}
```
- LLM評価：30秒タイムアウト
- 画像生成：15秒タイムアウト
- タイムアウト時：エラーメッセージ表示 + リトライオプション

---

## 7. Xシェア機能

### 7.1 目的
ユーザーがスコアをX（旧Twitter）でシェアできるようにし、アプリのバイラル性を高めます。

### 7.2 インタフェース定義

```typescript
// app/types/share.ts

interface ShareImageData {
  score: number;
  language: string;
  level: number;
  timestamp: number;
}

interface ShareImageConfig {
  width: number; // 1200
  height: number; // 630
  format: 'png' | 'jpeg';
  quality?: number; // 80-100
}

interface GeneratedImage {
  buffer: ArrayBuffer;
  contentType: string;
  size: number;
}

interface ShareResult {
  imageUrl: string;
  tweetText: string;
  tweetUrl: string;
}

interface ImageGeneratorService {
  /**
   * OG画像を生成
   * @param data - 画像データ
   * @param config - 画像設定
   * @returns 生成された画像
   */
  generateImage(
    data: ShareImageData,
    config: ShareImageConfig
  ): Promise<GeneratedImage>;

  /**
   * 言語に応じた背景グラデーションを取得
   * @param language - プログラミング言語
   * @returns CSSグラデーション文字列
   */
  getLanguageGradient(language: string): string;
}

interface R2StorageService {
  /**
   * R2に画像をアップロード
   * @param image - 画像データ
   * @param key - ストレージキー
   * @returns 公開URL
   */
  uploadImage(image: GeneratedImage, key: string): Promise<string>;

  /**
   * ストレージキーを生成
   * @param data - シェアデータ
   * @returns ストレージキー
   */
  generateKey(data: ShareImageData): string;
}

interface ShareService {
  /**
   * シェア情報を生成
   * @param data - シェアデータ
   * @returns シェア結果（画像URL、ツイートテキスト、ツイートURL）
   */
  createShare(data: ShareImageData): Promise<ShareResult>;

  /**
   * ツイートテキストを生成
   * @param data - シェアデータ
   * @returns ツイートテキスト
   */
  generateTweetText(data: ShareImageData): string;

  /**
   * X Web Intent URLを生成
   * @param tweetText - ツイートテキスト
   * @param imageUrl - 画像URL
   * @returns X Intent URL
   */
  generateTweetUrl(tweetText: string, imageUrl: string): string;
}
```

### 7.3 画像生成仕様

#### 7.3.1 画像サイズとフォーマット
- サイズ：1200x630px（Twitter/X OGP推奨サイズ）
- フォーマット：PNG
- 品質：最高品質（ロスレス）

#### 7.3.2 デザイン要素配置
```typescript
interface ImageLayout {
  background: {
    gradient: string; // 言語別グラデーション
  };
  title: {
    text: "Code Review Game";
    fontSize: 48;
    color: "#FFFFFF";
    position: { x: 600, y: 80 }; // 中央揃え
  };
  score: {
    text: `${score}点`;
    fontSize: 120;
    fontWeight: "bold";
    color: "#FFFFFF";
    position: { x: 600, y: 200 }; // 中央揃え
  };
  subtitle: {
    text: `${language} - Level ${level}`;
    fontSize: 36;
    color: "rgba(255, 255, 255, 0.8)";
    position: { x: 600, y: 350 }; // 中央揃え
  };
  icon: {
    path: "/public/images/coderabbit-icon.png";
    size: { width: 80, height: 80 };
    position: { x: 1100, y: 530 }; // 右下
    opacity: 0.8;
  };
  badge?: {
    // 70点以上の場合のみ表示
    text: "合格";
    backgroundColor: "#FFD700";
    color: "#000000";
    fontSize: 32;
    position: { x: 1050, y: 100 }; // 右上
  };
}
```

#### 7.3.3 言語別グラデーション
```typescript
const languageGradients = {
  javascript: "linear-gradient(135deg, #F7DF1E 0%, #FFA500 100%)",
  python: "linear-gradient(135deg, #3776AB 0%, #FFD43B 100%)",
  flutter: "linear-gradient(135deg, #02569B 0%, #13B9FD 100%)"
};
```

### 7.4 R2ストレージ設定

#### 7.4.1 バケット構成
- バケット名：`review-game-share-images`
- 公開アクセス：有効
- ディレクトリ構造：`share/{language}/{level}/{timestamp}.png`
- 例：`share/javascript/1/1699999999999.png`

#### 7.4.2 環境変数
```typescript
interface R2Config {
  BUCKET_NAME: string; // "review-game-share-images"
  PUBLIC_URL: string; // "https://share.review-game.com"
  ACCOUNT_ID: string; // Cloudflare Account ID
  ACCESS_KEY_ID: string; // R2 Access Key
  SECRET_ACCESS_KEY: string; // R2 Secret Key
}
```

### 7.5 Xシェアフロー

1. **ユーザーアクション**：結果画面で「Xでシェア」ボタンをクリック
2. **クライアント処理**：
   - `/api/share-image` にPOSTリクエスト
   - パラメータ：`{ score, language, level }`
   - ローディング表示開始（「シェア画像を生成中...」）
3. **サーバー処理**：
   - 画像生成（Canvas APIまたは@vercel/og）
   - R2にアップロード
   - 公開URLを取得
   - ツイートテキスト生成
   - X Web Intent URL生成
4. **クライアント処理**：
   - ローディング終了
   - 新しいタブでX Web Intent URLを開く
5. **ユーザーアクション**：Xの投稿画面でツイート

### 7.6 ツイートテキストテンプレート
```typescript
const tweetTemplate = (data: ShareImageData) => `
#CodeRabbit コードレビューゲームで${data.score}点を獲得しました！
言語: ${data.language} | レベル: ${data.level}

${process.env.GAME_URL}
`.trim();
```

### 7.7 エラーハンドリング
```typescript
interface ShareError {
  code: 'IMAGE_GENERATION_FAILED' | 'UPLOAD_FAILED' | 'INVALID_PARAMS';
  message: string;
  retryable: boolean;
}

interface ErrorHandler {
  /**
   * エラー処理
   * @param error - エラー情報
   * @returns ユーザー向けメッセージ
   */
  handleError(error: ShareError): string;
}
```

- 画像生成失敗：「画像の生成に失敗しました。もう一度お試しください。」
- アップロード失敗：「画像のアップロードに失敗しました。ネットワーク接続を確認してください。」
- パラメータ不正：「不正なパラメータです。」

---

## 8. 実装優先順位

### 8.1 Phase 3-1（優先度：高）
1. **ローディング状態表示** - ユーザーフィードバックの基盤
2. **シンタックスハイライト** - コード可読性の向上
3. **コード/要件クリック時の自動入力** - レビュー効率化

### 8.2 Phase 3-2（優先度：中）
4. **レスポンシブデザイン最適化** - モバイル対応
5. **アニメーション・トランジション** - UX向上

### 8.3 Phase 3-3（優先度：高、独立実装可能）
6. **Xシェア機能** - バイラル性向上

---

## 9. 技術スタック

### 9.1 新規追加ライブラリ
```json
{
  "dependencies": {
    "react-syntax-highlighter": "^15.5.0",
    "@types/react-syntax-highlighter": "^15.5.11",
    "@vercel/og": "^0.6.0"
  }
}
```

### 9.2 Cloudflare Workers追加設定
```toml
# wrangler.jsonc に追加
[[r2_buckets]]
binding = "SHARE_IMAGES"
bucket_name = "review-game-share-images"
```

### 9.3 環境変数
```bash
R2_PUBLIC_URL=https://share.review-game.com
GAME_URL=https://review-game.com
```

---

## 10. パフォーマンス考慮事項

### 10.1 画像生成の最適化
- 同一スコア・言語・レベルの画像はキャッシュして再利用
- 画像生成を非同期処理で実行
- タイムアウト設定（15秒）

### 10.2 シンタックスハイライトの最適化
- コード変更時のみ再計算（React.memo使用）
- 大きなコードファイルの場合は仮想スクロール検討

### 10.3 アニメーションの最適化
- `transform`と`opacity`のみ使用（GPU活用）
- `will-change`プロパティで最適化
- アニメーション中の再レンダリング抑制

### 10.4 レスポンシブの最適化
- CSSメディアクエリを活用（JavaScriptの使用最小化）
- 画像の遅延読み込み（lazy loading）
- モバイルでのタッチイベント最適化

---

## 11. テスト方針

### 11.1 単体テスト
- 各Serviceの関数テスト（Jest/Vitest）
- テンプレート生成ロジックのテスト
- グラデーション生成のテスト

### 11.2 統合テスト
- 画像生成からR2アップロードまでのフロー
- シェアボタンクリックからX Intent表示まで

### 11.3 E2Eテスト（Playwright）
- コードクリック時の自動入力動作
- レスポンシブレイアウトの検証
- ローディング表示の確認
- シェア機能の動作確認

### 11.4 ビジュアルリグレッションテスト
- 生成される画像のビジュアル確認
- アニメーションの滑らかさ確認

---

## 12. セキュリティ考慮事項

### 12.1 画像生成
- スコアのバリデーション（0-100）
- 言語・レベルのホワイトリスト検証
- 画像サイズ制限（最大5MB）

### 12.2 R2アップロード
- ファイル名のサニタイゼーション
- Content-Typeの検証
- レート制限（ユーザーあたり1分間に5回まで）

### 12.3 XSS対策
- ユーザー入力のエスケープ処理
- ツイートテキストのサニタイゼーション

---

## 13. まとめ

Phase 3では、6つのUX改善機能を実装し、ユーザー体験を大幅に向上させます。特にXシェア機能はアプリの成長に直結する重要な機能です。実装は3つのサブフェーズに分け、段階的にリリースすることで、早期のユーザーフィードバックを得ながら品質を高めていきます。
