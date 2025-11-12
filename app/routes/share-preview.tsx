/**
 * Share Preview Route
 * Development tool to test and preview share image generation
 * Allows testing different parameters and viewing the resulting image
 */

import { useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import { generateShareImage } from "~/utils/imageGenerator";
import { availableLanguages } from "~/data/problems";

// Simple language display names for the preview tool
const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  javascript: "JavaScript",
  python: "Python",
  flutter: "Flutter",
};

export const meta: MetaFunction = () => {
  return [
    { title: "Share Image Preview - Code Review Game" },
    {
      name: "description",
      content: "Development tool to preview share image generation",
    },
  ];
};

export default function SharePreview() {
  // Form state
  const [score, setScore] = useState<number>(75);
  const [language, setLanguage] = useState<string>(availableLanguages[0]);
  const [level, setLevel] = useState<string>("1");
  const [locale, setLocale] = useState<string>("en");

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  /**
   * Handles form submission and generates preview image
   */
  const handleGeneratePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsGenerating(true);

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    try {
      // Generate image using the same function as ShareButton
      const languageDisplayName = LANGUAGE_DISPLAY_NAMES[language] || language;
      const imageBlob = await generateShareImage(score, language, level, locale, languageDisplayName);

      // Create object URL for preview
      const url = URL.createObjectURL(imageBlob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Cleanup: revoke object URL when component unmounts or changes
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Share Image Preview
          </h1>
          <p className="text-gray-400">
            Development tool to test share image generation
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Parameters
          </h2>

          <form onSubmit={handleGeneratePreview} className="space-y-4">
            {/* Score Input */}
            <div>
              <label
                htmlFor="score"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Score (0-100): {score}
              </label>
              <input
                type="range"
                id="score"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Language Select */}
            <div>
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_DISPLAY_NAMES[lang] || lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Input */}
            <div>
              <label
                htmlFor="level"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Level
              </label>
              <input
                type="number"
                id="level"
                min="1"
                max="10"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Locale Select */}
            <div>
              <label
                htmlFor="locale"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Locale
              </label>
              <select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ja">日本語 (ja)</option>
                <option value="en">English (en)</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold text-white
                transition-all duration-200 ease-in-out
                ${
                  isGenerating
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:ring-offset-gray-800
              `}
            >
              {isGenerating ? "Generating..." : "Generate Preview"}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Preview Card */}
        {previewUrl && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Preview</h2>

            {/* Image Info */}
            <div className="mb-4 text-sm text-gray-400">
              <p>Dimensions: 1200x630px (X/Twitter OGP)</p>
              <p>Format: PNG</p>
              <p>
                Parameters: Score={score}, Language={language}, Level={level}
              </p>
            </div>

            {/* Image Preview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <img
                src={previewUrl}
                alt="Share image preview"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Download Button */}
            <div className="mt-4">
              <a
                href={previewUrl}
                download={`share-${language}-level${level}-${score}pts.png`}
                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Download Image
              </a>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            Instructions
          </h3>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li>
              • Adjust the parameters (Score, Language, Level) to test different
              combinations
            </li>
            <li>
              • Click "Generate Preview" to generate the share image
            </li>
            <li>
              • The generated image will be displayed below with download option
            </li>
            <li>
              • This uses the same generateShareImage function as the actual
              share feature
            </li>
            <li>
              • Image size is 1200x630px, optimized for X/Twitter sharing
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
