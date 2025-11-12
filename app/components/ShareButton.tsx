/**
 * ShareButton Component
 *
 * Enhanced with result persistence:
 * 1. Generate/upload share image
 * 2. Save result to KV
 * 3. Share with result URL
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "react-router";
import { Icon } from "@iconify/react";
import { generateShareImage, blobToFile } from "~/utils/imageGenerator";
import type { SaveResultResponse } from "~/types/result";

/**
 * Props for ShareButton
 *
 * Now includes evaluation result data for persistence
 */
export interface ShareButtonProps {
  /** Score achieved (0-100) */
  score: number;

  /** Programming language ID */
  language: string;

  /** Level number */
  level: string;

  /** Current locale (ja | en) */
  locale: string;

  /** LLM feedback text */
  feedback: string;

  /** Strengths array */
  strengths: string[];

  /** Improvements array */
  improvements: string[];

  /** Optional: Image URL if already generated/uploaded */
  imageUrl?: string;

  /** Additional CSS classes */
  className?: string;
}

type ShareState = "idle" | "generating" | "saving" | "success" | "error";

/**
 * Enhanced ShareButton with result persistence
 *
 * Flow:
 * 1. Generate image (client-side)
 * 2. Save result to KV (gets result URL)
 * 3. Share via Web Share API with result URL in text
 */
export function ShareButton({
  score,
  language,
  level,
  locale,
  feedback,
  strengths,
  improvements,
  imageUrl: providedImageUrl,
  className = "",
}: ShareButtonProps) {
  const { t } = useTranslation(["share", "common"]);
  const uploadFetcher = useFetcher();
  const saveFetcher = useFetcher<SaveResultResponse>();

  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  // Monitor upload fetcher state
  useEffect(() => {
    if (uploadFetcher.state === "loading" || uploadFetcher.state === "submitting") {
      setShareState("generating");
    } else if (uploadFetcher.data?.imageUrl) {
      // Upload completed, save to KV
      const imageUrl = uploadFetcher.data.imageUrl;
      setUploadedImageUrl(imageUrl);
      setShareState("saving");

      saveFetcher.submit(
        {
          score,
          language,
          level: parseInt(level, 10),
          locale,
          feedback,
          strengths,
          improvements,
          imageUrl,
        },
        {
          method: "POST",
          action: "/api/save-result",
          encType: "application/json",
        }
      );
    } else if (uploadFetcher.data?.error) {
      setShareState("error");
      setShareError(uploadFetcher.data.error);
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }
  }, [uploadFetcher.state, uploadFetcher.data]);

  // Monitor save fetcher state
  useEffect(() => {
    if (saveFetcher.state === "loading" || saveFetcher.state === "submitting") {
      setShareState("saving");
    } else if (saveFetcher.data?.success) {
      // Save completed, share
      handleShareWithResultUrl(saveFetcher.data.resultUrl);
      setShareState("success");
      setTimeout(() => setShareState("idle"), 3000);
    } else if (saveFetcher.data && !saveFetcher.data.success) {
      setShareState("error");
      setShareError(t("share:button.error", "Failed to save result"));
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }
  }, [saveFetcher.state, saveFetcher.data]);

  /**
   * Handle share button click
   * Generate image and upload to R2 using useFetcher
   */
  const handleShare = async () => {
    try {
      setShareError("");
      setShareState("generating");

      if (providedImageUrl) {
        // Skip generation, go directly to save
        setUploadedImageUrl(providedImageUrl);
        setShareState("saving");

        saveFetcher.submit(
          {
            score,
            language,
            level: parseInt(level, 10),
            locale,
            feedback,
            strengths,
            improvements,
            imageUrl: providedImageUrl,
          },
          {
            method: "POST",
            action: "/api/save-result",
            encType: "application/json",
          }
        );
        return;
      }

      // Generate image
      const languageDisplayName = t(`common:language.${language}`, language);
      const imageBlob = await generateShareImage(
        score,
        language,
        level,
        locale,
        languageDisplayName
      );

      // Convert to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          resolve(base64Data.split(",")[1]);
        };
        reader.onerror = () => reject(new Error("Failed to convert image to base64"));
        reader.readAsDataURL(imageBlob);
      });

      // Upload to R2 using useFetcher
      uploadFetcher.submit(
        {
          imageData: base64Image,
          score,
          language,
          level,
          locale,
        },
        {
          method: "POST",
          action: "/api/upload-image",
          encType: "application/json",
        }
      );
    } catch (error) {
      console.error("Share error:", error);
      setShareState("error");
      setShareError(
        error instanceof Error ? error.message : t("share:button.error")
      );
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }
  };

  /**
   * Share with result URL after result is saved
   */
  const handleShareWithResultUrl = (resultUrl: string) => {
    try {
      // Generate share text with result URL
      const languageDisplayName = t(`common:language.${language}`, language);
      const shareText =
        locale === "ja"
          ? `#CodeRabbit コードレビューゲームで${score}点を獲得しました！\n言語: ${languageDisplayName} | レベル: ${level}\n\n${resultUrl}`
          : `I scored ${score} points on #CodeRabbit Code Review Game!\nLanguage: ${languageDisplayName} | Level: ${level}\n\n${resultUrl}`;

      // Open X intent with result URL
      const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(xIntentUrl, "_blank");
    } catch (error) {
      console.error("Share error:", error);
      // Ignore errors in opening window
    }
  };

  const getButtonText = (): string => {
    switch (shareState) {
      case "generating":
        return t("share:button.generating", "Generating...");
      case "saving":
        return t("share:button.saving", "Saving...");
      case "success":
        return t("share:button.success", "Shared!");
      case "error":
        return t("share:button.error", "Error");
      default:
        return t("share:button.share", "Share");
    }
  };

  const getButtonIcon = (): string => {
    switch (shareState) {
      case "generating":
      case "saving":
        return "mdi:loading";
      case "success":
        return "mdi:check-circle";
      case "error":
        return "mdi:alert-circle";
      default:
        return "mdi:share-variant";
    }
  };

  const isDisabled =
    shareState === "generating" ||
    shareState === "saving" ||
    uploadFetcher.state !== "idle" ||
    saveFetcher.state !== "idle";

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
        aria-label={t("button.share")}
        aria-busy={isDisabled}
      >
        <Icon
          icon={getButtonIcon()}
          width={24}
          height={24}
          className={
            shareState === "generating" || shareState === "saving"
              ? "animate-spin"
              : ""
          }
        />
        <span>{getButtonText()}</span>
      </button>

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
