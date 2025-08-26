'use client'
import { SignInParam } from 'app/hooks/param/useSignInParam'
import { useEffect } from 'react'
import { useLogIn } from 'app/hooks/useLogIn'
import { useSignInWithTokenMutation } from 'app/api/graphql/mutations'
import { User } from 'app/api/graphql/types'
import { useRouter } from 'solito/navigation'
import { P, ActivityIndicator } from 'app/design/typography'
import { Button } from 'app/design/button'
import { View } from 'react-native'

export function AuthenticationView({
  signInParam,
}: {
  signInParam: SignInParam
}) {
  const [signIn, { error, loading }] = useSignInWithTokenMutation()
  const { replace } = useRouter()
  const logIn = useLogIn()

  useEffect(() => {
    const trySignIn = async () => {
      try {
        console.log('Attempting sign in with token...')
        const { data } = await signIn({
          variables: {
            uid: signInParam.uid,
            token: signInParam.token,
          },
        })
        
        console.log('Sign in response:', JSON.stringify(data, null, 2))
        
        if (data?.signInWithToken) {
          // The user data comes directly in the signInWithToken response, not nested in a 'user' property
          const userData = data.signInWithToken
          
          console.log('Authentication successful, updating user state with:', userData)
          
          // Double check that we have the necessary user fields
          if (userData.id && userData.email) {
            // Update the user state in Zustand
            logIn(userData)
            // The logIn function will handle redirect after setting user state
          } else {
            console.error('Invalid user data received:', userData)
            replace('/')
          }
        }
      } catch (ex) {
        console.error('Authentication error:', ex)
      }
    }
    
    if (signInParam.token && signInParam.uid) {
      trySignIn()
    }
  }, [signInParam, signIn, replace])

  return (
    <View className="flex w-72 items-center">
      {error ? (
        <>
          <P className="w-full text-center text-[#d9544f]">{error.message}</P>
          <Button
            text="Go back"
            onPress={() => replace('/')}
            className="my-3"
            variant="secondary"
          />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" />
          <P className="mt-2 text-center text-white">Authentication</P>
        </>
      )}
    </View>
  )
}
