'use client'

import { View, KeyboardAvoidingView, Platform } from 'react-native'
import { A, H1 } from 'app/design/typography'
import { useEffect } from 'react'
import { useRouter } from 'solito/navigation'
import { useIsAuthenticated } from 'app/state/user/hooks'
import { SkyhitzLogo } from 'app/ui/logo'
import { SignUpForm } from './signUpForm'

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
      className="from-blue-start via-blue-middle to-blue-end absolute inset-0 flex h-screen items-center justify-center bg-gradient-to-r from-5% via-35% to-95%"
    >
      <View className="w-72 items-center md:w-96">
        <View className="items-center justify-center py-5">
          <SkyhitzLogo id="sign-up" size={42} />
        </View>

        <H1 className="mb-6 text-center text-white">Create Account</H1>

        <SignUpForm signedXDR={signedXDR} />
      </View>
    </KeyboardAvoidingView>
  )
}
