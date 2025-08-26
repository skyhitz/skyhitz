'use client'

import * as React from 'react'
import { useColorScheme } from 'app/state/theme/useColorScheme'
import { themes } from 'app/state/theme/useTheme'
import { Platform } from 'react-native'
import { View } from 'react-native'

interface Props {
  children: React.ReactNode
}

/**
 * ThemeProvider applies theme variables to the entire app.
 * It uses a View as a wrapper with minimal styling to avoid layout issues.
 */
export function ThemeProvider({ children }: Props) {
  const { colorScheme } = useColorScheme()
  const theme = themes[colorScheme || 'light']

  if (Platform.OS === 'web') {
    return <body style={theme}>{children}</body>
  }
  return (
    <View className="flex-1" style={theme}>
      {children}
    </View>
  )
}
