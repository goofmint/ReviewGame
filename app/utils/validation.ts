/**
 * Validation Utility (Phase 5)
 *
 * Comprehensive input validation for SaveResultRequest.
 * Validates types, ranges, lengths, and formats.
 * Also checks total payload size (max 32KB).
 */

import { availableLanguages } from "~/data/problems";
import type { ValidationError } from "~/types/result";

/**
 * Validation result structure
 */
export interface ValidationResult {
  /** Whether all validation passed */
  valid: boolean;

  /** Array of validation errors (empty if valid) */
  errors: ValidationError[];
}

/**
 * Validate SaveResultRequest body
 *
 * Performs comprehensive validation including:
 * - Type checking (number, string, array)
 * - Range checking (score 0-100, level >= 1)
 * - Length checking (string length, array size)
 * - Format checking (URL, locale, language)
 * - Total payload size (max 32KB)
 *
 * @param body - Request body to validate (any type for flexibility)
 * @returns Validation result with errors array
 *
 * @example
 * ```ts
 * const result = validateSaveResultRequest(requestBody);
 * if (!result.valid) {
 *   return json({ errors: result.errors }, { status: 400 });
 * }
 * ```
 */
export function validateSaveResultRequest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
): ValidationResult {
  const errors: ValidationError[] = [];

  // Score validation
  if (typeof body.score !== "number" || body.score < 0 || body.score > 100) {
    errors.push({
      field: "score",
      message: "Score must be a number between 0 and 100",
    });
  }

  // Language validation
  const languages = availableLanguages as readonly string[];
  if (!body.language || !languages.includes(body.language)) {
    errors.push({
      field: "language",
      message: `Language must be one of: ${languages.join(", ")}`,
    });
  }

  // Level validation
  if (typeof body.level !== "number" || body.level < 1) {
    errors.push({
      field: "level",
      message: "Level must be a number greater than or equal to 1",
    });
  }

  // Locale validation
  const validLocales = ["ja", "en"];
  if (!body.locale || !validLocales.includes(body.locale)) {
    errors.push({
      field: "locale",
      message: `Locale must be one of: ${validLocales.join(", ")}`,
    });
  }

  // Feedback validation
  if (!body.feedback || typeof body.feedback !== "string") {
    errors.push({
      field: "feedback",
      message: "Feedback must be a non-empty string",
    });
  } else if (body.feedback.length > 5000) {
    errors.push({
      field: "feedback",
      message: "Feedback must not exceed 5000 characters",
    });
  }

  // Strengths validation
  if (!Array.isArray(body.strengths)) {
    errors.push({
      field: "strengths",
      message: "Strengths must be an array",
    });
  } else {
    if (body.strengths.length < 1 || body.strengths.length > 10) {
      errors.push({
        field: "strengths",
        message: "Strengths must contain 1 to 10 items",
      });
    }

    body.strengths.forEach((item: unknown, index: number) => {
      if (typeof item !== "string") {
        errors.push({
          field: `strengths[${index}]`,
          message: "Each strength must be a string",
        });
      } else if (item.length > 500) {
        errors.push({
          field: `strengths[${index}]`,
          message: "Each strength must not exceed 500 characters",
        });
      }
    });
  }

  // Improvements validation
  if (!Array.isArray(body.improvements)) {
    errors.push({
      field: "improvements",
      message: "Improvements must be an array",
    });
  } else {
    if (body.improvements.length < 1 || body.improvements.length > 10) {
      errors.push({
        field: "improvements",
        message: "Improvements must contain 1 to 10 items",
      });
    }

    body.improvements.forEach((item: unknown, index: number) => {
      if (typeof item !== "string") {
        errors.push({
          field: `improvements[${index}]`,
          message: "Each improvement must be a string",
        });
      } else if (item.length > 500) {
        errors.push({
          field: `improvements[${index}]`,
          message: "Each improvement must not exceed 500 characters",
        });
      }
    });
  }

  // ImageURL validation
  if (!body.imageUrl || typeof body.imageUrl !== "string") {
    errors.push({
      field: "imageUrl",
      message: "Image URL is required and must be a string",
    });
  } else {
    try {
      const url = new URL(body.imageUrl);

      // Must be HTTPS
      if (url.protocol !== "https:") {
        errors.push({
          field: "imageUrl",
          message: "Image URL must use HTTPS protocol",
        });
      }

      // Should be from R2 domain (if R2_PUBLIC_URL is set)
      // Note: In production, this should be validated against env var
      // For now, we just ensure it's a valid HTTPS URL
    } catch (e) {
      errors.push({
        field: "imageUrl",
        message: "Image URL is not a valid URL format",
      });
    }
  }

  // Total payload size check (max 32KB = 32,768 bytes)
  try {
    const payloadString = JSON.stringify(body);
    const payloadSize = new Blob([payloadString]).size;

    if (payloadSize > 32768) {
      errors.push({
        field: "payload",
        message: `Total payload size (${payloadSize} bytes) exceeds maximum of 32KB`,
      });
    }
  } catch (e) {
    errors.push({
      field: "payload",
      message: "Failed to calculate payload size",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * UUID v4 validation regex
 *
 * Matches the standard UUID v4 format:
 * xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hex digit and y is 8, 9, a, or b
 */
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate UUID v4 format
 *
 * Checks if a string matches the UUID v4 format.
 * Used to validate result IDs in URLs.
 *
 * @param id - String to validate
 * @returns true if valid UUID v4, false otherwise
 *
 * @example
 * ```ts
 * if (!isValidUUID(params.id)) {
 *   throw new Response('Not Found', { status: 404 });
 * }
 * ```
 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}
