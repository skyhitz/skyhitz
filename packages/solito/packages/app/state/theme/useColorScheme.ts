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
    // Check for browser environment before making state updates
    if (typeof window === 'undefined') return;
    
    // Use a flag to ensure we're safely mounted before updating
    let isMounted = true;
    
    // Delay initial state update to ensure component is fully mounted
    const timer = setTimeout(() => {
      if (isMounted) {
        if (isDark && colorScheme !== 'dark') {
          setColorScheme('dark')
        } else if (!isDark && colorScheme !== 'light') {
          setColorScheme('light')
        }
      }
    }, 0);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isDark, colorScheme, setColorScheme])

  // Safe wrapper to prevent server-side rendering issues
  const safelyExecute = (fn: () => void) => {
    if (typeof window === 'undefined') return;
    setTimeout(fn, 0);
  };
  
  // Enhanced toggleTheme that syncs with NativeWind
  const toggleTheme = () => {
    // Skip theme toggling on server
    if (typeof window === 'undefined') return;
    
    // Update our Zustand store (safe operation)
    if (isDark) {
      setLightTheme();
    } else {
      setDarkTheme();
    }
    
    // Safely toggle the NativeWind color scheme
    safelyExecute(() => toggleColorScheme());
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
