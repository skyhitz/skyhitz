'use client'
import { ReactNode, useEffect } from 'react'
import { useUserAtomState } from 'app/state/user'
import { useRouter } from 'solito/navigation'
import { SplashScreen } from 'app/features/splash/splashScreen'
import { A } from 'app/design/typography'

type Props = {
  children: ReactNode
  redirect?: boolean
  fallback?: () => ReactNode
  linkToAuth?: boolean
}

export function AuthWrap({
  children,
  redirect = true,
  fallback = SplashScreen,
  linkToAuth = false,
}: Props) {
  const { user } = useUserAtomState()
  const { push } = useRouter()

  useEffect(() => {
    if (!user && redirect) {
      push('/')
    }
  }, [user, push, redirect])

  // if auth with a valid user show protected stuff
  if (user) {
    return <>{children}</>
  }

  if (linkToAuth) {
    return (
      <A className="flex text-gray-600" href={'/sign-in'}>
        {children}
      </A>
    )
  }

  /* otherwise return fallback, will do a redirect from useEffect */
  return <>{fallback()}</>
}

export function ComponentAuthGuard({
  children,
  ...rest
}: {
  children: ReactNode
  linkToAuth?: boolean
}) {
  return (
    <AuthWrap fallback={() => null} redirect={false} {...rest}>
      {children}
    </AuthWrap>
  )
}

export function AuthGuard({
  children,
  ...props
}: {
  children: React.ReactNode
}) {
  return <AuthWrap {...props}>{children}</AuthWrap>
}
