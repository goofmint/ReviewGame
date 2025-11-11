/**
 * ShareButton Component
 * Provides X (Twitter) sharing functionality with image generation
 * Generates share image, uploads to R2, and opens X share dialog
 */

import { useState } from "react";
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
 * Loading states for the share button
 */
type ShareState = "idle" | "generating" | "uploading" | "success" | "error";

/**
 * ShareButton component that handles the entire share flow:
 * 1. Generate OG image using Canvas API
 * 2. Upload image to R2 via API
 * 3. Open X (Twitter) share dialog with pre-filled content
 */
export function ShareButton({
  score,
  language,
  level,
  className = "",
}: ShareButtonProps) {
  const [state, setState] = useState<ShareState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * Handles the share button click
   * Orchestrates image generation, upload, and X share dialog
   */
  const handleShare = async () => {
    try {
      // Reset error state
      setErrorMessage("");

      // Step 1: Generate image
      setState("generating");
      const imageBlob = await generateShareImage(score, language, level);

      // Step 2: Convert to base64 for upload
      const base64Image = await blobToBase64(imageBlob);

      // Step 3: Upload to R2
      setState("uploading");
      const response = await fetch("/api/share-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: base64Image,
          score,
          language,
          level,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const result: ShareResult = await response.json();

      // Step 4: Open X share dialog
      setState("success");
      window.open(result.tweetUrl, "_blank", "noopener,noreferrer");

      // Reset state after a delay
      setTimeout(() => {
        setState("idle");
      }, 2000);
    } catch (error) {
      console.error("Share error:", error);
      setState("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to share"
      );

      // Reset error state after a delay
      setTimeout(() => {
        setState("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  /**
   * Gets the button text based on current state
   */
  const getButtonText = (): string => {
    switch (state) {
      case "generating":
        return "画像生成中...";
      case "uploading":
        return "アップロード中...";
      case "success":
        return "シェア成功！";
      case "error":
        return "エラーが発生しました";
      default:
        return "Xでシェア";
    }
  };

  /**
   * Gets the button icon based on current state
   */
  const getButtonIcon = (): string => {
    switch (state) {
      case "generating":
      case "uploading":
        return "mdi:loading"; // Rotating spinner icon
      case "success":
        return "mdi:check-circle";
      case "error":
        return "mdi:alert-circle";
      default:
        return "mdi:twitter"; // X/Twitter logo
    }
  };

  /**
   * Determines if the button should be disabled
   */
  const isDisabled = state === "generating" || state === "uploading";

  /**
   * Gets button color classes based on state
   */
  const getButtonColorClasses = (): string => {
    if (state === "success") {
      return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600";
    }
    if (state === "error") {
      return "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600";
    }
    // Default: X brand blue color
    return "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700";
  };

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
          className={state === "generating" || state === "uploading" ? "animate-spin" : ""}
        />

        {/* Button text */}
        <span>{getButtonText()}</span>
      </button>

      {/* Error message display */}
      {state === "error" && errorMessage && (
        <p
          className="mt-2 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
