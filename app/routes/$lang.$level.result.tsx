import { useEffect } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import type { Route } from "./+types/$lang.$level.result";

interface ResultState {
  review: string;
  score: number;
  passed: boolean;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `結果 - ${params.lang} レベル${params.level}` },
    { name: "description", content: "レビューの評価結果" },
  ];
}

export default function ResultPage() {
  const { lang, level } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;

  // If no state, redirect back to problem page
  useEffect(() => {
    if (!state) {
      navigate(`/${lang}/${level}`, { replace: true });
    }
  }, [state, lang, level, navigate]);

  if (!state || !lang || !level) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* スコア表示 */}
          <div className="text-center mb-12">
            <div
              className={`inline-block px-8 py-4 rounded-2xl shadow-2xl ${
                state.passed
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : "bg-gradient-to-r from-blue-400 to-blue-600"
              }`}
            >
              <div className="text-white text-6xl font-bold mb-2">
                {state.score}点
              </div>
              <div className="text-white text-xl">
                {state.passed ? "🎉 合格！" : "📝 MVP版"}
              </div>
            </div>
          </div>

          {/* フィードバック */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">💬</span>
              フィードバック
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {state.feedback}
            </p>
          </div>

          {/* あなたのレビュー */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="text-3xl mr-3">✍️</span>
              あなたのレビュー
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans">
                {state.review}
              </pre>
            </div>
          </div>

          {/* 良かった点 */}
          {state.strengths.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-3xl mr-3">👍</span>
                良かった点
              </h2>
              <ul className="space-y-3">
                {state.strengths.map((strength, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-green-500 mr-3 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 改善点 */}
          {state.improvements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-3xl mr-3">💡</span>
                改善点
              </h2>
              <ul className="space-y-3">
                {state.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-blue-500 mr-3 mt-1">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={`/${lang}/${level}`}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
            >
              もう一度挑戦
            </Link>
            <Link
              to={`/${lang}`}
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-semibold"
            >
              レベル選択に戻る
            </Link>
            <Link
              to="/"
              className="px-8 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-center font-semibold"
            >
              言語選択に戻る
            </Link>
          </div>

          {/* MVP版の説明 */}
          <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              MVP版について
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              現在のバージョンはMVP（最小機能版）です。Phase 2でAIによるレビュー評価機能を実装予定です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
