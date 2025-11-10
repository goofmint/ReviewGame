import { Icon } from "@iconify/react";
import { useTheme } from "~/hooks/useTheme";

/**
 * @client
 */

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <Icon icon="ph:moon-fill" className="w-5 h-5 text-gray-800" />
      ) : (
        <Icon icon="ph:sun-fill" className="w-5 h-5 text-yellow-400" />
      )}
    </button>
  );
}
