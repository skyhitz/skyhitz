'use client'
import { useThemeStore } from './index'
import { useColorScheme as useNativeWindColorScheme } from 'nativewind'
import { vars } from 'nativewind'
import { useEffect, useCallback } from 'react'

// Define CSS variables for themes
export const themes = {
  light: vars({
    // Base colors
    '--bg-color': '#FFFFFF',
    '--surface-color': '#F5F5F5',
    '--text-color': 'rgb(75 85 99)',
    '--text-secondary-color': '#555555',
    '--primary-color': '#19aafe',
    '--secondary-color': '#5C6BC0',
    '--accent-color': '#19aafe',

    // UI elements
    '--border-color': '#E0E0E0',
    '--card-bg-color': '#FFFFFF',
    '--button-bg-color': '#F5F5F5',
    '--button-text-color': '#000000',
    '--invest-button-bg-color': '#19aafe',
    '--invest-button-text-color': '#FFFFFF',
    '--description-bg-color': '#F9F9F9',
    '--bg-secondary-color': '#F9F9F9',
  }),
  dark: vars({
    // Base colors
    '--bg-color': '#000000',
    '--surface-color': '#000000',
    '--text-color': 'rgb(255 255 255)',
    '--text-secondary-color': '#6B7280',
    '--primary-color': '#19aafe',
    '--secondary-color': '#6B7280',
    '--accent-color': '#19aafe',

    // UI elements
    '--border-color': '#1A1A1A',
    '--card-bg-color': '#000000',
    '--button-bg-color': '#19aafe',
    '--button-text-color': '#FFFFFF',
    '--invest-button-bg-color': '#FFFFFF',
    '--invest-button-text-color': '#000000',
    '--description-bg-color': '#000000',
    '--bg-secondary-color': '#1A1A1A',
  }),
}

// We're now using CSS variables for all theme colors defined in the themes object above

export function useTheme() {
  // Use NativeWind's colorScheme hook directly
  const { colorScheme, setColorScheme, toggleColorScheme } =
    useNativeWindColorScheme()
  // Get theme state from our Zustand store
  const {
    isDark,
    setDarkTheme,
    setLightTheme,
    toggleTheme: zustandToggleTheme,
  } = useThemeStore()
  // No longer using ThemeContext, keeping the implementation simple

  // Apply the appropriate theme CSS variables
  const theme = isDark ? themes.dark : themes.light

  // A safe wrapper to prevent server-side rendering issues with state updates
  const safelyUpdateColorScheme = useCallback((updateFn: () => void) => {
    // Skip updates during server-side rendering
    if (typeof window === 'undefined') return;
    
    // Delay update to ensure component is mounted
    setTimeout(updateFn, 0);
  }, []);
  
  // Memoize theme toggle functions to prevent recreating them every render
  const toggleTheme = useCallback(() => {
    // Update our Zustand store first (this is safe and doesn't cause React updates directly)
    zustandToggleTheme()
    // Safely update NativeWind's color scheme after component is mounted
    safelyUpdateColorScheme(() => toggleColorScheme())
  }, [zustandToggleTheme, toggleColorScheme, safelyUpdateColorScheme])

  const setDarkThemeFunc = useCallback(() => {
    setDarkTheme()
    safelyUpdateColorScheme(() => setColorScheme('dark'))
  }, [setDarkTheme, setColorScheme, safelyUpdateColorScheme])

  const setLightThemeFunc = useCallback(() => {
    setLightTheme()
    safelyUpdateColorScheme(() => setColorScheme('light'))
  }, [setLightTheme, setColorScheme, safelyUpdateColorScheme])

  // Sync NativeWind color scheme with our theme store
  useEffect(() => {
    // Check for browser environment before making state updates
    if (typeof window === 'undefined') return

    // Use a flag to ensure we're safely mounted before updating
    let isMounted = true
    // Delay initial state update to allow component to fully mount
    const timer = setTimeout(() => {
      if (isMounted) {
        if (isDark && colorScheme !== 'dark') {
          setColorScheme('dark')
        } else if (!isDark && colorScheme !== 'light') {
          setColorScheme('light')
        }
      }
    }, 0)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [isDark, colorScheme, setColorScheme])

  return {
    isDark,
    toggleTheme,
    setDarkTheme: setDarkThemeFunc,
    setLightTheme: setLightThemeFunc,
    // Expose NativeWind color scheme values
    colorScheme,
    setColorScheme,
    // Return the current theme object with CSS variables
    theme,
  }
}
