'use client'

import { useColorScheme as useNativeWindColorScheme } from 'nativewind'
import { useEffect } from 'react'
import { useThemeStore } from './index'

/**
 * Custom hook that integrates NativeWind's useColorScheme with our Zustand theme store.
 * This provides bidirectional sync between NativeWind's color scheme and our app's theme state.
 */
export function useColorScheme() {
  // Get theme state and actions from our Zustand store
  const { isDark, setDarkTheme, setLightTheme } = useThemeStore()
  
  // Get NativeWind's color scheme controller
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativeWindColorScheme()
  
  // Sync our Zustand theme state to NativeWind's color scheme
  useEffect(() => {
    if (isDark && colorScheme !== 'dark') {
      setColorScheme('dark')
    } else if (!isDark && colorScheme !== 'light') {
      setColorScheme('light')
    }
  }, [isDark, colorScheme, setColorScheme])

  // Enhanced toggleTheme that syncs with NativeWind
  const toggleTheme = () => {
    toggleColorScheme()
    // NativeWind's toggleColorScheme is synchronous, so we can check the new value immediately
    if (colorScheme === 'dark') {
      setLightTheme()
    } else {
      setDarkTheme()
    }
  }

  return {
    // Re-export the NativeWind functions and values
    colorScheme,
    setColorScheme: (scheme: 'light' | 'dark') => {
      setColorScheme(scheme)
      if (scheme === 'dark') {
        setDarkTheme()
      } else {
        setLightTheme()
      }
    },
    // Provide our enhanced toggle function
    toggleColorScheme: toggleTheme,
    // Also return our Zustand theme state for convenience
    isDark,
  }
}
