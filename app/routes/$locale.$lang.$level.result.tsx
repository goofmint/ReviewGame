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
import type { ShareResult, SavedResult, SaveResultRequest, SaveResultResponse } from "~/types/problem";
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
 * Cloudflare Workers KV namespace binding
 */
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Environment bindings for Cloudflare Workers
 * Includes R2 bucket binding and configuration
 */
interface Env {
  SHARE_IMAGES?: R2Bucket;
  R2_PUBLIC_URL?: string;
  RESULTS_KV?: KVNamespace;
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
 * TTL for stored results (1 year in seconds)
 */
const RESULT_TTL = 365 * 24 * 60 * 60;

/**
 * Maximum retry attempts for UUID collision
 */
const MAX_UUID_RETRIES = 3;

/**
 * Generates a UUID v4
 * Uses crypto.randomUUID() which is available in Cloudflare Workers
 *
 * @returns UUID v4 string
 */
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Validates the result data
 *
 * @param data - Request data to validate
 * @returns Validation result with error message if invalid
 */
function validateResultData(data: SaveResultRequest): { valid: boolean; error?: string } {
  // Score validation
  if (typeof data.score !== "number" || isNaN(data.score) || data.score < 0 || data.score > 100) {
    return { valid: false, error: "Score must be a number between 0 and 100" };
  }

  // Language validation
  if (!data.language || typeof data.language !== "string" || data.language.trim().length === 0) {
    return { valid: false, error: "Language is required" };
  }

  // Level validation
  if (!data.level || typeof data.level !== "string" || data.level.trim().length === 0) {
    return { valid: false, error: "Level is required" };
  }

  // Feedback validation
  if (!data.feedback || typeof data.feedback !== "string" || data.feedback.trim().length === 0) {
    return { valid: false, error: "Feedback is required" };
  }

  // Strengths validation
  if (!Array.isArray(data.strengths)) {
    return { valid: false, error: "Strengths must be an array" };
  }

  // Improvements validation
  if (!Array.isArray(data.improvements)) {
    return { valid: false, error: "Improvements must be an array" };
  }

  // ImageUrl validation
  if (!data.imageUrl || typeof data.imageUrl !== "string" || data.imageUrl.trim().length === 0) {
    return { valid: false, error: "Image URL is required" };
  }

  // Locale validation
  if (!data.locale || typeof data.locale !== "string" || data.locale.trim().length === 0) {
    return { valid: false, error: "Locale is required" };
  }

  return { valid: true };
}

/**
 * Saves result to KV storage with retry logic for UUID collisions
 *
 * @param kv - KV namespace
 * @param data - Result data to save
 * @returns Saved result with generated ID
 */
async function saveResultToKV(
  kv: KVNamespace,
  data: SaveResultRequest
): Promise<{ id: string; result: SavedResult }> {
  for (let attempt = 0; attempt < MAX_UUID_RETRIES; attempt++) {
    const id = generateUUID();
    const key = `result:${id}`;

    // Check if key already exists (collision detection)
    const existing = await kv.get(key);
    if (existing !== null) {
      console.warn(`UUID collision detected: ${id}, retrying...`);
      continue;
    }

    // Create saved result object
    const savedResult: SavedResult = {
      id,
      score: data.score,
      language: data.language,
      level: parseInt(data.level, 10),
      feedback: data.feedback,
      strengths: data.strengths,
      improvements: data.improvements,
      imageUrl: data.imageUrl,
      createdAt: Date.now(),
      locale: data.locale,
    };

    // Save to KV with TTL
    await kv.put(key, JSON.stringify(savedResult), {
      expirationTtl: RESULT_TTL,
    });

    console.log(`Result saved successfully with ID: ${id}`);
    return { id, result: savedResult };
  }

  throw new Error("Failed to generate unique ID after maximum retries");
}

/**
 * Action handler for share functionality
 * Handles both image upload and result saving based on intent
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    const contentType = request.headers.get("content-type");
    const env = context.cloudflare?.env as Env | undefined;

    // Parse request body once
    let requestData: Record<string, unknown>;

    if (contentType?.includes("application/json")) {
      requestData = await request.json() as Record<string, unknown>;
    } else {
      const formData = await request.formData();
      requestData = Object.fromEntries(formData.entries());
    }

    const intent = requestData.intent as string;
    console.log(`Received action request with intent: ${intent}`);

    // Handle image upload intent
    if (intent === "uploadImage") {
      console.log("Processing image upload");

      const imageData = requestData.imageData as string;
      const language = requestData.language as string;
      const level = requestData.level as string;
      const locale = requestData.locale as string;
      const scoreValue = requestData.score;
      const score = typeof scoreValue === "string" ? parseInt(scoreValue, 10) : (scoreValue as number);

      // Validate required fields
      if (!imageData || !language || !level) {
        return Response.json(
          { error: "Missing required fields: imageData, language, level" },
          { status: 400 }
        );
      }

      // Validate score
      if (typeof score !== "number" || isNaN(score) || score < 0 || score > 100) {
        return Response.json(
          { error: "Score must be a number between 0 and 100" },
          { status: 400 }
        );
      }

      // Validate image payload
      const validatedImage = validateBase64ImagePayload(imageData);
      if (!validatedImage) {
        return Response.json(
          { error: "Invalid or too large imageData" },
          { status: 400 }
        );
      }

      // Get R2 bucket
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

      // Generate storage key and upload to R2
      const timestamp = Date.now();
      const storageKey = generateStorageKey(language, level, timestamp);
      await uploadImageToR2(bucket, storageKey, imageBuffer);

      // Get public URL
      const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
      const publicUrl = env?.R2_PUBLIC_URL?.trim() || requestOrigin;
      const imageUrl = getPublicUrl(storageKey, publicUrl);

      // Return image URL
      return Response.json({ imageUrl }, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    }

    // Handle result saving intent
    if (intent === "saveResult") {
      console.log("Processing result save");

      // Parse result data
      const rawScore = requestData.score;
      const rawStrengths = requestData.strengths;
      const rawImprovements = requestData.improvements;

      const body: SaveResultRequest = {
        score: typeof rawScore === "string" ? Number(rawScore) : (rawScore as number),
        language: requestData.language as string,
        level: requestData.level as string,
        feedback: requestData.feedback as string,
        strengths: typeof rawStrengths === "string" ? JSON.parse(rawStrengths) : (rawStrengths as string[]),
        improvements: typeof rawImprovements === "string" ? JSON.parse(rawImprovements) : (rawImprovements as string[]),
        imageUrl: requestData.imageUrl as string,
        locale: requestData.locale as string,
      };

      // Validate data
      const validation = validateResultData(body);
      if (!validation.valid) {
        console.error("Validation failed:", validation.error);
        return Response.json({ error: validation.error }, { status: 400 });
      }

      // Get KV namespace
      const kv = env?.RESULTS_KV;
      if (!kv) {
        console.error("RESULTS_KV binding is missing");
        return Response.json(
          { error: "Result storage configuration is missing" },
          { status: 500 }
        );
      }

      // Save result to KV
      const { id, result } = await saveResultToKV(kv, body);

      // Generate result URL
      const requestOrigin = request.headers.get("origin") || new URL(request.url).origin;
      const resultUrl = `${requestOrigin}/results/${id}`;

      // Return response
      const response: SaveResultResponse = {
        id,
        url: resultUrl,
        imageUrl: result.imageUrl,
      };

      return Response.json(response, {
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      });
    }

    // Unknown intent
    return Response.json(
      { error: `Unknown intent: ${intent}` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Action error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      { error: `Failed to process request: ${errorMessage}` },
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
