import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'selector',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-wrapper-dark': 'radial-gradient(circle at bottom left, #000000, #010101 20%, #030303 40%, #080808 60%, #121212 80%, #1a1a1a 100%, #252525)',
        'gradient-wrapper': 'radial-gradient(circle at -20% 120%, #ffffff, #f6f6f6, #eeeeee, #e5e5e5, #dcdcdc, #d4d4d4, #cbcbcb, #c3c3c3)',
      },
      fontFamily: {
        'whiterabt': 'var(--font-whiterabt)',
      },
      colors: {
        'darktext': '#080808',
        'lighttext': '#e8e8e8',
        'main': '#8B53FB',
      },
    },
  },
  plugins: [],
};
export default config;
