/**
 * Sanitization Utility (Phase 5)
 *
 * Server-side sanitization using sanitize-html to prevent XSS attacks.
 * Removes all HTML tags and enforces maximum length constraints.
 *
 * Target fields: feedback, strengths[], improvements[]
 */

import sanitizeHtml from "sanitize-html";

/**
 * Decode common HTML entities to plain text
 *
 * Converts HTML entities back to their original characters.
 * This is necessary because sanitize-html encodes special characters.
 *
 * @param text - Text with HTML entities
 * @returns Text with decoded entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/");
}

/**
 * Sanitize a single text field
 *
 * Performs the following steps:
 * 1. Truncate to maximum length
 * 2. Remove all HTML tags (plain text only)
 * 3. Decode HTML entities back to plain text
 * 4. Sanitize again (in case entities formed tags)
 * 5. Remove any remaining < > characters
 * 6. Trim whitespace
 *
 * @param text - Input text to sanitize
 * @param maxLength - Maximum allowed length (default: 5000)
 * @returns Sanitized plain text
 *
 * @example
 * ```ts
 * const clean = sanitizeText('<script>alert("xss")</script>Hello', 1000);
 * // Returns: "Hello"
 * ```
 */
export function sanitizeText(text: string, maxLength: number = 5000): string {
  // 1. Enforce maximum length
  let sanitized = text.length > maxLength ? text.substring(0, maxLength) : text;

  // 2. Remove all HTML tags (no tags allowed - plain text only)
  sanitized = sanitizeHtml(sanitized, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    // disallowedTagsMode defaults to "discard" which removes tags entirely
  });

  // 3. Decode HTML entities back to plain text
  // sanitize-html encodes special characters like & < > into HTML entities
  // We need to decode them back for plain text output
  sanitized = decodeHtmlEntities(sanitized);

  // 4. Sanitize AGAIN to catch any tags created by decoding entities
  // This prevents XSS via encoded tags like &#60;script&#62;
  sanitized = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // 5. Decode AGAIN (second sanitize re-encodes characters)
  sanitized = decodeHtmlEntities(sanitized);

  // 6. Remove any remaining angle brackets as extra precaution
  sanitized = sanitized.replace(/[<>]/g, "");

  // 7. Trim leading/trailing whitespace
  return sanitized.trim();
}

/**
 * Sanitize an array of text items
 *
 * Applies sanitizeText() to each item in the array.
 * Also enforces maximum array length and per-item length.
 *
 * @param items - Array of strings to sanitize
 * @param maxItems - Maximum number of items allowed (default: 10)
 * @param maxItemLength - Maximum length per item (default: 500)
 * @returns Sanitized array
 *
 * @example
 * ```ts
 * const clean = sanitizeArray(
 *   ['<b>Point 1</b>', 'Point 2', ...],
 *   10,
 *   500
 * );
 * // Returns: ['Point 1', 'Point 2', ...]
 * ```
 */
export function sanitizeArray(
  items: string[],
  maxItems: number = 10,
  maxItemLength: number = 500
): string[] {
  // 1. Limit array length
  const limitedItems = items.slice(0, maxItems);

  // 2. Sanitize each item
  return limitedItems.map((item) => sanitizeText(item, maxItemLength));
}

/**
 * Sanitize complete SaveResultRequest data
 *
 * Applies sanitization to all text fields in the request.
 * This should be called before saving data to KV storage.
 *
 * @param data - Request data with potentially unsafe content
 * @returns Sanitized data safe for storage and display
 *
 * @example
 * ```ts
 * const clean = sanitizeResultRequest({
 *   feedback: '<script>...</script>',
 *   strengths: ['<b>good</b>'],
 *   improvements: ['<i>bad</i>'],
 *   ...
 * });
 * ```
 */
export function sanitizeResultRequest(data: {
  feedback: string;
  strengths: string[];
  improvements: string[];
  [key: string]: unknown;
}): {
  feedback: string;
  strengths: string[];
  improvements: string[];
  [key: string]: unknown;
} {
  return {
    ...data,
    feedback: sanitizeText(data.feedback, 5000),
    strengths: sanitizeArray(data.strengths, 10, 500),
    improvements: sanitizeArray(data.improvements, 10, 500),
  };
}
