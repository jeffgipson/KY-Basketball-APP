/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          50: '#E8EBF0',
          100: '#C5CDD8',
          200: '#8FA1B8',
          300: '#5A7598',
          400: '#2E4D78',
          500: '#0A1628',
          600: '#081220',
          700: '#060E18',
          800: '#040A10',
          900: '#020508',
        },
        gold: {
          DEFAULT: '#C9993A',
          50: '#FBF4E4',
          100: '#F5E3BB',
          200: '#EDD08A',
          300: '#E4BC59',
          400: '#D9A842',
          500: '#C9993A',
          600: '#A87B2E',
          700: '#875E22',
          800: '#664216',
          900: '#45270A',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Source Sans 3', 'Calibri', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201, 153, 58, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(201, 153, 58, 0)' },
        },
      },
    },
  },
  plugins: [],
}
