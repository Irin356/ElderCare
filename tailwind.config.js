/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        elder: {
          teal: {
            50: '#F0FDFA',
            100: '#CCFBF1',
            200: '#99F6E4',
            300: '#5EEAD4',
            400: '#2DD4BF',
            500: '#14B8A6',
            600: '#0D9488',
            700: '#0F766E',
            800: '#115E59',
            900: '#134E4A',
          },
          warm: {
            50: '#FDFBF7',
            100: '#F7F3EB',
            200: '#EFE6D5',
            800: '#4A3E3D',
            900: '#2C2523',
          },
          accent: {
            blue: '#0284C7',
            amber: '#D97706',
            rose: '#E11D48',
            emerald: '#059669',
          }
        },
      },
      fontSize: {
        'accessible-sm': ['1.05rem', { lineHeight: '1.6' }],
        'accessible-base': ['1.2rem', { lineHeight: '1.7' }],
        'accessible-lg': ['1.35rem', { lineHeight: '1.75' }],
        'accessible-xl': ['1.6rem', { lineHeight: '1.8' }],
        'accessible-2xl': ['2rem', { lineHeight: '1.4' }],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(15, 118, 110, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'elevated': '0 12px 32px -4px rgba(15, 118, 110, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
