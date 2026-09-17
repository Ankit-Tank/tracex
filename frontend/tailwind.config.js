/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        bgSubtle: "var(--bg-subtle)",
        bgMuted: "var(--bg-muted)",
        border: "var(--border)",
        borderStrong: "var(--border-strong)",
        text: "var(--text)",
        textDim: "var(--text-dim)",
        textFaint: "var(--text-faint)",
        accent: "var(--accent)",
        accentHover: "var(--accent-hover)",
        accentSoft: "var(--accent-soft)",
        accentBorder: "var(--accent-border)",
        riskHigh: "var(--risk-high)",
        riskHighBg: "var(--risk-high-bg)",
        riskMed: "var(--risk-med)",
        riskMedBg: "var(--risk-med-bg)",
        riskLow: "var(--risk-low)",
        riskLowBg: "var(--risk-low-bg)",
        urgentBg: "var(--urgent-bg)",
        urgentBorder: "var(--urgent-border)",
        urgentText: "var(--urgent-text)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
