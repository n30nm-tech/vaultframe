import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06070a",
        foreground: "#f5f7fa",
        surface: "#0f1117",
        "surface-muted": "#151925",
        border: "#242938",
        accent: "#7dd3fc",
        "accent-strong": "#38bdf8",
        success: "#34d399",
      },
      boxShadow: {
        panel: "0 24px 60px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(56, 189, 248, 0.18), transparent 34%), radial-gradient(circle at 80% 20%, rgba(125, 211, 252, 0.14), transparent 24%)",
      },
    },
  },
  plugins: [],
};

export default config;
