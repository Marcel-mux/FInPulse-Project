import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        foreground: "#F9FAFB",
        charcoal: {
          DEFAULT: "#0B0F19",
          950: "#0B0F19",
          900: "#111827",
          850: "#161F30",
          800: "#1F2937",
          700: "#374151",
          card: "rgba(17, 24, 39, 0.7)",
          glass: "rgba(22, 31, 48, 0.6)",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        indigo: {
          500: "#6366F1",
          600: "#4F46E5",
        },
        violet: {
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        crimson: {
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      boxShadow: {
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
        "glow-indigo": "0 0 25px -5px rgba(99, 102, 241, 0.35)",
        "glow-violet": "0 0 25px -5px rgba(139, 92, 246, 0.35)",
        "glow-crimson": "0 0 25px -5px rgba(239, 68, 68, 0.4)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-subtle": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
