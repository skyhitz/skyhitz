// Shared Tailwind config for both Next.js and Expo in Solito (TypeScript)
import { theme } from './theme'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../../packages/**/*.{js,jsx,ts,tsx}',
    './App.tsx',
  ],
  presets: [require('nativewind/preset')],
  important: 'html',
  theme: {
    ...theme,
  },
  plugins: [],
}

export default config
