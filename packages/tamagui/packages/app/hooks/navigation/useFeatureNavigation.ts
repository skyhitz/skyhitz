/**
 * Feature-specific navigation hooks for common app workflows
 */
import { useAppNavigation, RouteParams } from './useAppNavigation'
import { ROUTES } from 'app/constants/routes'

/**
 * Navigation hook for auth-related routes
 */
export function useAuthNavigation() {
  const { navigateTo, replaceTo } = useAppNavigation()

  return {
    /**
     * Navigate to the sign in page
     */
    goToSignIn: () => navigateTo(ROUTES.SIGN_IN),

    /**
     * Navigate to the sign up page
     */
    goToSignUp: () => navigateTo(ROUTES.SIGN_UP),

    /**
     * Navigate to sign in with token page (from email link)
     */
    goToSignInWithToken: (token: string, uid: string) => 
      navigateTo(ROUTES.SIGN_IN_WITH_TOKEN, { token, uid }),

    /**
     * Navigate to the main app after successful authentication
     * (replaces current route to prevent back navigation to auth screens)
     */
    goToMainAppAfterAuth: () => replaceTo(ROUTES.SEARCH),
  }
}

/**
 * Navigation hook for profile-related routes
 */
export function useProfileNavigation() {
  const { navigateTo, pathname } = useAppNavigation()

  const isProfileActive = pathname === ROUTES.PROFILE || 
    pathname?.startsWith(`${ROUTES.PROFILE}/`)

  return {
    /**
     * Navigate to user's own profile
     */
    goToMyProfile: () => navigateTo(ROUTES.PROFILE),

    /**
     * Navigate to profile likes
     */
    goToProfileLikes: () => navigateTo(ROUTES.PROFILE_LIKES),

    /**
     * Navigate to profile collection
     */
    goToProfileCollection: () => navigateTo(ROUTES.PROFILE_COLLECTION),

    /**
     * Navigate to profile edit page
     */
    goToProfileEdit: () => navigateTo(ROUTES.PROFILE_EDIT),

    /**
     * Is user currently on any profile route
     */
    isProfileActive,
  }
}

/**
 * Navigation hook for content-related routes
 */
export function useContentNavigation() {
  const { navigateTo } = useAppNavigation()

  return {
    /**
     * Navigate to the search page
     */
    goToSearch: () => navigateTo(ROUTES.SEARCH),

    /**
     * Navigate to the charts page
     */
    goToChart: () => navigateTo(ROUTES.CHART),

    /**
     * Navigate to a specific beat/track
     */
    goToBeat: (id: string) => navigateTo(ROUTES.BEAT, { id }),
  }
}
