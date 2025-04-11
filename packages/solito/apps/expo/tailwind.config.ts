// @ts-nocheck - Disabling TypeScript checking for this file to avoid module resolution issues

const { theme } = require('app/design/tailwind/theme')

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./App.tsx', '../../packages/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    ...theme,
  },
  plugins: [],
}
