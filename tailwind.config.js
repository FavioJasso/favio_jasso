/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF8800',
          light: '#FFAB40',
          dark: '#C66800'
        },
        secondary: {
          DEFAULT: '#FF9500',
          light: '#FFB740',
          dark: '#C76B00'
        },
        tertiary: {
          DEFAULT: '#FFAA00',
          light: '#FFC040',
          dark: '#C78300'
        }
      },

      boxShadow: {
        normal: '2.5px 2.5px 2.5px rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: []
}
