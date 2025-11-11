/**
 * Language Icon Component
 * Displays an icon for a specific programming language using Iconify
 *
 * Uses Material Design Icons (mdi) from Iconify
 * Replaces emoji usage to comply with design requirements
 */

import { Icon } from "@iconify/react";

interface LanguageIconProps {
  language: string;
  className?: string;
}

/**
 * Maps language names to Iconify icon identifiers
 * Uses MDI (Material Design Icons) icon set
 */
const LANGUAGE_ICONS: Record<string, string> = {
  javascript: "mdi:language-javascript",
  python: "mdi:language-python",
  flutter: "material-symbols:flutter",
};

/**
 * Renders an icon for the specified programming language
 *
 * @param language - The programming language identifier (e.g., "javascript")
 * @param className - Optional CSS classes to apply to the icon
 * @returns Icon component or fallback div if language not found
 */
export function LanguageIcon({ language, className = "" }: LanguageIconProps) {
  const iconName = LANGUAGE_ICONS[language];

  if (!iconName) {
    // Fallback: use generic code icon
    return <Icon icon="mdi:code-braces" className={className} />;
  }

  return <Icon icon={iconName} className={className} />;
}
