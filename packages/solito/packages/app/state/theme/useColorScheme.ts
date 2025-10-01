'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useThemeStore } from './index'
import { Platform } from 'react-native'

/**
 * Cross-platform color scheme hook that works on both web and native
 * - On web: Uses direct DOM manipulation to avoid React state update errors
 * - On native: Uses NativeWind v5's built-in theme system
 */
export function useColorScheme() {
  // Track if we've already initialized the theme
  const initialized = useRef(false)
  
  // Get our Zustand theme state - this is the single source of truth
  const { isDark, setDarkTheme, setLightTheme } = useThemeStore()
  
  // Map isDark to colorScheme for compatibility
  const colorScheme = isDark ? 'dark' : 'light'
  
  // Web-only: Initial theme setup (runs once)
  useEffect(() => {
    // Skip if not on web
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    
    // Only run once
    if (initialized.current) return
    
    // Set the dark class and data-theme attribute directly
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.documentElement.dataset.theme = colorScheme
    
    // Mark as initialized
    initialized.current = true
  }, [])
  
  // Web-only: Update DOM whenever theme changes in Zustand
  useEffect(() => {
    // Skip if not on web
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    
    // Apply theme directly to the document
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    document.documentElement.dataset.theme = colorScheme
  }, [colorScheme, isDark])
  
  // Cross-platform toggle function
  const toggleColorScheme = useCallback(() => {
    // Update Zustand store (works on both platforms)
    if (isDark) {
      setLightTheme()
    } else {
      setDarkTheme()
    }
    
    // Platform-specific updates
    if (Platform.OS === 'web') {
      // Web: The useEffect above will update the DOM
      if (typeof document !== 'undefined') {
        const newTheme = isDark ? 'light' : 'dark'
        document.documentElement.dataset.theme = newTheme
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
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
    
    // Platform-specific updates
    if (Platform.OS === 'web') {
      // Web: Update the DOM directly
      if (typeof document !== 'undefined') {
        document.documentElement.dataset.theme = scheme
        if (scheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
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