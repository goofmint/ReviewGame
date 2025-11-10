interface CodeDisplayProps {
  code: string;
  language: string;
  onLineClick?: (lineNumber: number) => void;
}

export function CodeDisplay({ code, language, onLineClick }: CodeDisplayProps) {
  const lines = code.split("\n");

  return (
    <div className="bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden">
      <div className="bg-gray-800 dark:bg-gray-900 px-4 py-2 border-b border-gray-700">
        <span className="text-sm font-mono text-gray-300">{language}</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm">
          <code>
            {lines.map((line, index) => (
              <div
                key={index}
                className="flex hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors"
                onClick={() => onLineClick?.(index + 1)}
                style={{ cursor: onLineClick ? "pointer" : "default" }}
              >
                <span className="select-none text-gray-500 w-12 text-right pr-4 flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-gray-100 flex-1">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
