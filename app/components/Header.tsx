/**
 * Global Header Component
 * Displays site navigation with links to GitHub and CodeRabbit
 */

import { Link } from "react-router";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation(['common']);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Icon icon="mdi:code-review" width={28} height={28} />
            <span className="hidden sm:inline">Code Review Game</span>
            <span className="sm:hidden">CR Game</span>
          </Link>

          {/* Right side links */}
          <div className="flex items-center gap-3">
            {/* GitHub Link */}
            <a
              href="https://github.com/goofmint/ReviewGame"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="View source on GitHub"
            >
              <Icon icon="mdi:github" width={20} height={20} />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            {/* CodeRabbit Link */}
            <a
              href="https://www.coderabbit.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all shadow-sm hover:shadow-md"
              aria-label="Visit CodeRabbit"
            >
              <Icon icon="mdi:rabbit" width={20} height={20} />
              <span className="hidden sm:inline">CodeRabbit</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
