import { Link } from "@remix-run/react";
import { Icon } from "@iconify/react";
import { Card } from "./Card";
import type { ProgressState } from "~/types/problem";

interface LevelSelectorProps {
  language: string;
  levels: number[];
  progress: ProgressState;
}

export function LevelSelector({ language, levels, progress }: LevelSelectorProps) {
  const getLevelStatus = (level: number) => {
    if (level === 1) return { unlocked: true, bestScore: progress[language]?.[level]?.bestScore };
    return {
      unlocked: progress[language]?.[level]?.unlocked ?? false,
      bestScore: progress[language]?.[level]?.bestScore,
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {levels.map((level) => {
        const { unlocked, bestScore } = getLevelStatus(level);

        return (
          <div key={level}>
            {unlocked ? (
              <Link to={`/${language}/${level}`} className="block">
                <Card hoverable>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="ph:star-fill"
                        className="w-6 h-6 text-yellow-500"
                      />
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Level {level}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      難易度: {level}
                    </p>
                    {bestScore !== undefined && (
                      <div className="mt-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          最高スコア: {bestScore}点
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="opacity-50">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="ph:lock-fill"
                      className="w-6 h-6 text-gray-400"
                    />
                    <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400">
                      Level {level}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    前のレベルで70点以上を獲得してアンロック
                  </p>
                </div>
              </Card>
            )}
          </div>
        );
      })}
    </div>
  );
}
