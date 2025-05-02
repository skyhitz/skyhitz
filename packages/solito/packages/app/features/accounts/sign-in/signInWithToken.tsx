'use client'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { P, H3 } from 'app/design/typography'
import { useSignInWithTokenMutation } from 'app/api/graphql/mutations'
import { useUserState } from 'app/state/user/hooks'
import { useRouter } from 'solito/navigation'
import { ActivityIndicator } from 'react-native'
import { AuthService } from 'app/services/auth'

interface SignInWithTokenProps {
  uid: string
  token: string
}

export function SignInWithToken({ uid, token }: SignInWithTokenProps) {
  const [error, setError] = useState<string | null>(null)
  const { updateUser } = useUserState()
  const router = useRouter()

  const [signInWithToken, { loading }] = useSignInWithTokenMutation({
    onCompleted: async (data) => {
      if (data?.signInWithToken?.user) {
        // Update user state with returned user data
        updateUser(data.signInWithToken.user)
        
        // Navigate to dashboard
        router.replace('/dashboard')
      } else {
        setError('Authentication failed. Try signing in again.')
      }
    },
    onError: (error) => {
      setError(error.message || 'Authentication failed. Try signing in again.')
    }
  })

  useEffect(() => {
    // Automatically attempt to sign in when component mounts
    const authenticate = async () => {
      try {
        if (!uid || !token) {
          setError('Invalid authentication parameters')
          return
        }

        await signInWithToken({
          variables: { uid, token }
        })
      } catch (err) {
        console.error('Sign in with token error:', err)
        setError('Authentication failed. Please try signing in again.')
      }
    }

    authenticate()
  }, [uid, token, signInWithToken])

  return (
    <View className="items-center justify-center py-12">
      <H3 className="mb-8 text-center">Verifying your login...</H3>
      {loading && (
        <ActivityIndicator size="large" color="#0000ff" />
      )}
      {error && (
        <P className="mt-4 text-center text-red">{error}</P>
      )}
    </View>
  )
}
