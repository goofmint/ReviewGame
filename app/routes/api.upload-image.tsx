/**
 * API Endpoint: Upload Share Image
 *
 * POST /api/upload-image
 *
 * Uploads a base64-encoded image to Cloudflare R2.
 * Returns the public URL of the uploaded image.
 */

import type { Route } from "./+types/api.upload-image";
import {
  uploadImageToR2,
  generateStorageKey,
  getPublicUrl,
  type R2Bucket,
} from "~/utils/r2";
import {
  base64ToArrayBuffer,
  validateBase64ImagePayload,
} from "~/utils/imageData";

/**
 * Environment bindings for Cloudflare Workers
 */
interface Env {
  SHARE_IMAGES?: R2Bucket;
  R2_PUBLIC_URL?: string;
}

/**
 * Request body structure
 */
interface UploadImageRequest {
  imageData: string; // Base64-encoded PNG data
  score: number | string;
  language: string;
  level: string;
  locale: string;
}

/**
 * Handle POST /api/upload-image
 */
export async function action({ request, context }: Route.ActionArgs) {
  try {
    // Check content type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return Response.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = (await request.json()) as UploadImageRequest;

    // Validate required fields
    if (!body.imageData || !body.language || !body.level) {
      return Response.json(
        { error: "Missing required fields: imageData, language, level" },
        { status: 400 }
      );
    }

    // Parse score
    const score =
      typeof body.score === "string" ? parseInt(body.score, 10) : body.score;

    // Validate score
    if (
      typeof score !== "number" ||
      isNaN(score) ||
      score < 0 ||
      score > 100
    ) {
      return Response.json(
        { error: "Score must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate image payload
    const validatedImage = validateBase64ImagePayload(body.imageData);
    if (!validatedImage) {
      return Response.json(
        { error: "Invalid or too large imageData" },
        { status: 400 }
      );
    }

    // Get R2 bucket from context
    const env = context.cloudflare?.env as Env | undefined;
    const bucket = env?.SHARE_IMAGES;
    if (!bucket) {
      console.error("SHARE_IMAGES bucket binding is missing");
      return Response.json(
        { error: "Image storage configuration is missing" },
        { status: 500 }
      );
    }

    // Convert base64 to ArrayBuffer
    const imageBuffer = base64ToArrayBuffer(validatedImage.base64);

    // Generate storage key
    const timestamp = Date.now();
    const storageKey = generateStorageKey(
      body.language,
      body.level,
      timestamp
    );

    // Upload to R2
    await uploadImageToR2(bucket, storageKey, imageBuffer);

    // Get public URL
    const requestOrigin =
      request.headers.get("origin") || new URL(request.url).origin;
    const publicUrl = env?.R2_PUBLIC_URL?.trim() || requestOrigin;
    const imageUrl = getPublicUrl(storageKey, publicUrl);

    // Return result
    return Response.json(
      { imageUrl },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Upload image error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return Response.json(
      { error: `Failed to upload image: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Disable GET requests
export async function loader() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
