/**
 * Rate Limiting Utility (Phase 5)
 *
 * KV-based fixed window counter for rate limiting.
 * Limits requests to 5 per minute per IP address.
 *
 * Note: KV has eventual consistency, so perfect rate limiting
 * is not guaranteed. For stricter limits, consider Durable Objects.
 */

import type { RateLimitConfig, RateLimitResult } from "~/types/result";

/**
 * Check if a request is within the rate limit
 *
 * Uses KV storage to track request counts per key (typically IP address).
 * Implements a fixed window counter that resets after the TTL expires.
 *
 * @param kv - Cloudflare KV namespace
 * @param key - Unique identifier (e.g., ratelimit:save-result:192.168.1.1)
 * @param config - Rate limit configuration (limit and window duration)
 * @returns Object indicating whether request is allowed and remaining count
 *
 * @example
 * ```ts
 * const result = await checkRateLimit(
 *   context.env.RESULTS_KV,
 *   `ratelimit:save-result:${clientIp}`,
 *   { limit: 5, windowSeconds: 60 }
 * );
 *
 * if (!result.allowed) {
 *   return json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    // Get current count from KV
    const currentValue = await kv.get(key);
    const currentCount = currentValue ? parseInt(currentValue, 10) : 0;

    // Check if limit exceeded
    if (currentCount >= config.limit) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    // Increment count with TTL
    // Note: This is not atomic due to KV's eventual consistency
    const newCount = currentCount + 1;
    await kv.put(key, newCount.toString(), {
      expirationTtl: config.windowSeconds,
    });

    return {
      allowed: true,
      remaining: config.limit - newCount,
    };
  } catch (error) {
    // On error, allow the request (fail open)
    // This prevents rate limiting from blocking legitimate requests
    // when KV is unavailable
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      remaining: config.limit - 1,
    };
  }
}

/**
 * Extract client IP address from request headers
 *
 * Checks multiple headers in order of preference:
 * 1. CF-Connecting-IP (Cloudflare's real client IP)
 * 2. X-Forwarded-For (standard proxy header, takes first IP)
 *
 * @param request - Remix request object
 * @returns Client IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Try Cloudflare's header first
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  // Fall back to X-Forwarded-For
  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (forwardedFor && forwardedFor.trim()) {
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
    // Take the first one (original client IP)
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return "unknown";
}

/**
 * Build rate limit key for save-result endpoint
 *
 * Creates a namespaced key for KV storage.
 *
 * @param ip - Client IP address
 * @returns Formatted KV key
 */
export function buildRateLimitKey(ip: string): string {
  return `ratelimit:save-result:${ip}`;
}
