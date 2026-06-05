/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#EEEEFE',
          100: '#DDDDFB',
          500: '#1100FF',
          600: '#4D1AFF',
          700: '#0D00CC',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
