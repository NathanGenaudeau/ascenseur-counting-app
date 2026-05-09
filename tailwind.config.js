/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './index.ts', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /** Fonds profonds — noir Zaun / Jinx */
        void: {
          950: '#000000',
          900: '#050309',
          850: '#090710',
          800: '#0f0c18',
        },
        /** Surfaces type « panneau » — caverne de Jinx */
        panel: {
          DEFAULT: '#100d1a',
          raised: '#181426',
          inset: '#08060e',
        },
        /** Bordures fines sur fond sombre */
        hairline: '#3a1f38',
        /** Accent primaire — rose Jinx / bombe explosive */
        star: {
          DEFAULT: '#ff2d78',
          bright: '#ff6ba0',
          dim: '#c2185b',
          deep: '#8c0044',
        },
        /** Accent secondaire — cristal Hextech / mint */
        nova: {
          DEFAULT: '#3dffc0',
          muted: '#00c896',
          dim: '#008762',
        },
        /** Texte et neutres légèrement violacés */
        cosmic: {
          50: '#ffffff',
          100: '#f0f0fb',
          200: '#d0d0ec',
          300: '#9898c0',
          400: '#6a6a90',
          500: '#464660',
          600: '#2c2c42',
          700: '#18182a',
        },
      },
      fontFamily: {
        sans: ['Rajdhani_400Regular'],
        'sans-medium': ['Rajdhani_500Medium'],
        'sans-semibold': ['Rajdhani_600SemiBold'],
        'sans-bold': ['Rajdhani_700Bold'],
        display: ['Bangers_400Regular'],
        'display-bold': ['Bangers_400Regular'],
      },
    },
  },
  plugins: [],
};
