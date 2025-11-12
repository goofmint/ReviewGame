/**
 * Programming Language Selection Page
 * Users select a programming language after locale is determined
 *
 * Displays available languages with their icons and descriptions
 * Provides instructions on how to play the game
 */

import { Link, useParams, type LoaderFunctionArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { availableLanguages, availableLocales } from "~/data/problems";
import { LanguageIcon } from "~/components/LanguageIcon";
import { initI18n } from "~/utils/i18n.client";

export async function loader({ params }: LoaderFunctionArgs) {
  const { locale } = params;

  // Validate locale parameter
  if (!locale || !availableLocales.includes(locale)) {
    throw new Response("Invalid locale", { status: 404 });
  }

  return { locale };
}

export default function LanguageSelection() {
  const { locale } = useParams();
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('game:title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('game:selectLanguage')}
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          {/* Language Switcher */}
          <div className="mb-8 flex justify-center gap-4">
            <Link
              to="/ja"
              className={`px-4 py-2 rounded-lg transition-colors ${
                locale === 'ja'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t('common:locale.ja')}
            </Link>
            <Link
              to="/en"
              className={`px-4 py-2 rounded-lg transition-colors ${
                locale === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t('common:locale.en')}
            </Link>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 text-center">
              {t('game:selectLanguage')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableLanguages.map((lang) => {
                const langStr = lang as string;
                const displayName = t(`common:language.${langStr}`, langStr);
                const description = t(`common:languageDescription.${langStr}`, '');

                return (
                  <Link
                    key={lang}
                    to={`/${locale}/${lang}`}
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

        </main>
      </div>
    </div>
  );
}
