import { useCallback } from 'react'
import { useUserStore } from './index'
import { User } from 'app/api/graphql/types'

export function useUserState() {
  const { user, setUser } = useUserStore()

  const updateUser = useCallback(
    (newUser: User | null) => {
      setUser(newUser)
    },
    [setUser]
  )

  return {
    user,
    updateUser,
  }
}

export function useIsAuthenticated() {
  return useUserStore((state) => state.isAuthenticated())
}

export function useUserId() {
  return useUserStore((state) => state.userId())
}

export function useUserPublicKey() {
  return useUserStore((state) => state.userPublicKey())
}

export function useUserEmail() {
  return useUserStore((state) => state.userEmail())
}
