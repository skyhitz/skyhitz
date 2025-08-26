import { secureStorage, STORAGE_KEYS } from '../storage'
import { User } from 'app/api/graphql/types'

/**
 * AuthService provides utilities for managing authentication state
 */
export class AuthService {
  /**
   * Restores user data from secure storage if available
   */
  static async restoreUserFromStorage(): Promise<User | null> {
    try {
      // Get stored user data
      const userDataJson = await secureStorage.getItem(STORAGE_KEYS.USER_DATA)
      if (!userDataJson) return null
      
      // Parse user data
      const userData = JSON.parse(userDataJson) as User
      
      // Verify token exists
      const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (!token) return null
      
      return userData
    } catch (error) {
      console.error('Failed to restore user from storage:', error)
      return null
    }
  }

  /**
   * Checks if the user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    return !!token
  }

  /**
   * Gets the authentication token from storage
   */
  static async getAuthToken(): Promise<string | null> {
    return secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  }
}
