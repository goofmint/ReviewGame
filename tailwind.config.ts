import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        javascript: {
          light: "#F7DF1E",
          dark: "#FFA500",
        },
        python: {
          light: "#3776AB",
          dark: "#FFD43B",
        },
        flutter: {
          light: "#02569B",
          dark: "#13B9FD",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
