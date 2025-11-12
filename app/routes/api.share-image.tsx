/**
 * Share Image API Route
 * Handles image upload requests for social sharing
 * Uploads images to R2 and returns public URL
 */

import type { Route } from "./+types/api.share-image";
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
 * Client sends base64-encoded image data
 * Note: score may be sent as string from useFetcher
 */
interface ShareImageRequest {
  imageData: string; // Base64-encoded PNG data
  score: number | string; // May be string from form submission
  language: string;
  level: string;
}

/**
 * Rate limiting configuration
 * Prevents abuse of the image generation/upload endpoint
 */
const RATE_LIMIT = {
  maxRequests: 10, // Maximum requests per time window
  windowMs: 60 * 1000, // 1 minute
};

/**
 * Simple in-memory rate limiter
 * In production, use Cloudflare Workers KV or Durable Objects
 */
const rateLimitMap = new Map<string, number[]>();

/**
 * Checks if the request should be rate-limited
 *
 * @param clientId - Client identifier (IP or user ID)
 * @returns true if rate limit exceeded
 */
function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const requests = rateLimitMap.get(clientId) || [];

  // Remove old requests outside the time window
  const recentRequests = requests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT.windowMs
  );

  if (recentRequests.length >= RATE_LIMIT.maxRequests) {
    return true;
  }

  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(clientId, recentRequests);

  return false;
}

/**
 * POST handler for share image upload
 * Accepts base64 image data, uploads to R2, returns public URL and share info
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    console.log("Received share image upload request");
    // Check content type
    const contentType = request.headers.get("content-type");
    if (
      !contentType ||
      !contentType.toLowerCase().includes("application/json")
    ) {
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

    // Rate limiting (use client IP as identifier)
    const clientIp = request.headers.get("cf-connecting-ip") || "unknown";
    if (isRateLimited(clientIp)) {
      return Response.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
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
      console.error("SHARE_IMAGES bucket binding is not configured");
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
    console.error("Share image API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      { error: `Failed to process share image: ${errorMessage}` },
      { status: 500 }
    );
  }
}
