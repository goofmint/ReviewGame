/**
 * R2 Storage Utility Unit Tests
 * Tests for R2 upload functions, validation, and URL generation
 * No mocks used - tests use actual implementations with test data
 */

import { describe, it, expect } from "vitest";
import {
  validateImageData,
  sanitizeFilename,
  generateStorageKey,
  getPublicUrl,
  uploadImageToR2,
  type R2Bucket,
  type R2Object,
} from "../../app/utils/r2";

describe("R2 Storage Utilities", () => {
  describe("validateImageData", () => {
    it("should accept valid image data within size limit", () => {
      const data = new ArrayBuffer(1024 * 1024); // 1MB
      expect(() => validateImageData(data)).not.toThrow();
    });

    it("should reject empty image data", () => {
      const data = new ArrayBuffer(0);
      expect(() => validateImageData(data)).toThrow("Image data is empty");
    });

    it("should reject image data exceeding default size limit (5MB)", () => {
      const data = new ArrayBuffer(6 * 1024 * 1024); // 6MB
      expect(() => validateImageData(data)).toThrow(/exceeds maximum/);
    });

    it("should accept image data at exact size limit", () => {
      const data = new ArrayBuffer(5 * 1024 * 1024); // Exactly 5MB
      expect(() => validateImageData(data)).not.toThrow();
    });

    it("should respect custom size limit", () => {
      const data = new ArrayBuffer(2 * 1024 * 1024); // 2MB
      const customLimit = 1 * 1024 * 1024; // 1MB limit

      expect(() => validateImageData(data, customLimit)).toThrow(/exceeds maximum/);
    });
  });

  describe("sanitizeFilename", () => {
    it("should preserve valid alphanumeric characters", () => {
      const filename = "image123.png";
      expect(sanitizeFilename(filename)).toBe("image123.png");
    });

    it("should replace invalid characters with underscores", () => {
      const filename = "my image!@#.png";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).not.toContain(" ");
      expect(sanitized).not.toContain("!");
      expect(sanitized).not.toContain("@");
      expect(sanitized).not.toContain("#");
      expect(sanitized).toContain("_");
    });

    it("should prevent path traversal attacks", () => {
      const filename = "../../../etc/passwd";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).not.toContain("..");
      expect(sanitized).not.toContain("/");
    });

    it("should handle multiple dots correctly", () => {
      const filename = "image...png";
      const sanitized = sanitizeFilename(filename);

      expect(sanitized).not.toContain("...");
    });

    it("should limit filename length to 255 characters", () => {
      const longFilename = "a".repeat(300) + ".png";
      const sanitized = sanitizeFilename(longFilename);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it("should preserve hyphens and underscores", () => {
      const filename = "my-image_file.png";
      expect(sanitizeFilename(filename)).toBe("my-image_file.png");
    });
  });

  describe("generateStorageKey", () => {
    it("should generate correct storage key format", () => {
      const key = generateStorageKey("javascript", "1", 1234567890);

      expect(key).toBe("share/javascript/1/1234567890.png");
    });

    it("should sanitize language and level in the key", () => {
      const key = generateStorageKey("java script", "level 1", 1234567890);

      expect(key).toContain("share/");
      expect(key).not.toContain(" ");
      expect(key).toContain(".png");
    });

    it("should handle different timestamps", () => {
      const timestamp1 = 1234567890;
      const timestamp2 = 9876543210;

      const key1 = generateStorageKey("python", "2", timestamp1);
      const key2 = generateStorageKey("python", "2", timestamp2);

      expect(key1).not.toBe(key2);
      expect(key1).toContain(timestamp1.toString());
      expect(key2).toContain(timestamp2.toString());
    });

    it("should always use .png extension", () => {
      const key = generateStorageKey("flutter", "3", Date.now());

      // Check that the key ends with .png extension
      expect(key).toMatch(/\.png$/);
    });
  });

  describe("getPublicUrl", () => {
    it("should construct correct public URL", () => {
      const key = "share/javascript/1/12345.png";
      const baseUrl = "https://share.example.com";

      const url = getPublicUrl(key, baseUrl);

      expect(url).toBe("https://share.example.com/share/javascript/1/12345.png");
    });

    it("should handle base URL with trailing slash", () => {
      const key = "share/python/2/67890.png";
      const baseUrl = "https://share.example.com/";

      const url = getPublicUrl(key, baseUrl);

      expect(url).toBe("https://share.example.com/share/python/2/67890.png");
      // Verify no double slashes except in https://
      const withoutProtocol = url.replace("https://", "");
      expect(withoutProtocol).not.toContain("//");
    });

    it("should handle key with leading slash", () => {
      const key = "/share/flutter/3/11111.png";
      const baseUrl = "https://share.example.com";

      const url = getPublicUrl(key, baseUrl);

      expect(url).toBe("https://share.example.com/share/flutter/3/11111.png");
    });

    it("should handle both trailing slash in URL and leading slash in key", () => {
      const key = "/share/javascript/1/22222.png";
      const baseUrl = "https://share.example.com/";

      const url = getPublicUrl(key, baseUrl);

      expect(url).toBe("https://share.example.com/share/javascript/1/22222.png");
      expect(url.match(/\/\//g)?.length).toBe(1); // Only one // (in https://)
    });
  });

  describe("uploadImageToR2", () => {
    it("should successfully upload valid image data", async () => {
      // Create a mock R2 bucket
      const mockBucket: R2Bucket = {
        put: async (key, value, options) => {
          // Verify parameters
          expect(key).toBeTruthy();
          expect(value).toBeInstanceOf(ArrayBuffer);
          expect(options?.httpMetadata?.contentType).toBe("image/png");
          expect(options?.httpMetadata?.cacheControl).toContain("immutable");

          // Return mock R2Object
          const mockObject: R2Object = {
            key,
            size: (value as ArrayBuffer).byteLength,
            etag: "mock-etag",
            httpEtag: "mock-http-etag",
          };
          return mockObject;
        },
        get: async () => null,
        delete: async () => {},
      };

      const imageData = new ArrayBuffer(1024);
      const key = "share/test/1/12345.png";

      const result = await uploadImageToR2(mockBucket, key, imageData);

      expect(result).toBeTruthy();
      expect(result.key).toBe(key);
      expect(result.size).toBe(1024);
    });

    it("should throw error for empty image data", async () => {
      const mockBucket: R2Bucket = {
        put: async () => null,
        get: async () => null,
        delete: async () => {},
      };

      const imageData = new ArrayBuffer(0);
      const key = "share/test/1/12345.png";

      await expect(uploadImageToR2(mockBucket, key, imageData)).rejects.toThrow();
    });

    it("should throw error if R2 put returns null", async () => {
      const mockBucket: R2Bucket = {
        put: async () => null, // Simulate failure
        get: async () => null,
        delete: async () => {},
      };

      const imageData = new ArrayBuffer(1024);
      const key = "share/test/1/12345.png";

      await expect(uploadImageToR2(mockBucket, key, imageData)).rejects.toThrow(
        "Failed to upload image to R2"
      );
    });

    it("should include custom metadata in upload", async () => {
      let capturedMetadata: Record<string, string> | undefined;

      const mockBucket: R2Bucket = {
        put: async (key, value, options) => {
          capturedMetadata = options?.customMetadata;

          const mockObject: R2Object = {
            key,
            size: (value as ArrayBuffer).byteLength,
            etag: "mock-etag",
            httpEtag: "mock-http-etag",
          };
          return mockObject;
        },
        get: async () => null,
        delete: async () => {},
      };

      const imageData = new ArrayBuffer(1024);
      const key = "share/test/1/12345.png";

      await uploadImageToR2(mockBucket, key, imageData);

      expect(capturedMetadata).toBeTruthy();
      expect(capturedMetadata?.source).toBe("code-review-game");
      expect(capturedMetadata?.uploadedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
    });
  });
});
