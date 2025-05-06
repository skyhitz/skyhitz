import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { secureStorage, STORAGE_KEYS } from 'app/services/storage'

export type ThemeState = {
  isDark: boolean
  toggleTheme: () => void
  setDarkTheme: () => void
  setLightTheme: () => void
}

// Create a storage adapter that matches the interface Zustand expects
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await secureStorage.getItem(`${STORAGE_KEYS.PREFERENCES}:${name}`)
    return value
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await secureStorage.setItem(`${STORAGE_KEYS.PREFERENCES}:${name}`, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await secureStorage.removeItem(`${STORAGE_KEYS.PREFERENCES}:${name}`)
  },
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true, // Default to dark mode
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setDarkTheme: () => set({ isDark: true }),
      setLightTheme: () => set({ isDark: false }),
    }),
    {
      name: 'theme',
      storage: createJSONStorage(() => customStorage),
    }
  )
)
