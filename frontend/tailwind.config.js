/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica', 'Arial', 'sans-serif'],
      },

      colors: {
        primary: '#116dff',
        secondary: '#2b5672',
        accent: '#eea623',
        dark: '#141416',
        grey: '#8f8f8f',
      }
    },
  },
  plugins: [],
}
