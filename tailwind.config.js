/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#0a0f1e',
          card:    '#0f1629',
          border:  '#1e2d4a',
        }
      }
    }
  },
  plugins: []
}
