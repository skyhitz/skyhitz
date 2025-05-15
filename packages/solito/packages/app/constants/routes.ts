/**
 * Application route constants
 * 
 * This file centralizes all route definitions used throughout the application,
 * making it easier to maintain and update paths consistently.
 */

export const ROUTES = {
  HOME: '/',
  BEAT: '/beat',
  CHART: '/chart',
  PROFILE: '/profile',
  SEARCH: '/search',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  SIGN_IN_WITH_TOKEN: '/sign-in-with-token',
  
  // Profile sub-routes
  PROFILE_LIKES: '/profile/likes',
  PROFILE_COLLECTION: '/profile/collection',
  PROFILE_EDIT: '/profile/edit',
}

/**
 * Routes that should include the main navigation UI (navbar + tab bar)
 */
export const NAVIGATION_ROUTES = [
  ROUTES.BEAT,
  ROUTES.CHART,
  ROUTES.PROFILE, 
  ROUTES.SEARCH
]

/**
 * Check if a given pathname should use navigation UI
 */
export function shouldUseNavigationUI(pathname: string | null): boolean {
  if (!pathname) return false
  
  return NAVIGATION_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}
