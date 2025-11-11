/**
 * Result Page Route
 * Displays the evaluation result after a user submits their review
 *
 * Shows score, feedback, strengths, improvements, and action buttons
 * Records progress to localStorage for level unlocking
 */

import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/$lang.$level.result";
import { recordAttempt } from "~/utils/progress";
import { problems } from "~/data/problems";
import { PASSING_SCORE } from "~/utils/constants";
import { ShareButton } from "~/components/ShareButton";
import {
  uploadImageToR2,
  generateStorageKey,
  getPublicUrl,
  type R2Bucket,
} from "~/utils/r2";
import { generateTweetText, generateXIntentUrl } from "~/utils/share";
import type { ShareResult } from "~/types/problem";

interface ResultState {
  review: string;
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string[] | undefined;
  improvements: string[] | undefined;
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `結果 - ${params.lang} レベル${params.level}` },
    { name: "description", content: "レビューの評価結果" },
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
}

/**
 * Converts base64 data URL to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Action handler for share image upload
 * Accepts base64 image data, uploads to R2, returns public URL and share info
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
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

    // Get R2 bucket from context (Cloudflare Workers binding)
    const env = context.cloudflare?.env as Env | undefined;
    const bucket = env?.SHARE_IMAGES;

    if (!bucket) {
      // In development/testing, return a mock response
      if (process.env.NODE_ENV === "development") {
        const mockImageUrl = `https://example.com/share/${body.language}/${body.level}/${Date.now()}.png`;
        const tweetText = generateTweetText(
          score,
          body.language,
          body.level
        );
        const tweetUrl = generateXIntentUrl(tweetText, mockImageUrl);

        const result: ShareResult = {
          imageUrl: mockImageUrl,
          tweetText,
          tweetUrl,
        };

        return Response.json(result);
      }

      return Response.json(
        { error: "R2 bucket not configured" },
        { status: 500 }
      );
    }

    // Convert base64 to ArrayBuffer
    const imageBuffer = base64ToArrayBuffer(body.imageData);

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
    const publicUrl = env?.R2_PUBLIC_URL || "https://share.example.com";
    const imageUrl = getPublicUrl(storageKey, publicUrl);

    // Generate tweet text and X intent URL
    const tweetText = generateTweetText(score, body.language, body.level);
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
  const { lang, level } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;
  const lastRecordedKey = useRef<string>("");

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
      navigate(`/${lang}/${level}`, { replace: true });
    }
  }, [state, lang, level, navigate]);

  if (!state || !lang || !level) {
    return null;
  }

  // Check if next level exists
  const parsedLevel = parseInt(level, 10);
  let hasNextLevel = false;
  let nextLevel = "";
  const langProblems = lang in problems ? problems[lang as keyof typeof problems] : null;

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
                {state.score}点
              </div>
              <div className="text-white text-xl">
                {state.passed ? "🎉 合格！" : "もう少し！"}
              </div>
            </div>
            {state.passed && hasNextLevel && (
              <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg">
                次のレベルがアンロックされました！
              </p>
            )}
          </div>

          {/* AI Feedback Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">💬</span>
              AIフィードバック
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {state.feedback}
            </p>
          </div>

          {/* User's Review Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">✍️</span>
              あなたのレビュー
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
                良かった点
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
                改善点
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
              結果をシェアしよう！
            </h3>
            <ShareButton
              score={state.score}
              language={lang}
              level={level}
              className="inline-block"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Show "Next Level" button if passed and next level exists */}
            {state.passed && hasNextLevel && (
              <Link
                to={`/${lang}/${nextLevel}`}
                className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
              >
                次のレベルへ →
              </Link>
            )}
            <Link
              to={`/${lang}/${level}`}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
            >
              もう一度挑戦
            </Link>
            <Link
              to={`/${lang}`}
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-semibold"
            >
              レベル選択に戻る
            </Link>
            <Link
              to="/"
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-semibold"
            >
              言語選択に戻る
            </Link>
          </div>

          {/* Passing Score Info */}
          {!state.passed && (
            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                <span className="mr-2">ℹ️</span>
                次のレベルに進むには
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                {PASSING_SCORE}点以上を獲得すると、次のレベルがアンロックされます。
                もう一度挑戦してみましょう！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
