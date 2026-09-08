import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Tractor Outdoor brand - primarily black & white. "navy" and
        // "yellow" are kept as class names (already used throughout the
        // app) but now resolve to the real brand colors instead of the
        // placeholder Glynt navy/yellow.
        navy: "#000000",
        yellow: "#F7D849", // Minion Yellow - accent, use sparingly
        teal: "#04CA95", // Caribbean Green - accent, use sparingly
        folly: "#FF005B", // accent, use sparingly
        hanpurple: "#4C22F2", // accent, use sparingly
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-montserrat)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
