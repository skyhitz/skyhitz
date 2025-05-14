'use client'
import { useColorScheme } from './useColorScheme'
import { vars } from 'nativewind'

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
    '--button-bg-color': '#19aafe',
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
    '--text-color': 'rgb(179, 186, 197)',
    '--text-secondary-color': 'rgb(217, 220, 226)',
    '--primary-color': '#19aafe',
    '--secondary-color': '#6B7280',
    '--accent-color': '#19aafe',

    // UI elements
    '--border-color': '#1A1A1A',
    '--card-bg-color': '#000000',
    '--button-bg-color': '#19aafe',
    '--button-text-color': '#FFFFFF',
    '--invest-button-bg-color': '#19aafe',
    '--invest-button-text-color': '#FFFFFF',
    '--description-bg-color': '#000000',
    '--bg-secondary-color': '#1A1A1A',
  }),
}

/**
 * Simple theme hook that uses our custom useColorScheme which bypasses NativeWind's React state updates
 */
export function useTheme() {
  // Use our custom color scheme hook
  const { colorScheme, isDark, toggleColorScheme, setColorScheme } =
    useColorScheme()

  // Get the appropriate theme CSS variables
  const theme = isDark ? themes.dark : themes.light

  return {
    // Our custom implementation exposes everything we need
    isDark,
    colorScheme,
    // Alias functions for backward compatibility
    toggleTheme: toggleColorScheme,
    setDarkTheme: () => setColorScheme('dark'),
    setLightTheme: () => setColorScheme('light'),
    setColorScheme,
    // Return the theme CSS variables
    theme,
  }
}
