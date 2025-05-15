/**
 * Hook for protecting routes that require authentication
 */
import { useEffect } from 'react'
import { useAppNavigation } from './useAppNavigation'
import { useAuthNavigation } from './useFeatureNavigation'
import { useIsAuthenticated } from '../useIsAuthenticated'
import { ROUTES } from 'app/constants/routes'

type AuthProtectionOptions = {
  /**
   * If true, will redirect to sign-in when not authenticated
   * Default: true
   */
  redirectWhenUnauthenticated?: boolean
  
  /**
   * If true, will redirect to search when already authenticated
   * (useful for auth pages like sign-in/sign-up)
   * Default: false 
   */
  redirectWhenAuthenticated?: boolean
  
  /**
   * Custom redirect path when not authenticated
   * Default: ROUTES.SIGN_IN
   */
  unauthenticatedRedirect?: string
  
  /**
   * Custom redirect path when authenticated
   * Default: ROUTES.SEARCH
   */
  authenticatedRedirect?: string
}

/**
 * Hook to handle authentication-based redirects
 * 
 * Use this hook at the top of components that need auth protection
 * or to prevent authenticated users from accessing auth pages
 */
export function useAuthProtection(options: AuthProtectionOptions = {}) {
  const {
    redirectWhenUnauthenticated = true,
    redirectWhenAuthenticated = false,
    unauthenticatedRedirect = ROUTES.SIGN_IN,
    authenticatedRedirect = ROUTES.SEARCH,
  } = options
  
  const { replaceTo } = useAppNavigation()
  const isAuthenticated = useIsAuthenticated()
  
  useEffect(() => {
    // For auth pages: redirect if already logged in
    if (redirectWhenAuthenticated && isAuthenticated) {
      replaceTo(authenticatedRedirect)
      return
    }
    
    // For protected pages: redirect if not logged in
    if (redirectWhenUnauthenticated && !isAuthenticated) {
      replaceTo(unauthenticatedRedirect)
      return
    }
  }, [
    isAuthenticated, 
    redirectWhenAuthenticated,
    redirectWhenUnauthenticated,
    authenticatedRedirect,
    unauthenticatedRedirect,
    replaceTo,
  ])
  
  return { isAuthenticated }
}
