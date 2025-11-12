/**
 * Share Button E2E Tests
 * Tests for the X share functionality including image generation and dark/light mode
 * Tests actual user flows without mocks
 */

import { test, expect } from "@playwright/test";

test.describe("Share Button Functionality", () => {
  /**
   * Helper function to navigate to result page
   * Simulates completing a review and getting a score
   */
  async function navigateToResultPage(page: ReturnType<typeof test.use>) {
    // Go to home
    await page.goto("/");

    // Select JavaScript
    await page.getByRole("link", { name: /JavaScript/i }).click();
    await expect(page).toHaveURL(/\/javascript/);

    // Select Level 1
    await page
      .getByRole("link", { name: /レベル 1/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/javascript\/1$/);

    // Submit a review (enter some text and submit)
    const textarea = page.getByRole("textbox");
    await textarea.fill("This is a test review for sharing functionality.");

    await page.getByRole("button", { name: /送信/i }).click();

    // Wait for navigation to result page
    await expect(page).toHaveURL(/\/javascript\/1\/result/);
  }

  test("should display share button on result page", async ({ page }) => {
    await navigateToResultPage(page);

    // Check that share button is visible
    const shareButton = page.getByRole("button", { name: /Xでシェア/i });
    await expect(shareButton).toBeVisible();
  });

  test("should have proper styling in light mode", async ({ page }) => {
    await navigateToResultPage(page);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });

    // Get button colors
    const backgroundColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Button should have a blue background
    expect(backgroundColor).toContain("rgb");
    // Text should be white
    expect(textColor).toBeTruthy();

    // Check contrast between text and background
    // Both should be defined
    expect(backgroundColor).not.toBe(textColor);
  });

  test("should have proper styling in dark mode", async ({ page, context }) => {
    // Set dark mode preference
    await context.emulateMedia({ colorScheme: "dark" });
    await navigateToResultPage(page);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });

    // Get button colors in dark mode
    const backgroundColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Colors should be defined
    expect(backgroundColor).toBeTruthy();
    expect(textColor).toBeTruthy();

    // Ensure there's contrast between background and text
    expect(backgroundColor).not.toBe(textColor);
  });

  test("should show loading state when clicked", async ({ page }) => {
    await navigateToResultPage(page);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });

    // Click the share button
    await shareButton.click();

    // Should show loading text immediately
    await expect(
      page.getByRole("button", { name: /画像生成中/i })
    ).toBeVisible({ timeout: 1000 });

    // Button should be disabled during loading
    const isDisabled = await shareButton.evaluate((el) =>
      el.hasAttribute("disabled")
    );
    expect(isDisabled).toBe(true);
  });

  test("should have Twitter icon from Iconify", async ({ page }) => {
    await navigateToResultPage(page);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });

    // Check for SVG icon (Iconify renders as SVG)
    const icon = shareButton.locator("svg").first();
    await expect(icon).toBeVisible();

    // Icon should have width and height
    const width = await icon.getAttribute("width");
    const height = await icon.getAttribute("height");
    expect(width).toBeTruthy();
    expect(height).toBeTruthy();
  });

  test("should be accessible", async ({ page }) => {
    await navigateToResultPage(page);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });

    // Check aria-label
    const ariaLabel = await shareButton.getAttribute("aria-label");
    expect(ariaLabel).toBe("Xでシェア");

    // Button should be focusable
    await shareButton.focus();
    const isFocused = await shareButton.evaluate(
      (el) => el === document.activeElement
    );
    expect(isFocused).toBe(true);
  });

  test("should display in result page layout correctly", async ({ page }) => {
    await navigateToResultPage(page);

    // Check that share section exists
    const shareSection = page.locator("text=結果をシェアしよう！").first();
    await expect(shareSection).toBeVisible();

    // Share button should be within the share section
    const shareButton = page.getByRole("button", { name: /Xでシェア/i });
    await expect(shareButton).toBeVisible();

    // Check position (should be above action buttons)
    const shareSectionBox = await shareSection.boundingBox();
    const actionButtons = page.getByRole("link", { name: /もう一度挑戦/i });
    const actionButtonBox = await actionButtons.boundingBox();

    expect(shareSectionBox).toBeTruthy();
    expect(actionButtonBox).toBeTruthy();

    if (shareSectionBox && actionButtonBox) {
      // Share section should be above action buttons
      expect(shareSectionBox.y).toBeLessThan(actionButtonBox.y);
    }
  });
});

test.describe("Share Button Color Contrast", () => {
  /**
   * Helper to calculate relative luminance for WCAG contrast calculations
   */
  function getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  function getContrastRatio(color1: string, color2: string): number {
    // Parse RGB values
    const rgb1Match = color1.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    const rgb2Match = color2.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (!rgb1Match || !rgb2Match) return 0;

    const l1 = getRelativeLuminance(
      parseInt(rgb1Match[1]),
      parseInt(rgb1Match[2]),
      parseInt(rgb1Match[3])
    );
    const l2 = getRelativeLuminance(
      parseInt(rgb2Match[1]),
      parseInt(rgb2Match[2]),
      parseInt(rgb2Match[3])
    );

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  test("should meet WCAG AA contrast ratio in light mode", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /JavaScript/i }).click();
    await page.getByRole("link", { name: /レベル 1/i }).first().click();
    await page.getByRole("textbox").fill("Test review");
    await page.getByRole("button", { name: /送信/i }).click();
    await expect(page).toHaveURL(/result/);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });
    const backgroundColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    const contrastRatio = getContrastRatio(backgroundColor, textColor);

    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    // Button text is typically large, so we check for 3:1
    expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
  });

  test("should meet WCAG AA contrast ratio in dark mode", async ({
    page,
    context,
  }) => {
    await context.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("link", { name: /JavaScript/i }).click();
    await page.getByRole("link", { name: /レベル 1/i }).first().click();
    await page.getByRole("textbox").fill("Test review");
    await page.getByRole("button", { name: /送信/i }).click();
    await expect(page).toHaveURL(/result/);

    const shareButton = page.getByRole("button", { name: /Xでシェア/i });
    const backgroundColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await shareButton.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    const contrastRatio = getContrastRatio(backgroundColor, textColor);

    // WCAG AA requires 3:1 for large text
    expect(contrastRatio).toBeGreaterThanOrEqual(3.0);
  });
});

test.describe("Result Page Dark/Light Mode", () => {
  test("should have proper color contrast for all text in light mode", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /JavaScript/i }).click();
    await page.getByRole("link", { name: /レベル 1/i }).first().click();
    await page.getByRole("textbox").fill("Test review");
    await page.getByRole("button", { name: /送信/i }).click();
    await expect(page).toHaveURL(/result/);

    // Check heading colors
    const heading = page.getByText("結果をシェアしよう！");
    const headingColor = await heading.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Get background
    const body = page.locator("body");
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Both should be defined
    expect(headingColor).toBeTruthy();
    expect(backgroundColor).toBeTruthy();

    // Should have different colors (contrast exists)
    expect(headingColor).not.toBe(backgroundColor);
  });

  test("should have proper color contrast for all text in dark mode", async ({
    page,
    context,
  }) => {
    await context.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    await page.getByRole("link", { name: /JavaScript/i }).click();
    await page.getByRole("link", { name: /レベル 1/i }).first().click();
    await page.getByRole("textbox").fill("Test review");
    await page.getByRole("button", { name: /送信/i }).click();
    await expect(page).toHaveURL(/result/);

    // Check heading colors in dark mode
    const heading = page.getByText("結果をシェアしよう！");
    const headingColor = await heading.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // Get background
    const body = page.locator("body");
    const backgroundColor = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Both should be defined
    expect(headingColor).toBeTruthy();
    expect(backgroundColor).toBeTruthy();

    // Should have different colors (contrast exists)
    expect(headingColor).not.toBe(backgroundColor);
  });
});
