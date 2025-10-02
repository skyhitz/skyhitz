'use client'

import { useCallback, useEffect } from 'react'
import { useThemeStore } from './index'
import { Platform } from 'react-native'

/**
 * Cross-platform color scheme hook that works on both web and native with Tamagui
 * - On web: Uses direct DOM manipulation to set data attributes
 * - On native: Uses Tamagui's theme system
 */
export function useColorScheme() {
  // Get our Zustand theme state - this is the single source of truth
  const { isDark, setDarkTheme, setLightTheme } = useThemeStore()
  
  // Map isDark to colorScheme for compatibility
  const colorScheme = isDark ? 'dark' : 'light'
  
  // Web-only: Update DOM whenever theme changes in Zustand
  useEffect(() => {
    // Skip if not on web
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    
    // Apply theme directly to the document
    document.documentElement.dataset.theme = colorScheme
    
    // Also set class for compatibility
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [colorScheme, isDark])
  
  // Cross-platform toggle function
  const toggleColorScheme = useCallback(() => {
    // Update Zustand store (works on both platforms)
    if (isDark) {
      setLightTheme()
    } else {
      setDarkTheme()
    }
  }, [isDark, setDarkTheme, setLightTheme])
  
  // Cross-platform function to set a specific theme
  const setColorScheme = useCallback((scheme: 'light' | 'dark') => {
    // Update Zustand store (works on both platforms)
    if (scheme === 'dark') {
      setDarkTheme()
    } else {
      setLightTheme()
    }
  }, [setDarkTheme, setLightTheme])
  
  return {
    // Return consistent interface for compatibility
    colorScheme,
    isDark,
    toggleColorScheme,
    setColorScheme
  }
}
