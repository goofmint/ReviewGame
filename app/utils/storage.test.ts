import { describe, it, expect, beforeEach } from "vitest";
import {
  getProgress,
  saveProgress,
  unlockLevel,
  updateScore,
  isLevelUnlocked,
  getBestScore,
} from "./storage";
import type { ProgressState } from "~/types/problem";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getProgress", () => {
    it("should return empty object when no progress is stored", () => {
      const progress = getProgress();
      expect(progress).toEqual({});
    });

    it("should return stored progress", () => {
      const testProgress: ProgressState = {
        javascript: {
          1: { unlocked: true, bestScore: 85, attempts: 1 },
        },
      };
      localStorage.setItem("reviewGameProgress", JSON.stringify(testProgress));

      const progress = getProgress();
      expect(progress).toEqual(testProgress);
    });
  });

  describe("saveProgress", () => {
    it("should save progress to localStorage", () => {
      const testProgress: ProgressState = {
        javascript: {
          1: { unlocked: true, bestScore: 75, attempts: 2 },
        },
      };

      saveProgress(testProgress);

      const stored = localStorage.getItem("reviewGameProgress");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(testProgress);
    });
  });

  describe("unlockLevel", () => {
    it("should unlock a new level", () => {
      unlockLevel("javascript", 2);

      const progress = getProgress();
      expect(progress.javascript?.[2]?.unlocked).toBe(true);
    });

    it("should preserve existing level data when unlocking", () => {
      updateScore("javascript", 1, 80);
      unlockLevel("javascript", 2);

      const progress = getProgress();
      expect(progress.javascript?.[1]?.bestScore).toBe(80);
      expect(progress.javascript?.[2]?.unlocked).toBe(true);
    });
  });

  describe("updateScore", () => {
    it("should create new entry for first attempt", () => {
      updateScore("javascript", 1, 75);

      const progress = getProgress();
      expect(progress.javascript?.[1]).toEqual({
        unlocked: true,
        attempts: 1,
        bestScore: 75,
      });
    });

    it("should update best score if new score is higher", () => {
      updateScore("javascript", 1, 60);
      updateScore("javascript", 1, 80);

      const progress = getProgress();
      expect(progress.javascript?.[1]?.bestScore).toBe(80);
      expect(progress.javascript?.[1]?.attempts).toBe(2);
    });

    it("should keep best score if new score is lower", () => {
      updateScore("javascript", 1, 85);
      updateScore("javascript", 1, 70);

      const progress = getProgress();
      expect(progress.javascript?.[1]?.bestScore).toBe(85);
    });

    it("should unlock next level when score >= 70", () => {
      updateScore("javascript", 1, 75);

      const progress = getProgress();
      expect(progress.javascript?.[2]?.unlocked).toBe(true);
    });

    it("should not unlock next level when score < 70", () => {
      updateScore("javascript", 1, 65);

      const progress = getProgress();
      expect(progress.javascript?.[2]?.unlocked).toBeUndefined();
    });
  });

  describe("isLevelUnlocked", () => {
    it("should return true for level 1", () => {
      expect(isLevelUnlocked("javascript", 1)).toBe(true);
    });

    it("should return false for locked levels", () => {
      expect(isLevelUnlocked("javascript", 2)).toBe(false);
    });

    it("should return true for unlocked levels", () => {
      unlockLevel("javascript", 2);
      expect(isLevelUnlocked("javascript", 2)).toBe(true);
    });
  });

  describe("getBestScore", () => {
    it("should return undefined when no score exists", () => {
      expect(getBestScore("javascript", 1)).toBeUndefined();
    });

    it("should return best score when it exists", () => {
      updateScore("javascript", 1, 85);
      expect(getBestScore("javascript", 1)).toBe(85);
    });
  });
});
