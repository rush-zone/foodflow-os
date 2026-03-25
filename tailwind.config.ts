import type { Config } from "tailwindcss";

// NOTE: In Tailwind v4, custom design tokens are defined via @theme in globals.css.
// This file is kept for IDE type support only — it is NOT loaded at build time.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
