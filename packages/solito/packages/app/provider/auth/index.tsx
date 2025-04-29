'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useUserStore } from 'app/state/user'
import { AuthService } from 'app/services/auth'
import { ActivityIndicator } from 'app/design/typography'
import { View } from 'react-native'
import { useRouter } from 'solito/navigation'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser } = useUserStore()
  const { replace } = useRouter()

  useEffect(() => {
    async function restoreAuth() {
      // Try to restore authentication state
      const user = await AuthService.restoreUserFromStorage()
      
      if (user) {
        // User data found, set auth state
        setUser(user)
      }
    }

    restoreAuth()
  }, [setUser, replace])

  return <>{children}</>
}

/**
 * Higher-order component that ensures a user is authenticated
 * If not authenticated, it redirects to sign-in
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthProtected(props: P) {
    const router = useRouter()
    const [currentPath, setCurrentPath] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    
    // Get the current path in a platform-compatible way
    useEffect(() => {
      if (typeof window !== 'undefined') {
        // For web
        setCurrentPath(window.location.pathname)
      }
      // For native, we would need to use React Navigation's hooks
      // but for now we'll rely on the auth check only
    }, [])
    
    useEffect(() => {
      async function checkAuth() {
        try {
          const authenticated = await AuthService.isAuthenticated()
          setIsAuthenticated(authenticated)
          
          const isAuthRoute = currentPath === '/sign-in' || currentPath === '/sign-up'
          if (!authenticated && !isAuthRoute) {
            router.replace('/sign-in')
          }
        } finally {
          setIsLoading(false)
        }
      }
      
      checkAuth()
    }, [currentPath, router])
    
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      )
    }
    
    const isAuthRoute = currentPath === '/sign-in' || currentPath === '/sign-up'
    if (!isAuthenticated && !isAuthRoute) {
      return null // Will redirect via the useEffect
    }
    
    return <Component {...props} />
  }
}
