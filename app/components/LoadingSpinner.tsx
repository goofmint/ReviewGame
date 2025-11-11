/**
 * LoadingSpinner Component
 *
 * 非同期処理中にユーザーへフィードバックを提供するスピナーコンポーネント
 * LLM評価や画像生成などの不定期処理で使用
 *
 * Features:
 * - 回転アニメーション
 * - カスタマイズ可能なメッセージ
 * - ライトモード・ダークモード対応
 * - 画面中央オーバーレイ表示
 */

import { Icon } from "@iconify/react";

interface LoadingSpinnerProps {
  /** ローディング中に表示するメッセージ */
  message?: string;
  /** フルスクリーンオーバーレイとして表示するか（デフォルト: true） */
  fullScreen?: boolean;
  /** スピナーのサイズ（デフォルト: 48） */
  size?: number;
}

/**
 * ローディングスピナーコンポーネント
 *
 * @example
 * ```tsx
 * <LoadingSpinner message="レビューを評価中..." />
 * ```
 */
export function LoadingSpinner({
  message = "読み込み中...",
  fullScreen = true,
  size = 48,
}: LoadingSpinnerProps) {
  // フルスクリーンオーバーレイの場合
  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 flex flex-col items-center space-y-4 max-w-sm mx-4">
          {/* 回転するスピナーアイコン */}
          <Icon
            icon="mdi:loading"
            className="text-blue-600 dark:text-blue-400 animate-spin"
            width={size}
            height={size}
          />

          {/* ローディングメッセージ */}
          <p className="text-gray-900 dark:text-white text-center font-medium">
            {message}
          </p>
        </div>
      </div>
    );
  }

  // インライン表示の場合
  return (
    <div
      className="flex items-center space-x-3"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* 回転するスピナーアイコン */}
      <Icon
        icon="mdi:loading"
        className="text-blue-600 dark:text-blue-400 animate-spin"
        width={size}
        height={size}
      />

      {/* ローディングメッセージ */}
      <span className="text-gray-900 dark:text-white">
        {message}
      </span>
    </div>
  );
}
