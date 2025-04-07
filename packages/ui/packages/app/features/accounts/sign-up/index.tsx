'use client'

import { View } from 'react-native'
import { A, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import { Platform, TextInput, KeyboardAvoidingView } from 'react-native'
// import BackgroundImage from 'app/ui/backgroundImage'
// import { WalletConnectBtn } from 'app/ui/buttons/walletconnectBtn'
// import { Separator } from 'app/ui/orSeparator'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { Formik, FormikProps } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { useCreateUserWithEmailMutation, User } from 'app/api/graphql'
import { signUpFormSchema } from 'app/validation'
import { useRouter } from 'solito/navigation'
import { isEmpty } from 'ramda'
import { useLogIn } from 'app/hooks/useLogIn'
import { SkyhitzLogo } from 'app/ui/logo'

type FormFields = {
  username: string
  displayedName: string
  email: string
}

export function SignUp() {
  const [signedXDR, setSignedXDR] = useState<string>('')
  const [createUserWithEmail, { loading, error, data }] =
    useCreateUserWithEmailMutation()
  const { replace } = useRouter()
  const logIn = useLogIn()

  useEffect(() => {
    // if the user is returned, it means we are already logged in
    // cause we provided signedXDR
    if (data?.createUserWithEmail?.user) {
      logIn(data.createUserWithEmail.user as User)
    } else if (data?.createUserWithEmail) {
      replace('/sign-in')
    }
  }, [data, replace, logIn])

  const handleSignUp = async (formData: FormFields) => {
    if (loading) return
    await createUserWithEmail({
      variables: {
        displayName: formData.displayedName,
        username: formData.username,
        email: formData.email,
        signedXDR,
      },
    })
  }

  const displayedNameInputRef = useRef<TextInput>(null)
  const emailInputRef = useRef<TextInput>(null)

  const initialValues: FormFields = {
    username: '',
    email: '',
    displayedName: '',
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="from-blue-start via-blue-middle to-blue-end absolute inset-0 flex h-screen items-center justify-center bg-gradient-to-r from-5% via-35% to-95%"
    >
      <View className="w-72 backdrop-blur-sm md:w-96">
        <View className="my-4 flex w-full items-center">
          <SkyhitzLogo id="sign-up" size={42} />
        </View>

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
          }: FormikProps<FormFields>) => (
            <View className="items-center">
              <StyledTextInput
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={handleBlur('username')}
                className="mt-4"
                placeholder="Username"
                showFeedback={touched.username}
                valid={!errors.username}
                autoFocus
                blurOnSubmit={false}
                onSubmitEditing={() => displayedNameInputRef.current?.focus()}
                editable={!loading}
                autoCapitalize="none"
              />

              <StyledTextInput
                value={values.displayedName}
                onChangeText={handleChange('displayedName')}
                onBlur={handleBlur('displayedName')}
                className="mt-4"
                placeholder="Displayed Name"
                showFeedback={touched.displayedName}
                valid={!errors.displayedName}
                ref={displayedNameInputRef}
                blurOnSubmit={false}
                onSubmitEditing={() => emailInputRef.current?.focus()}
                editable={!loading}
                autoCapitalize="none"
              />

              <StyledTextInput
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                className="mt-4"
                placeholder="Email address"
                showFeedback={touched.email}
                valid={!errors.email}
                blurOnSubmit={false}
                ref={emailInputRef}
                onSubmitEditing={() => handleSubmit()}
                editable={!loading}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View className="mt-4 h-auto min-h-[1.25rem] w-full flex-row">
                <P className="text-red w-full text-center text-sm">
                  {(touched.username && errors.username) ||
                    (touched.displayedName && errors.displayedName) ||
                    (touched.email && errors.email) ||
                    error?.message}
                </P>
              </View>
              <Button
                text="Join"
                loading={loading && isEmpty(signedXDR)}
                disabled={!isValid || loading}
                onPress={() => {
                  setSignedXDR('')
                  handleSubmit()
                }}
                size="large"
                className="mt-5"
              />
              {/* <Separator /> */}

              {/* <WalletConnectBtn
                disabled={!isValid || loading}
                loading={loading && not(isEmpty(signedXDR))}
                onAuth={(xdr: string) => {
                  setSignedXDR(xdr)
                  handleSubmit()
                }}
              /> */}
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
    </KeyboardAvoidingView>
  )
}
