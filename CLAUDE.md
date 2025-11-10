# コードレビューゲーム 基本設計書

## 1. プロジェクト概要

コードレビューのスキルを楽しく学習できるゲーム形式のWebアプリケーション。
ユーザーは様々なプログラミング言語のコードに対してレビューを行い、AI（LLM）による評価を受けて得点を獲得し、レベルアップしていく。

## 2. 機能要件

### 2.1 言語選択画面
- 対応言語：JavaScript、Flutter (Dart)、Python
- 初期表示で言語を選択
- 選択後、レベル選択画面へ遷移

### 2.2 レベル選択画面
- レベル1〜3まで用意
- 各レベルの難易度表示
- レベルのロック/アンロック状態の管理（70点以上で次レベルがアンロック）

### 2.3 問題表示画面
- **要件セクション**：コードが満たすべき要件を表示
- **コードセクション**：レビュー対象のコードを表示（行番号付き）
- **レビュー入力セクション**：テキストエリアでレビュー内容を入力
- クリック機能：コードまたは要件をクリックすると、「コードの◯◯行は〜」といったテンプレートがテキストエリアに自動挿入

### 2.4 レビュー評価機能
- ユーザーが入力したレビュー内容をLLMに送信
- あらかじめ用意された「お手本レビュー」との整合性をLLMがチェック
- LLMが以下の観点で評価：
  - 指摘の正確性（お手本との一致度）
  - 指摘の網羅性（重要なポイントを見逃していないか）
  - 説明の分かりやすさ
- 0〜100点でスコアリング

### 2.5 結果表示画面
- 獲得スコアの表示
- LLMによるフィードバックコメント
- お手本レビューの表示
- 70点以上で次のレベルがアンロック
- 「もう一度挑戦」「次のレベルへ」「言語選択に戻る」ボタン

### 2.6 ソーシャルシェア機能（X連携）
- **シェアボタン**：結果表示画面に「Xでシェア」ボタンを表示
- **シェア画像生成**：
  - 評価スコアとプログラミング言語を含むOG画像を動的生成
  - 画像サイズ：1200x630px（X/Twitterカード推奨サイズ）
  - デザイン要素：
    - スコア（大きく中央に表示）
    - プログラミング言語名とレベル
    - 背景グラデーション（言語ごとに色分け）
    - CodeRabbitのアイコン画像を右下に配置
- **R2への画像保存**：
  - 生成した画像をCloudflare R2に保存
  - ファイル名形式：`share/{language}/{level}/{timestamp}.png`
  - 公開URL経由でアクセス可能に設定
- **Xポストテンプレート**：
  ```
  #CodeRabbit コードレビューゲームで{score}点を獲得しました！
  言語: {language} | レベル: {level}

  {gameURL}
  ```
- **ポスト機能**：
  - X API（旧Twitter API）またはWeb Intent経由でのシェア
  - 画像付きツイート（R2の画像URLを添付）
  - ゲームURLを含めて誘導

## 3. 技術スタック

### 3.1 フロントエンド/バックエンド
- **Remix**: フルスタックReactフレームワーク
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: スタイリング

### 3.2 ホスティング
- **Cloudflare Workers**: エッジでの高速実行
- **Cloudflare Pages**: 静的アセットのホスティング

### 3.3 LLM連携
- **Cloudflare AI** または **外部LLM API**（OpenAI/Anthropic）
  - レビュー評価機能に使用
  - プロンプトエンジニアリングで評価精度を確保

### 3.4 コンテンツ管理
- **Markdown**: 問題・要件・お手本レビューを記述
  - ソースファイル：`problems/`ディレクトリに配置
  - ビルド時処理：gray-matterでMarkdownをパース
  - 出力：TypeScriptファイルとしてバンドル
- **ビルドプロセス**：
  - ビルドスクリプト（`scripts/build-problems.ts`）で自動変換
  - `app/data/problems.ts`を生成（静的インポート可能）
  - DBやKV不要、ファイルシステムアクセスなし

### 3.5 画像ストレージ
- **Cloudflare R2**: シェア画像の保存
  - S3互換のオブジェクトストレージ
  - 公開バケット設定で直接アクセス可能
  - 低コストで大容量ストレージ

### 3.6 画像生成
- **@vercel/og** または **Canvas API**: OG画像の動的生成
  - サーバーサイドでの画像レンダリング
  - JSXライクな構文で画像をデザイン
  - PNGフォーマットで出力

### 3.7 ビルドツール
- **gray-matter**: MarkdownのFront Matter解析
- **tsx**: TypeScriptビルドスクリプトの実行
- 依存パッケージ：
  ```json
  {
    "devDependencies": {
      "gray-matter": "^4.0.3",
      "tsx": "^4.7.0",
      "@types/node": "^20.10.0"
    }
  }
  ```

## 4. アーキテクチャ設計

### 4.1 ディレクトリ構成

```
ReviewGame/
├── app/
│   ├── routes/
│   │   ├── _index.tsx           # 言語選択画面
│   │   ├── $lang._index.tsx     # レベル選択画面
│   │   ├── $lang.$level.tsx     # 問題表示・レビュー画面
│   │   ├── api.evaluate.tsx     # レビュー評価API
│   │   └── api.share-image.tsx  # シェア画像生成API
│   ├── components/
│   │   ├── LanguageSelector.tsx
│   │   ├── LevelSelector.tsx
│   │   ├── ProblemView.tsx
│   │   ├── CodeDisplay.tsx
│   │   ├── RequirementsDisplay.tsx
│   │   ├── ReviewInput.tsx
│   │   ├── ResultView.tsx
│   │   └── ShareButton.tsx      # Xシェアボタン
│   ├── utils/
│   │   ├── llm.ts              # LLM連携ロジック
│   │   ├── scorer.ts           # スコア計算
│   │   ├── imageGenerator.ts   # OG画像生成
│   │   ├── r2.ts               # R2アップロードユーティリティ
│   │   └── share.ts            # シェアテキスト生成
│   ├── data/
│   │   └── problems.ts         # ビルド時に自動生成される問題データ
│   ├── types/
│   │   └── problem.ts          # 型定義
│   └── root.tsx
├── problems/                   # ソースファイル（Markdown）
│   ├── javascript/
│   │   ├── level1.md
│   │   ├── level2.md
│   │   └── level3.md
│   ├── python/
│   │   ├── level1.md
│   │   ├── level2.md
│   │   └── level3.md
│   └── flutter/
│       ├── level1.md
│       ├── level2.md
│       └── level3.md
├── scripts/
│   └── build-problems.ts       # ビルド時にMarkdown→TSに変換
├── public/
│   └── images/
│       └── coderabbit-icon.png  # CodeRabbitアイコン
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── wrangler.toml              # Cloudflare Workers設定
└── README.md
```

### 4.2 問題ファイルフォーマット（Markdown）

```markdown
---
title: "レベル1: 基本的なバグ発見"
difficulty: 1
language: javascript
---

# 要件

ユーザーの年齢を検証する関数を実装してください。
- 年齢は0以上150以下の整数である必要がある
- 不正な値の場合はエラーを投げる

# コード

\`\`\`javascript
function validateAge(age) {
  if (age < 0) {
    throw new Error('年齢は0以上である必要があります');
  }
  return true;
}
\`\`\`

# お手本レビュー

1. **上限チェックの欠如**: コードの2-4行目で下限（0以上）のみチェックしていますが、上限（150以下）のチェックが実装されていません。

2. **型チェックの欠如**: 要件では「整数」と指定されていますが、実装では数値型かどうか、整数かどうかのチェックがありません。

3. **エラーメッセージの不整合**: 上限チェックがないため、上限を超えた場合のエラーメッセージも用意されていません。

4. **改善提案**:
   - `Number.isInteger(age)` で整数チェック
   - `age <= 150` で上限チェック
   - それぞれに適切なエラーメッセージを設定
\`\`\`
```

### 4.3 ビルドプロセス

ビルド時に`scripts/build-problems.ts`を実行し、Markdownファイルを読み込んでTypeScriptファイルに変換します。

```typescript
// scripts/build-problems.ts の例
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const problemsDir = path.join(process.cwd(), 'problems');
const languages = ['javascript', 'python', 'flutter'];
const levels = [1, 2, 3];

const allProblems = {};

languages.forEach(lang => {
  allProblems[lang] = {};
  levels.forEach(level => {
    const filePath = path.join(problemsDir, lang, `level${level}.md`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    // Markdownをセクションごとに分割
    const sections = content.split(/^# /m).filter(Boolean);
    const requirements = sections.find(s => s.startsWith('要件'))?.replace('要件\n\n', '').trim();
    const codeSection = sections.find(s => s.startsWith('コード'));
    const code = codeSection?.match(/```[\s\S]*?\n([\s\S]*?)```/)?.[1]?.trim();
    const modelReview = sections.find(s => s.startsWith('お手本レビュー'))?.replace('お手本レビュー\n\n', '').trim();

    allProblems[lang][level] = {
      title: data.title,
      difficulty: data.difficulty,
      language: data.language,
      requirements,
      code,
      modelReview
    };
  });
});

// app/data/problems.ts に出力
const outputPath = path.join(process.cwd(), 'app/data/problems.ts');
const output = `// このファイルは自動生成されます。直接編集しないでください。
export const problems = ${JSON.stringify(allProblems, null, 2)} as const;
`;

fs.writeFileSync(outputPath, output, 'utf8');
```

**package.jsonのスクリプト**:
```json
{
  "scripts": {
    "prebuild": "tsx scripts/build-problems.ts",
    "build": "remix vite:build",
    "dev": "tsx scripts/build-problems.ts && remix vite:dev"
  }
}
```

## 5. データ構造

### 5.1 Problem型

```typescript
interface Problem {
  title: string;
  difficulty: 1 | 2 | 3;
  language: 'javascript' | 'python' | 'flutter';
  requirements: string;
  code: string;
  modelReview: string;
}
```

### 5.2 UserReview型

```typescript
interface UserReview {
  content: string;
  submittedAt: Date;
}
```

### 5.3 EvaluationResult型

```typescript
interface EvaluationResult {
  score: number;              // 0-100
  feedback: string;           // LLMによるフィードバック
  strengths: string[];        // 良かった点
  improvements: string[];     // 改善点
  passed: boolean;            // 70点以上かどうか
}
```

### 5.4 ProgressState型（ローカルストレージ）

```typescript
interface ProgressState {
  [language: string]: {
    [level: number]: {
      unlocked: boolean;
      bestScore?: number;
      attempts: number;
    }
  }
}
```

### 5.5 ShareImageData型

```typescript
interface ShareImageData {
  score: number;
  language: 'javascript' | 'python' | 'flutter';
  level: 1 | 2 | 3;
  timestamp: number;
}

interface ShareResult {
  imageUrl: string;         // R2に保存された画像のURL
  tweetText: string;        // 生成されたツイートテキスト
  tweetUrl: string;         // X Web IntentのURL
}
```

## 6. 主要機能の実装フロー

### 6.1 問題読み込みフロー

**ビルド時**:
1. `scripts/build-problems.ts` が実行される
2. `problems/` ディレクトリ内の全Markdownファイルを読み込み
3. gray-matterでFront Matterとコンテンツを解析
4. TypeScript形式で `app/data/problems.ts` に出力

**ランタイム時**:
1. ユーザーが言語とレベルを選択
2. ルートコンポーネントで `import { problems } from '~/data/problems'`
3. `problems[language][level]` で該当する問題データを取得
4. Problem型オブジェクトとして使用（ファイルI/O不要）

### 6.2 コード/要件クリック時の自動入力

1. CodeDisplayコンポーネントで各行にクリックイベント設定
2. クリック時、行番号を取得
3. 「コードの{行番号}行目: 」をテキストエリアに挿入
4. カーソルを末尾に移動

### 6.3 レビュー評価フロー

1. ユーザーがレビューを入力して送信
2. `/api/evaluate` エンドポイントにPOST
3. サーバー側でLLMにプロンプトを送信
   ```
   あなたはコードレビューの評価者です。
   以下のユーザーレビューと模範レビューを比較し、評価してください。

   【模範レビュー】
   {modelReview}

   【ユーザーレビュー】
   {userReview}

   【評価基準】
   - 指摘の正確性: 模範レビューと同様の問題点を指摘できているか
   - 網羅性: 重要なポイントを見逃していないか
   - 説明の明確性: 分かりやすく説明できているか

   JSON形式で以下を返してください:
   {
     "score": 0-100の数値,
     "feedback": "全体的なフィードバック",
     "strengths": ["良かった点1", "良かった点2"],
     "improvements": ["改善点1", "改善点2"]
   }
   ```
4. LLMの応答を解析
5. EvaluationResult型で返却
6. スコアが70以上なら次レベルをアンロック（ローカルストレージに保存）

### 6.4 シェア画像生成とXポストフロー

1. ユーザーが結果画面で「Xでシェア」ボタンをクリック
2. クライアントから `/api/share-image` にPOSTリクエスト
   - パラメータ：`{ score, language, level }`
3. サーバー側で画像生成処理：
   ```typescript
   // imageGenerator.ts
   - Canvas APIまたは@vercel/ogを使用
   - 1200x630pxの画像を生成
   - スコアを中央に大きく表示
   - 言語名とレベルを表示
   - 背景にグラデーション（言語ごとに異なる色）
   - CodeRabbitアイコンを右下に配置
   ```
4. 生成した画像をR2にアップロード：
   ```typescript
   // r2.ts
   - ファイル名：`share/${language}/${level}/${timestamp}.png`
   - Content-Type: image/png
   - 公開アクセス可能に設定
   ```
5. R2の公開URLを取得
6. ツイートテキストを生成：
   ```
   #CodeRabbit コードレビューゲームで{score}点を獲得しました！
   言語: {language} | レベル: {level}

   https://review-game.example.com
   ```
7. X Web Intent URLを生成：
   ```
   https://twitter.com/intent/tweet?
     text={encodeURIComponent(tweetText)}&
     url={encodeURIComponent(imageUrl)}
   ```
8. クライアントに `{ imageUrl, tweetText, tweetUrl }` を返却
9. クライアントで新しいタブを開いてtweetUrlにアクセス

## 7. 状態管理

### 7.1 サーバーサイド
- 状態なし（ステートレス）
- 各リクエストで問題ファイルを読み込み

### 7.2 クライアントサイド
- **React State**: 現在のレビュー入力内容、評価結果
- **Local Storage**:
  - 進捗状態（各レベルのアンロック状態、最高スコア）
  - セッション情報は保持しない（リロードで初期化OK）

## 8. UI/UX設計

### 8.1 言語選択画面
- 3つの言語カードを横並びで表示
- カードにはアイコンと言語名
- ホバー時にアニメーション

### 8.2 レベル選択画面
- レベル1〜3のカードを表示
- ロック中のレベルはグレーアウト
- 各レベルに難易度表示（星の数など）
- 最高スコアを表示（達成済みの場合）

### 8.3 問題画面
- 3カラムレイアウト
  - 左: 要件表示
  - 中央: コード表示（行番号付き、シンタックスハイライト）
  - 右: レビュー入力エリア
- レスポンシブ対応（スマホでは縦積み）

### 8.4 結果画面
- スコアを大きく表示
- 合格/不合格を明確に
- フィードバックを見やすく整形
- お手本レビューとの比較表示
- **Xシェアボタン**：
  - 目立つ位置に配置
  - Xのロゴアイコン付き
  - クリックで画像生成とシェア画面へ遷移

## 9. Cloudflare Workers対応

### 9.1 wrangler.toml設定

```toml
name = "review-game"
main = "build/index.js"
compatibility_date = "2024-01-01"

[site]
bucket = "./public"

# 問題データはビルド時にバンドルされるためKV不要

[[r2_buckets]]
binding = "SHARE_IMAGES"
bucket_name = "review-game-share-images"
preview_bucket_name = "review-game-share-images-preview"
```

### 9.2 環境変数
- `LLM_API_KEY`: LLM APIのキー（Cloudflare Workersのシークレットに設定）
- `R2_PUBLIC_URL`: R2バケットの公開URL（例：https://share.review-game.com）
- `GAME_URL`: ゲームのベースURL（例：https://review-game.com）

### 9.3 R2バケット設定
- バケット名：`review-game-share-images`
- 公開アクセス設定：有効
- カスタムドメイン設定（オプション）
- CORS設定：必要に応じて設定

## 10. 実装の優先順位

### Phase 1: MVP（最小機能版）
1. 基本的なRemixプロジェクトのセットアップ
2. 言語選択画面
3. レベル選択画面（レベル1のみ）
4. 問題表示画面（JavaScript Level 1のみ）
5. レビュー入力機能
6. 静的な評価（お手本を表示するのみ）

### Phase 2: コア機能
1. LLM連携によるレビュー評価
2. スコアリング機能
3. 進捗管理（ローカルストレージ）
4. レベルアンロック機能
5. 全言語・全レベルの問題追加

### Phase 3: UX向上
1. コード/要件クリック時の自動入力
2. シンタックスハイライト
3. アニメーション・トランジション
4. レスポンシブデザインの最適化
5. ローディング状態の表示
6. **Xシェア機能の実装**：
   - OG画像生成機能
   - R2への画像アップロード
   - シェアボタンの実装
   - X Web Intentとの連携

### Phase 4: 追加機能（オプション）
1. ヒント機能
2. 過去の挑戦履歴
3. ランキング機能（ローカル）
4. シェア機能の拡張（他のSNS対応）

## 11. セキュリティ考慮事項

- LLM APIキーはCloudflare Workersのシークレットで管理
- ユーザー入力のサニタイゼーション
- レート制限（LLM API呼び出し）
- XSS対策（Reactのデフォルト対策）
- **R2アクセス制御**：
  - 画像生成APIのレート制限（スパム対策）
  - ファイル名のサニタイゼーション
  - 画像サイズの制限（最大5MB程度）
  - 不正なパラメータのバリデーション

## 12. パフォーマンス最適化

- Cloudflare Workersでエッジキャッシング
- **問題データの最適化**：
  - ビルド時に全問題をバンドル（9問のみで軽量）
  - ランタイムでのファイルI/O不要
  - 即座にアクセス可能（レイテンシゼロ）
  - Workersのバンドルサイズ制限内に収まる（問題データは数KB程度）
- LLM応答のキャッシング（同一レビュー内容の場合）
- Code Splittingによる初期ロード最適化
- **R2画像の最適化**：
  - 同一スコアの画像をキャッシュして再利用
  - CloudflareのCDN経由で配信
  - 画像生成の非同期処理
  - R2のライフサイクルポリシー（古い画像の自動削除）

## 13. 今後の拡張性

- **新しい言語の追加が容易**：
  - `problems/{language}/` ディレクトリを追加
  - ビルドスクリプトで自動的に検出・変換
- **レベル数の拡張が容易**：
  - Markdownファイルを追加するだけ
  - 型定義を更新すれば型安全性も維持
- **問題数が大幅に増えた場合の対応**：
  - 現状：9問（軽量、バンドル可能）
  - 将来的に100問以上になる場合：
    - Cloudflare KVへの移行を検討
    - または問題を動的にfetchする形式に変更
    - Route単位でのCode Splittingを活用
- **カスタム問題のインポート機能**
- **マルチプレイヤーモード**
- **AIによる問題自動生成**

---

## 付録A: シェア画像のデザイン仕様

### 画像サイズとレイアウト
- サイズ：1200x630px（X/Twitter OGP推奨サイズ）
- フォーマット：PNG
- 背景：言語ごとのグラデーション
  - JavaScript: 黄色系グラデーション (#F7DF1E → #FFA500)
  - Python: 青系グラデーション (#3776AB → #FFD43B)
  - Flutter: 青系グラデーション (#02569B → #13B9FD)

### コンテンツ配置
1. **中央エリア（スコア）**：
   - フォントサイズ：120px
   - フォント：太字
   - 色：白
   - テキスト："{score}点"
   - 位置：中央上部（Y: 200px）

2. **サブテキストエリア**：
   - フォントサイズ：36px
   - 色：白（80%透明度）
   - テキスト："{language} - Level {level}"
   - 位置：スコアの下（Y: 350px）

3. **タイトルエリア**：
   - フォントサイズ：48px
   - 色：白
   - テキスト："Code Review Game"
   - 位置：上部（Y: 80px）

4. **CodeRabbitアイコン**：
   - サイズ：80x80px
   - 位置：右下（X: 1100px, Y: 530px）
   - 半透明オーバーレイ（20%白）付き

### 追加装飾
- 合格（70点以上）の場合：金色のボーダーまたはバッジ追加
- スコアに応じた星マーク表示（オプション）

---

## 付録B: サンプルプロンプト（LLM評価用）

```
あなたは経験豊富なコードレビューアです。新人エンジニアのコードレビューを評価してください。

【問題の要件】
{requirements}

【レビュー対象コード】
{code}

【模範的なレビュー】
{modelReview}

【新人エンジニアのレビュー】
{userReview}

【評価タスク】
新人エンジニアのレビューを以下の観点で評価してください：

1. 正確性（40点）: 模範レビューで指摘されている重要な問題点を正しく指摘できているか
2. 網羅性（30点）: 見逃している重要な指摘がないか
3. 説明力（20点）: 指摘内容が分かりやすく、建設的に説明されているか
4. 追加価値（10点）: 模範レビューにはない有益な指摘があるか

【出力形式】
以下のJSON形式で評価結果を返してください：

{
  "score": 75,
  "feedback": "全体的によくできています。主要な問題点を指摘できていますが、型チェックの重要性についての説明がやや不足しています。",
  "strengths": [
    "上限チェックの欠如を正確に指摘できています",
    "具体的な改善案を提示できています"
  ],
  "improvements": [
    "型チェックの重要性についてより詳しく説明できるとよいでしょう",
    "セキュリティ観点からの指摘も加えられるとさらに良いです"
  ]
}
```
