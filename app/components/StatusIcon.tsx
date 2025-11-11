/**
 * Status Icon Component
 * Displays status icons using Iconify instead of emojis
 *
 * Provides consistent icon display across the application
 * Supports dark mode through Tailwind CSS classes
 */

import { Icon } from "@iconify/react";

interface StatusIconProps {
  type:
    | "clipboard"
    | "code"
    | "pencil"
    | "lightbulb"
    | "chat"
    | "thumbsup"
    | "arrow"
    | "checkmark"
    | "lock"
    | "trophy"
    | "info"
    | "star";
  className?: string;
}

/**
 * Maps status types to Iconify icon identifiers
 * Using Material Design Icons (mdi) for consistency
 */
const STATUS_ICONS: Record<string, string> = {
  clipboard: "mdi:clipboard-text",
  code: "mdi:code-tags",
  pencil: "mdi:pencil",
  lightbulb: "mdi:lightbulb-on",
  chat: "mdi:chat",
  thumbsup: "mdi:thumb-up",
  arrow: "mdi:arrow-right",
  checkmark: "mdi:check-circle",
  lock: "mdi:lock",
  trophy: "mdi:trophy",
  info: "mdi:information",
  star: "mdi:star",
};

/**
 * Renders an icon for the specified status type
 *
 * @param type - The type of status icon to display
 * @param className - Optional CSS classes to apply to the icon
 * @returns Icon component
 */
export function StatusIcon({ type, className = "" }: StatusIconProps) {
  const iconName = STATUS_ICONS[type];

  return <Icon icon={iconName} className={className} />;
}
