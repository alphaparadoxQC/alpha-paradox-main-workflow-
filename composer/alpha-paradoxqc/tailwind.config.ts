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
        "jet-black": "#050505",
        "royal-amethyst": "#3B0A6B",
        "amethyst-deep": "#250545",
        "amethyst-vivid": "#6B1B9A",
        "amethyst-light": "#C77DFF",
        "electric-cyan": "#00E5FF",
        "cyan-bright": "#33EFFF",
        "cyan-glow": "#80F5FF",
      },
      fontFamily: {
        serif: [
          "Didot",
          "Bodoni MT",
          "Cinzel",
          "Playfair Display",
          "Georgia",
          "Cambria",
          "serif",
        ],
        sans: [
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SF Mono",
          "Fira Code",
          "monospace",
        ],
        cursive: [
          "Dancing Script",
          "Caveat",
          "Snell Roundhand",
          "Brush Script MT",
          "Apple Chancery",
          "cursive",
        ],
      },
      backgroundImage: {
        "radial-hero": "radial-gradient(circle at 50% 50%, rgba(59, 10, 107, 0.35) 0%, rgba(0, 229, 255, 0.08) 50%, rgba(5, 5, 5, 0) 75%)",
        "radial-amethyst": "radial-gradient(circle at 50% 40%, rgba(59, 10, 107, 0.45) 0%, rgba(5, 5, 5, 0) 65%)",
        "radial-cyan": "radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.2) 0%, rgba(5, 5, 5, 0) 70%)",
        "accent-gradient": "linear-gradient(135deg, #3B0A6B 0%, #7B1FA2 50%, #00E5FF 100%)",
        "amethyst-cyan": "linear-gradient(135deg, #3B0A6B 0%, #00E5FF 100%)",
        "cyan-amethyst": "linear-gradient(135deg, #00E5FF 0%, #7B1FA2 60%, #3B0A6B 100%)",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
      },
      animation: {
        "pulse-glow": "pulseGlow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

