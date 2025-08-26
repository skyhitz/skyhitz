import { SecureStorage } from 'app/utils/secure-storage'

// Define storage keys to ensure consistency
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token', // Must match what's used in Apollo client
  USER_DATA: 'user-data',
  PREFERENCES: 'user-preferences'
}

// Create a secureStorage interface with localStorage-like API
export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return SecureStorage.get(key)
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    return SecureStorage.save(key, value)
  },
  
  removeItem: async (key: string): Promise<void> => {
    return SecureStorage.clear(key)
  },
  
  clear: async (): Promise<void> => {
    // Clear all app storage keys
    await Promise.all([
      SecureStorage.clear(STORAGE_KEYS.AUTH_TOKEN),
      SecureStorage.clear(STORAGE_KEYS.USER_DATA),
      SecureStorage.clear(STORAGE_KEYS.PREFERENCES)
    ])
  }
}
