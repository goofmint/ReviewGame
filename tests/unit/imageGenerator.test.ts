/**
 * Image Generator Unit Tests
 * Tests for Canvas-based image generation utilities
 * Note: Canvas API and Image loading tests run in E2E environment
 * Unit tests focus on helper functions that don't require browser APIs
 */

import { describe, it, expect } from "vitest";
import {
  generateShareImage,
  blobToFile,
  blobToBase64,
} from "../../app/utils/imageGenerator";

describe("Image Generator Utilities", () => {
  describe("generateShareImage - Error Handling", () => {
    it("should throw error when Canvas API is not available or getContext fails", async () => {
      // In JSDOM environment, Canvas getContext returns null
      // This tests the error handling path
      await expect(
        generateShareImage(85, "javascript", "1")
      ).rejects.toThrow(/Failed to get 2D context from canvas|Canvas API/);
    });
  });

  describe("blobToFile", () => {
    it("should convert Blob to File", () => {
      const blob = new Blob(["test content"], { type: "image/png" });
      const file = blobToFile(blob, "test.png");

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("test.png");
      expect(file.type).toBe("image/png");
      expect(file.size).toBe(blob.size);
    });

    it("should preserve Blob content", () => {
      const content = "test image data";
      const blob = new Blob([content], { type: "image/png" });
      const file = blobToFile(blob, "image.png");

      expect(file.size).toBe(content.length);
    });

    it("should handle different filenames", () => {
      const blob = new Blob(["data"], { type: "image/png" });
      const file1 = blobToFile(blob, "image1.png");
      const file2 = blobToFile(blob, "image2.png");

      expect(file1.name).toBe("image1.png");
      expect(file2.name).toBe("image2.png");
    });

    it("should handle various MIME types", () => {
      const pngBlob = new Blob(["png data"], { type: "image/png" });
      const jpgBlob = new Blob(["jpg data"], { type: "image/jpeg" });

      const pngFile = blobToFile(pngBlob, "image.png");
      const jpgFile = blobToFile(jpgBlob, "image.jpg");

      expect(pngFile.type).toBe("image/png");
      expect(jpgFile.type).toBe("image/jpeg");
    });

    it("should handle empty blobs", () => {
      const blob = new Blob([], { type: "image/png" });
      const file = blobToFile(blob, "empty.png");

      expect(file).toBeInstanceOf(File);
      expect(file.size).toBe(0);
      expect(file.name).toBe("empty.png");
    });

    it("should preserve file metadata", () => {
      const blob = new Blob(["data"], { type: "application/octet-stream" });
      const file = blobToFile(blob, "custom-type.bin");

      expect(file.type).toBe("application/octet-stream");
      expect(file.name).toBe("custom-type.bin");
    });
  });

  describe("blobToBase64", () => {
    it("should convert Blob to base64 data URL", async () => {
      const content = "test data";
      const blob = new Blob([content], { type: "text/plain" });
      const base64 = await blobToBase64(blob);

      expect(base64).toMatch(/^data:text\/plain;base64,/);
      expect(base64.length).toBeGreaterThan(0);
    });

    it("should handle image PNG blobs", async () => {
      const blob = new Blob(["fake png data"], { type: "image/png" });
      const base64 = await blobToBase64(blob);

      expect(base64).toMatch(/^data:image\/png;base64,/);
    });

    it("should produce decodable base64", async () => {
      const originalContent = "Hello, World!";
      const blob = new Blob([originalContent], { type: "text/plain" });
      const base64 = await blobToBase64(blob);

      // Extract base64 content
      const base64Content = base64.split(",")[1];
      const decoded = atob(base64Content);

      expect(decoded).toBe(originalContent);
    });

    it("should handle empty blob", async () => {
      const blob = new Blob([], { type: "text/plain" });
      const base64 = await blobToBase64(blob);

      expect(base64).toMatch(/^data:text\/plain;base64,/);
      // Empty blob should produce base64 with no content after comma
      const base64Content = base64.split(",")[1];
      expect(base64Content || "").toBe("");
    });

    it("should handle large blobs", async () => {
      // Create a larger blob (10KB)
      const largeContent = "a".repeat(10 * 1024);
      const blob = new Blob([largeContent], { type: "text/plain" });
      const base64 = await blobToBase64(blob);

      expect(base64).toMatch(/^data:text\/plain;base64,/);
      // Base64 is roughly 1.33x larger than original
      expect(base64.length).toBeGreaterThan(largeContent.length);
    });

    it("should handle binary data", async () => {
      // Create binary data
      const binaryData = new Uint8Array([0, 1, 2, 3, 255]);
      const blob = new Blob([binaryData], { type: "application/octet-stream" });
      const base64 = await blobToBase64(blob);

      expect(base64).toMatch(/^data:application\/octet-stream;base64,/);
      expect(base64.length).toBeGreaterThan(0);
    });
  });

  describe("Integration: File conversion workflow", () => {
    it("should convert Blob to File and back to base64", async () => {
      // Create a blob
      const originalContent = "Test image data";
      const blob = new Blob([originalContent], { type: "image/png" });

      // Convert to File
      const file = blobToFile(blob, "test-image.png");
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("test-image.png");

      // Convert to base64
      const base64 = await blobToBase64(blob);
      expect(base64).toMatch(/^data:image\/png;base64,/);

      // Verify content is preserved
      const base64Content = base64.split(",")[1];
      const decoded = atob(base64Content);
      expect(decoded).toBe(originalContent);
    });

    it("should handle multiple file conversions", async () => {
      const blobs = [
        new Blob(["content1"], { type: "image/png" }),
        new Blob(["content2"], { type: "image/jpeg" }),
        new Blob(["content3"], { type: "image/gif" }),
      ];

      const files = blobs.map((blob, index) =>
        blobToFile(blob, `image${index}.png`)
      );

      expect(files).toHaveLength(3);
      files.forEach((file, index) => {
        expect(file).toBeInstanceOf(File);
        expect(file.name).toBe(`image${index}.png`);
      });

      const base64Results = await Promise.all(
        blobs.map((blob) => blobToBase64(blob))
      );

      expect(base64Results).toHaveLength(3);
      base64Results.forEach((base64) => {
        expect(base64).toMatch(/^data:image\//);
      });
    });

    it("should maintain data integrity through conversion chain", async () => {
      // Use ASCII-only characters to avoid encoding issues with atob
      const testData = "Test data with special chars: @#$% 123";
      const blob = new Blob([testData], { type: "text/plain" });

      // Convert to File
      const file = blobToFile(blob, "test.txt");
      expect(file.size).toBe(blob.size);

      // Convert to Base64
      const base64 = await blobToBase64(blob);
      const base64Content = base64.split(",")[1];
      const decoded = atob(base64Content);

      // Verify data integrity
      expect(decoded).toBe(testData);
    });
  });
});
