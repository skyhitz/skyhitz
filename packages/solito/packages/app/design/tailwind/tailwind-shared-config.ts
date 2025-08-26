// Shared Tailwind config for both Next.js and Expo in Solito (TypeScript)
import { theme } from './theme'
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    // App-specific patterns
    './app/**/*.{js,jsx,ts,tsx}',
    './App.tsx',

    // Specific package directories that contain Tailwind classes
    '../../packages/app/features/**/*.{js,jsx,ts,tsx}',
    '../../packages/app/design/**/*.{js,jsx,ts,tsx}',
    '../../packages/app/ui/**/*.{js,jsx,ts,tsx}',

    // Explicitly exclude node_modules
    '!../../packages/**/node_modules/**',
  ],
  presets: [require('nativewind/preset')],
  important: 'html',
  theme: {
    ...theme,
  },
  plugins: [],
}

export default config
