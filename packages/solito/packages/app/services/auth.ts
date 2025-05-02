import { client } from 'app/api/graphql/client'
import { SecureStorage } from 'app/utils/secure-storage'
import { AUTHENTICATED_USER } from 'app/api/graphql/operations'
import { User } from 'app/api/graphql/types'
import { ApolloQueryResult } from '@apollo/client'

interface AuthenticatedUserResponse {
  authenticatedUser: User
}

export const AuthService = {
  /**
   * Checks if user is authenticated by looking for valid token
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await SecureStorage.get('auth-token')
    return !!token
  },

  /**
   * Logs the user out by clearing their auth token
   */
  logout: async (): Promise<void> => {
    await SecureStorage.clear('auth-token')
    // Force reset of Apollo cache to clear any user data
    client.resetStore()
  },

  /**
   * Attempts to restore user data from storage token
   * if a valid token exists in storage
   */
  restoreUserFromStorage: async (): Promise<User | null> => {
    try {
      // Check if we have a token
      const token = await SecureStorage.get('auth-token')
      if (!token) {
        return null
      }

      // If we have a token, try to get the authenticated user
      const { data } = await client.query<AuthenticatedUserResponse>({
        query: AUTHENTICATED_USER,
        fetchPolicy: 'network-only' // Always get fresh data
      })

      if (data?.authenticatedUser) {
        return data.authenticatedUser
      }

      return null
    } catch (error) {
      console.error('Error restoring auth:', error)
      // If there was an error, clear the token since it might be invalid
      await SecureStorage.clear('auth-token')
      return null
    }
  },

  /**
   * Stores auth token in secure storage
   */
  saveAuthToken: async (token: string): Promise<void> => {
    await SecureStorage.save('auth-token', token)
  }
}
