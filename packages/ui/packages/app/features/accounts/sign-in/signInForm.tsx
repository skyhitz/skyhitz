import { SignInForm as FormData } from 'app/types'
import { View } from 'react-native'
import { Button } from 'app/design/button'
// import { WalletConnectBtn } from 'app/ui/buttons/walletconnectBtn'
// import { Separator } from 'app/ui/orSeparator'
import { Formik, FormikProps } from 'formik'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { useRequestTokenMutation } from 'app/api/graphql'
import { signInFormSchema } from 'app/validation'
import { A, P } from 'app/design/typography'

type SignInFormProps = {
  onEmailSend: () => void
  onWalletConnected: (signedXDR: string) => void
}

export function SignInForm({
  onEmailSend, // onWalletConnected,
}: SignInFormProps) {
  const [requestToken, { loading, error }] = useRequestTokenMutation({
    onCompleted: onEmailSend,
  })
  const handleSignIn = async (formData: FormData) => {
    if (loading) return
    await requestToken({
      variables: {
        usernameOrEmail: formData.usernameOrEmail,
      },
    })
  }

  const initialValues: FormData = {
    usernameOrEmail: '',
  }

  return (
    <View className="w-72 items-center md:w-96">
      {/* <WalletConnectBtn loading={false} onAuth={onWalletConnected} /> */}
      {/* <Separator /> */}
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
          <View className="items-center">
            <StyledTextInput
              value={values.usernameOrEmail}
              onChangeText={handleChange('usernameOrEmail')}
              onBlur={handleBlur('usernameOrEmail')}
              className="mt-4"
              placeholder="Email"
              showFeedback={touched.usernameOrEmail}
              valid={!errors.usernameOrEmail}
              blurOnSubmit={false}
              onSubmitEditing={() => handleSubmit()}
              editable={!loading}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View className="mt-4  flex-row">
              <P className="text-red min-h-5 w-full text-center text-sm">
                {(touched.usernameOrEmail && errors.usernameOrEmail) ||
                  error?.message}
              </P>
            </View>

            <Button
              onPress={handleSubmit}
              loading={loading}
              text="Log In"
              size="large"
              className="mt-6"
              disabled={!isValid}
            />
            <View className="mt-8 flex-row">
              <P className="min-h-5 w-full text-center text-sm text-white">
                Don&apos;t have an account?{' '}
                <A className="mx-2 text-gray-700" href="/sign-up">
                  Sign Up
                </A>
              </P>
            </View>
          </View>
        )}
      </Formik>
    </View>
  )
}
