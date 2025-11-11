/**
 * ShareButton Component
 * Provides X (Twitter) sharing functionality with image generation
 * Generates share image, uploads to R2, and opens X share dialog
 * Uses Remix useFetcher for server communication
 */

import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { Icon } from "@iconify/react";
import { generateShareImage, blobToBase64 } from "~/utils/imageGenerator";
import type { ShareResult } from "~/types/problem";

/**
 * Props for ShareButton component
 */
interface ShareButtonProps {
  /** Score achieved (0-100) */
  score: number;
  /** Programming language ID (e.g., "javascript") */
  language: string;
  /** Level number */
  level: string;
  /** Additional CSS classes for styling */
  className?: string;
}

/**
 * Client-side states for image generation
 */
type GenerationState = "idle" | "generating" | "ready" | "error";

/**
 * ShareButton component that handles the entire share flow:
 * 1. Generate OG image using Canvas API (client-side)
 * 2. Upload image to R2 via useFetcher
 * 3. Open X (Twitter) share dialog with pre-filled content
 */
export function ShareButton({
  score,
  language,
  level,
  className = "",
}: ShareButtonProps) {
  // Remix fetcher for API communication
  const fetcher = useFetcher<ShareResult>();

  // Client-side image generation state
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [generationError, setGenerationError] = useState<string>("");
  const [imageData, setImageData] = useState<string>("");

  /**
   * Handle successful share response
   * Opens X share dialog when data is received
   */
  useEffect(() => {
    if (fetcher.data && "tweetUrl" in fetcher.data) {
      // Open X share dialog
      window.open(fetcher.data.tweetUrl, "_blank", "noopener,noreferrer");

      // Reset generation state after success
      setTimeout(() => {
        setGenerationState("idle");
        setImageData("");
      }, 2000);
    }
  }, [fetcher.data]);

  /**
   * Handles the share button click
   * Orchestrates image generation and upload
   */
  const handleShare = async () => {
    try {
      // Reset error state
      setGenerationError("");

      // Step 1: Generate image (client-side)
      setGenerationState("generating");
      const imageBlob = await generateShareImage(score, language, level);

      // Step 2: Convert to base64 for upload
      const base64Image = await blobToBase64(imageBlob);
      setImageData(base64Image);
      setGenerationState("ready");

      // Step 3: Upload to R2 via useFetcher
      fetcher.submit(
        {
          imageData: base64Image,
          score: score.toString(),
          language,
          level,
        },
        {
          method: "POST",
          action: "/api/share-image",
          encType: "application/json",
        }
      );
    } catch (error) {
      console.error("Share error:", error);
      setGenerationState("error");
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate image"
      );

      // Reset error state after a delay
      setTimeout(() => {
        setGenerationState("idle");
        setGenerationError("");
      }, 5000);
    }
  };

  /**
   * Gets the button text based on current state
   */
  const getButtonText = (): string => {
    // Check fetcher state first (uploading)
    if (fetcher.state === "submitting" || fetcher.state === "loading") {
      return "アップロード中...";
    }

    // Check for errors
    if (fetcher.data && "error" in fetcher.data) {
      return "エラーが発生しました";
    }

    if (generationState === "error") {
      return "エラーが発生しました";
    }

    // Check generation state
    if (generationState === "generating") {
      return "画像生成中...";
    }

    // Check for success
    if (fetcher.data && "tweetUrl" in fetcher.data) {
      return "シェア成功！";
    }

    return "Xでシェア";
  };

  /**
   * Gets the button icon based on current state
   */
  const getButtonIcon = (): string => {
    // Check for loading states
    if (
      generationState === "generating" ||
      fetcher.state === "submitting" ||
      fetcher.state === "loading"
    ) {
      return "mdi:loading"; // Rotating spinner icon
    }

    // Check for errors
    if (
      generationState === "error" ||
      (fetcher.data && "error" in fetcher.data)
    ) {
      return "mdi:alert-circle";
    }

    // Check for success
    if (fetcher.data && "tweetUrl" in fetcher.data) {
      return "mdi:check-circle";
    }

    return "mdi:twitter"; // X/Twitter logo
  };

  /**
   * Determines if the button should be disabled
   */
  const isDisabled =
    generationState === "generating" ||
    fetcher.state === "submitting" ||
    fetcher.state === "loading";

  /**
   * Gets button color classes based on state
   */
  const getButtonColorClasses = (): string => {
    // Success state
    if (fetcher.data && "tweetUrl" in fetcher.data) {
      return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600";
    }

    // Error state
    if (
      generationState === "error" ||
      (fetcher.data && "error" in fetcher.data)
    ) {
      return "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600";
    }

    // Default: X brand blue color
    return "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700";
  };

  /**
   * Gets the current error message
   */
  const getErrorMessage = (): string => {
    if (generationError) {
      return generationError;
    }

    if (fetcher.data && "error" in fetcher.data) {
      return fetcher.data.error as string;
    }

    return "";
  };

  const errorMessage = getErrorMessage();
  const hasError =
    generationState === "error" || (fetcher.data && "error" in fetcher.data);

  return (
    <div className={className}>
      <button
        onClick={handleShare}
        disabled={isDisabled}
        className={`
          px-6 py-3 rounded-lg font-semibold text-white
          transition-all duration-200 ease-in-out
          flex items-center justify-center gap-2
          ${getButtonColorClasses()}
          ${isDisabled ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          dark:focus:ring-offset-gray-900
        `}
        aria-label="Xでシェア"
        aria-busy={isDisabled}
      >
        {/* Icon with conditional animation */}
        <Icon
          icon={getButtonIcon()}
          width={24}
          height={24}
          className={
            generationState === "generating" ||
            fetcher.state === "submitting" ||
            fetcher.state === "loading"
              ? "animate-spin"
              : ""
          }
        />

        {/* Button text */}
        <span>{getButtonText()}</span>
      </button>

      {/* Error message display */}
      {hasError && errorMessage && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
