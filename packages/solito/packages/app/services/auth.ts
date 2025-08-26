import { client } from 'app/api/graphql/client'
import { SecureStorage } from 'app/utils/secure-storage'
import { User } from 'app/api/graphql/types'
import { secureStorage, STORAGE_KEYS } from 'app/services/storage'

export const AuthService = {
  /**
   * Checks if user is authenticated by looking for valid token
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await SecureStorage.get(STORAGE_KEYS.AUTH_TOKEN)
    return !!token
  },

  /**
   * Logs the user out by clearing their auth token
   */
  logout: async (): Promise<void> => {
    await SecureStorage.clear(STORAGE_KEYS.AUTH_TOKEN)
    // Force reset of Apollo cache to clear any user data
    client.resetStore()
  },

  /**
   * Attempts to restore user data from storage if available
   */
  restoreUserFromStorage: async (): Promise<User | null> => {
    try {
      // Check if we have a token
      const token = await SecureStorage.get(STORAGE_KEYS.AUTH_TOKEN)
      if (!token) {
        return null
      }

      // Load user data from secure storage
      const userData = await secureStorage.getItem(STORAGE_KEYS.USER_DATA)
      if (userData) {
        try {
          const user = JSON.parse(userData) as User
          return user
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError)
          // Invalid user data in storage - clear it
          await secureStorage.removeItem(STORAGE_KEYS.USER_DATA)
        }
      }

      return null
    } catch (error) {
      console.error('Error restoring auth:', error)
      // If there was an error, clear the auth data
      await SecureStorage.clear(STORAGE_KEYS.AUTH_TOKEN)
      await secureStorage.removeItem(STORAGE_KEYS.USER_DATA)
      return null
    }
  },

  /**
   * Stores auth token in secure storage
   */
  saveAuthToken: async (token: string): Promise<void> => {
    await SecureStorage.save(STORAGE_KEYS.AUTH_TOKEN, token)
  },
}
