/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#001F3F',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#102A43',
          900: '#001F3F',
          light: '#003D7A',
          dark: '#000A1A',
        },
        orange: {
          DEFAULT: '#FF6B35',
          50: '#FFF7ED',
          100: '#FFE0CC',
          200: '#FFC499',
          300: '#FFA766',
          400: '#FFA500',
          500: '#FF6B35',
          600: '#E55A24',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
          pale: '#FFF1E8',
        },
        gold: {
          DEFAULT: '#FFC107',
          light: '#FFD54F',
          dark: '#FFA000',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 31, 63, 0.08)',
        'card-hover': '0 12px 30px -4px rgba(0, 31, 63, 0.16)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.35)',
      },
    },
  },
  plugins: [],
}
