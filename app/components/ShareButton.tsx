/**
 * ShareButton Component
 * Provides social media sharing functionality using Web Share API
 * Generates share image and shares via native share dialog
 * Falls back to X Web Intent if Web Share API is not available
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { generateShareImage, blobToFile } from "~/utils/imageGenerator";

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
  /** Locale (e.g., "ja", "en") */
  locale: string;
  /** AI feedback text */
  feedback: string;
  /** List of strengths */
  strengths: string[];
  /** List of improvements */
  improvements: string[];
  /** Additional CSS classes for styling */
  className?: string;
}

/**
 * Client-side states for sharing
 */
type ShareState = "idle" | "generating" | "success" | "error";

/**
 * ShareButton component that handles the entire share flow:
 * 1. Generate OG image using Canvas API (client-side)
 * 2. Upload image to R2 storage
 * 3. Save result to KV storage
 * 4. Open X share intent with result URL
 */
export function ShareButton({
  score,
  language,
  level,
  locale,
  feedback,
  strengths,
  improvements,
  className = "",
}: ShareButtonProps) {
  // i18n translation hook
  const { t } = useTranslation(['share', 'common']);

  // Client-side sharing state
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string>("");

  /**
   * Handles the share button click
   * Generates image, uploads to R2, saves to KV, and opens X share intent
   */
  const handleShare = async () => {
    try {
      // Reset error state
      setShareError("");
      setShareState("generating");

      // Step 1: Generate image (client-side)
      const languageDisplayName = t(`common:language.${language}`, language);
      const imageBlob = await generateShareImage(score, language, level, locale, languageDisplayName);

      // Step 2: Convert image to base64 for upload
      const reader = new FileReader();
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert image to base64"));
          }
        };
        reader.onerror = () => reject(new Error("FileReader error"));
        reader.readAsDataURL(imageBlob);
      });

      // Step 3: Upload image to R2
      const uploadResponse = await fetch(`/${locale}/${language}/${level}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageData: imageBase64,
          score,
          language,
          level,
          locale,
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const uploadResult = await uploadResponse.json() as { imageUrl: string };

      // Step 4: Save result to KV
      const saveResponse = await fetch("/api/results/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score,
          language,
          level,
          feedback,
          strengths,
          improvements,
          imageUrl: uploadResult.imageUrl,
          locale,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save result");
      }

      const saveResult = await saveResponse.json() as { url: string };

      // Step 5: Generate X share text
      const shareText = locale === 'ja'
        ? `コードレビューゲーム powered by #CodeRabbit にて ${score}点を獲得しました！\n言語: ${languageDisplayName}\nレベル: ${level}\n\n${saveResult.url}`
        : `I scored ${score} points on #CodeRabbit Code Review Game!\nLanguage: ${languageDisplayName}\nLevel: ${level}\n\n${saveResult.url}`;

      // Step 6: Open X share intent
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(tweetUrl, "_blank", "noopener,noreferrer");

      setShareState("success");

      // Reset state after success
      setTimeout(() => {
        setShareState("idle");
      }, 3000);
    } catch (error) {
      console.error("Share error:", error);

      setShareState("error");
      setShareError(
        error instanceof Error ? error.message : t('share:button.error', 'Failed to share')
      );

      // Reset error state after a delay
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }
  };

  /**
   * Gets the button text based on current state
   */
  const getButtonText = (): string => {
    switch (shareState) {
      case "generating":
        return t('share:button.generating', 'Generating...');
      case "success":
        return t('share:button.success', 'Shared!');
      case "error":
        return t('share:button.error', 'Error');
      default:
        return t('share:button.share', 'Share');
    }
  };

  /**
   * Gets the button icon based on current state
   */
  const getButtonIcon = (): string => {
    switch (shareState) {
      case "generating":
        return "mdi:loading"; // Rotating spinner icon
      case "success":
        return "mdi:check-circle";
      case "error":
        return "mdi:alert-circle";
      default:
        return "mdi:share-variant"; // Share icon
    }
  };

  /**
   * Determines if the button should be disabled
   */
  const isDisabled = shareState === "generating";

  /**
   * Gets button color classes based on state
   */
  const getButtonColorClasses = (): string => {
    switch (shareState) {
      case "success":
        return "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600";
      case "error":
        return "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600";
      default:
        return "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700";
    }
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
        aria-label={t('button.share')}
        aria-busy={isDisabled}
      >
        {/* Icon with conditional animation */}
        <Icon
          icon={getButtonIcon()}
          width={24}
          height={24}
          className={shareState === "generating" ? "animate-spin" : ""}
        />

        {/* Button text */}
        <span>{getButtonText()}</span>
      </button>

      {/* Error/Info message display */}
      {shareError && (
        <p
          className={`mt-2 text-sm ${
            shareState === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-blue-600 dark:text-blue-400"
          }`}
          role={shareState === "error" ? "alert" : "status"}
        >
          {shareError}
        </p>
      )}
    </div>
  );
}
