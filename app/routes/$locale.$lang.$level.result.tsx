/**
 * Result Page Route
 * Displays the evaluation result after a user submits their review
 *
 * Shows score, feedback, strengths, improvements, and action buttons
 * Records progress to localStorage for level unlocking
 */

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, type LoaderFunctionArgs } from "react-router";
import { useTranslation } from "react-i18next";
import { recordAttempt } from "~/utils/progress";
import { problems, availableLocales } from "~/data/problems";
import { PASSING_SCORE } from "~/utils/constants";
import { ShareButton } from "~/components/ShareButton";
import { initI18n } from "~/utils/i18n.client";
import {
  uploadImageToR2,
  generateStorageKey,
  getPublicUrl,
  type R2Bucket,
} from "~/utils/r2";
import { generateTweetText, generateXIntentUrl } from "~/utils/share";
import type { ShareResult } from "~/types/problem";
import {
  base64ToArrayBuffer,
  validateBase64ImagePayload,
} from "~/utils/imageData";

interface ResultState {
  review: string;
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string[] | undefined;
  improvements: string[] | undefined;
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { locale, lang, level } = params;

  // Validate locale, language and level parameters
  if (!locale || !availableLocales.includes(locale)) {
    throw new Response("Invalid locale", { status: 404 });
  }

  if (!lang || !level || !problems[locale]?.[lang]?.[level]) {
    throw new Response("Invalid language or level", { status: 404 });
  }

  return { locale, lang, level };
}

export function meta({ params }: { params: { locale: string; lang: string; level: string } }) {
  return [
    { title: `Result - ${params.lang} Level ${params.level}` },
    { name: "description", content: "Code review evaluation result" },
  ];
}

/**
 * Environment bindings for Cloudflare Workers
 * Includes R2 bucket binding and configuration
 */
interface Env {
  SHARE_IMAGES?: R2Bucket;
  R2_PUBLIC_URL?: string;
}

/**
 * Request body structure for share image upload
 */
interface ShareImageRequest {
  imageData: string; // Base64-encoded PNG data
  score: number | string;
  language: string;
  level: string;
  locale: string;
}

/**
 * Action handler for share image upload
 * Accepts base64 image data, uploads to R2, returns public URL and share info
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    console.log("Received share image upload request");
    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return Response.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = (await request.json()) as ShareImageRequest;
    // Validate required fields
    if (!body.imageData || !body.language || !body.level) {
      return Response.json(
        { error: "Missing required fields: imageData, language, level" },
        { status: 400 }
      );
    }

    // Parse score (may be string from useFetcher)
    const score =
      typeof body.score === "string" ? parseInt(body.score, 10) : body.score;

    // Validate score
    if (
      typeof score !== "number" ||
      isNaN(score) ||
      score < 0 ||
      score > 100
    ) {
      return Response.json(
        { error: "Score must be a number between 0 and 100" },
        { status: 400 }
      );
    }
    // Validate image payload before conversion/upload
    const validatedImage = validateBase64ImagePayload(body.imageData);
    if (!validatedImage) {
      return Response.json(
        { error: "Invalid or too large imageData" },
        { status: 400 }
      );
    }

    // Get R2 bucket from context (Cloudflare Workers binding)
    const env = context.cloudflare?.env as Env | undefined;
    const bucket = env?.SHARE_IMAGES;
    if (!bucket) {
      console.error("SHARE_IMAGES bucket binding is missing");
      return Response.json(
        { error: "Image storage configuration is missing" },
        { status: 500 }
      );
    }

    // Convert base64 to ArrayBuffer
    const imageBuffer = base64ToArrayBuffer(validatedImage.base64);

    // Generate storage key
    const timestamp = Date.now();
    const storageKey = generateStorageKey(
      body.language,
      body.level,
      timestamp
    );

    // Upload to R2
    await uploadImageToR2(bucket, storageKey, imageBuffer);

    // Get public URL
    if (!env?.R2_PUBLIC_URL) {
      console.warn(
        "R2_PUBLIC_URL not configured; falling back to request origin"
      );
    }
    const requestOrigin =
      request.headers.get("origin") || new URL(request.url).origin;
    const publicUrl = env?.R2_PUBLIC_URL?.trim() || requestOrigin;
    const imageUrl = getPublicUrl(storageKey, publicUrl);

    // Generate tweet text and X intent URL
    const locale = body.locale || "en";
    const tweetText = generateTweetText(score, body.language, body.level, locale);
    const tweetUrl = generateXIntentUrl(tweetText, imageUrl);

    // Return result
    const result: ShareResult = {
      imageUrl,
      tweetText,
      tweetUrl,
    };

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Share image action error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      { error: `Failed to process share image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export default function ResultPage() {
  const { locale, lang, level } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, ready } = useTranslation(['common', 'game', 'feedback']);
  const [i18nReady, setI18nReady] = useState(false);
  const state = location.state as ResultState | null;
  const lastRecordedKey = useRef<string>("");

  // Initialize i18n
  useEffect(() => {
    if (locale) {
      initI18n(locale).then(() => {
        setI18nReady(true);
      });
    }
  }, [locale]);

  // Record progress when page loads
  useEffect(() => {
    if (state && lang && level) {
      const key = `${lang}-${level}-${state.score}`;
      if (lastRecordedKey.current !== key) {
        recordAttempt(lang, level, state.score);
        lastRecordedKey.current = key;
      }
    }
  }, [state, lang, level]);

  // If no state, redirect back to problem page
  useEffect(() => {
    if (!state) {
      navigate(`/${locale}/${lang}/${level}`, { replace: true });
    }
  }, [state, locale, lang, level, navigate]);

  if (!i18nReady || !ready) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  if (!state || !lang || !level || !locale) {
    return null;
  }

  // Check if next level exists
  const parsedLevel = parseInt(level, 10);
  let hasNextLevel = false;
  let nextLevel = "";
  const langProblems = locale && lang && problems[locale]?.[lang] ? problems[locale][lang] : null;

  if (Number.isInteger(parsedLevel) && langProblems) {
    nextLevel = String(parsedLevel + 1);
    hasNextLevel = nextLevel in langProblems;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Score Display */}
          <div className="text-center mb-12">
            <div
              className={`inline-block px-8 py-4 rounded-2xl shadow-2xl ${
                state.passed
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : "bg-gradient-to-r from-blue-400 to-blue-600"
              }`}
            >
              <div className="text-white text-6xl font-bold mb-2">
                {t('feedback:score', { score: state.score })}
              </div>
              <div className="text-white text-xl">
                {state.passed ? t('feedback:passed') : t('feedback:almostThere')}
              </div>
            </div>
            {state.passed && hasNextLevel && (
              <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg">
                {t('feedback:nextLevelUnlocked')}
              </p>
            )}
          </div>

          {/* AI Feedback Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">💬</span>
              {t('feedback:aiFeedback')}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {state.feedback}
            </p>
          </div>

          {/* User's Review Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">✍️</span>
              {t('feedback:yourReview')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                {state.review}
              </pre>
            </div>
          </div>

          {/* Strengths Section */}
          {(state.strengths || []).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-3xl mr-3">👍</span>
                {t('feedback:strengths')}
              </h2>
              <ul className="space-y-3">
                {(state.strengths || []).map((strength, index) => (
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
          {(state.improvements || []).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-3xl mr-3">💡</span>
                {t('feedback:improvements')}
              </h2>
              <ul className="space-y-3">
                {(state.improvements || []).map((improvement, index) => (
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

          {/* Share Section */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('feedback:shareTitle')}
            </h3>
            <ShareButton
              score={state.score}
              language={lang}
              level={level}
              locale={locale}
              feedback={state.feedback}
              strengths={state.strengths || []}
              improvements={state.improvements || []}
              className="inline-block"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Show "Next Level" button if passed and next level exists */}
            {state.passed && hasNextLevel && (
              <Link
                to={`/${locale}/${lang}/${nextLevel}`}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
              >
                {t('feedback:nextLevel')}
              </Link>
            )}
            <Link
              to={`/${locale}/${lang}/${level}`}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
            >
              {t('feedback:retry')}
            </Link>
            <Link
              to={`/${locale}/${lang}`}
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-semibold"
            >
              {t('feedback:backToLevels')}
            </Link>
            <Link
              to={`/${locale}`}
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-semibold"
            >
              {t('feedback:backToLanguages')}
            </Link>
          </div>

          {/* Passing Score Info */}
          {!state.passed && (
            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <span className="mr-2">ℹ️</span>
                {t('feedback:passingInfoTitle')}
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t('feedback:passingInfoMessage', { score: PASSING_SCORE })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
