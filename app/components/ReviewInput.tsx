import { Icon } from "@iconify/react";
import { Button } from "./Button";
import { forwardRef } from "react";

interface ReviewInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const ReviewInput = forwardRef<HTMLTextAreaElement, ReviewInputProps>(
  function ReviewInput({ value, onChange, onSubmit, disabled = false }, ref) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="ph:pen-bold" className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            レビュー入力
          </h2>
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50"
          placeholder="コードのレビューをここに入力してください..."
        />
        <div className="mt-4">
          <Button
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            variant="success"
            className="w-full"
          >
            レビューを送信
          </Button>
        </div>
      </div>
    );
  }
);
