/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './index.ts', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /** Bleu marine — couleur primaire de l’app (CTA, titres, accents). */
        primary: {
          50: '#f0f4f9',
          100: '#d9e6f2',
          200: '#b3c9e5',
          300: '#8daad6',
          400: '#5c85b8',
          500: '#3b5f8f',
          600: '#2d4d76',
          700: '#1f3d5e',
          800: '#162e47',
          900: '#0f2235',
          950: '#081620',
        },
        /** Ambre — couleur secondaire (boutons alternatifs, accents chaleureux, graphiques). */
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
      },
    },
  },
  plugins: [],
};
