import { defineConfig } from "vite";
import { vitePlugin as remix } from "@remix-run/dev";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isTest = mode === "test" || process.env.VITEST === "true";

  return {
    plugins: [
      isTest
        ? react()
        : remix({
            future: {
              v3_fetcherPersist: true,
              v3_relativeSplatPath: true,
              v3_throwAbortReason: true,
            },
          }),
      tsconfigPaths(),
    ],
    test: {
      globals: true,
      environment: "happy-dom",
      setupFiles: ["./test/setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html"],
        include: ["app/**/*.{ts,tsx}"],
        exclude: ["app/**/*.test.{ts,tsx}", "app/data/problems.ts"],
      },
    },
  };
});
