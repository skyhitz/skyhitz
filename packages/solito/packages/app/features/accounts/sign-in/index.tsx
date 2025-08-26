'use client'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { useState } from 'react'
import { useSignInParam } from 'app/hooks/param/useSignInParam'
import { AuthenticationView } from './authenticationView'
import { OpenEmailView } from './openEmailView'
import { SignInForm } from './signInForm'
import { isEmpty, not } from 'ramda'
import { GradientBackground } from 'app/design/gradient'

export function SignIn() {
  const signInParam = useSignInParam()
  const [emailSend, setEmailSend] = useState<boolean>(false)
  const [signedXDR, setSignedXDR] = useState<string>('')

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <GradientBackground
        className="from-blue-start via-blue-middle to-blue-end absolute inset-0 flex h-screen items-center justify-center bg-gradient-to-r from-5% via-35% to-95%"
        // native compatibility
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        {signInParam ? (
          <AuthenticationView signInParam={signInParam} />
        ) : emailSend ? (
          <OpenEmailView />
        ) : not(isEmpty(signedXDR)) ? null : (
          // WalletConnectView will be implemented later
          <SignInForm
            onEmailSend={() => setEmailSend(true)}
            onWalletConnected={setSignedXDR}
          />
        )}
      </GradientBackground>
    </KeyboardAvoidingView>
  )
}
