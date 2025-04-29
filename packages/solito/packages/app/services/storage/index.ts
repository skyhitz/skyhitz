import { Platform } from 'react-native'

/**
 * Cross-platform secure storage abstraction
 * 
 * This is a placeholder implementation that will be replaced with:
 * - Web: localStorage with encryption
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences
 */

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
}

// Simple placeholder implementation
class StorageService {
  private storage: Record<string, string> = {}

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value)
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    } else {
      // For React Native, we're using in-memory storage for now
      // TODO: Replace with SecureStore or similar
      this.storage[key] = value
    }
  }

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key)
      } catch (error) {
        console.error('Error reading from localStorage:', error)
        return null
      }
    } else {
      // For React Native, we're using in-memory storage for now
      return this.storage[key] || null
    }
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.error('Error removing from localStorage:', error)
      }
    } else {
      delete this.storage[key]
    }
  }

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        localStorage.clear()
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      }
    } else {
      this.storage = {}
    }
  }
}

export const secureStorage = new StorageService()
