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
import { Link, useNavigate, useParams, useFetcher, type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { useTranslation } from "react-i18next";
import { problems, availableLocales } from "~/data/problems";
import { ErrorCard } from "~/components/ErrorCard";
import { CodeDisplay } from "~/components/CodeDisplay";
import { RequirementsDisplay } from "~/components/RequirementsDisplay";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { isLevelUnlocked } from "~/utils/progress";
import { initI18n } from "~/utils/i18n.client";
import type { EvaluationResult } from "~/types/problem";
import { evaluate } from "~/utils/evaluate";
import type { EvaluationRequestBody } from "~/types/evaluate";
import { i18n } from "~/i18n.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { locale, lang, level } = params;

  // Validate locale, language and level parameters
  if (!locale || !availableLocales.includes(locale)) {
    throw new Response("Invalid locale", { status: 404 });
  }

  if (!lang || !level || !problems[locale]?.[lang]?.[level]) {
    throw new Response("Invalid language or level", { status: 404 });
  }

  // Load translations for meta tags
  const t = await i18n.getFixedT(request, 'game', locale);

  // Get language display name
  const tCommon = await i18n.getFixedT(request, 'common', locale);
  const languageDisplayName = tCommon(`language.${lang}`, lang);

  const metaTitle = t('meta.titleTemplate', {
    language: languageDisplayName,
    level,
  });
  const metaDescription = t('meta.description');

  return {
    locale,
    lang,
    level,
    metaTitle,
    metaDescription,
  };
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [
      { title: "Code Review Game" },
      { name: "description", content: "Review code and improve your skills" },
    ];
  }

  return [
    { title: data.metaTitle },
    { name: "description", content: data.metaDescription },
  ];
};

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
  params: { locale?: string; lang?: string; level?: string };
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
  const { locale, lang, level } = useParams();
  const { t, ready } = useTranslation(['common', 'game']);
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  const [i18nError, setI18nError] = useState(false);

  useEffect(() => {
    if (locale) {
      initI18n(locale)
        .then(() => {
          setI18nReady(true);
          setI18nError(false);
        })
        .catch((err) => {
          console.error("Failed to initialize i18n:", err);
          setI18nReady(false);
          setI18nError(true);
        });
    }
  }, [locale]);

  /**
   * 評価完了時の処理
   * 結果画面に遷移
   */
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      const result = fetcher.data as EvaluationResult;
      console.log({ result });
      navigate(`/${locale}/${lang}/${level}/result`, {
        state: {
          review,
          ...result,
        },
      });
    }
  }, [fetcher.state, fetcher.data, navigate, locale, lang, level, review]);

  // Handle i18n initialization error
  if (i18nError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-8 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
            Failed to load translations
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            Unable to initialize the language settings. Please refresh the page or try a different language.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!i18nReady || !ready) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  // パラメータの検証と問題の存在確認
  if (!locale || !lang || !level || !problems[locale]?.[lang]) {
    return (
      <ErrorCard
        title={t('game:problemNotFound', 'Problem not found')}
        linkTo={`/${locale}`}
        linkText={t('common:button.backToLanguages')}
      />
    );
  }

  const langProblems = problems[locale][lang];
  const problem = langProblems[level as keyof typeof langProblems];

  if (!problem) {
    return (
      <ErrorCard
        title={t('game:levelNotReady', 'This level is not ready yet')}
        linkTo={`/${locale}/${lang}`}
        linkText={t('common:button.backToLevels')}
      />
    );
  }

  // レベルのアンロック状態を確認（クライアント側のチェックのみ）
  const unlocked = isLevelUnlocked(lang, level);
  if (!unlocked) {
    return (
      <ErrorCard
        title={t('game:levelLocked', 'This level is still locked')}
        linkTo={`/${locale}/${lang}`}
        linkText={t('common:button.backToLevels')}
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
      setError(t('game:reviewRequired', 'Please enter your review'));
      return;
    }

    if (review.trim().length < 10) {
      setError(t('game:reviewTooShort', 'Review must be at least 10 characters'));
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const body = {
        language: String(lang),
        level: String(level),
        review: review.trim(),
        locale: String(locale),
      };
      fetcher.submit(body, {
        method: "post",
        action: `/${locale}/${lang}/${level}`,
        encType: "application/json",
      });
    } catch (err) {
      console.log(err);
      setError(
        err instanceof Error
          ? err.message
          : t('game:evaluationError', 'An error occurred during evaluation. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * コードの行がクリックされた時の処理
   * 「コードの{行番号}行目: 」をレビュー入力エリアに挿入
   */
  const handleCodeLineClick = (lineNumber: number) => {
    const template = t('game:lineReference', { line: lineNumber });
    setReview((prev) => (prev ? `${prev}\n${template}` : template));
  };

  /**
   * 要件がクリックされた時の処理
   * Markdown見出し形式で要件をレビュー入力エリアに挿入
   */
  const handleRequirementClick = (requirement: string) => {
    const template = t('game:requirementReference', { requirement });
    setReview((prev) => (prev ? `${prev}\n${template}` : template));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* ローディング表示 */}
      {fetcher.state === "submitting" && (
        <LoadingSpinner message={t('game:submitting')} />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <header className="mb-8">
          <Link
            to={`/${locale}/${lang}`}
            className="inline-block mb-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← {t('common:button.backToLevels')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {problem.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {t('game:difficulty')}: {"★".repeat(problem.difficulty)}
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
                  📋 {t('game:requirements')}
                </h2>
                <RequirementsDisplay
                  requirements={problem.requirements}
                  onRequirementClick={handleRequirementClick}
                />
              </div>

              {/* コードセクション */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  💻 {t('game:code')}
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
                ✍️ {t('game:yourReview')}
              </h2>
              <textarea
                value={review}
                onChange={(e) => {
                  setReview(e.target.value);
                  setError("");
                }}
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder={t('game:reviewPlaceholder')}
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
                {isSubmitting ? t('game:submitting') : t('common:button.submit')}
              </button>
            </div>
          </div>
        </fetcher.Form>

        {/* ヒントセクション */}
        <div className="max-w-4xl mx-auto mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            💡 {t('game:hints', 'Hints')}
          </h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>{t('game:hint1', 'Check if all requirements are met')}</li>
            <li>{t('game:hint2', 'Is error handling appropriate?')}</li>
            <li>{t('game:hint3', 'Is type checking necessary?')}</li>
            <li>{t('game:hint4', 'Are boundary value tests considered?')}</li>
            <li>{t('game:hint5', 'Click on code lines to add line numbers to your review')}</li>
            <li>{t('game:hint6', 'Click on requirements to add Markdown headings')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
