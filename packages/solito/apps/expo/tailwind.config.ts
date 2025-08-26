// @ts-nocheck - Disabling TypeScript checking for this file to avoid module resolution issues

// Use shared Tailwind config

/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    './App.tsx',
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/app/**/*.{js,jsx,ts,tsx}',
    // Exclude node_modules
    '!../../packages/app/**/node_modules/**',
  ],
  ...require('app/design/tailwind/tailwind-shared-config').default,
}
