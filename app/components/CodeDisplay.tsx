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
  const codeLines = code.split("\n");

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      <div className="relative">
        {/* シンタックスハイライト表示（非インタラクティブ、背景として使用） */}
        <div className="pointer-events-none">
          <SyntaxHighlighter
            language={normalizedLanguage}
            style={isDark ? oneDark : oneLight}
            showLineNumbers={false}
            customStyle={{
              margin: 0,
              padding: "1rem",
              background: "transparent",
              fontSize: "0.875rem",
            }}
            lineProps={{
              style: {
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
              },
            }}
          >
            {code}
          </SyntaxHighlighter>
        </div>

        {/* クリック可能な行のオーバーレイ */}
        <div className="absolute top-0 left-0 right-0 p-4">
          {codeLines.map((line, index) => (
            <button
              type="button"
              key={index}
              className="flex w-full hover:bg-yellow-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              onClick={() => onLineClick(index + 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onLineClick(index + 1);
                }
              }}
              title={`クリックしてレビューに追加: ${index + 1}行目`}
              aria-label={`${index + 1}行目をレビューに追加`}
              style={{
                // 行の高さをSyntaxHighlighterと合わせる
                minHeight: "1.5rem",
              }}
            >
              {/* 行番号 */}
              <span className="select-none text-gray-400 dark:text-gray-600 w-10 text-right mr-4 flex-shrink-0">
                {index + 1}
              </span>

              {/* 行の内容（透明テキスト、スペースを保持するため） */}
              <span className="opacity-0 pointer-events-none text-sm font-mono">
                {line || " "}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
