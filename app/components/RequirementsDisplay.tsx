import { Icon } from "@iconify/react";

interface RequirementsDisplayProps {
  requirements: string;
  onRequirementClick?: (text: string) => void;
}

export function RequirementsDisplay({
  requirements,
  onRequirementClick,
}: RequirementsDisplayProps) {
  const lines = requirements.split("\n");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="ph:list-checks-bold" className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          要件
        </h2>
      </div>
      <div className="space-y-2">
        {lines.map((line, index) => (
          <p
            key={index}
            className="text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
            onClick={() => {
              if (line.trim() && onRequirementClick) {
                onRequirementClick(line);
              }
            }}
            style={{ cursor: onRequirementClick && line.trim() ? "pointer" : "default" }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
