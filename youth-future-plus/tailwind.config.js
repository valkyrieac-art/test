/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effafe',
          100: '#d9f2fb',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        mint: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
        },
      },
      boxShadow: {
        soft: '0 12px 40px rgba(2, 132, 199, 0.12)',
      },
    },
  },
  plugins: [],
};
