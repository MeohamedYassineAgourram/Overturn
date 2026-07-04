/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        met: "#10b981", // emerald
        verify: "#f59e0b", // amber
        unmet: "#ef4444", // red
        accent: "#6366f1", // indigo accent
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
