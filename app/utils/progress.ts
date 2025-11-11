/**
 * Progress Management Module
 * Handles user progress persistence using localStorage
 * Tracks unlocked levels, best scores, and attempt counts
 */

import type { ProgressState } from "~/types/problem";
import { PROGRESS_STORAGE_KEY, PASSING_SCORE } from "./constants";

/**
 * Loads the complete progress state from localStorage
 * Returns an empty object if no progress exists or if localStorage is unavailable
 *
 * @returns The user's progress state across all languages and levels
 */
export function loadProgress(): ProgressState {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {};
  }

  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as ProgressState;
  } catch (error) {
    // If parsing fails, log the error and return empty state
    console.error("Failed to load progress from localStorage:", error);
    return {};
  }
}

/**
 * Saves the complete progress state to localStorage
 * Gracefully handles localStorage quota exceeded errors
 *
 * @param progress - The complete progress state to save
 */
export function saveProgress(progress: ProgressState): void {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    // Handle quota exceeded or other localStorage errors
    console.error("Failed to save progress to localStorage:", error);
  }
}

/**
 * Checks if a specific level is unlocked for the given language
 * Level 1 is always unlocked by default
 *
 * @param language - The programming language (e.g., "javascript")
 * @param level - The level number (e.g., "1", "2", "3")
 * @returns true if the level is unlocked, false otherwise
 */
export function isLevelUnlocked(language: string, level: string): boolean {
  // Level 1 is always unlocked
  if (level === "1") {
    return true;
  }

  const progress = loadProgress();
  const langProgress = progress[language];

  if (!langProgress || !langProgress[level]) {
    return false;
  }

  return langProgress[level].unlocked;
}

/**
 * Records a completed attempt for a specific level
 * Updates best score, increments attempt count, and unlocks next level if passing
 *
 * @param language - The programming language
 * @param level - The level number
 * @param score - The score achieved (0-100)
 */
export function recordAttempt(
  language: string,
  level: string,
  score: number
): void {
  const progress = loadProgress();

  // Initialize language progress if it doesn't exist
  if (!progress[language]) {
    progress[language] = {};
  }

  // Initialize level progress if it doesn't exist
  if (!progress[language][level]) {
    progress[language][level] = {
      unlocked: true, // Current level must be unlocked if they're playing it
      attempts: 0,
    };
  }

  const levelProgress = progress[language][level];

  // Update best score if this score is higher
  if (
    levelProgress.bestScore === undefined ||
    score > levelProgress.bestScore
  ) {
    levelProgress.bestScore = score;
  }

  // Increment attempt count
  levelProgress.attempts++;

  // Unlock next level if passing score achieved
  if (score >= PASSING_SCORE) {
    const nextLevel = String(Number(level) + 1);
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

/**
 * Gets the best score for a specific level
 *
 * @param language - The programming language
 * @param level - The level number
 * @returns The best score, or undefined if never attempted
 */
export function getBestScore(
  language: string,
  level: string
): number | undefined {
  const progress = loadProgress();
  return progress[language]?.[level]?.bestScore;
}

/**
 * Gets the number of attempts for a specific level
 *
 * @param language - The programming language
 * @param level - The level number
 * @returns The number of attempts, or 0 if never attempted
 */
export function getAttemptCount(language: string, level: string): number {
  const progress = loadProgress();
  return progress[language]?.[level]?.attempts ?? 0;
}

/**
 * Resets all progress (useful for development/testing)
 * USE WITH CAUTION: This permanently deletes all user progress
 */
export function resetAllProgress(): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to reset progress:", error);
  }
}
