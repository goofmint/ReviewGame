/**
 * Language Selection Page (Home Page)
 * The entry point of the application where users select a programming language
 *
 * Displays available languages with their icons and descriptions
 * Provides instructions on how to play the game
 */

import { Link } from "react-router";
import { availableLanguages } from "~/data/problems";
import { LANGUAGE_DISPLAY_NAMES, LANGUAGE_DESCRIPTIONS, PASSING_SCORE } from "~/utils/constants";
import { LanguageIcon } from "~/components/LanguageIcon";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            コードレビューゲーム
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            あなたのコードレビュースキルを磨こう！
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
              言語を選択してください
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableLanguages.map((lang) => {
                const langStr = lang as string;
                const displayName = LANGUAGE_DISPLAY_NAMES[langStr] || langStr;
                const description = LANGUAGE_DESCRIPTIONS[langStr] || "";

                return (
                  <Link
                    key={lang}
                    to={`/${lang}`}
                    className="group block p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="text-center">
                      {/* Language Icon using Iconify */}
                      <div className="mb-4 flex justify-center">
                        <LanguageIcon
                          language={langStr}
                          className="w-16 h-16 text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {displayName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* How to Play Section */}
          <section className="mt-12 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              遊び方
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>学習したい言語を選択</li>
              <li>レベルを選択（最初はレベル1のみ）</li>
              <li>コードと要件を確認</li>
              <li>問題点を見つけてレビューを書く</li>
              <li>AIによる評価を受けて得点獲得！</li>
              <li>{PASSING_SCORE}点以上で次のレベルがアンロック</li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  );
}
