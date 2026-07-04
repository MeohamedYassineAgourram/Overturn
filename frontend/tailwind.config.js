/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#f4f5f7",
        surface: "#ffffff",
        ink: "#181a1f",
        muted: "#6b7280",
        line: "#eceef1",
        accent: {
          DEFAULT: "#f15b2a",
          soft: "#fdeee7",
          ring: "#f6d3c3",
          hover: "#e04d1c",
        },
        met: "#16a34a",
        verify: "#d97706",
        unmet: "#dc2626",
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        cardhover: "0 4px 14px rgba(16,24,40,0.08)",
        pop: "0 12px 40px rgba(16,24,40,0.16)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "drawer-in": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.28s ease-out both",
        "drawer-in": "drawer-in 0.24s ease-out both",
      },
    },
  },
  plugins: [],
};
