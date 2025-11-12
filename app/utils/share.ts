/**
 * Share Utility Module
 * Generates tweet text and URLs for X (Twitter) sharing
 * Provides consistent formatting across the application
 */

import { LANGUAGE_DISPLAY_NAMES } from "./constants";

/**
 * Base URL for the game
 * This should be configured via environment variables in production
 */
const GAME_URL = "https://review-game.goofmint.workers.dev";

/**
 * Generates the tweet text for sharing a game result
 * Includes hashtag, score, language, level, and game URL
 *
 * @param score - The score achieved (0-100)
 * @param language - The programming language ID (e.g., "javascript")
 * @param level - The level number
 * @returns Formatted tweet text ready for sharing
 */
export function generateTweetText(
  score: number,
  language: string,
  level: string
): string {
  // Get display name for the language, fallback to capitalized language ID
  const displayName =
    LANGUAGE_DISPLAY_NAMES[language] ||
    language.charAt(0).toUpperCase() + language.slice(1);

  return `#CodeRabbit コードレビューゲームで${score}点を獲得しました！
言語: ${displayName} | レベル: ${level}

${GAME_URL}`;
}

/**
 * Generates the X Web Intent URL for sharing
 * Opens the tweet composition dialog with pre-filled text and image
 *
 * @param tweetText - The text to pre-fill in the tweet
 * @param imageUrl - Optional URL of the share image
 * @returns Complete X Web Intent URL
 */
export function generateXIntentUrl(
  tweetText: string,
  imageUrl?: string
): string {
  const params = new URLSearchParams({
    text: tweetText,
  });

  // Note: X Web Intent doesn't directly support images via URL parameter
  // Images must be uploaded via the API or included in the tweet text as a link
  if (imageUrl) {
    // Append the image URL to the tweet text for now
    // In production, this would be handled by the X API with media upload
    params.set("text", `${tweetText}\n\n${imageUrl}`);
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Gets the game URL (can be overridden by environment variable)
 * Used for sharing and referencing the game in social media
 *
 * @returns The base URL of the game
 */
export function getGameUrl(): string {
  // In a Cloudflare Worker environment, you might want to use env variables
  // For now, return the constant
  return GAME_URL;
}
