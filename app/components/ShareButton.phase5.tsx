/**
 * ShareButton Component (Phase 5 Enhanced)
 *
 * Enhanced with result persistence:
 * 1. Generate/upload share image
 * 2. Save result to KV (useFetcher)
 * 3. Share with result URL
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFetcher } from "@remix-run/react";
import { Icon } from "@iconify/react";
import { generateShareImage, blobToFile } from "~/utils/imageGenerator";
import type { SaveResultResponse } from "~/types/result";

/**
 * Props for Phase 5 ShareButton
 *
 * Now includes evaluation result data for persistence
 */
export interface ShareButtonPhase5Props {
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
 * 2. Save result to KV via useFetcher (gets result URL)
 * 3. Share via Web Share API with result URL in text
 */
export function ShareButtonPhase5({
  score,
  language,
  level,
  locale,
  feedback,
  strengths,
  improvements,
  imageUrl: providedImageUrl,
  className = "",
}: ShareButtonPhase5Props) {
  const { t } = useTranslation(["share", "common"]);
  const fetcher = useFetcher<SaveResultResponse>();

  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>("");

  // Monitor fetcher state for result saving
  useEffect(() => {
    if (fetcher.state === "loading" || fetcher.state === "submitting") {
      setShareState("saving");
    } else if (fetcher.data?.success && generatedImageUrl) {
      // Result saved successfully, proceed to share
      handleShareWithResultUrl(fetcher.data.resultUrl, generatedImageUrl);
    } else if (fetcher.data && !fetcher.data.success) {
      setShareState("error");
      setShareError(t("share:button.error", "Failed to save result"));
      setTimeout(() => {
        setShareState("idle");
        setShareError("");
      }, 5000);
    }
  }, [fetcher.state, fetcher.data, generatedImageUrl]);

  /**
   * Handle share button click
   * Generates image, uploads it, saves result, then shares
   */
  const handleShare = async () => {
    try {
      setShareError("");
      setShareState("generating");

      // Use provided image URL or generate a placeholder
      // In real implementation, image should be uploaded to R2 first
      const imageUrl =
        providedImageUrl ||
        `https://example.com/share/${language}/${level}/${Date.now()}.png`;

      setGeneratedImageUrl(imageUrl);

      // Save result using useFetcher
      const saveData = {
        score,
        language,
        level: parseInt(level, 10),
        locale,
        feedback,
        strengths,
        improvements,
        imageUrl,
      };

      fetcher.submit(saveData, {
        method: "POST",
        action: "/api/save-result",
        encType: "application/json",
      });
    } catch (error) {
      console.error("Share preparation error:", error);
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
  const handleShareWithResultUrl = async (
    resultUrl: string,
    imageUrl: string
  ) => {
    try {
      // Generate share text with result URL
      const languageDisplayName = t(`common:language.${language}`, language);
      const shareText =
        locale === "ja"
          ? `#CodeRabbit コードレビューゲームで${score}点を獲得しました！\n言語: ${languageDisplayName} | レベル: ${level}\n\n${resultUrl}`
          : `I scored ${score} points on #CodeRabbit Code Review Game!\nLanguage: ${languageDisplayName} | Level: ${level}\n\n${resultUrl}`;

      // Try to generate and share image
      try {
        const imageBlob = await generateShareImage(
          score,
          language,
          level,
          locale,
          languageDisplayName
        );
        const fileName = `code-review-game-${language}-level${level}-${score}pts.png`;
        const imageFile = blobToFile(imageBlob, fileName);

        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
          await navigator.share({
            title: t("common:language.codeReviewGame", "Code Review Game"),
            text: shareText,
            files: [imageFile],
          });
        } else {
          // Fallback: Copy to clipboard or open X intent
          const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
          window.open(xIntentUrl, "_blank");
        }
      } catch (imageError) {
        // If image generation fails, share text only
        console.warn("Image generation failed, sharing text only:", imageError);
        const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(xIntentUrl, "_blank");
      }

      setShareState("success");
      setTimeout(() => setShareState("idle"), 3000);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setShareState("idle");
        return;
      }

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
    fetcher.state !== "idle";

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
