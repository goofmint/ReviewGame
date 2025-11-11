/**
 * Constants Unit Tests
 * Tests for application-wide constants
 */

import { describe, it, expect } from "vitest";
import {
  PASSING_SCORE,
  LANGUAGE_DISPLAY_NAMES,
  LANGUAGE_DESCRIPTIONS,
} from "../../app/utils/constants";

describe("Constants", () => {
  it("should have correct passing score", () => {
    expect(PASSING_SCORE).toBe(70);
  });

  it("should have display names for all languages", () => {
    expect(LANGUAGE_DISPLAY_NAMES.javascript).toBe("JavaScript");
    expect(LANGUAGE_DISPLAY_NAMES.python).toBe("Python");
    expect(LANGUAGE_DISPLAY_NAMES.flutter).toBe("Flutter");
  });

  it("should have descriptions for all languages", () => {
    expect(LANGUAGE_DESCRIPTIONS.javascript).toBeTruthy();
    expect(LANGUAGE_DESCRIPTIONS.python).toBeTruthy();
    expect(LANGUAGE_DESCRIPTIONS.flutter).toBeTruthy();
  });
});
