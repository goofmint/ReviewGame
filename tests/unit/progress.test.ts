/**
 * Progress Management Unit Tests
 * Tests for localStorage-based progress tracking functionality
 *
 * No mocks are used - tests run against actual localStorage mock from vitest.setup.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  saveProgress,
  isLevelUnlocked,
  recordAttempt,
  getBestScore,
  getAttemptCount,
  resetAllProgress,
} from "../../app/utils/progress";
import type { ProgressState } from "../../app/types/problem";

describe("Progress Management", () => {
  // Clear localStorage before each test
  beforeEach(() => {
    resetAllProgress();
  });

  describe("loadProgress", () => {
    it("should return empty object when no progress exists", () => {
      const progress = loadProgress();
      expect(progress).toEqual({});
    });

    it("should load saved progress from localStorage", () => {
      const mockProgress: ProgressState = {
        javascript: {
          "1": { unlocked: true, bestScore: 85, attempts: 3 },
        },
      };
      saveProgress(mockProgress);

      const loaded = loadProgress();
      expect(loaded).toEqual(mockProgress);
    });
  });

  describe("isLevelUnlocked", () => {
    it("should return true for level 1 (always unlocked)", () => {
      expect(isLevelUnlocked("javascript", "1")).toBe(true);
      expect(isLevelUnlocked("python", "1")).toBe(true);
    });

    it("should return false for locked levels", () => {
      expect(isLevelUnlocked("javascript", "2")).toBe(false);
    });

    it("should return true for unlocked levels", () => {
      const progress: ProgressState = {
        javascript: {
          "2": { unlocked: true, attempts: 0 },
        },
      };
      saveProgress(progress);

      expect(isLevelUnlocked("javascript", "2")).toBe(true);
    });
  });

  describe("recordAttempt", () => {
    it("should record first attempt with correct score", () => {
      recordAttempt("javascript", "1", 75);

      const progress = loadProgress();
      expect(progress.javascript?.["1"]).toEqual({
        unlocked: true,
        bestScore: 75,
        attempts: 1,
      });
    });

    it("should update best score when new score is higher", () => {
      recordAttempt("javascript", "1", 65);
      recordAttempt("javascript", "1", 80);

      const bestScore = getBestScore("javascript", "1");
      expect(bestScore).toBe(80);
    });

    it("should not update best score when new score is lower", () => {
      recordAttempt("javascript", "1", 85);
      recordAttempt("javascript", "1", 70);

      const bestScore = getBestScore("javascript", "1");
      expect(bestScore).toBe(85);
    });

    it("should increment attempt count on each attempt", () => {
      recordAttempt("javascript", "1", 60);
      recordAttempt("javascript", "1", 70);
      recordAttempt("javascript", "1", 80);

      const attempts = getAttemptCount("javascript", "1");
      expect(attempts).toBe(3);
    });

    it("should unlock next level when score >= 70", () => {
      recordAttempt("javascript", "1", 75);

      expect(isLevelUnlocked("javascript", "2")).toBe(true);
    });

    it("should not unlock next level when score < 70", () => {
      recordAttempt("javascript", "1", 65);

      expect(isLevelUnlocked("javascript", "2")).toBe(false);
    });
  });

  describe("getBestScore", () => {
    it("should return undefined for levels never attempted", () => {
      const score = getBestScore("javascript", "1");
      expect(score).toBeUndefined();
    });

    it("should return the best score for attempted levels", () => {
      recordAttempt("python", "1", 90);

      const score = getBestScore("python", "1");
      expect(score).toBe(90);
    });
  });

  describe("getAttemptCount", () => {
    it("should return 0 for levels never attempted", () => {
      const count = getAttemptCount("flutter", "1");
      expect(count).toBe(0);
    });

    it("should return correct attempt count", () => {
      recordAttempt("flutter", "1", 70);
      recordAttempt("flutter", "1", 75);

      const count = getAttemptCount("flutter", "1");
      expect(count).toBe(2);
    });
  });
});
