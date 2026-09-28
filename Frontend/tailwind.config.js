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
          DEFAULT: "#005F55",
          dark: "#00201C",
          light: "#98F3E3",
        },
        secondary: {
          DEFAULT: "#007D70",
          dark: "#005F55",
        },
        neutral: {
          dark: "#181D1B",
          gray: "#6E7976",
          light: "#F6FAF8",
          border: "#DFE3E1",
        },
      },
    },
  },
  plugins: [],
};
