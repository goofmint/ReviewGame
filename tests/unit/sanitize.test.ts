/**
 * Unit Tests for Sanitization Utility (Phase 5)
 *
 * Tests comprehensive XSS prevention and text sanitization.
 * Covers HTML tag removal, length limits, and edge cases.
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeText,
  sanitizeArray,
  sanitizeResultRequest,
} from "../../app/utils/sanitize";

describe("sanitizeText", () => {
  describe("HTML tag removal", () => {
    it("should remove script tags", () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(input);
      expect(result).toBe("Hello");
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("should remove all HTML tags", () => {
      const input = "<b>Bold</b> <i>Italic</i> <u>Underline</u>";
      const result = sanitizeText(input);
      expect(result).toBe("Bold Italic Underline");
    });

    it("should remove nested HTML tags", () => {
      const input = "<div><span><strong>Nested</strong></span></div>";
      const result = sanitizeText(input);
      expect(result).toBe("Nested");
    });

    it("should remove img tags", () => {
      const input = '<img src="x" onerror="alert(1)">Text';
      const result = sanitizeText(input);
      expect(result).not.toContain("<img");
      expect(result).not.toContain("onerror");
    });

    it("should remove style tags", () => {
      const input = "<style>body { display: none; }</style>Content";
      const result = sanitizeText(input);
      expect(result).toBe("Content");
    });

    it("should remove iframe tags", () => {
      const input = '<iframe src="evil.com"></iframe>Safe';
      const result = sanitizeText(input);
      expect(result).toBe("Safe");
    });
  });

  describe("angle bracket removal", () => {
    it("should remove remaining angle brackets", () => {
      const input = "Text with < and > symbols";
      const result = sanitizeText(input);
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should handle multiple angle brackets", () => {
      const input = "<<<>>>Test<<<>>>";
      const result = sanitizeText(input);
      expect(result).toBe("Test");
    });
  });

  describe("length enforcement", () => {
    it("should accept text under max length", () => {
      const input = "a".repeat(100);
      const result = sanitizeText(input, 200);
      expect(result).toHaveLength(100);
    });

    it("should truncate text at max length", () => {
      const input = "a".repeat(5001);
      const result = sanitizeText(input, 5000);
      expect(result).toHaveLength(5000);
    });

    it("should accept text exactly at max length", () => {
      const input = "a".repeat(5000);
      const result = sanitizeText(input, 5000);
      expect(result).toHaveLength(5000);
    });

    it("should respect custom max length", () => {
      const input = "a".repeat(1000);
      const result = sanitizeText(input, 500);
      expect(result).toHaveLength(500);
    });

    it("should truncate before HTML removal", () => {
      const input = "<b>" + "a".repeat(100) + "</b>";
      const result = sanitizeText(input, 10);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading whitespace", () => {
      const input = "   Text";
      const result = sanitizeText(input);
      expect(result).toBe("Text");
    });

    it("should trim trailing whitespace", () => {
      const input = "Text   ";
      const result = sanitizeText(input);
      expect(result).toBe("Text");
    });

    it("should trim both leading and trailing whitespace", () => {
      const input = "   Text   ";
      const result = sanitizeText(input);
      expect(result).toBe("Text");
    });

    it("should preserve internal whitespace", () => {
      const input = "Hello   World";
      const result = sanitizeText(input);
      expect(result).toBe("Hello   World");
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = sanitizeText("");
      expect(result).toBe("");
    });

    it("should handle whitespace-only string", () => {
      const result = sanitizeText("   ");
      expect(result).toBe("");
    });

    it("should handle string with only HTML tags", () => {
      const input = "<div><span></span></div>";
      const result = sanitizeText(input);
      expect(result).toBe("");
    });

    it("should handle special characters", () => {
      const input = "Hello!@#$%^&*()_+-=[]{}|;':\",.?/~`";
      const result = sanitizeText(input);
      expect(result).toBe("Hello!@#$%^&*()_+-=[]{}|;':\",.?/~`");
    });

    it("should handle unicode characters", () => {
      const input = "こんにちは世界 🌍";
      const result = sanitizeText(input);
      expect(result).toBe("こんにちは世界 🌍");
    });

    it("should handle mixed content", () => {
      const input = '<script>alert("xss")</script>正常なテキスト<b>Bold</b>';
      const result = sanitizeText(input);
      expect(result).toBe("正常なテキストBold");
    });
  });

  describe("XSS attack vectors", () => {
    it("should prevent javascript: protocol", () => {
      const input = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeText(input);
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain("<a");
    });

    it("should prevent data: protocol", () => {
      const input = '<img src="data:text/html,<script>alert(1)</script>">';
      const result = sanitizeText(input);
      expect(result).not.toContain("data:");
      expect(result).not.toContain("<img");
    });

    it("should prevent event handlers", () => {
      const input = '<div onclick="alert(1)">Click</div>';
      const result = sanitizeText(input);
      expect(result).not.toContain("onclick");
      expect(result).toBe("Click");
    });

    it("should prevent encoded scripts", () => {
      const input = "&#60;script&#62;alert(1)&#60;/script&#62;";
      const result = sanitizeText(input);
      expect(result).not.toContain("script");
    });
  });
});

describe("sanitizeArray", () => {
  describe("array length enforcement", () => {
    it("should accept array under max items", () => {
      const input = ["Item 1", "Item 2", "Item 3"];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toHaveLength(3);
    });

    it("should truncate array at max items", () => {
      const input = Array(15).fill("Item");
      const result = sanitizeArray(input, 10, 500);
      expect(result).toHaveLength(10);
    });

    it("should accept array exactly at max items", () => {
      const input = Array(10).fill("Item");
      const result = sanitizeArray(input, 10, 500);
      expect(result).toHaveLength(10);
    });

    it("should preserve order when truncating", () => {
      const input = ["First", "Second", "Third", "Fourth"];
      const result = sanitizeArray(input, 2, 500);
      expect(result).toEqual(["First", "Second"]);
    });
  });

  describe("item sanitization", () => {
    it("should sanitize each item", () => {
      const input = ["<b>Bold</b>", "<i>Italic</i>", "<u>Underline</u>"];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toEqual(["Bold", "Italic", "Underline"]);
    });

    it("should enforce item length limit", () => {
      const input = ["a".repeat(600), "b".repeat(600)];
      const result = sanitizeArray(input, 10, 500);
      expect(result[0]).toHaveLength(500);
      expect(result[1]).toHaveLength(500);
    });

    it("should trim whitespace from each item", () => {
      const input = ["  Item 1  ", "  Item 2  "];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toEqual(["Item 1", "Item 2"]);
    });

    it("should remove HTML from each item", () => {
      const input = [
        '<script>alert(1)</script>Safe',
        '<img src="x" onerror="alert(2)">Text',
      ];
      const result = sanitizeArray(input, 10, 500);
      expect(result[0]).toBe("Safe");
      expect(result[1]).toBe("Text");
    });
  });

  describe("edge cases", () => {
    it("should handle empty array", () => {
      const result = sanitizeArray([], 10, 500);
      expect(result).toEqual([]);
    });

    it("should handle array with empty strings", () => {
      const input = ["", "", ""];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toEqual(["", "", ""]);
    });

    it("should handle array with whitespace-only strings", () => {
      const input = ["   ", "   ", "   "];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toEqual(["", "", ""]);
    });

    it("should handle single item array", () => {
      const input = ["Only item"];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toEqual(["Only item"]);
    });

    it("should handle unicode in array items", () => {
      const input = ["こんにちは", "世界", "🌍"];
      const result = sanitizeArray(input, 10, 500);
      expect(result).toEqual(["こんにちは", "世界", "🌍"]);
    });
  });

  describe("custom limits", () => {
    it("should respect custom max items", () => {
      const input = Array(20).fill("Item");
      const result = sanitizeArray(input, 5, 500);
      expect(result).toHaveLength(5);
    });

    it("should respect custom max item length", () => {
      const input = ["a".repeat(1000)];
      const result = sanitizeArray(input, 10, 100);
      expect(result[0]).toHaveLength(100);
    });

    it("should apply both custom limits", () => {
      const input = Array(20).fill("a".repeat(1000));
      const result = sanitizeArray(input, 5, 100);
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveLength(100);
    });
  });
});

describe("sanitizeResultRequest", () => {
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

  describe("feedback sanitization", () => {
    it("should sanitize feedback text", () => {
      const input = {
        ...validRequest,
        feedback: "<script>alert('xss')</script>Safe feedback",
      };
      const result = sanitizeResultRequest(input);
      expect(result.feedback).toBe("Safe feedback");
      expect(result.feedback).not.toContain("<script>");
    });

    it("should enforce feedback max length (5000 chars)", () => {
      const input = {
        ...validRequest,
        feedback: "a".repeat(6000),
      };
      const result = sanitizeResultRequest(input);
      expect(result.feedback).toHaveLength(5000);
    });

    it("should trim feedback whitespace", () => {
      const input = {
        ...validRequest,
        feedback: "  Feedback text  ",
      };
      const result = sanitizeResultRequest(input);
      expect(result.feedback).toBe("Feedback text");
    });
  });

  describe("strengths sanitization", () => {
    it("should sanitize strengths array", () => {
      const input = {
        ...validRequest,
        strengths: ["<b>Point 1</b>", "<i>Point 2</i>"],
      };
      const result = sanitizeResultRequest(input);
      expect(result.strengths).toEqual(["Point 1", "Point 2"]);
    });

    it("should enforce strengths max items (10)", () => {
      const input = {
        ...validRequest,
        strengths: Array(15).fill("Point"),
      };
      const result = sanitizeResultRequest(input);
      expect(result.strengths).toHaveLength(10);
    });

    it("should enforce strengths item max length (500 chars)", () => {
      const input = {
        ...validRequest,
        strengths: ["a".repeat(600)],
      };
      const result = sanitizeResultRequest(input);
      expect(result.strengths[0]).toHaveLength(500);
    });

    it("should remove HTML from each strength", () => {
      const input = {
        ...validRequest,
        strengths: [
          '<script>alert(1)</script>Strength 1',
          '<img src="x" onerror="alert(2)">Strength 2',
        ],
      };
      const result = sanitizeResultRequest(input);
      expect(result.strengths[0]).toBe("Strength 1");
      expect(result.strengths[1]).toBe("Strength 2");
    });
  });

  describe("improvements sanitization", () => {
    it("should sanitize improvements array", () => {
      const input = {
        ...validRequest,
        improvements: ["<b>Point 1</b>", "<i>Point 2</i>"],
      };
      const result = sanitizeResultRequest(input);
      expect(result.improvements).toEqual(["Point 1", "Point 2"]);
    });

    it("should enforce improvements max items (10)", () => {
      const input = {
        ...validRequest,
        improvements: Array(15).fill("Point"),
      };
      const result = sanitizeResultRequest(input);
      expect(result.improvements).toHaveLength(10);
    });

    it("should enforce improvements item max length (500 chars)", () => {
      const input = {
        ...validRequest,
        improvements: ["a".repeat(600)],
      };
      const result = sanitizeResultRequest(input);
      expect(result.improvements[0]).toHaveLength(500);
    });

    it("should remove HTML from each improvement", () => {
      const input = {
        ...validRequest,
        improvements: [
          '<script>alert(1)</script>Improvement 1',
          '<img src="x" onerror="alert(2)">Improvement 2',
        ],
      };
      const result = sanitizeResultRequest(input);
      expect(result.improvements[0]).toBe("Improvement 1");
      expect(result.improvements[1]).toBe("Improvement 2");
    });
  });

  describe("other fields preservation", () => {
    it("should preserve non-text fields unchanged", () => {
      const result = sanitizeResultRequest(validRequest);
      expect(result.score).toBe(validRequest.score);
      expect(result.language).toBe(validRequest.language);
      expect(result.level).toBe(validRequest.level);
      expect(result.locale).toBe(validRequest.locale);
      expect(result.imageUrl).toBe(validRequest.imageUrl);
    });

    it("should preserve additional fields", () => {
      const input = {
        ...validRequest,
        extraField: "extra data",
      };
      const result = sanitizeResultRequest(input);
      expect(result.extraField).toBe("extra data");
    });
  });

  describe("complete sanitization", () => {
    it("should sanitize all text fields together", () => {
      const input = {
        ...validRequest,
        feedback: "<script>Bad</script>Good feedback",
        strengths: ["<b>Strength 1</b>", "<i>Strength 2</i>"],
        improvements: ["<u>Improvement 1</u>", "<strong>Improvement 2</strong>"],
      };
      const result = sanitizeResultRequest(input);
      expect(result.feedback).toBe("Good feedback");
      expect(result.strengths).toEqual(["Strength 1", "Strength 2"]);
      expect(result.improvements).toEqual(["Improvement 1", "Improvement 2"]);
    });

    it("should handle maximum data size", () => {
      const input = {
        ...validRequest,
        feedback: "a".repeat(5000),
        strengths: Array(10).fill("a".repeat(500)),
        improvements: Array(10).fill("a".repeat(500)),
      };
      const result = sanitizeResultRequest(input);
      expect(result.feedback).toHaveLength(5000);
      expect(result.strengths).toHaveLength(10);
      expect(result.improvements).toHaveLength(10);
    });
  });
});
