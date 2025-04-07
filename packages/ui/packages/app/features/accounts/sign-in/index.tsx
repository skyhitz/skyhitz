'use client'
import { Platform, KeyboardAvoidingView } from 'react-native'
import { useState } from 'react'
import { useSignInParam } from 'app/hooks/param/useSignInParam'
import { AuthenticationView } from 'app/features/accounts/sign-in/authenticationView'
import { OpenEmailView } from 'app/features/accounts/sign-in/openEmailView'
import { SignInForm } from 'app/features/accounts/sign-in/signInForm'
// import { WalletConnectView } from './WalletConnectView'
import { isEmpty, not } from 'ramda'

export function SignIn() {
  const signInParam = useSignInParam()
  const [emailSend, setEmailSend] = useState<boolean>(false)
  const [signedXDR, setSignedXDR] = useState<string>('')

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="from-blue-start via-blue-middle to-blue-end absolute inset-0 flex h-screen items-center justify-center bg-gradient-to-r from-5% via-35% to-95%"
    >
      {signInParam ? (
        <AuthenticationView signInParam={signInParam} />
      ) : emailSend ? (
        <OpenEmailView />
      ) : not(isEmpty(signedXDR)) ? null : ( // <WalletConnectView signedXDR={signedXDR} />
        <SignInForm
          onEmailSend={() => setEmailSend(true)}
          onWalletConnected={setSignedXDR}
        />
      )}
    </KeyboardAvoidingView>
  )
}
