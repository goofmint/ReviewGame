/**
 * RequirementsDisplay Component
 *
 * 要件を表示し、各項目をクリックするとMarkdown見出し形式で
 * レビュー入力エリアに自動挿入されるコンポーネント
 *
 * Features:
 * - 箇条書き項目の自動検出
 * - クリック可能な要件項目
 * - Markdown見出し形式での挿入
 * - ライトモード・ダークモード対応
 * - ホバー時のハイライト
 */

interface RequirementsDisplayProps {
  /** 要件テキスト（改行区切り） */
  requirements: string;
  /** 要件クリック時のコールバック */
  onRequirementClick: (requirement: string) => void;
}

/**
 * 要件テキストを解析して箇条書き項目を抽出
 *
 * @param text - 要件全体のテキスト
 * @returns 要件項目の配列
 */
function parseRequirements(text: string): string[] {
  const lines = text.split("\n");
  const requirements: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 箇条書き記号で始まる行を要件項目として認識
    // サポート: "- ", "* ", "• ", "・ ", 数字付き "1. ", "1) "
    const bulletMatch = trimmed.match(/^[-*•・]\s+(.+)$/);
    const numberedMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (bulletMatch) {
      requirements.push(bulletMatch[1]);
    } else if (numberedMatch) {
      requirements.push(numberedMatch[1]);
    } else if (trimmed && !trimmed.match(/^[#=]+$/)) {
      // 見出し記号やセパレータでない場合は通常の要件として扱う
      requirements.push(trimmed);
    }
  }

  return requirements;
}

/**
 * 要件表示コンポーネント
 *
 * @example
 * ```tsx
 * <RequirementsDisplay
 *   requirements="- 年齢は0以上150以下\n- 整数である必要がある"
 *   onRequirementClick={(req) => console.log(`Clicked: ${req}`)}
 * />
 * ```
 */
export function RequirementsDisplay({
  requirements,
  onRequirementClick,
}: RequirementsDisplayProps) {
  const requirementItems = parseRequirements(requirements);

  // 要件項目が存在しない場合は通常のテキスト表示
  if (requirementItems.length === 0) {
    return (
      <div className="prose dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
          {requirements}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requirementItems.map((item, index) => (
        <button
          type="button"
          key={index}
          className="flex items-start w-full text-left p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => onRequirementClick(item)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRequirementClick(item);
            }
          }}
          title={`クリックしてレビューに追加: ${item}`}
          aria-label={`要件「${item}」をレビューに追加`}
        >
          {/* 箇条書きマーカー */}
          <span className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0">
            •
          </span>

          {/* 要件テキスト */}
          <span className="text-gray-700 dark:text-gray-300 text-sm">
            {item}
          </span>
        </button>
      ))}
    </div>
  );
}
