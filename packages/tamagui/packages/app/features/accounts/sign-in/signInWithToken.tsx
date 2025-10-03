'use client'
import { useEffect, useState } from 'react'
import { YStack } from 'tamagui'
import { P, H3, ActivityIndicator } from 'app/design/typography'
import { useSignInWithTokenMutation } from 'app/api/graphql/mutations'
import { useRouter } from 'app/navigation'

interface SignInWithTokenProps {
  uid: string
  token: string
}

export function SignInWithToken({ uid, token }: SignInWithTokenProps) {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Use the hook without overriding its built-in callbacks
  const [signInWithToken, { loading, called, data, error: mutationError }] =
    useSignInWithTokenMutation()

  // Effect to handle API errors
  useEffect(() => {
    if (mutationError) {
      console.error('Sign in error:', mutationError)
      setError(
        mutationError.message || 'Authentication failed. Try signing in again.'
      )
    }
  }, [mutationError])

  // Effect to navigate after successful login
  useEffect(() => {
    if (data?.signInWithToken?.user) {
      // Navigate to the search page after successful login
      router.replace('/search')
    } else if (called && !loading && !mutationError) {
      // If the mutation completed but no user was returned
      setError('Authentication failed. Try signing in again.')
    }
  }, [data, called, loading, router])

  // Effect to initiate sign-in when component mounts
  useEffect(() => {
    // Automatically attempt to sign in when component mounts
    const authenticate = async () => {
      try {
        if (!uid || !token) {
          setError('Invalid authentication parameters')
          return
        }

        await signInWithToken({
          variables: { uid, token },
        })
      } catch (err) {
        console.error('Sign in with token error:', err)
        setError('Authentication failed. Please try signing in again.')
      }
    }

    if (!called && !loading) {
      authenticate()
    }
  }, [uid, token, signInWithToken, called, loading])

  return (
    <YStack alignItems="center" justifyContent="center" paddingVertical="$12">
      <H3 marginBottom="$8" textAlign="center">Verifying your login...</H3>
      {loading && <ActivityIndicator size="large" />}
      {error && <P marginTop="$4" textAlign="center" color="$red9">{error}</P>}
    </YStack>
  )
}
