import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50:  "#f0f7ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a5f",
        },
        accent: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        display: ["var(--font-lora)", "Georgia", "serif"],
        body:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "slide-up": {
          "0%":   { opacity: "0", transform: "translate(-50%, 16px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-pop": {
          "0%":   { transform: "scale(0.75)" },
          "60%":  { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "celebrate-pop": {
          "0%":   { transform: "scale(1)" },
          "25%":  { transform: "scale(1.38)" },
          "55%":  { transform: "scale(0.93)" },
          "80%":  { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "sparkle-fade": {
          "0%":   { opacity: "0", transform: "scale(0) translateY(0px)" },
          "25%":  { opacity: "1", transform: "scale(1.2) translateY(-2px)" },
          "100%": { opacity: "0", transform: "scale(0.4) translateY(-7px)" },
        },
        "text-brighten": {
          "0%":   { opacity: "0", color: "#f3f4f6" },
          "15%":  { opacity: "1", color: "#f3f4f6" },
          "40%":  { color: "#d1d5db" },
          "65%":  { color: "#9ca3af" },
          "85%":  { color: "#4b5563" },
          "100%": { opacity: "1", color: "#1f2937" },
        },
      },
      animation: {
        "slide-up":       "slide-up 0.2s ease-out both",
        "fade-in-up":     "fade-in-up 0.28s ease-out both",
        "fade-in":        "fade-in 0.22s ease-out both",
        "scale-pop":      "scale-pop 0.2s ease-out both",
        "celebrate-pop":  "celebrate-pop 0.55s ease-out both",
        "sparkle-fade":   "sparkle-fade 0.65s ease-out both",
        "text-brighten":  "text-brighten 1.3s ease-in both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
