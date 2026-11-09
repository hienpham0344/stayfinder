/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F1E5C6",
          dark: "#342D24",
          light: "#F1E5C6",
        },
        secondary: {
          DEFAULT: "#F1E5C6",
          dark: "#F1E5C6",
        },
        neutral: {
          dark: "#F5F0E8",
          gray: "#B3A79E",
          light: "#1D191A",
          border: "#42383A",
        },
      },
    },
  },
  plugins: [],
};
