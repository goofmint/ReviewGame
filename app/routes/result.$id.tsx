/**
 * Result Display Page (Phase 5)
 *
 * GET /result/:id
 *
 * Displays a saved review result with:
 * - Locale-fixed display (no language switching)
 * - OGP tags for social media sharing
 * - Simple UI with "Start Challenge" link only
 *
 * URL does NOT include locale (not /:locale/result/:id)
 */

import { json } from "@remix-run/cloudflare";
import type {
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { useLoaderData, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

import type { SavedResult } from "~/types/result";
import { isValidUUID } from "~/utils/validation";

/**
 * Load saved result from KV storage
 *
 * Validates UUID format and retrieves data from KV.
 * Returns 404 if UUID is invalid or data not found.
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
  const { id } = params;

  // Validate UUID format
  if (!id || !isValidUUID(id)) {
    throw new Response("Not Found", { status: 404 });
  }

  // Get KV namespace
  const env = context.cloudflare?.env as {
    RESULTS_KV: KVNamespace;
  } | undefined;

  if (!env?.RESULTS_KV) {
    throw new Response("Service Unavailable", { status: 503 });
  }

  // Retrieve result from KV (UUID is used as key directly)
  const resultJson = await env.RESULTS_KV.get(id);

  if (!resultJson) {
    throw new Response("Not Found", { status: 404 });
  }

  // Parse and return result
  const result: SavedResult = JSON.parse(resultJson);
  return json(result);
}

/**
 * Generate meta tags for SEO and OGP
 *
 * Creates dynamic meta tags based on the saved result data.
 * Uses the saved locale to determine the language of the tags.
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: "Result Not Found | Code Review Game" }];
  }

  const result = data as SavedResult;

  // Generate title based on locale
  const title =
    result.locale === "ja"
      ? `Code Review Game - ${result.score}点獲得！`
      : `Code Review Game - ${result.score} points!`;

  // Generate description based on locale
  const description =
    result.locale === "ja"
      ? `${result.language} Level ${result.level}でスコア${result.score}点を獲得しました`
      : `Achieved a score of ${result.score} points in ${result.language} Level ${result.level}`;

  return [
    { title },
    { name: "description", content: description },

    // Open Graph tags
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: result.imageUrl },
    { property: "og:url", content: `https://review-game.com/result/${result.id}` },
    { property: "og:type", content: "website" },

    // Twitter Card tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: result.imageUrl },
  ];
};

/**
 * Result display component
 *
 * Shows the saved result with locale-fixed display.
 * No language switching is provided.
 */
export default function ResultPage() {
  const result = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation("result");

  // Fix locale to the saved locale (no switching allowed)
  useEffect(() => {
    if (i18n.language !== result.locale) {
      i18n.changeLanguage(result.locale);
    }
  }, [result.locale, i18n]);

  // Determine pass/fail based on score
  const passed = result.score >= 70;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-5xl sm:text-6xl font-bold mb-3">
              <span
                className={
                  passed
                    ? "text-green-600 dark:text-green-400"
                    : "text-orange-600 dark:text-orange-400"
                }
              >
                {result.score}
              </span>
              <span className="text-2xl text-gray-600 dark:text-gray-400 ml-2">
                {result.locale === "ja" ? "点" : "pts"}
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {result.language} - Level {result.level}
            </p>
          </div>

          {/* Feedback Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
              {t("feedback")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {result.feedback}
            </p>
          </div>

          {/* Strengths Section */}
          {result.strengths.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-green-700 dark:text-green-400">
                {t("strengths")}
              </h3>
              <ul className="space-y-2">
                {result.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-green-600 dark:text-green-400 mr-2 mt-1">
                      ✓
                    </span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements Section */}
          {result.improvements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-3 text-orange-700 dark:text-orange-400">
                {t("improvements")}
              </h3>
              <ul className="space-y-2">
                {result.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-orange-600 dark:text-orange-400 mr-2 mt-1">
                      →
                    </span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenge Button */}
          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {t("challenge")}
            </Link>
          </div>
        </div>

        {/* Metadata Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {new Date(result.createdAt).toLocaleDateString(result.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Error boundary for 404 and other errors
 */
export function ErrorBoundary() {
  const { t } = useTranslation("result");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          404
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          {t("notFound")}
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          {t("challenge")}
        </Link>
      </div>
    </div>
  );
}
