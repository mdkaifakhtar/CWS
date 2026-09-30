/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A0B',
          light: '#1A1A1C',
          card: '#141416',
        },
        aqua: {
          50: '#E9F7F7',
          100: '#CFEEEE',
          300: '#7FCBCE',
          500: '#0E7C86',
          600: '#0B6870',
          700: '#08535A',
        },
        amber: {
          50: '#FFF6E6',
          300: '#FBCB74',
          500: '#F4A100',
          600: '#D98C00',
        },
        volt: {
          50: '#FBFFE8',
          100: '#F5FFC2',
          300: '#EBFF7A',
          400: '#E3FF45',
          500: '#D9F520',
          600: '#BFDA0E',
          700: '#93A80C',
        },
        mist: '#F7FAFB',
        slate: {
          650: '#43566B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(11, 27, 43, 0.06)',
        cardHover: '0 12px 28px rgba(11, 27, 43, 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        floatUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        ripple: 'ripple 2.4s cubic-bezier(0.22, 0.61, 0.36, 1) infinite',
        floatUp: 'floatUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
