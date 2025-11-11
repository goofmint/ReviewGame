/**
 * Problem Page Route
 * Displays the code review problem with requirements, code, and review input
 *
 * Users can read the requirements, examine the code, and submit their review
 * Upon submission, the review is sent to the LLM evaluation API
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useFetcher } from "react-router";
import { problems } from "~/data/problems";
import { ErrorCard } from "~/components/ErrorCard";
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

export async function action({
  request,
  params,
  context,
}: {
  request: Request;
  params: { lang?: string; level?: string, review?: string };
  context?: { cloudflare?: { env?: Record<string, unknown> } };
}) {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const body = await request.json() as EvaluationRequestBody;
  const { GEMINI_API_KEY } = context?.cloudflare?.env as { GEMINI_API_KEY: string };
  try {
    const result = await evaluate(body, { GEMINI_API_KEY });
    console.log({ result });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response((error as Error).message, { status: 500 });
  }
}


export default function ProblemPage() {
  const { lang, level } = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate parameters and check if problem exists
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

  // Check if level is unlocked (client-side check only, not security-critical)
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

  const codeLines = problem.code.split("\n");

  /**
   * Handles review submission
   * Sends the review to the evaluation API and navigates to the result page
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate review content
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
  
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const result = fetcher.data as EvaluationResult;
      navigate(`/${lang}/${level}/result`, {
        state: {
          review,
          ...result,
        },
      });
    }
  }, [fetcher.state, fetcher.data]);

  /**
   * Inserts a template text into the review textarea
   * Useful for helping users reference specific lines
   */
  const insertTemplate = (template: string) => {
    setReview((prev) => (prev ? `${prev}\n${template}` : template));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
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
          {/* Two-column layout: requirements/code on left (2/3), review on right (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left side: Requirements and Code stacked vertically (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Requirements Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">📋</span>
                  要件
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                    {problem.requirements}
                  </pre>
                </div>
              </div>

              {/* Code Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-2xl mr-2">💻</span>
                  コード
                </h2>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm">
                    {codeLines.map((line: string, index: number) => (
                      <div
                        key={index}
                        className="flex hover:bg-yellow-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        onClick={() =>
                          insertTemplate(`コードの${index + 1}行目: `)
                        }
                        title="クリックしてレビューに追加"
                      >
                        <span className="select-none text-gray-400 dark:text-gray-600 w-10 text-right mr-4">
                          {index + 1}
                        </span>
                        <code className="text-gray-800 dark:text-gray-200">
                          {line || " "}
                        </code>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            </div>

            {/* Right side: Review Input Section (1/3 width) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:sticky lg:top-8 lg:self-start">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">✍️</span>
                あなたのレビュー
              </h2>
              <textarea
                value={review}
                onChange={(e) => {
                  setReview(e.target.value);
                  setError("");
                }}
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="コードの問題点を指摘してください...&#10;&#10;例:&#10;- コードの5行目: 上限チェックがありません&#10;- 要件「150以下の整数」について: 型チェックが不足しています"
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

        {/* Hints Section */}
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
          </ul>
        </div>
      </div>
    </div>
  );
}
