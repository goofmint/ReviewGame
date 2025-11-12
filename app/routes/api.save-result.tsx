/**
 * API Endpoint: Save Review Result
 *
 * POST /api/save-result
 *
 * Saves a review result to Cloudflare KV with a unique UUID.
 * Implements rate limiting, validation, and sanitization.
 */

import type {
  SavedResult,
  SaveResultRequest,
  SaveResultResponse,
} from "~/types/result";
import {
  checkRateLimit,
  getClientIp,
  buildRateLimitKey,
} from "~/utils/rateLimit";
import { sanitizeResultRequest } from "~/utils/sanitize";
import { validateSaveResultRequest } from "~/utils/validation";

/**
 * Action function arguments type
 */
interface ActionArgs {
  request: Request;
  context: {
    cloudflare?: {
      env: {
        RESULTS_KV: KVNamespace;
      };
    };
  };
}

/**
 * Handle POST /api/save-result
 *
 * Process flow:
 * 1. Rate limit check (5 requests/minute per IP)
 * 2. Request body validation
 * 3. Text sanitization (XSS prevention)
 * 4. UUID generation
 * 5. Save to KV storage
 * 6. Return result URL
 */
export async function action({ request, context }: ActionArgs) {
  try {
    // Get environment bindings
    const env = context.cloudflare?.env as {
      RESULTS_KV: KVNamespace;
    } | undefined;

    if (!env?.RESULTS_KV) {
      return Response.json(
        { error: "KV namespace not configured" },
        { status: 500 }
      );
    }

    // 1. Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimitKey = buildRateLimitKey(clientIp);
    const rateLimitResult = await checkRateLimit(
      env.RESULTS_KV,
      rateLimitKey,
      { limit: 5, windowSeconds: 60 }
    );

    if (!rateLimitResult.allowed) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 2. Parse and validate request body
    const body: SaveResultRequest = await request.json();

    const validation = validateSaveResultRequest(body);
    if (!validation.valid) {
      return Response.json(
        { error: "Validation failed", errors: validation.errors },
        { status: 400 }
      );
    }

    // 3. Sanitize text fields
    const sanitizedData = sanitizeResultRequest(body);

    // 4. Generate UUID v4 using Web Crypto API
    const resultId = crypto.randomUUID();

    // 5. Create SavedResult object
    const now = Date.now();
    const savedResult: SavedResult = {
      id: resultId,
      score: sanitizedData.score,
      language: sanitizedData.language,
      level: sanitizedData.level,
      locale: sanitizedData.locale,
      feedback: sanitizedData.feedback,
      strengths: sanitizedData.strengths,
      improvements: sanitizedData.improvements,
      imageUrl: sanitizedData.imageUrl,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    // 6. Save to KV (UUID as key directly, no prefix)
    // No expiration (permanent storage)
    await env.RESULTS_KV.put(resultId, JSON.stringify(savedResult));

    // 7. Build result URL
    const url = new URL(request.url);
    const resultUrl = `${url.origin}/result/${resultId}`;

    // 8. Return success response
    const response: SaveResultResponse = {
      success: true,
      resultId,
      resultUrl,
    };

    return Response.json(response, {
      headers: {
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    // Log error for debugging
    console.error("Save result error:", error);

    // Return generic error message (don't expose internal details)
    return Response.json(
      { error: "Failed to save result. Please try again." },
      { status: 500 }
    );
  }
}

// Disable GET requests (only POST is allowed)
export async function loader() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
