/**
 * ShareButton Component
 *
 * Enhanced with result persistence:
 * 1. Generate/upload share image
 * 2. Save result to KV
 * 3. Share with result URL
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
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

  const [shareState, setShareState] = useState<ShareState>("idle");
  const [shareError, setShareError] = useState<string>("");

  /**
   * Handle share button click
   * Full flow: Generate image → Upload to R2 → Save to KV → Share on X
   */
  const handleShare = async () => {
    try {
      setShareError("");
      setShareState("generating");

      let imageUrl = providedImageUrl;

      // Step 1: Generate and upload image if not provided
      if (!imageUrl) {
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
            resolve(base64Data.split(",")[1]); // Remove data:image/png;base64, prefix
          };
          reader.onerror = () => reject(new Error("Failed to convert image to base64"));
          reader.readAsDataURL(imageBlob);
        });

        // Upload to R2
        const uploadResponse = await fetch("/api/upload-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageData: base64Image,
            score,
            language,
            level,
            locale,
          }),
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to R2");
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.imageUrl;

        if (!imageUrl) {
          throw new Error("No image URL returned from upload");
        }
      }

      // Step 2: Save result to KV
      setShareState("saving");
      const saveResult = await saveResultToKV(imageUrl);

      if (!saveResult.success) {
        throw new Error("Failed to save result to KV");
      }

      // Step 3: Share with result URL
      await handleShareWithResultUrl(saveResult.resultUrl);

      setShareState("success");
      setTimeout(() => setShareState("idle"), 3000);
    } catch (error) {
      // User cancelled the share
      if (error instanceof Error && error.name === "AbortError") {
        setShareState("idle");
        return;
      }

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
   * Save result to KV storage
   */
  const saveResultToKV = async (imageUrl: string): Promise<SaveResultResponse> => {
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

    const response = await fetch("/api/save-result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to save result");
    }

    return await response.json();
  };

  /**
   * Share with result URL after result is saved
   */
  const handleShareWithResultUrl = async (resultUrl: string) => {
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
        // Fallback: Open X intent
        const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(xIntentUrl, "_blank");
      }
    } catch (imageError) {
      // If image generation or share fails, open X intent with text only
      if (imageError instanceof Error && imageError.name === "AbortError") {
        // User cancelled, don't show error
        throw imageError;
      }
      console.warn("Image share failed, opening X intent:", imageError);
      const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(xIntentUrl, "_blank");
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
    shareState === "saving";

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
