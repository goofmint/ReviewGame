import { Link, useParams } from "react-router";
import { problems } from "~/data/problems";
import type { Route } from "./+types/$lang._index";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.lang} - コードレビューゲーム` },
    { name: "description", content: `${params.lang}のレベルを選択` },
  ];
}

export default function LevelSelect() {
  const { lang } = useParams();

  if (!lang || !(lang in problems)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            言語が見つかりません
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
  const levels = Object.keys(langProblems).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="mb-12">
          <Link
            to="/"
            className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← 言語選択に戻る
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 capitalize">
            {lang === "javascript" && "JavaScript"}
            {lang === "python" && "Python"}
            {lang === "flutter" && "Flutter"}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            レベルを選択してください
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => {
              const problem = langProblems[String(level) as keyof typeof langProblems];
              return (
                <Link
                  key={level}
                  to={`/${lang}/${level}`}
                  className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      レベル {level}
                    </h3>
                    <div className="flex">
                      {Array.from({ length: problem.difficulty }).map((_, i) => (
                        <span key={i} className="text-yellow-400">★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {problem.title}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      難易度: {problem.difficulty}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                      挑戦する →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {levels.length === 0 && (
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                この言語の問題はまだ準備されていません。
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                言語選択に戻る
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
