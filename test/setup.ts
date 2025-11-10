import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Mock fetch to prevent Iconify from making API calls
global.fetch = () =>
  Promise.reject(new Error("Network requests are disabled in tests"));

// Clean up after each test
afterEach(async () => {
  // Wait a bit for any pending async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 0));
});
