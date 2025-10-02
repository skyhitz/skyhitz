import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui } from 'tamagui'
import { bodyFont, headingFont } from './fonts'
import { animations } from './animations'

export const config = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    body: bodyFont,
    heading: headingFont,
  },
  tokens: {
    ...defaultConfig.tokens,
    size: {
      ...defaultConfig.tokens.size,
      '7xl': 1280, // max-width for large screens
    },
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      gray8: '#27272a', // zinc-800
      gray10: '#a1a1aa', // zinc-400
    },
    dark: {
      ...defaultConfig.themes.dark,
      gray8: '#27272a', // zinc-800
      gray10: '#a1a1aa', // zinc-400
    },
  },
  settings:{
    ...defaultConfig.settings,
    onlyAllowShorthands: false
  }
})
