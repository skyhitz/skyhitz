'use client'
import { YStack, XStack } from 'tamagui'
import { Button } from 'app/design/button'
import { Formik, FormikProps } from 'formik'
import { useEffect } from 'react'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { useCreateUserWithEmailMutation, useRequestTokenMutation } from 'app/api/graphql/mutations'
import { signUpFormSchema } from 'app/validation'
import { A, P } from 'app/design/typography'
import { SignUpForm as FormData } from 'app/types'
import { useRouter } from 'app/navigation'
import { useUserState } from 'app/state/user/hooks'
import { useToast } from 'app/provider/toast'
import { trackSignUp } from 'app/utils/analytics'

type SignUpFormProps = {
  signedXDR?: string
}

export function SignUpForm({ signedXDR }: SignUpFormProps = {}) {
  const router = useRouter()
  const { updateUser } = useUserState()
  const toast = useToast()
  
  // Use the hook without passing options
  const [createUserWithEmail, { loading, error, called, data }] = useCreateUserWithEmailMutation()
  const [requestToken] = useRequestTokenMutation()
  
  // Effect to handle navigation and user update after successful signup
  useEffect(() => {
    if (data?.createUserWithEmail?.user) {
      // Track sign-up event
      trackSignUp(data.createUserWithEmail.user.id)
      
      // Update user state with returned user data
      updateUser(data.createUserWithEmail.user)
      
      // Navigate to search page (formerly dashboard)
      router.replace('/search')
    }
  }, [data, router, updateUser])
  
  const handleSignUp = async (formData: FormData) => {
    if (loading) return
    
    try {
      const res = await createUserWithEmail({
        variables: {
          username: formData.username,
          displayName: formData.displayedName,
          email: formData.email,
          signedXDR: signedXDR,
        },
      })
      const createdUser = res?.data?.createUserWithEmail?.user
      if (!createdUser) {
        // Auto-start email sign-in: send magic link
        try {
          await requestToken({ variables: { usernameOrEmail: formData.email } })
          toast.show('Check your email for the sign-in link to complete setup.', { type: 'success' })
          router.replace('/sign-in')
        } catch (e) {
          console.error('Request token failed', e)
        }
      }
    } catch (err) {
      console.error('Sign up error:', err)
    }
  }

  const initialValues: FormData = {
    username: '',
    displayedName: '',
    email: '',
  }

  return (
    <YStack width={{ xs: 288, md: 384 }} alignItems="center">
      <Formik
        validateOnMount
        initialValues={initialValues}
        onSubmit={handleSignUp}
        validationSchema={signUpFormSchema}
      >
        {({
          values,
          handleChange,
          handleBlur,
          errors,
          touched,
          isValid,
          handleSubmit,
        }: FormikProps<FormData>) => (
          <YStack alignItems="center">
            <StyledTextInput
              value={values.displayedName}
              onChangeText={handleChange('displayedName')}
              onBlur={handleBlur('displayedName')}
              marginTop="$4"
              placeholder="Display Name"
              showFeedback={touched.displayedName}
              valid={!errors.displayedName}
              editable={!loading}
            />
            <XStack marginTop="$2" flexDirection="row">
              <P color="$red9" minHeight="$5" width="100%" textAlign="center" fontSize="$3">
                {touched.displayedName && errors.displayedName}
              </P>
            </XStack>

            <StyledTextInput
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              marginTop="$4"
              placeholder="Username"
              showFeedback={touched.username}
              valid={!errors.username}
              editable={!loading}
              autoCapitalize="none"
            />
            <XStack marginTop="$2" flexDirection="row">
              <P color="$red9" minHeight="$5" width="100%" textAlign="center" fontSize="$3">
                {touched.username && errors.username}
              </P>
            </XStack>

            <StyledTextInput
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              marginTop="$4"
              placeholder="Email"
              showFeedback={touched.email}
              valid={!errors.email}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <XStack marginTop="$2" flexDirection="row">
              <P color="$red9" minHeight="$5" width="100%" textAlign="center" fontSize="$3">
                {(touched.email && errors.email) || error?.message}
              </P>
            </XStack>

            <Button
              onPress={() => handleSubmit()}
              loading={loading}
              text="Sign Up"
              size="large"
              marginTop="$6"
              disabled={!isValid}
            />
            <XStack marginTop="$8" flexDirection="row">
              <P minHeight="$5" width="100%" textAlign="center" fontSize="$3" color="$white1">
                Already have an account?{' '}
                <A marginHorizontal="$2" color="$gray10" href="/sign-in">
                  Sign In
                </A>
              </P>
            </XStack>
          </YStack>
        )}
      </Formik>
    </YStack>
  )
}
