import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#052132",
        yellow: "#F0F532",
        teal: "#A8DCD0",
      },
    },
  },
  plugins: [],
};
export default config;
