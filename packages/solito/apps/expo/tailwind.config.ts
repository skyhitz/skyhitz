// @ts-nocheck - Disabling TypeScript checking for this file to avoid module resolution issues

// Use shared Tailwind config

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./App.tsx', '../../packages/**/*.{js,jsx,ts,tsx}'],
  ...require('app/design/tailwind/tailwind-shared-config').default,
}
