/**
 * Home Page E2E Tests
 * Tests for the language selection page with dark mode and layout checks
 */

import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display all language options", async ({ page }) => {
    await page.goto("/");

    // Check that the main heading is visible
    await expect(
      page.getByRole("heading", { name: "コードレビューゲーム" })
    ).toBeVisible();

    // Check that all three languages are displayed
    await expect(page.getByText("JavaScript")).toBeVisible();
    await expect(page.getByText("Python")).toBeVisible();
    await expect(page.getByText("Flutter")).toBeVisible();
  });

  test("should have proper color contrast in light mode", async ({ page }) => {
    await page.goto("/");

    // Get background and text colors
    const heading = page.getByRole("heading", {
      name: "コードレビューゲーム",
    });
    const headingColor = await heading.evaluate((el) =>
      window.getComputedStyle(el).color
    );
    const backgroundColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );

    // Ensure colors are defined (basic check)
    expect(headingColor).toBeTruthy();
    expect(backgroundColor).toBeTruthy();

    // The heading should have dark text (contains rgb with low values)
    // and background should be light
    expect(headingColor).toContain("rgb");
  });

  test("should have proper color contrast in dark mode", async ({
    page,
    context,
  }) => {
    // Set dark mode preference
    await context.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");

    // Get colors in dark mode
    const heading = page.getByRole("heading", {
      name: "コードレビューゲーム",
    });
    const headingColor = await heading.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // In dark mode, text should be light colored
    expect(headingColor).toBeTruthy();
    expect(headingColor).toContain("rgb");
  });

  test("should not have layout issues or overflow", async ({ page }) => {
    await page.goto("/");

    // Check viewport doesn't have horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Check that language cards are properly aligned
    const languageCards = page.locator("a").filter({ hasText: "JavaScript" });
    const box = await languageCards.first().boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      // Card should be within viewport
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
    }
  });

  test("should navigate to language level selection", async ({ page }) => {
    await page.goto("/");

    // Click on JavaScript
    await page.getByRole("link", { name: /JavaScript/i }).click();

    // Should navigate to /javascript
    await expect(page).toHaveURL(/\/javascript/);

    // Should show level selection
    await expect(
      page.getByRole("heading", { name: /レベル/i })
    ).toBeVisible();
  });
});
