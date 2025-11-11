/**
 * CodeDisplay Component
 *
 * シンタックスハイライト付きのコード表示コンポーネント
 * 各行をクリックすると、レビュー入力エリアに行番号が自動挿入される
 *
 * Features:
 * - react-syntax-highlighterによるシンタックスハイライト
 * - クリック可能な行
 * - 行番号表示
 * - ライトモード・ダークモード対応
 * - ホバー時のハイライト
 */

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEffect, useState } from "react";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

interface CodeDisplayProps {
  /** 表示するコード */
  code: string;
  /** プログラミング言語（javascript, python, dart） */
  language: string;
  /** 行クリック時のコールバック */
  onLineClick: (lineNumber: number) => void;
}

/**
 * システムのダークモード設定を検出するカスタムフック
 */
function useDarkMode(): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 初期値を設定
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mediaQuery.matches);

    // ダークモード設定の変更を監視
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return isDark;
}

/**
 * プログラミング言語名をreact-syntax-highlighterの言語コードに変換
 */
function normalizeLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: "javascript",
    python: "python",
    flutter: "dart",
    dart: "dart",
  };

  return languageMap[language.toLowerCase()] || "javascript";
}

/**
 * コード表示コンポーネント
 *
 * @example
 * ```tsx
 * <CodeDisplay
 *   code="function hello() { return 'world'; }"
 *   language="javascript"
 *   onLineClick={(lineNumber) => console.log(`Line ${lineNumber} clicked`)}
 * />
 * ```
 */
export function CodeDisplay({
  code,
  language,
  onLineClick,
}: CodeDisplayProps) {
  const isDark = useDarkMode();
  const normalizedLanguage = normalizeLanguage(language);

  /**
   * 各行のプロパティを設定
   * クリック可能にし、ホバー時のスタイルを適用
   */
  const getLineProps: SyntaxHighlighterProps["lineProps"] = (
    lineNumber: number
  ) => {
    return {
      style: {
        cursor: "pointer",
        display: "block",
      },
      onClick: () => onLineClick(lineNumber),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onLineClick(lineNumber);
        }
      },
      className: "hover:bg-yellow-100 dark:hover:bg-gray-700 transition-colors",
      title: `クリックしてレビューに追加: ${lineNumber}行目`,
      "aria-label": `${lineNumber}行目をレビューに追加`,
      tabIndex: 0,
      role: "button",
    };
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      <SyntaxHighlighter
        language={normalizedLanguage}
        style={isDark ? oneDark : oneLight}
        showLineNumbers={true}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "transparent",
          fontSize: "0.875rem",
        }}
        lineNumberStyle={{
          minWidth: "2.5em",
          paddingRight: "1em",
          color: isDark ? "#6b7280" : "#9ca3af",
          userSelect: "none",
        }}
        wrapLines={true}
        lineProps={getLineProps}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
