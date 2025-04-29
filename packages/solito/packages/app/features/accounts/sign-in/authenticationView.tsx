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
  const [signIn, { error }] = useSignInWithTokenMutation()
  const { push } = useRouter()
  const logIn = useLogIn()

  useEffect(() => {
    const trySignIn = async () => {
      try {
        const { data } = await signIn({
          variables: {
            uid: signInParam.uid,
            token: signInParam.token,
          },
        })
        if (data?.signInWithToken) {
          logIn(data.signInWithToken as User)
        }
      } catch (ex) {
        //no-op
      }
    }
    trySignIn()
  }, [signInParam, signIn, logIn])

  return (
    <View className="flex w-72 items-center">
      {error ? (
        <>
          <P className="w-full text-center text-[#d9544f]">{error.message}</P>
          <Button
            text="Go back"
            onPress={() => push('/')}
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
