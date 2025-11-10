import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, onClick, className = "", hoverable = false }: CardProps) {
  const baseStyles = "bg-white dark:bg-gray-800 rounded-lg shadow-md p-6";
  const hoverStyles = hoverable
    ? "hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer"
    : "";

  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={`${baseStyles} ${hoverStyles} ${className}`}
    >
      {children}
    </Component>
  );
}
