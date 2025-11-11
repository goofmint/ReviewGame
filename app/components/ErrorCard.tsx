import { Link } from "react-router";

interface ErrorCardProps {
  title: string;
  linkTo: string;
  linkText: string;
  className?: string;
}

export function ErrorCard({
  title,
  linkTo,
  linkText,
  className = "",
}: ErrorCardProps) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center ${className}`}
    >
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {title}
        </h1>
        <Link
          to={linkTo}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {linkText}
        </Link>
      </div>
    </div>
  );
}
