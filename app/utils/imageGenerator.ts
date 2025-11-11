/**
 * Image Generator Module
 * Creates OG images for social sharing using Canvas API (client-side)
 * Generates 1200x630px images with gradients, score, and language info
 */

import { LANGUAGE_DISPLAY_NAMES } from "./constants";

/**
 * Image dimensions following X/Twitter OGP recommendations
 */
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

/**
 * Language-specific gradient color schemes
 * Each language has a unique visual identity for share images
 */
const LANGUAGE_GRADIENTS: Record<string, { start: string; end: string }> = {
  javascript: { start: "#F7DF1E", end: "#FFA500" },
  python: { start: "#3776AB", end: "#FFD43B" },
  flutter: { start: "#02569B", end: "#13B9FD" },
};

/**
 * Default gradient for unknown languages
 */
const DEFAULT_GRADIENT = { start: "#4F46E5", end: "#7C3AED" };

/**
 * Generates a share image for social media
 * Creates a canvas element, draws the image, and returns as Blob
 *
 * @param score - The score achieved (0-100)
 * @param language - The programming language ID
 * @param level - The level number
 * @returns Promise resolving to a Blob containing the PNG image
 * @throws Error if Canvas API is not available or image generation fails
 */
export async function generateShareImage(
  score: number,
  language: string,
  level: string
): Promise<Blob> {
  // Ensure we're in a browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Canvas API is only available in browser environment");
  }

  // Create canvas element
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2D context from canvas");
  }

  // Get language-specific gradient or default
  const gradient =
    LANGUAGE_GRADIENTS[language.toLowerCase()] || DEFAULT_GRADIENT;

  // Draw background gradient
  const backgroundGradient = ctx.createLinearGradient(
    0,
    0,
    IMAGE_WIDTH,
    IMAGE_HEIGHT
  );
  backgroundGradient.addColorStop(0, gradient.start);
  backgroundGradient.addColorStop(1, gradient.end);
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

  // Add passing score visual indicator (gold border for 70+)
  if (score >= 70) {
    ctx.strokeStyle = "#FFD700"; // Gold color
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, IMAGE_WIDTH - 10, IMAGE_HEIGHT - 10);
  }

  // Configure text rendering
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";

  // Draw title
  ctx.font = "bold 48px sans-serif";
  ctx.fillText("Code Review Game", IMAGE_WIDTH / 2, 80);

  // Draw score (large and prominent)
  ctx.font = "bold 120px sans-serif";
  ctx.fillText(`${score}点`, IMAGE_WIDTH / 2, 250);

  // Draw language and level info
  ctx.font = "36px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  const displayName =
    LANGUAGE_DISPLAY_NAMES[language] ||
    language.charAt(0).toUpperCase() + language.slice(1);
  ctx.fillText(`${displayName} - Level ${level}`, IMAGE_WIDTH / 2, 380);

  // Draw CodeRabbit branding (text-based, as we may not have the icon)
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("Powered by CodeRabbit", IMAGE_WIDTH / 2, IMAGE_HEIGHT - 50);

  // Convert canvas to Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Loads an image from a URL
 * Helper function for drawing images on canvas
 *
 * @param url - The URL of the image to load
 * @returns Promise resolving to an HTMLImageElement
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS for external images
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Converts a Blob to a File object
 * Useful for uploading to servers that expect File objects
 *
 * @param blob - The Blob to convert
 * @param filename - The filename to assign
 * @returns File object
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * Converts a Blob to Base64 data URL
 * Useful for uploading as JSON payload
 *
 * @param blob - The Blob to convert
 * @returns Promise resolving to Base64 data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}
