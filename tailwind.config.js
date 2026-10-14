/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        card: '0 16px 40px -28px rgba(15, 23, 42, 0.55)',
      },
    },
  },
  plugins: [],
}
