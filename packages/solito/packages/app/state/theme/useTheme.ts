'use client'
import { useThemeStore } from './index'
import { useColorScheme as useNativeWindColorScheme } from 'nativewind'
import { vars } from 'nativewind'

// Define CSS variables for themes
export const themes = {
  light: vars({
    // Base colors
    '--bg-color': '#FFFFFF',
    '--surface-color': '#F5F5F5',
    '--text-color': '#000000',
    '--text-secondary-color': '#555555',
    '--primary-color': '#0097A7',
    '--secondary-color': '#5C6BC0',
    '--accent-color': '#0097A7',
    
    // UI elements
    '--border-color': '#E0E0E0',
    '--card-bg-color': '#FFFFFF',
    '--button-bg-color': '#F5F5F5',
    '--button-text-color': '#000000',
    '--invest-button-bg-color': '#0097A7',
    '--invest-button-text-color': '#FFFFFF',
    '--description-bg-color': '#F9F9F9',
    '--bg-secondary-color': '#F9F9F9',
  }),
  dark: vars({
    // Base colors
    '--bg-color': '#000000',
    '--surface-color': '#000000',
    '--text-color': '#FFFFFF',
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
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativeWindColorScheme()
  // Get theme state from our Zustand store
  const { isDark, setDarkTheme, setLightTheme, toggleTheme: zustandToggleTheme } = useThemeStore()
  // No longer using ThemeContext, keeping the implementation simple
  
  // Apply the appropriate theme CSS variables
  const theme = isDark ? themes.dark : themes.light

  return {
    isDark,
    // Toggle both NativeWind and our store
    toggleTheme: () => {
      zustandToggleTheme()
      toggleColorScheme()
    },
    // Set dark theme in both systems
    setDarkTheme: () => {
      setDarkTheme()
      setColorScheme('dark')
    },
    // Set light theme in both systems
    setLightTheme: () => {
      setLightTheme()
      setColorScheme('light')
    },
    // Expose NativeWind color scheme values
    colorScheme,
    setColorScheme,
    // Return the current theme object with CSS variables
    theme,
  }
}
