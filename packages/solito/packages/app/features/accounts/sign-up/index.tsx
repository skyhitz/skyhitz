'use client'

import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { A, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import StyledTextInput from 'app/features/accounts/styledTextInput'
import { Formik, FormikProps } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { useCreateUserWithEmailMutation } from 'app/api/graphql/mutations'
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
      logIn(data.createUserWithEmail.user)
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

  const initialValues: FormFields = {
    username: '',
    displayedName: '',
    email: '',
  }

  const usernameRef = useRef<TextInput>(null)
  const displayedNameRef = useRef<TextInput>(null)
  const emailRef = useRef<TextInput>(null)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="from-blue-start via-blue-middle to-blue-end absolute inset-0 flex h-screen items-center justify-center bg-gradient-to-r from-5% via-35% to-95%"
    >
      <View className="w-72 items-center md:w-96">
        {!isEmpty(signedXDR) ? null : (
          <>
            <View className="items-center justify-center py-5">
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
                    ref={usernameRef}
                    value={values.username}
                    onChangeText={handleChange('username')}
                    onBlur={handleBlur('username')}
                    className="mt-2"
                    placeholder="Username"
                    showFeedback={touched.username}
                    valid={!errors.username}
                    blurOnSubmit={false}
                    onSubmitEditing={() => displayedNameRef.current?.focus()}
                    editable={!loading}
                    autoCapitalize="none"
                  />
                  <View className="mt-2 flex-row">
                    <P className="text-red min-h-5 w-full text-center text-sm">
                      {touched.username && errors.username}
                    </P>
                  </View>

                  <StyledTextInput
                    ref={displayedNameRef}
                    value={values.displayedName}
                    onChangeText={handleChange('displayedName')}
                    onBlur={handleBlur('displayedName')}
                    className="mt-2"
                    placeholder="Display name"
                    showFeedback={touched.displayedName}
                    valid={!errors.displayedName}
                    blurOnSubmit={false}
                    onSubmitEditing={() => emailRef.current?.focus()}
                    editable={!loading}
                  />
                  <View className="mt-2 flex-row">
                    <P className="text-red min-h-5 w-full text-center text-sm">
                      {touched.displayedName && errors.displayedName}
                    </P>
                  </View>

                  <StyledTextInput
                    ref={emailRef}
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    className="mt-2"
                    placeholder="Email"
                    showFeedback={touched.email}
                    valid={!errors.email}
                    blurOnSubmit={false}
                    onSubmitEditing={() => handleSubmit()}
                    editable={!loading}
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                    className="mt-5"
                    disabled={!isValid}
                  />
                  <View className="mt-8 flex-row">
                    <P className="min-h-5 w-full text-center text-sm text-white">
                      Already have an account?{' '}
                      <A className="mx-2 text-gray-700" href="/sign-in">
                        Log In
                      </A>
                    </P>
                  </View>
                </View>
              )}
            </Formik>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
