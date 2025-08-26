'use client'

import { useCallback } from 'react'
import { useUserStore } from './index'
import { User } from 'app/api/graphql/types'

export function useUserState() {
  const { user, loading, setUser, setLoading } = useUserStore()

  const updateUser = useCallback(
    (newUser: User | null) => {
      setUser(newUser)
      setLoading(false) // Once user is set, loading is complete
    },
    [setUser, setLoading]
  )

  return {
    user,
    loading,
    updateUser,
    setLoading
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
