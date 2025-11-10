import { useEffect, useState } from "react";
import type { Theme } from "~/types/theme";
import { getStoredTheme, saveTheme, getSystemTheme, applyTheme } from "~/utils/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    return stored ?? getSystemTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme: Theme = theme === "light" ? "dark" : "light";
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  return { theme, toggleTheme };
}
