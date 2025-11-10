import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { problems } from "~/data/problems";
import type { Route } from "./+types/$lang.$level";

export function meta({ params }: Route.MetaArgs) {
  return [
    {
      title: `${params.lang} レベル${params.level} - コードレビューゲーム`,
    },
    { name: "description", content: "コードをレビューしてスキルアップ" },
  ];
}

export default function ProblemPage() {
  const { lang, level } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lang || !level || !(lang in problems)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            問題が見つかりません
          </h1>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            言語選択に戻る
          </Link>
        </div>
      </div>
    );
  }

  const langProblems = problems[lang as keyof typeof problems];
  const problem = langProblems[level as keyof typeof langProblems];

  if (!problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            このレベルの問題はまだ準備されていません
          </h1>
          <Link
            to={`/${lang}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            レベル選択に戻る
          </Link>
        </div>
      </div>
    );
  }

  const codeLines = problem.code.split("\n");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!review.trim()) {
      alert("レビューを入力してください");
      return;
    }

    setIsSubmitting(true);

    // MVP: 静的な結果を表示
    // Phase 2でLLM評価を実装
    setTimeout(() => {
      navigate(`/${lang}/${level}/result`, {
        state: {
          review,
          score: 0,
          passed: false,
          feedback: "MVP版では評価機能はまだ実装されていません。",
          strengths: [],
          improvements: [],
        },
      });
      setIsSubmitting(false);
    }, 500);
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

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* 要件セクション */}
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

            {/* コードセクション */}
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
                      className="flex hover:bg-yellow-50 dark:hover:bg-gray-700"
                    >
                      <span className="select-none text-gray-400 dark:text-gray-600 w-10 text-right mr-4">
                        {index + 1}
                      </span>
                      <code className="text-gray-800 dark:text-gray-200">
                        {line}
                      </code>
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {/* レビュー入力セクション */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-2xl mr-2">✍️</span>
                あなたのレビュー
              </h2>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="コードの問題点を指摘してください...&#10;&#10;例:&#10;- コードの5行目: 上限チェックがありません&#10;- 要件「150以下の整数」について: 型チェックが不足しています"
              />
              <button
                type="submit"
                disabled={isSubmitting || !review.trim()}
                className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {isSubmitting ? "送信中..." : "レビューを送信"}
              </button>
            </div>
          </div>
        </form>

        <div className="max-w-4xl mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💡 ヒント
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>要件を満たしていない部分はないか確認しましょう</li>
            <li>エラーハンドリングは適切ですか？</li>
            <li>型チェックは必要ありませんか？</li>
            <li>境界値のテストは考慮されていますか？</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
