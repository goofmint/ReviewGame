/**
 * Level Selection Page Route
 * Displays all available levels for the selected programming language
 *
 * Shows progress indicators (best score, lock status) for each level
 * Locked levels are shown but cannot be accessed until prerequisites are met
 */

import { Link, useParams } from "react-router";
import { problems } from "~/data/problems";
import { isLevelUnlocked, getBestScore } from "~/utils/progress";
import { LANGUAGE_DISPLAY_NAMES } from "~/utils/constants";
import type { Route } from "./+types/$lang._index";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.lang} - コードレビューゲーム` },
    { name: "description", content: `${params.lang}のレベルを選択` },
  ];
}

export default function LevelSelect() {
  const { lang } = useParams();

  // Validate language parameter
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

  // Get language display name
  const displayName = LANGUAGE_DISPLAY_NAMES[lang] || lang;

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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {displayName}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            レベルを選択してください
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => {
              const levelStr = String(level);
              const problem = langProblems[levelStr as keyof typeof langProblems];
              const unlocked = isLevelUnlocked(lang, levelStr);
              const bestScore = getBestScore(lang, levelStr);

              return (
                <Link
                  key={level}
                  to={unlocked ? `/${lang}/${level}` : `/${lang}`}
                  className={`group block p-6 rounded-xl shadow-lg transition-all duration-300 ${
                    unlocked
                      ? "bg-white dark:bg-gray-800 hover:shadow-2xl transform hover:-translate-y-1"
                      : "bg-gray-200 dark:bg-gray-700 opacity-60 cursor-not-allowed"
                  }`}
                  onClick={(e) => {
                    if (!unlocked) e.preventDefault();
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {!unlocked && <span>🔒</span>}
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
                  {bestScore !== undefined && (
                    <div className="mb-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-lg inline-block">
                      <span className="text-green-700 dark:text-green-300 text-sm font-semibold">
                        ベストスコア: {bestScore}点
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      難易度: {problem.difficulty}
                    </span>
                    {unlocked && (
                      <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                        挑戦する →
                      </span>
                    )}
                    {!unlocked && (
                      <span className="text-gray-500 dark:text-gray-500">
                        ロック中
                      </span>
                    )}
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
