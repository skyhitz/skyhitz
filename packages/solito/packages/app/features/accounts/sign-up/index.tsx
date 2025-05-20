'use client'

import { View, KeyboardAvoidingView, Platform } from 'react-native'
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
        className="from-blue-start via-blue-middle to-blue-end absolute inset-0 flex h-screen items-center justify-center bg-gradient-to-r from-5% via-35% to-95%"
        // native compatibility
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <View className="items-center justify-center py-5">
          <SkyhitzLogo id="sign-up" size={42} />
        </View>
        <SignUpForm signedXDR={signedXDR} />
      </GradientBackground>
    </KeyboardAvoidingView>
  )
}
