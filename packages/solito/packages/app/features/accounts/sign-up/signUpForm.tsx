'use client'
import { View } from 'react-native'
import { Button } from 'app/design/button'
import { Formik, FormikProps } from 'formik'
import { useEffect } from 'react'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { useCreateUserWithEmailMutation, useRequestTokenMutation } from 'app/api/graphql/mutations'
import { signUpFormSchema } from 'app/validation'
import { A, P } from 'app/design/typography'
import { SignUpForm as FormData } from 'app/types'
import { useRouter } from 'solito/navigation'
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
      const user = data.createUserWithEmail.user
      
      // Track sign-up event with user ID
      trackSignUp(user.id)
      
      // If user has JWT, they're logged in (wallet connect flow)
      if (user.jwt) {
        // Update user state with returned user data
        updateUser(user)
        
        // Navigate to search page (formerly dashboard)
        router.replace('/search')
      }
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
      
      // If user was created but has no JWT, they need email verification
      if (createdUser && !createdUser.jwt) {
        // Auto-start email sign-in: send magic link
        try {
          await requestToken({ variables: { usernameOrEmail: formData.email } })
          toast.show('Check your email for the sign-in link to complete setup.', { type: 'success' })
          router.replace('/sign-in')
        } catch (e) {
          console.error('Request token failed', e)
        }
      }
      // If user has JWT, the useEffect will handle login
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
    <View className="w-72 items-center md:w-96">
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
          <View className="items-center">
            <StyledTextInput
              value={values.displayedName}
              onChangeText={handleChange('displayedName')}
              onBlur={handleBlur('displayedName')}
              className="mt-4"
              placeholder="Display Name"
              showFeedback={touched.displayedName}
              valid={!errors.displayedName}
              editable={!loading}
            />
            <View className="mt-2 flex-row">
              <P className="text-red min-h-5 w-full text-center text-sm">
                {touched.displayedName && errors.displayedName}
              </P>
            </View>

            <StyledTextInput
              value={values.username}
              onChangeText={handleChange('username')}
              onBlur={handleBlur('username')}
              className="mt-4"
              placeholder="Username"
              showFeedback={touched.username}
              valid={!errors.username}
              editable={!loading}
              autoCapitalize="none"
            />
            <View className="mt-2 flex-row">
              <P className="text-red min-h-5 w-full text-center text-sm">
                {touched.username && errors.username}
              </P>
            </View>

            <StyledTextInput
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              className="mt-4"
              placeholder="Email"
              showFeedback={touched.email}
              valid={!errors.email}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View className="mt-2 flex-row">
              <P className="text-red min-h-5 w-full text-center text-sm">
                {(touched.email && errors.email) || error?.message}
              </P>
            </View>

            <Button
              onPress={() => handleSubmit()}
              loading={loading}
              text="Sign Up"
              size="large"
              className="mt-6"
              disabled={!isValid}
            />
            <View className="mt-8 flex-row">
              <P className="min-h-5 w-full text-center text-sm text-white">
                Already have an account?{' '}
                <A className="mx-2 text-gray-700" href="/sign-in">
                  Sign In
                </A>
              </P>
            </View>
          </View>
        )}
      </Formik>
    </View>
  )
}
