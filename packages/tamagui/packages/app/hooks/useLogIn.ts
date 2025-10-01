import { useUserStore } from 'app/state/user'
import { User } from 'app/api/graphql/types'
import { secureStorage, STORAGE_KEYS } from 'app/services/storage'
import { useCallback } from 'react'
import { useAuthNavigation, useAppNavigation } from './navigation'
import { ROUTES } from 'app/constants/routes'

export const useLogIn = () => {
  const { setUser } = useUserStore()
  const { goToMainAppAfterAuth } = useAuthNavigation()

  return useCallback(
    async (user: User) => {
      // Set user in Zustand store
      setUser(user)

      // Save JWT token to secure storage
      if (user.jwt) {
        await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, user.jwt)
      } else {
        console.warn('No JWT token found in user object during login')
      }

      // Save user data for offline access
      await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))

      // Navigate to search page after successful login using our custom hook
      goToMainAppAfterAuth()
    },
    [setUser, goToMainAppAfterAuth]
  )
}

export const useLogOut = () => {
  const { setUser } = useUserStore()
  const { navigateTo } = useAppNavigation()

  return useCallback(async () => {
    // Reset user in Zustand store
    setUser(null)

    // Clear authentication data from secure storage
    await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    await secureStorage.removeItem(STORAGE_KEYS.USER_DATA)

    // Navigate to home page
    navigateTo(ROUTES.HOME)
  }, [setUser, navigateTo])
}
