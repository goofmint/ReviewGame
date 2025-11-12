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
