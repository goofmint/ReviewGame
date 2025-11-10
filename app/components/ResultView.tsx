import { Icon } from "@iconify/react";
import { Link } from "@remix-run/react";
import { Button } from "./Button";

interface ResultViewProps {
  score: number;
  passed: boolean;
  review: string;
  language: string;
  level: number;
}

export function ResultView({ score, passed, review, language, level }: ResultViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg text-center">
        <div className="mb-6">
          {passed ? (
            <Icon
              icon="ph:check-circle-fill"
              className="w-24 h-24 text-green-500 mx-auto"
            />
          ) : (
            <Icon
              icon="ph:x-circle-fill"
              className="w-24 h-24 text-red-500 mx-auto"
            />
          )}
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {score}点
        </h1>

        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8">
          {passed
            ? "合格！次のレベルがアンロックされました"
            : "不合格。もう一度挑戦してください"}
        </p>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Icon icon="ph:chat-text-fill" className="w-6 h-6" />
            あなたのレビュー
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-left">
            {review}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={`/${language}/${level}`}>
            <Button variant="secondary" className="w-full sm:w-auto">
              もう一度挑戦
            </Button>
          </Link>

          {passed && (
            <Link to={`/${language}/${level + 1}`}>
              <Button variant="primary" className="w-full sm:w-auto">
                次のレベルへ
              </Button>
            </Link>
          )}

          <Link to="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              言語選択に戻る
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p>Phase 1: 静的評価モード（LLM評価は未実装）</p>
      </div>
    </div>
  );
}
