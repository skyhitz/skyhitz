'use client'
import { View } from 'react-native'
import { Modal } from 'app/design/modal'
import { H1, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useRouter } from 'solito/navigation'
import { useSearchRateLimitStore } from 'app/state/search'
import { ROUTES } from 'app/constants/routes'

export function SignInRequiredModal() {
  const { signInModalVisible, closeSignInModal } = useSearchRateLimitStore()
  const { push } = useRouter()

  const handleSignUp = () => {
    closeSignInModal()
    push(ROUTES.SIGN_UP)
  }

  const handleSignIn = () => {
    closeSignInModal()
    push(ROUTES.SIGN_IN)
  }

  return (
    <Modal visible={signInModalVisible} onClose={closeSignInModal}>
      <View className="w-full max-w-[520px] rounded-xl border border-[--border-color] bg-[--bg-color] p-6">
        <H1 className="text-lg font-unbounded text-center">Account required</H1>
        <P className="mt-3 text-sm text-[--text-secondary-color]">
          Please Sign up or Sign In to continue searching.
        </P>
        <P className="mt-2 text-sm text-[--text-secondary-color]">
          Create a free account to unlock unlimited search and discover amazing music.
        </P>
        <View className="mt-6 flex-row gap-3 mx-auto">
          <Button text="Sign Up" onPress={handleSignUp} />
          <Button text="Sign In" onPress={handleSignIn} variant="secondary" />
        </View>
      </View>
    </Modal>
  )
}

export default SignInRequiredModal

