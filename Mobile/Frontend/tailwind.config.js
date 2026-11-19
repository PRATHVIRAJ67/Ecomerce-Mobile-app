/** URU design tokens — mirrors Shared/constants/tokens.ts and the website theme. */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0F6F2',
          100: '#E7EFEA',
          200: '#C7DACF',
          300: '#9CBFAB',
          400: '#5F9A7B',
          500: '#2F7D5A',
          600: '#2C6B52',
          700: '#174D38',
          800: '#103B2C',
          900: '#0A2A1D',
        },
        terracotta: {
          50: '#FDF6F1',
          100: '#FBEDE4',
          200: '#F4CFB6',
          300: '#EAA77F',
          500: '#D97745',
          600: '#B85E2F',
          700: '#97491F',
        },
        cream: { DEFAULT: '#FAF7F0', dark: '#F1EBDD' },
        sand: '#E9DFCA',
        ink: { DEFAULT: '#1D2722', soft: '#4A5650' },
        muted: '#6E7873',
        line: '#E6E0D2',
        success: { DEFAULT: '#2E7D4F', tint: '#E3F2E8' },
        warning: { DEFAULT: '#9A6416', tint: '#FCF3DC' },
        danger: { DEFAULT: '#B83A2E', tint: '#FBE7E4' },
      },
      fontFamily: {
        // Custom fonts are selected by family (not fontWeight) so Android renders the right face.
        display: ['Fraunces_600SemiBold'],
        'display-medium': ['Fraunces_500Medium'],
        'display-italic': ['Fraunces_500Medium_Italic'],
        sans: ['Inter_400Regular'],
        'ui-medium': ['Inter_500Medium'],
        'ui-semibold': ['Inter_600SemiBold'],
        'ui-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
