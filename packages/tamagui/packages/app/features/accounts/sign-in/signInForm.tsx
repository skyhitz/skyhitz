'use client'
import { SignInForm as FormData } from 'app/types'
import { Button } from 'app/design/button'
import { Formik, FormikProps } from 'formik'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { useRequestTokenMutation } from 'app/api/graphql/mutations'
import { signInFormSchema } from 'app/validation'
import { A, P } from 'app/design/typography'
import { ApolloError } from '@apollo/client'
import { YStack, XStack } from 'tamagui'

type SignInFormProps = {
  onEmailSend: () => void
  onWalletConnected: (signedXDR: string) => void
}

export function SignInForm({
  onEmailSend,
}: SignInFormProps) {
  const [requestToken, { loading, error }] = useRequestTokenMutation({
    onCompleted: () => {
      onEmailSend()
    },
  })
  
  const handleSignIn = async (formData: FormData) => {
    if (loading) return
    try {
      await requestToken({
        variables: {
          usernameOrEmail: formData.usernameOrEmail,
        },
      })
    } catch (err) {
      console.error('Sign in error:', err)
    }
  }

  const initialValues: FormData = {
    usernameOrEmail: '',
  }

  return (
    <YStack
      width={{ xs: 288, md: 384 }}
      alignItems="center"
    >
      {/* Wallet connect button will be implemented later */}
      <Formik
        validateOnMount
        initialValues={initialValues}
        onSubmit={handleSignIn}
        validationSchema={signInFormSchema}
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
              value={values.usernameOrEmail}
              onChangeText={handleChange('usernameOrEmail')}
              onBlur={handleBlur('usernameOrEmail')}
              marginTop="$4"
              placeholder="Email"
              showFeedback={touched.usernameOrEmail}
              valid={!errors.usernameOrEmail}
              blurOnSubmit={false}
              onSubmitEditing={() => handleSubmit()}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <XStack marginTop="$4" flexDirection="row">
              <P
                color="$red9"
                minHeight="$5"
                width="100%"
                textAlign="center"
                fontSize="$3"
              >
                {(touched.usernameOrEmail && errors.usernameOrEmail) ||
                  error?.message}
              </P>
            </XStack>

            <Button
              onPress={() => handleSubmit()}
              loading={loading}
              text="Log In"
              size="large"
              marginTop="$6"
              disabled={!isValid}
            />
            <XStack marginTop="$8" flexDirection="row">
              <P
                minHeight="$5"
                width="100%"
                textAlign="center"
                fontSize="$3"
                color="$white1"
              >
                Don&apos;t have an account?{' '}
                <A marginHorizontal="$2" color="$gray10" href="/sign-up">
                  Sign Up
                </A>
              </P>
            </XStack>
          </YStack>
        )}
      </Formik>
    </YStack>
  )
}
