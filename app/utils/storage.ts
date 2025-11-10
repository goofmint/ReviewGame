import type { ProgressState } from "~/types/problem";

export const PROGRESS_KEY = "reviewGameProgress";

export function getProgress(): ProgressState {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (!stored) return {};
    return JSON.parse(stored) as ProgressState;
  } catch {
    return {};
  }
}

export function saveProgress(progress: ProgressState): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save progress:", error);
  }
}

export function unlockLevel(language: string, level: number): void {
  const progress = getProgress();

  if (!progress[language]) {
    progress[language] = {};
  }

  if (!progress[language][level]) {
    progress[language][level] = {
      unlocked: true,
      attempts: 0,
    };
  } else {
    progress[language][level].unlocked = true;
  }

  saveProgress(progress);
}

export function updateScore(
  language: string,
  level: number,
  score: number
): void {
  const progress = getProgress();

  if (!progress[language]) {
    progress[language] = {};
  }

  if (!progress[language][level]) {
    progress[language][level] = {
      unlocked: true,
      attempts: 1,
      bestScore: score,
    };
  } else {
    progress[language][level].attempts += 1;
    if (
      !progress[language][level].bestScore ||
      score > progress[language][level].bestScore!
    ) {
      progress[language][level].bestScore = score;
    }
  }

  // Unlock next level if score >= 70
  if (score >= 70) {
    const nextLevel = level + 1;
    if (!progress[language][nextLevel]) {
      progress[language][nextLevel] = {
        unlocked: true,
        attempts: 0,
      };
    } else {
      progress[language][nextLevel].unlocked = true;
    }
  }

  saveProgress(progress);
}

export function isLevelUnlocked(language: string, level: number): boolean {
  if (level === 1) return true; // Level 1 is always unlocked

  const progress = getProgress();
  return progress[language]?.[level]?.unlocked ?? false;
}

export function getBestScore(language: string, level: number): number | undefined {
  const progress = getProgress();
  return progress[language]?.[level]?.bestScore;
}
