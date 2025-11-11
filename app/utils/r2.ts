/**
 * R2 Storage Utility Module
 * Handles uploads to Cloudflare R2 (S3-compatible object storage)
 * Manages share image storage with proper access controls
 */

/**
 * R2 bucket binding type
 * Provided by Cloudflare Workers runtime
 */
export interface R2Bucket {
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | Blob | string,
    options?: R2PutOptions
  ): Promise<R2Object | null>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}

/**
 * Options for R2 put operation
 */
export interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
  };
  customMetadata?: Record<string, string>;
}

/**
 * R2 object representation
 */
export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
}

/**
 * Validates the image data before upload
 * Ensures file size and type constraints are met
 *
 * @param imageData - The image data as ArrayBuffer
 * @param maxSizeBytes - Maximum allowed file size (default: 5MB)
 * @throws Error if validation fails
 */
export function validateImageData(
  imageData: ArrayBuffer,
  maxSizeBytes: number = 5 * 1024 * 1024
): void {
  if (imageData.byteLength === 0) {
    throw new Error("Image data is empty");
  }

  if (imageData.byteLength > maxSizeBytes) {
    throw new Error(
      `Image size (${imageData.byteLength} bytes) exceeds maximum allowed size (${maxSizeBytes} bytes)`
    );
  }
}

/**
 * Sanitizes the filename to prevent path traversal and invalid characters
 * Removes or replaces potentially dangerous characters
 *
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and potentially dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, "_") // Replace multiple dots
    .slice(0, 255); // Limit filename length
}

/**
 * Generates a storage key for the share image
 * Format: share/{language}/{level}/{timestamp}.png
 *
 * @param language - Programming language ID
 * @param level - Level number
 * @param timestamp - Unix timestamp (milliseconds)
 * @returns Storage key path
 */
export function generateStorageKey(
  language: string,
  level: string,
  timestamp: number
): string {
  const sanitizedLang = sanitizeFilename(language);
  const sanitizedLevel = sanitizeFilename(level);
  return `share/${sanitizedLang}/${sanitizedLevel}/${timestamp}.png`;
}

/**
 * Retry configuration for network operations
 */
interface RetryConfig {
  maxAttempts: number;
  backoffDelays: number[]; // in milliseconds
}

/**
 * Default retry configuration: 4 attempts with exponential backoff
 * Delays: 2s, 4s, 8s, 16s (similar to git operation retry pattern)
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 4,
  backoffDelays: [2000, 4000, 8000, 16000],
};

/**
 * Executes an async operation with retry logic and exponential backoff
 * Retries network errors up to maxAttempts times with increasing delays
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration (attempts and backoff delays)
 * @returns Promise resolving to the operation result
 * @throws Error if all retry attempts fail
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable (network errors)
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("Network") ||
          error.message.includes("network") ||
          error.message.includes("connection") ||
          (error as any).retryable === true);

      // If not retryable or last attempt, throw immediately
      if (!isRetryable || attempt === config.maxAttempts) {
        throw error;
      }

      // Log retry attempt
      console.warn(
        `R2 upload failed (attempt ${attempt}/${config.maxAttempts}): ${
          error instanceof Error ? error.message : String(error)
        }. Retrying in ${config.backoffDelays[attempt - 1]}ms...`
      );

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, config.backoffDelays[attempt - 1])
      );
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Uploads an image to R2 storage with automatic retry on network errors
 * Includes proper content-type and cache headers
 * Retries up to 4 times with exponential backoff (2s, 4s, 8s, 16s)
 *
 * @param bucket - R2 bucket binding from Cloudflare Workers
 * @param key - Storage key for the image
 * @param imageData - Image data as ArrayBuffer
 * @returns Promise resolving to the R2Object
 * @throws Error if upload fails after all retry attempts
 */
export async function uploadImageToR2(
  bucket: R2Bucket,
  key: string,
  imageData: ArrayBuffer
): Promise<R2Object> {
  // Validate image data before upload (no retry needed for validation)
  validateImageData(imageData);

  // Execute upload with retry logic
  const result = await withRetry(async () => {
    const uploadResult = await bucket.put(key, imageData, {
      httpMetadata: {
        contentType: "image/png",
        // Cache for 1 year (images are immutable with timestamp in filename)
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        source: "code-review-game",
      },
    });

    if (!uploadResult) {
      // Create a retryable error for null results
      const error = new Error("Failed to upload image to R2: null result");
      (error as any).retryable = true;
      throw error;
    }

    return uploadResult;
  });

  return result;
}

/**
 * Constructs the public URL for an R2 object
 * Uses the configured public URL base or generates a default one
 *
 * @param key - Storage key of the object
 * @param publicUrl - Base public URL for R2 bucket (from env vars)
 * @returns Complete public URL
 */
export function getPublicUrl(key: string, publicUrl: string): string {
  // Ensure the public URL doesn't end with a slash
  const baseUrl = publicUrl.endsWith("/")
    ? publicUrl.slice(0, -1)
    : publicUrl;

  // Ensure the key doesn't start with a slash
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;

  return `${baseUrl}/${cleanKey}`;
}

/**
 * Deletes an image from R2 storage
 * Used for cleanup or image removal requests
 *
 * @param bucket - R2 bucket binding
 * @param key - Storage key of the image to delete
 */
export async function deleteImageFromR2(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}
