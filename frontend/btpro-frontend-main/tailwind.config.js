/** @type {import('tailwindcss').Config} */
export default {
  // Scope Tailwind utilities to the refonte subtrees only (landing/auth/admin),
  // so the existing hand-written dashboard CSS is never affected.
  important: '.planner-site',
  corePlugins: {
    preflight: false, // app already has its own reset; scoped reset lives in styles/design.css
  },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#EEEEFE',
          100: '#DDDDFB',
          500: '#1100FF',
          600: '#4D1AFF',
          700: '#0D00CC',
        },
        // Design-system tokens (landing / auth / admin refonte)
        brand: { DEFAULT: '#1100FF', dark: '#0D00CC', deep: '#0A00A8' },
        ink: '#0B0B14',
        muted: '#5B5B6B',
        faint: '#8A8A99',
        hair: '#ECECF2',
        mist: '#F8F7FC',
      },
      borderRadius: { card: '14px' },
      boxShadow: {
        soft: '0 1px 2px rgba(11,11,20,0.04), 0 8px 24px -12px rgba(11,11,20,0.10)',
        lift: '0 1px 2px rgba(11,11,20,0.05), 0 24px 48px -20px rgba(17,0,255,0.18)',
        glow: '0 0 0 1px rgba(17,0,255,0.10), 0 30px 70px -28px rgba(17,0,255,0.30)',
      },
    },
  },
  plugins: [],
}
