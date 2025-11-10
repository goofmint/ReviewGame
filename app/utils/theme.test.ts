import { describe, it, expect, beforeEach } from "vitest";
import { getStoredTheme, saveTheme, getSystemTheme, applyTheme } from "./theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  describe("getStoredTheme", () => {
    it("should return null when no theme is stored", () => {
      const theme = getStoredTheme();
      expect(theme).toBeNull();
    });

    it("should return stored theme", () => {
      localStorage.setItem("reviewGameTheme", "dark");
      const theme = getStoredTheme();
      expect(theme).toBe("dark");
    });

    it("should return null for invalid stored value", () => {
      localStorage.setItem("reviewGameTheme", "invalid");
      const theme = getStoredTheme();
      expect(theme).toBeNull();
    });
  });

  describe("saveTheme", () => {
    it("should save light theme", () => {
      saveTheme("light");
      const stored = localStorage.getItem("reviewGameTheme");
      expect(stored).toBe("light");
    });

    it("should save dark theme", () => {
      saveTheme("dark");
      const stored = localStorage.getItem("reviewGameTheme");
      expect(stored).toBe("dark");
    });
  });

  describe("getSystemTheme", () => {
    it("should return a valid theme", () => {
      const theme = getSystemTheme();
      expect(["light", "dark"]).toContain(theme);
    });
  });

  describe("applyTheme", () => {
    it("should add dark class for dark theme", () => {
      applyTheme("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("should remove dark class for light theme", () => {
      document.documentElement.classList.add("dark");
      applyTheme("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });
});
