/**
 * ShareButton Component
 * Provides social media sharing functionality
 * Generates share image, uploads to R2, saves to KV, and opens X share intent
 */

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";
import { useFetcher } from "react-router";
import { generateShareImage } from "~/utils/imageGenerator";
import type { ShareResult, SaveResultResponse } from "~/types/problem";

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

  // Fetchers for image upload and result save
  const imageFetcher = useFetcher<ShareResult>();
  const resultFetcher = useFetcher<SaveResultResponse>();

  // Client-side sharing state
  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string>("");
  const [imageBase64, setImageBase64] = useState<string>("");

  // Track if we've already opened the share dialog
  const sharedRef = useRef(false);

  /**
   * Monitor image upload fetcher state
   * When image is uploaded successfully, save result to KV
   */
  useEffect(() => {
    if (imageFetcher.state === "idle" && imageFetcher.data) {
      console.log("Image fetcher data:", imageFetcher.data);

      // Check if there's an error in the response
      if ('error' in imageFetcher.data) {
        console.error("Image upload error:", imageFetcher.data.error);
        setShareState("error");
        setShareError(imageFetcher.data.error as string);
        return;
      }

      const imageUrl = imageFetcher.data.imageUrl;
      console.log("Image URL:", imageUrl);

      if (imageUrl && resultFetcher.state === "idle" && !resultFetcher.data) {
        console.log("Submitting to result save with:", {
          score,
          language,
          level,
          feedback: feedback.substring(0, 50) + "...",
          strengthsCount: strengths.length,
          improvementsCount: improvements.length,
          imageUrl,
          locale,
        });

        // Submit to result page's action with saveResult intent
        const formData = new FormData();
        formData.append("intent", "saveResult");
        formData.append("score", score.toString());
        formData.append("language", language);
        formData.append("level", level);
        formData.append("feedback", feedback);
        formData.append("strengths", JSON.stringify(strengths));
        formData.append("improvements", JSON.stringify(improvements));
        formData.append("imageUrl", imageUrl);
        formData.append("locale", locale);

        resultFetcher.submit(formData, {
          method: "POST",
          action: `/${locale}/${language}/${level}/result`,
        });
      }
    }
  }, [imageFetcher.state, imageFetcher.data, resultFetcher.state, resultFetcher.data, score, language, level, feedback, strengths, improvements, locale]);

  /**
   * Monitor result save fetcher state
   * When result is saved successfully, open X share intent
   */
  useEffect(() => {
    if (resultFetcher.state === "idle" && resultFetcher.data && !sharedRef.current) {
      console.log("Result fetcher data:", resultFetcher.data);

      // Check if there's an error in the response
      if ('error' in resultFetcher.data) {
        console.error("Result save error:", resultFetcher.data.error);
        setShareState("error");
        setShareError(resultFetcher.data.error as string);
        return;
      }

      const resultUrl = resultFetcher.data.url;
      console.log("Result URL:", resultUrl);

      if (resultUrl) {
        sharedRef.current = true;

        // Generate X share text
        const languageDisplayName = t(`common:language.${language}`, language);
        const shareText = locale === 'ja'
          ? `コードレビューゲーム powered by #CodeRabbit にて ${score}点を獲得しました！\n言語: ${languageDisplayName}\nレベル: ${level}\n\n${resultUrl}`
          : `I scored ${score} points on #CodeRabbit Code Review Game!\nLanguage: ${languageDisplayName}\nLevel: ${level}\n\n${resultUrl}`;

        console.log("Opening X share dialog with text:", shareText);

        // Open X share intent
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(tweetUrl, "_blank", "noopener,noreferrer");

        setShareState("success");

        // Reset state after success
        setTimeout(() => {
          setShareState("idle");
          sharedRef.current = false;
        }, 3000);
      }
    }
  }, [resultFetcher.state, resultFetcher.data, score, language, level, locale, t]);

  /**
   * Monitor fetcher errors
   */
  useEffect(() => {
    if (imageFetcher.state === "idle" && imageFetcher.data && 'error' in imageFetcher.data) {
      setShareState("error");
      setShareError(imageFetcher.data.error as string);
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }

    if (resultFetcher.state === "idle" && resultFetcher.data && 'error' in resultFetcher.data) {
      setShareState("error");
      setShareError(resultFetcher.data.error as string);
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }
  }, [imageFetcher.state, imageFetcher.data, resultFetcher.state, resultFetcher.data]);

  /**
   * Handles the share button click
   * Generates image and starts the upload process
   */
  const handleShare = async () => {
    try {
      // Reset error state
      setShareError("");
      setShareState("generating");
      sharedRef.current = false;

      // Step 1: Generate image (client-side)
      const languageDisplayName = t(`common:language.${language}`, language);
      const imageBlob = await generateShareImage(score, language, level, locale, languageDisplayName);

      // Step 2: Convert image to base64 for upload
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
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

      setImageBase64(base64);

      // Step 3: Submit image upload using fetcher as FormData
      const formData = new FormData();
      formData.append("intent", "uploadImage");
      formData.append("imageData", base64);
      formData.append("score", score.toString());
      formData.append("language", language);
      formData.append("level", level);
      formData.append("locale", locale);

      imageFetcher.submit(formData, {
        method: "POST",
        action: `/${locale}/${language}/${level}/result`,
      });
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
   * Update share state based on fetcher states
   */
  useEffect(() => {
    if (imageFetcher.state === "submitting" || resultFetcher.state === "submitting") {
      setShareState("generating");
    }
  }, [imageFetcher.state, resultFetcher.state]);

  /**
   * Gets the button text based on current state
   */
  const getButtonText = (): string => {
    if (imageFetcher.state === "submitting" || resultFetcher.state === "submitting") {
      return t('share:button.generating', 'Generating...');
    }

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
  const isDisabled =
    shareState === "generating" ||
    imageFetcher.state === "submitting" ||
    resultFetcher.state === "submitting";

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
