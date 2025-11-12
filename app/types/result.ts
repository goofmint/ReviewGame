/**
 * Type definitions for Phase 5: Result Persistence
 *
 * These types define the structure for saving and retrieving review results
 * with unique UUID-based URLs and locale-fixed display.
 */

/**
 * Saved review result stored in Cloudflare KV
 *
 * This represents the complete result data that is persisted to KV storage.
 * The ID is used as both the URL path and the KV key directly (no prefix).
 */
export interface SavedResult {
  /** UUID v4 - used directly as URL path and KV key */
  id: string;

  /** Score from 0 to 100 */
  score: number;

  /** Programming language (javascript | python | flutter) */
  language: string;

  /** Level number (1 or greater) */
  level: number;

  /** Display locale (ja | en) - fixed at save time */
  locale: string;

  /** LLM feedback text (max 5,000 chars) */
  feedback: string;

  /** Positive points (1-10 items, max 500 chars each) */
  strengths: string[];

  /** Improvement points (1-10 items, max 500 chars each) */
  improvements: string[];

  /** OG image URL from R2 storage */
  imageUrl: string;

  /** UNIX timestamp in milliseconds */
  timestamp: number;

  /** ISO 8601 formatted date-time string */
  createdAt: string;
}

/**
 * Request body for POST /api/save-result
 *
 * This is sent from the client when saving a review result.
 * Should be submitted using useFetcher(), not direct fetch().
 */
export interface SaveResultRequest {
  /** Score from 0 to 100 */
  score: number;

  /** Programming language */
  language: string;

  /** Level number */
  level: number;

  /** Locale at save time (ja | en) */
  locale: string;

  /** LLM feedback text */
  feedback: string;

  /** Positive points array */
  strengths: string[];

  /** Improvement points array */
  improvements: string[];

  /** OG image URL from R2 */
  imageUrl: string;
}

/**
 * Response from POST /api/save-result
 *
 * Returned after successfully saving a result to KV storage.
 */
export interface SaveResultResponse {
  /** Success flag */
  success: boolean;

  /** Generated UUID v4 */
  resultId: string;

  /** Full URL to the result page */
  resultUrl: string;
}

/**
 * Validation error structure
 *
 * Used in validation utility to provide detailed error feedback.
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;

  /** Human-readable error message */
  message: string;
}

/**
 * Rate limit check result
 *
 * Returned by the rate limiting utility.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Number of remaining requests in the window */
  remaining: number;
}

/**
 * Rate limit configuration
 *
 * Configuration for the rate limiting utility.
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;

  /** Time window in seconds */
  windowSeconds: number;
}
