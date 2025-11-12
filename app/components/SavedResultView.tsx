/**
 * Saved Result View Component
 * Displays a previously saved review result in simplified format
 * Shows score, feedback, strengths, improvements, and "Try Challenge" button
 * Does NOT show: Next Level, Try Again, Back buttons, or Share button
 */

import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { SavedResult } from "~/types/problem";
import { PASSING_SCORE } from "~/utils/constants";

export interface SavedResultViewProps {
  result: SavedResult;
}

/**
 * SavedResultView Component
 * Renders saved result with minimal navigation (only "Try Challenge" link to home)
 */
export function SavedResultView({ result }: SavedResultViewProps) {
  const { t } = useTranslation(["common", "game", "feedback"]);

  const passed = result.score >= PASSING_SCORE;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Score Display */}
          <div className="text-center mb-12">
            <div
              className={`inline-block px-8 py-4 rounded-2xl shadow-2xl ${
                passed
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : "bg-gradient-to-r from-blue-400 to-blue-600"
              }`}
            >
              <div className="text-white text-6xl font-bold mb-2">
                {t("feedback:score", { score: result.score })}
              </div>
              <div className="text-white text-xl">
                {passed ? t("feedback:passed") : t("feedback:almostThere")}
              </div>
            </div>
          </div>

          {/* Language and Level Info */}
          <div className="text-center mb-8">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              {result.language.charAt(0).toUpperCase() + result.language.slice(1)} - Level {result.level}
            </p>
          </div>

          {/* AI Feedback Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">💬</span>
              {t("feedback:aiFeedback")}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {result.feedback}
            </p>
          </div>

          {/* Strengths Section */}
          {result.strengths.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-3xl mr-3">👍</span>
                {t("feedback:strengths")}
              </h2>
              <ul className="space-y-3">
                {result.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements Section */}
          {result.improvements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-3xl mr-3">💡</span>
                {t("feedback:improvements")}
              </h2>
              <ul className="space-y-3">
                {result.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-blue-500 mr-3 mt-1">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Try Challenge Button */}
          <div className="flex justify-center mb-8">
            <Link
              to={`/${result.locale}`}
              className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg text-center font-bold text-xl"
            >
              {t("common:tryChallenge")}
            </Link>
          </div>

          {/* Timestamp Info */}
          <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
            {new Date(result.createdAt).toLocaleString(result.locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
