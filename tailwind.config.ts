// import type { Config } from "tailwindcss";

// export default {
//   content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {
// fontFamily: {
//   sans: [
//     '"Inter"',
//     "ui-sans-serif",
//     "system-ui",
//     "sans-serif",
//     '"Apple Color Emoji"',
//     '"Segoe UI Emoji"',
//     '"Segoe UI Symbol"',
//     '"Noto Color Emoji"',
//   ],
// },
// animation: {
//   'spin-slow': 'spin 3s linear infinite', // Define a custom animation with 15s duration
// },
//     },
//   },
//   plugins: [],
// } satisfies Config;
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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: [
          '"Inter"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite', // Define a custom animation with 15s duration
      },
    },
  },
  plugins: [],
};
export default config;
