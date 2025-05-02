'use client'

import { SignInWithToken } from 'app/features/accounts/sign-in/signInWithToken'
import { useSearchParams } from 'next/navigation'
import { View } from 'react-native'
import { H1 } from 'app/design/typography'

export default function SignInWithTokenPage() {
  const searchParams = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''

  return (
    <View className="flex-1 items-center justify-center p-4">
      <H1 className="mb-8 text-center">Sign In to Skyhitz</H1>
      <SignInWithToken uid={uid} token={token} />
    </View>
  )
}

export const metadata = {
  title: 'Sign In | Skyhitz',
  description: 'Sign in to your Skyhitz account',
}
