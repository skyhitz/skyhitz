// Use shared Tailwind config


/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
  ],
  ...require('app/design/tailwind/tailwind-shared-config').default,
}
