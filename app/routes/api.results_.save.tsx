/**
 * Results Save API Route
 * Handles saving review results to KV storage
 * Generates unique IDs and stores results with OGP images for sharing
 */

import type { ActionFunctionArgs } from "react-router";
import type {
  SavedResult,
  SaveResultRequest,
  SaveResultResponse,
} from "~/types/problem";

/**
 * Cloudflare Workers KV namespace binding
 */
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/**
 * Environment bindings for Cloudflare Workers
 */
interface Env {
  RESULTS_KV?: KVNamespace;
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
 * POST handler for saving review results
 * Accepts result data, saves to KV, returns result URL
 */
export async function action({ request, context }: ActionFunctionArgs) {
  try {
    console.log("Received result save request");

    // Parse request body (could be JSON or FormData)
    let body: SaveResultRequest;
    const contentType = request.headers.get("content-type");

    if (contentType?.toLowerCase().includes("application/json")) {
      // JSON format
      const rawBody = (await request.json()) as Record<string, unknown>;

      // Parse stringified arrays if necessary
      const strengths = typeof rawBody.strengths === 'string'
        ? JSON.parse(rawBody.strengths)
        : rawBody.strengths;
      const improvements = typeof rawBody.improvements === 'string'
        ? JSON.parse(rawBody.improvements)
        : rawBody.improvements;

      body = {
        ...rawBody,
        strengths: strengths as string[],
        improvements: improvements as string[],
      } as SaveResultRequest;
    } else {
      // FormData format (fallback)
      const formData = await request.formData();

      console.log("FormData entries:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      const rawStrengths = formData.get("strengths") as string | null;
      const rawImprovements = formData.get("improvements") as string | null;
      const rawScore = formData.get("score") as string | null;

      body = {
        score: rawScore ? Number(rawScore) : 0,
        language: (formData.get("language") as string) || "",
        level: (formData.get("level") as string) || "",
        feedback: (formData.get("feedback") as string) || "",
        strengths: rawStrengths ? JSON.parse(rawStrengths) : [],
        improvements: rawImprovements ? JSON.parse(rawImprovements) : [],
        imageUrl: (formData.get("imageUrl") as string) || "",
        locale: (formData.get("locale") as string) || "",
      };

      console.log("Parsed body:", JSON.stringify(body, null, 2));
    }

    // Validate data
    const validation = validateResultData(body);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Get KV namespace from context
    const env = context.cloudflare?.env as Env | undefined;
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
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Result save error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      { error: `Failed to save result: ${errorMessage}` },
      { status: 500 }
    );
  }
}
