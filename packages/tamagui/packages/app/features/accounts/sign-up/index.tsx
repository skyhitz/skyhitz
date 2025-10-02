'use client'

import { KeyboardAvoidingView, Platform } from 'react-native'
import { YStack } from 'tamagui'
import { A, H1 } from 'app/design/typography'
import { useEffect } from 'react'
import { useRouter } from 'solito/navigation'
import { useIsAuthenticated } from 'app/state/user/hooks'
import { SkyhitzLogo } from 'app/ui/logo'
import { SignUpForm } from './signUpForm'
import { GradientBackground } from 'app/design/gradient'

type SignUpProps = {
  signedXDR?: string
}

export function SignUp({ signedXDR }: SignUpProps = {}) {
  const { replace } = useRouter()
  const isAuthenticated = useIsAuthenticated()

  // If already authenticated, redirect to search page
  useEffect(() => {
    if (isAuthenticated) {
      replace('/search')
    }
  }, [isAuthenticated, replace])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <GradientBackground
        // native compatibility
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <YStack alignItems="center" justifyContent="center" paddingVertical="$5">
          <SkyhitzLogo id="sign-up" size={42} />
        </YStack>
        <SignUpForm signedXDR={signedXDR} />
      </GradientBackground>
    </KeyboardAvoidingView>
  )
}
