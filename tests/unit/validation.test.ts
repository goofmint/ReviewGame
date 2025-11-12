/**
 * Unit Tests for Validation Utility (Phase 5)
 *
 * Tests comprehensive input validation for SaveResultRequest.
 * Covers type checking, range validation, length limits, and UUID validation.
 */

import { describe, it, expect } from "vitest";
import {
  validateSaveResultRequest,
  isValidUUID,
} from "../../app/utils/validation";

describe("validateSaveResultRequest", () => {
  // Valid baseline request for testing
  const validRequest = {
    score: 85,
    language: "javascript",
    level: 1,
    locale: "ja",
    feedback: "Great review with good points.",
    strengths: ["Good analysis", "Clear explanations"],
    improvements: ["Could be more detailed"],
    imageUrl: "https://example.com/image.png",
  };

  describe("score validation", () => {
    it("should accept valid score (0-100)", () => {
      const result = validateSaveResultRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accept score of 0", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        score: 0,
      });
      expect(result.valid).toBe(true);
    });

    it("should accept score of 100", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        score: 100,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject negative score", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        score: -1,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "score" })
      );
    });

    it("should reject score over 100", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        score: 101,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "score" })
      );
    });

    it("should reject non-number score", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        score: "85",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "score" })
      );
    });
  });

  describe("language validation", () => {
    it("should accept valid language", () => {
      const languages = ["javascript", "python", "flutter"];
      languages.forEach((lang) => {
        const result = validateSaveResultRequest({
          ...validRequest,
          language: lang,
        });
        expect(result.valid).toBe(true);
      });
    });

    it("should reject invalid language", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        language: "ruby",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "language" })
      );
    });

    it("should reject missing language", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        language: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "language" })
      );
    });
  });

  describe("level validation", () => {
    it("should accept level >= 1", () => {
      const levels = [1, 2, 3, 10, 100];
      levels.forEach((level) => {
        const result = validateSaveResultRequest({
          ...validRequest,
          level,
        });
        expect(result.valid).toBe(true);
      });
    });

    it("should reject level 0", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        level: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "level" })
      );
    });

    it("should reject negative level", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        level: -1,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "level" })
      );
    });

    it("should reject non-number level", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        level: "1",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "level" })
      );
    });
  });

  describe("locale validation", () => {
    it("should accept 'ja' locale", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        locale: "ja",
      });
      expect(result.valid).toBe(true);
    });

    it("should accept 'en' locale", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        locale: "en",
      });
      expect(result.valid).toBe(true);
    });

    it("should reject invalid locale", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        locale: "fr",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "locale" })
      );
    });

    it("should reject missing locale", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        locale: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "locale" })
      );
    });
  });

  describe("feedback validation", () => {
    it("should accept valid feedback", () => {
      const result = validateSaveResultRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it("should accept feedback at max length (5000 chars)", () => {
      const feedback = "a".repeat(5000);
      const result = validateSaveResultRequest({
        ...validRequest,
        feedback,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject feedback over 5000 chars", () => {
      const feedback = "a".repeat(5001);
      const result = validateSaveResultRequest({
        ...validRequest,
        feedback,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "feedback" })
      );
    });

    it("should reject empty feedback", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        feedback: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "feedback" })
      );
    });

    it("should reject non-string feedback", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        feedback: 123,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "feedback" })
      );
    });
  });

  describe("strengths validation", () => {
    it("should accept valid strengths array", () => {
      const result = validateSaveResultRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it("should accept 1 strength", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths: ["One point"],
      });
      expect(result.valid).toBe(true);
    });

    it("should accept 10 strengths", () => {
      const strengths = Array(10).fill("Point");
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject empty strengths array", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "strengths" })
      );
    });

    it("should reject more than 10 strengths", () => {
      const strengths = Array(11).fill("Point");
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths,
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "strengths" })
      );
    });

    it("should reject strength over 500 chars", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths: ["a".repeat(501)],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("strengths");
    });

    it("should reject non-array strengths", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths: "not an array",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "strengths" })
      );
    });

    it("should reject non-string strength item", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        strengths: [123],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("strengths");
    });
  });

  describe("improvements validation", () => {
    it("should accept valid improvements array", () => {
      const result = validateSaveResultRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it("should accept 1 improvement", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        improvements: ["One point"],
      });
      expect(result.valid).toBe(true);
    });

    it("should accept 10 improvements", () => {
      const improvements = Array(10).fill("Point");
      const result = validateSaveResultRequest({
        ...validRequest,
        improvements,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject empty improvements array", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        improvements: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "improvements" })
      );
    });

    it("should reject improvement over 500 chars", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        improvements: ["a".repeat(501)],
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toContain("improvements");
    });
  });

  describe("imageUrl validation", () => {
    it("should accept valid HTTPS URL", () => {
      const result = validateSaveResultRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it("should reject HTTP URL", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        imageUrl: "http://example.com/image.png",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "imageUrl" })
      );
    });

    it("should reject invalid URL format", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        imageUrl: "not-a-url",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "imageUrl" })
      );
    });

    it("should reject missing imageUrl", () => {
      const result = validateSaveResultRequest({
        ...validRequest,
        imageUrl: "",
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "imageUrl" })
      );
    });
  });

  describe("payload size validation", () => {
    it("should accept payload under 32KB", () => {
      const result = validateSaveResultRequest(validRequest);
      expect(result.valid).toBe(true);
    });

    it("should reject payload over 32KB", () => {
      // Create a large payload (>32KB)
      const largeArray = Array(100).fill("a".repeat(500));
      const result = validateSaveResultRequest({
        ...validRequest,
        feedback: "a".repeat(5000),
        strengths: largeArray,
        improvements: largeArray,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: "payload" })
      );
    });
  });
});

describe("isValidUUID", () => {
  it("should accept valid UUID v4", () => {
    const validUUIDs = [
      "123e4567-e89b-42d3-a456-426614174000",
      "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      "550e8400-e29b-41d4-a716-446655440000",
    ];

    validUUIDs.forEach((uuid) => {
      expect(isValidUUID(uuid)).toBe(true);
    });
  });

  it("should reject invalid UUID format", () => {
    const invalidUUIDs = [
      "not-a-uuid",
      "123e4567-e89b-12d3-a456-426614174000", // v1 (not v4)
      "123e4567-e89b-52d3-a456-426614174000", // v5 (not v4)
      "123e4567e89b42d3a456426614174000", // Missing hyphens
      "123e4567-e89b-42d3-a456", // Too short
      "",
    ];

    invalidUUIDs.forEach((uuid) => {
      expect(isValidUUID(uuid)).toBe(false);
    });
  });

  it("should be case-insensitive", () => {
    const uuid = "123E4567-E89B-42D3-A456-426614174000";
    expect(isValidUUID(uuid)).toBe(true);
    expect(isValidUUID(uuid.toLowerCase())).toBe(true);
  });
});
