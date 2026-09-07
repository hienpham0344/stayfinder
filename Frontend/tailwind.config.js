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
          DEFAULT: "#FF385C",
          dark: "#E00B41",
          light: "#FF6682",
        },
        secondary: {
          DEFAULT: "#008489",
          dark: "#00666B",
        },
        neutral: {
          dark: "#222222",
          gray: "#717171",
          light: "#F7F7F7",
          border: "#DDDDDD",
        },
      },
    },
  },
  plugins: [],
};
