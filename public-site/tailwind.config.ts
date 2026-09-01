import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F3EDE7",
        espresso: "#2B1F16",
        tan: "#8B6F4E",
        ink: "#3A2E22",
        muted: "#6B5D4F",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
};

export default config;
