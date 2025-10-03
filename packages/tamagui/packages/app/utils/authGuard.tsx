'use client'
import { PropsWithChildren, useEffect } from 'react'
import { useRouter } from 'app/navigation'
import { useUserState, useIsAuthenticated } from 'app/state/user/hooks'
import { ActivityIndicator } from 'app/design/typography'
import { YStack } from 'tamagui'

/**
 * Higher-order component to guard routes that require authentication
 */
export function ComponentAuthGuard({ children }: PropsWithChildren) {
  const { replace } = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const { loading } = useUserState()

  useEffect(() => {
    // Only redirect if we know the user is not authenticated (after loading)
    if (!loading && !isAuthenticated) {
      replace('/sign-in')
    }
  }, [isAuthenticated, loading, replace])

  if (loading) {
    return (
      <YStack height="100vh" alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" />
      </YStack>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}

/**
 * Route guard for Next.js app directory pages
 */
export async function RouteAuthGuard() {
  // For server components
  return {
    redirect: {
      destination: '/sign-in',
      permanent: false,
    },
  }
}
