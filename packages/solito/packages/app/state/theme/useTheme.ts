'use client'
import { useThemeStore } from './index'

export type ThemeColors = {
  background: string
  surface: string
  text: string
  textSecondary: string
  primary: string
  secondary: string
  accent: string
  border: string
  cardBackground: string
  buttonBackground: string
  buttonText: string
  investButtonBackground: string
  investButtonText: string
  descriptionBackground: string
}

// Colors matching Skyhitz's existing dark theme
const darkColors: ThemeColors = {
  background: '#000000', // Pure black background as seen in screenshot
  surface: '#000000', // Also black for surface elements
  text: '#FFFFFF',
  textSecondary: '#6B7280', // Gray color from the screenshot
  primary: '#19aafe', // Skyhitz blue from screenshot
  secondary: '#6B7280',
  accent: '#19aafe',
  border: '#1A1A1A', // Very subtle border color
  cardBackground: '#000000', // Keeping cards black
  buttonBackground: '#19aafe', // Blue buttons
  buttonText: '#FFFFFF',
  investButtonBackground: '#FFFFFF',
  investButtonText: '#000000',
  descriptionBackground: '#000000'
}

// Light theme to contrast with dark theme
const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textSecondary: '#555555',
  primary: '#0097A7', // Darker blue for light theme
  secondary: '#5C6BC0',
  accent: '#0097A7',
  border: '#E0E0E0',
  cardBackground: '#FFFFFF',
  buttonBackground: '#F5F5F5',
  buttonText: '#000000',
  investButtonBackground: '#0097A7',
  investButtonText: '#FFFFFF',
  descriptionBackground: '#F9F9F9'
}

export function useTheme() {
  const { isDark, toggleTheme, setDarkTheme, setLightTheme } = useThemeStore()
  
  return {
    isDark,
    toggleTheme,
    setDarkTheme,
    setLightTheme,
    colors: isDark ? darkColors : lightColors,
  }
}
