/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "#f3f5f4",
        surface: "#ffffff",
        ink: "#1c2b27",
        muted: "#6b7c76",
        line: "#e7ecea",
        accent: {
          DEFAULT: "#4e9c81", // sage green
          soft: "#e8f3ee",
          ring: "#c3e0d3",
          hover: "#3f8168",
        },
        teal: {
          DEFAULT: "#2f4a47", // deep teal for feature/hero cards
          light: "#3a5a56",
        },
        met: "#16a34a",
        verify: "#d97706",
        unmet: "#dc2626",
      },
      boxShadow: {
        card: "0 1px 3px rgba(20,40,36,0.06), 0 1px 2px rgba(20,40,36,0.04)",
        cardhover: "0 6px 20px rgba(20,40,36,0.09)",
        pop: "0 12px 40px rgba(20,40,36,0.16)",
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
