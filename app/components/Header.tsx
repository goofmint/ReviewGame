import { Link } from "@remix-run/react";
import { Icon } from "@iconify/react";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
}

export function Header({ showBackButton = false, backTo = "/", title }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                to={backTo}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Go back"
              >
                <Icon icon="ph:arrow-left-bold" className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </Link>
            )}
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {title ?? "Code Review Game"}
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
