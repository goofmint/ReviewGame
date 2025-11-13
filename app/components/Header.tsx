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
              className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="View source on GitHub"
            >
              <Icon icon="mdi:github" width={24} height={24} />
            </a>

            {/* CodeRabbit Link */}
            <a
              href="https://www.coderabbit.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-10 h-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Visit CodeRabbit"
            >
              <img
                src="/images/coderabbit-icon.svg"
                alt="CodeRabbit"
                className="w-6 h-6"
              />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
