/**
 * Share Utility Unit Tests
 * Tests for tweet text generation and X intent URL creation
 * No mocks used - tests the actual utility functions
 */

import { describe, it, expect } from "vitest";
import {
  generateTweetText,
  generateXIntentUrl,
  getGameUrl,
} from "../../app/utils/share";

describe("Share Utilities", () => {
  describe("generateTweetText", () => {
    it("should generate tweet text with correct format", () => {
      const text = generateTweetText(85, "javascript", "1");

      expect(text).toContain("#CodeRabbit");
      expect(text).toContain("85点");
      expect(text).toContain("JavaScript");
      expect(text).toContain("レベル: 1");
      expect(text).toContain("https://review-game.example.com");
    });

    it("should handle Python language correctly", () => {
      const text = generateTweetText(70, "python", "2");

      expect(text).toContain("Python");
      expect(text).toContain("70点");
      expect(text).toContain("レベル: 2");
    });

    it("should handle Flutter language correctly", () => {
      const text = generateTweetText(95, "flutter", "3");

      expect(text).toContain("Flutter");
      expect(text).toContain("95点");
      expect(text).toContain("レベル: 3");
    });

    it("should capitalize unknown languages", () => {
      const text = generateTweetText(80, "rust", "1");

      expect(text).toContain("Rust"); // Capitalized
      expect(text).toContain("80点");
    });

    it("should handle perfect score", () => {
      const text = generateTweetText(100, "javascript", "1");

      expect(text).toContain("100点");
    });

    it("should handle minimum score", () => {
      const text = generateTweetText(0, "javascript", "1");

      expect(text).toContain("0点");
    });
  });

  describe("generateXIntentUrl", () => {
    it("should generate valid X intent URL without image", () => {
      const tweetText = "Test tweet";
      const url = generateXIntentUrl(tweetText);

      expect(url).toContain("https://twitter.com/intent/tweet");
      expect(url).toContain("text=");
      // URLSearchParams converts spaces to +, so we need to replace them before decoding
      const decodedUrl = url.replace(/\+/g, " ");
      expect(decodeURIComponent(decodedUrl)).toContain("Test tweet");
    });

    it("should include image URL in tweet text when provided", () => {
      const tweetText = "Test tweet";
      const imageUrl = "https://example.com/image.png";
      const url = generateXIntentUrl(tweetText, imageUrl);

      // URLSearchParams converts spaces to +, so we need to replace them before decoding
      const decodedUrl = url.replace(/\+/g, " ");
      const fullyDecoded = decodeURIComponent(decodedUrl);
      expect(fullyDecoded).toContain("Test tweet");
      expect(fullyDecoded).toContain(imageUrl);
    });

    it("should properly encode special characters", () => {
      const tweetText = "Test #hash @mention & special";
      const url = generateXIntentUrl(tweetText);

      expect(url).toContain("twitter.com/intent/tweet");
      // Should be URL encoded
      expect(url).toContain("%23"); // # encoded
    });

    it("should handle Japanese characters", () => {
      const tweetText = "テストツイート";
      const url = generateXIntentUrl(tweetText);

      expect(url).toContain("twitter.com/intent/tweet");
      // Japanese should be encoded
      expect(url).toMatch(/%[0-9A-F]{2}/);
    });
  });

  describe("getGameUrl", () => {
    it("should return the game URL", () => {
      const url = getGameUrl();

      expect(url).toBe("https://review-game.example.com");
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  describe("Integration: Complete share flow", () => {
    it("should generate complete share data for JavaScript Level 1", () => {
      const score = 85;
      const language = "javascript";
      const level = "1";

      const tweetText = generateTweetText(score, language, level);
      const imageUrl = "https://share.example.com/js-1-12345.png";
      const xUrl = generateXIntentUrl(tweetText, imageUrl);

      // Verify tweet text
      expect(tweetText).toContain("85点");
      expect(tweetText).toContain("JavaScript");

      // Verify X URL
      expect(xUrl).toContain("twitter.com/intent/tweet");
      const decodedUrl = decodeURIComponent(xUrl);
      expect(decodedUrl).toContain(imageUrl);
    });

    it("should generate complete share data for Python Level 3", () => {
      const score = 70;
      const language = "python";
      const level = "3";

      const tweetText = generateTweetText(score, language, level);
      const xUrl = generateXIntentUrl(tweetText);

      expect(tweetText).toContain("70点");
      expect(tweetText).toContain("Python");
      expect(tweetText).toContain("レベル: 3");
      expect(xUrl).toContain("twitter.com/intent/tweet");
    });
  });
});
