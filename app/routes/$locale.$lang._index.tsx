/**
 * Level Selection Page Route
 * Displays all available levels for the selected programming language
 *
 * Shows progress indicators (best score, lock status) for each level
 * Locked levels are shown but cannot be accessed until prerequisites are met
 */

import { Link, useParams, type LoaderFunctionArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { problems, availableLocales } from "~/data/problems";
import { isLevelUnlocked, getBestScore } from "~/utils/progress";
import { initI18n } from "~/utils/i18n.client";

export async function loader({ params }: LoaderFunctionArgs) {
  const { locale, lang } = params;

  // Validate locale and language parameters
  if (!locale || !availableLocales.includes(locale)) {
    throw new Response("Invalid locale", { status: 404 });
  }

  if (!lang || !problems[locale]?.[lang]) {
    throw new Response("Invalid language", { status: 404 });
  }

  return { locale, lang };
}

export function meta({ params }: { params: { locale: string; lang: string } }) {
  return [
    { title: `${params.lang} - Code Review Game` },
    { name: "description", content: `Select level for ${params.lang}` },
  ];
}

export default function LevelSelect() {
  const { locale, lang } = useParams();
  const { t, ready } = useTranslation(['common', 'game']);
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    if (locale) {
      initI18n(locale).then(() => {
        setI18nReady(true);
      });
    }
  }, [locale]);

  if (!i18nReady || !ready) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  // Validate language parameter
  if (!locale || !lang || !problems[locale]?.[lang]) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('game:languageNotFound', 'Language not found')}
          </h1>
          <Link
            to={`/${locale}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common:button.backToLanguages')}
          </Link>
        </div>
      </div>
    );
  }

  const langProblems = problems[locale][lang];
  const levels = Object.keys(langProblems).map(Number).sort((a, b) => a - b);

  // Get language display name
  const displayName = t(`common:language.${lang}`, lang);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="mb-12">
          <Link
            to={`/${locale}`}
            className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← {t('common:button.backToLanguages')}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {displayName}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('game:selectLevel')}
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
                  to={unlocked ? `/${locale}/${lang}/${level}` : `/${locale}/${lang}`}
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
                      {t('game:level', { level })}
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
                        {t('game:bestScore', { score: bestScore })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {t('game:difficulty')}: {problem.difficulty}
                    </span>
                    {unlocked && (
                      <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                        {t('game:startChallenge', 'Start →')}
                      </span>
                    )}
                    {!unlocked && (
                      <span className="text-gray-500 dark:text-gray-500">
                        {t('game:locked')}
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
                {t('game:noProblems', 'No problems available for this language yet.')}
              </p>
              <Link
                to={`/${locale}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('common:button.backToLanguages')}
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
