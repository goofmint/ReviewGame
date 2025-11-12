/**
 * Problem Page Route
 * Displays the code review problem with requirements, code, and review input
 *
 * Users can read the requirements, examine the code, and submit their review
 * Upon submission, the review is sent to the LLM evaluation API
 *
 * Phase 3 Updates:
 * - シンタックスハイライト対応（CodeDisplayコンポーネント）
 * - 要件クリック時のMarkdown見出し自動挿入（RequirementsDisplayコンポーネント）
 * - ローディング状態表示（LoadingSpinnerコンポーネント）
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useFetcher } from "react-router";
import { problems } from "~/data/problems";
import { ErrorCard } from "~/components/ErrorCard";
import { CodeDisplay } from "~/components/CodeDisplay";
import { RequirementsDisplay } from "~/components/RequirementsDisplay";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { isLevelUnlocked } from "~/utils/progress";
import type { Route } from "./+types/$lang.$level";
import type { EvaluationResult } from "~/types/problem";
import { evaluate } from "~/utils/evaluate";
import type { EvaluationRequestBody } from "~/types/evaluate";

export function meta({ params }: Route.MetaArgs) {
  return [
    {
      title: `${params.lang} レベル${params.level} - コードレビューゲーム`,
    },
    { name: "description", content: "コードをレビューしてスキルアップ" },
  ];
}

/**
 * レビュー評価のアクション
 * LLMにレビュー内容を送信して評価結果を取得
 */
export async function action({
  request,
  params,
  context,
}: {
  request: Request;
  params: { lang?: string; level?: string };
  context?: { cloudflare?: { env?: Record<string, unknown> } };
}) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as EvaluationRequestBody;
  const env = context?.cloudflare?.env as
    | { GEMINI_API_KEY?: string }
    | undefined;
  const GEMINI_API_KEY = env?.GEMINI_API_KEY;

  try {
    const result = await evaluate(body, { GEMINI_API_KEY });
    console.log({ result });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export default function ProblemPage() {
  const { lang, level } = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // パラメータの検証と問題の存在確認
  if (!lang || !level || !(lang in problems)) {
    return (
      <ErrorCard
        title="問題が見つかりません"
        linkTo="/"
        linkText="言語選択に戻る"
      />
    );
  }

  const langProblems = problems[lang as keyof typeof problems];
  const problem = langProblems[level as keyof typeof langProblems];

  if (!problem) {
    return (
      <ErrorCard
        title="このレベルの問題はまだ準備されていません"
        linkTo={`/${lang}`}
        linkText="レベル選択に戻る"
      />
    );
  }

  // レベルのアンロック状態を確認（クライアント側のチェックのみ）
  const unlocked = isLevelUnlocked(lang, level);
  if (!unlocked) {
    return (
      <ErrorCard
        title="このレベルはまだロックされています"
        linkTo={`/${lang}`}
        linkText="レベル選択に戻る"
      />
    );
  }

  /**
   * レビュー送信ハンドラ
   * 評価APIにレビューを送信し、結果画面に遷移
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // レビュー内容のバリデーション
    if (!review.trim()) {
      setError("レビューを入力してください");
      return;
    }

    if (review.trim().length < 10) {
      setError("レビューは10文字以上入力してください");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const body = {
        language: String(lang),
        level: String(level),
        review: review.trim(),
      };
      fetcher.submit(body, {
        method: "post",
        action: `/${lang}/${level}`,
        encType: "application/json",
      });
    } catch (err) {
      console.log(err);
      setError(
        err instanceof Error
          ? err.message
          : "評価中にエラーが発生しました。もう一度お試しください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 評価完了時の処理
   * 結果画面に遷移
   */
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const result = fetcher.data as EvaluationResult;
      console.log({ result });
      navigate(`/${lang}/${level}/result`, {
        state: {
          review,
          ...result,
        },
      });
    }
  }, [fetcher.state, fetcher.data, navigate, lang, level, review]);

  /**
   * コードの行がクリックされた時の処理
   * 「コードの{行番号}行目: 」をレビュー入力エリアに挿入
   */
  const handleCodeLineClick = (lineNumber: number) => {
    const template = `コードの${lineNumber}行目: `;
    setReview((prev) => (prev ? `${prev}\n${template}` : template));
  };

  /**
   * 要件がクリックされた時の処理
   * Markdown見出し形式で要件をレビュー入力エリアに挿入
   */
  const handleRequirementClick = (requirement: string) => {
    const template = `## 要件「${requirement}」について\n\n`;
    setReview((prev) => (prev ? `${prev}\n${template}` : template));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* ローディング表示 */}
      {fetcher.state === "submitting" && (
        <LoadingSpinner message="レビューを評価中..." />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-8">
          <Link
            to={`/${lang}`}
            className="inline-block mb-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← レベル選択に戻る
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {problem.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                難易度: {"★".repeat(problem.difficulty)}
              </p>
            </div>
          </div>
        </header>

        <fetcher.Form method="post" onSubmit={handleSubmit}>
          {/* 2カラムレイアウト: 要件/コード（左2/3） + レビュー入力（右1/3） */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 左側: 要件とコードを縦に並べる */}
            <div className="lg:col-span-2 space-y-6">
              {/* 要件セクション */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📋 要件
                </h2>
                <RequirementsDisplay
                  requirements={problem.requirements}
                  onRequirementClick={handleRequirementClick}
                />
              </div>

              {/* コードセクション */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  💻 コード
                </h2>
                <CodeDisplay
                  code={problem.code}
                  language={problem.language}
                  onLineClick={handleCodeLineClick}
                />
              </div>
            </div>

            {/* 右側: レビュー入力セクション */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:sticky lg:top-8 lg:self-start">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                ✍️ あなたのレビュー
              </h2>
              <textarea
                value={review}
                onChange={(e) => {
                  setReview(e.target.value);
                  setError("");
                }}
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="コードの問題点を指摘してください...&#10;&#10;ヒント:&#10;- コードの行をクリックすると行番号が自動入力されます&#10;- 要件の項目をクリックするとMarkdown見出しが自動入力されます"
              />
              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !review.trim()}
                className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isSubmitting ? "評価中..." : "レビューを送信"}
              </button>
            </div>
          </div>
        </fetcher.Form>

        {/* ヒントセクション */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💡 ヒント
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>要件を満たしていない部分はないか確認しましょう</li>
            <li>エラーハンドリングは適切ですか？</li>
            <li>型チェックは必要ありませんか？</li>
            <li>境界値のテストは考慮されていますか？</li>
            <li>コードの行をクリックすると、レビューに行番号を追加できます</li>
            <li>要件の項目をクリックすると、Markdown見出しを追加できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
