'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useThemeStore } from './index'
import { Platform } from 'react-native'
// Import NativeWind's colorScheme hook but only use it on native platforms
import { useColorScheme as useNativeWindColorScheme } from 'nativewind'

/**
 * Cross-platform color scheme hook that works on both web and native
 * - On web: Uses direct DOM manipulation to avoid React state update errors
 * - On native: Uses NativeWind's hook but with error prevention
 */
export function useColorScheme() {
  // Track if we've already initialized the theme
  const initialized = useRef(false)
  
  // Get our Zustand theme state - this is the single source of truth
  const { isDark, setDarkTheme, setLightTheme } = useThemeStore()
  
  // Map isDark to colorScheme for compatibility
  const colorScheme = isDark ? 'dark' : 'light'
  
  // For native support only - get NativeWind's hook
  const nativeWindHook = useNativeWindColorScheme()
  
  // Web-only: Initial theme setup (runs once)
  useEffect(() => {
    // Skip if not on web
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    
    // Only run once
    if (initialized.current) return
    
    // Set the data-theme attribute directly
    document.documentElement.dataset.theme = colorScheme
    
    // Mark as initialized
    initialized.current = true
  }, [])
  
  // Web-only: Update DOM whenever theme changes in Zustand
  useEffect(() => {
    // Skip if not on web
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    
    // Apply theme directly to the document
    document.documentElement.dataset.theme = colorScheme
  }, [colorScheme])
  
  // Native-only: Update NativeWind's colorScheme but only on initial mount
  useEffect(() => {
    // Skip if not on native
    if (Platform.OS === 'web' || initialized.current) return
    
    try {
      // Update NativeWind on native platforms (just once)
      nativeWindHook.setColorScheme(colorScheme)
      initialized.current = true
    } catch (e) {
      console.warn('Failed to set native color scheme:', e)
    }
  }, [colorScheme, nativeWindHook])
  
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
        document.documentElement.dataset.theme = isDark ? 'light' : 'dark'
      }
    } else {
      // Native: Safely update NativeWind
      try {
        // Use setTimeout to avoid React state update errors
        setTimeout(() => {
          nativeWindHook.toggleColorScheme()
        }, 0)
      } catch (e) {
        console.warn('Failed to toggle native color scheme:', e)
      }
    }
  }, [isDark, setDarkTheme, setLightTheme, nativeWindHook])
  
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
      }
    } else {
      // Native: Safely update NativeWind
      try {
        // Use setTimeout to avoid React state update errors during navigation
        setTimeout(() => {
          nativeWindHook.setColorScheme(scheme)
        }, 0)
      } catch (e) {
        console.warn('Failed to set native color scheme:', e)
      }
    }
    
  }, [setDarkTheme, setLightTheme, nativeWindHook])
  
  return {
    // Return consistent interface for compatibility
    colorScheme,
    isDark,
    toggleColorScheme,
    setColorScheme
  }
}
