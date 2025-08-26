/**
 * Hook to check if a user is authenticated
 */
import { useUserStore } from 'app/state/user'

/**
 * Returns whether the current user is authenticated or not
 */
export function useIsAuthenticated(): boolean {
  const { user } = useUserStore()
  return !!user
}
