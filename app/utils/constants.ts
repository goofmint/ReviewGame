/**
 * Application-wide constants
 * These values control core game mechanics and should be reviewed carefully before changes
 */

/** Minimum score required to unlock the next level (out of 100) */
export const PASSING_SCORE = 70;

/**
 * Storage key for persisting user progress in localStorage
 * Format: { [language]: { [level]: { unlocked, bestScore, attempts } } }
 */
export const PROGRESS_STORAGE_KEY = "codeReviewGame_progress";

/**
 * Timeout for LLM API requests in milliseconds
 * Prevents hanging requests from degrading UX
 */
export const LLM_REQUEST_TIMEOUT = 30000; // 30 seconds

/**
 * Language display names for UI
 * Maps internal language IDs to user-friendly display names
 */
export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  flutter: "Flutter",
} as const;

/**
 * Language descriptions shown on the language selection screen
 */
export const LANGUAGE_DESCRIPTIONS: Record<string, string> = {
  javascript: "Web開発の基礎言語",
  python: "データ分析・AI開発",
  flutter: "モバイルアプリ開発",
} as const;
