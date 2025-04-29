import { useUserStore } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { User } from 'app/api/graphql/types'
import { secureStorage, STORAGE_KEYS } from 'app/services/storage'
import { useCallback } from 'react'

export const useLogIn = () => {
  const { setUser } = useUserStore()
  const { replace } = useRouter()

  return useCallback(async (user: User) => {
    // Set user in Zustand store
    setUser(user)
    
    // Save JWT token to secure storage
    if (user.jwt) {
      await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, user.jwt)
    }
    
    // Save user data for offline access
    await secureStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
    
    replace('/')
  }, [setUser, replace])
}

export const useLogOut = () => {
  const { setUser } = useUserStore()
  const { replace } = useRouter()

  return useCallback(async () => {
    // Reset user in Zustand store
    setUser(null)
    
    // Clear authentication data from secure storage
    await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    await secureStorage.removeItem(STORAGE_KEYS.USER_DATA)
    
    replace('/')
  }, [setUser, replace])
}
