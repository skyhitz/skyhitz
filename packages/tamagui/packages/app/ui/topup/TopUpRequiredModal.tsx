'use client'
import { Modal } from 'app/design/modal'
import { H1, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useRouter } from 'app/navigation'
import { useTopUpModalStore } from 'app/state/topup'
import { useUserStore } from 'app/state/user'
import { YStack, XStack } from 'tamagui'

export function TopUpRequiredModal() {
  const { visible, context, closeTopUpModal } = useTopUpModalStore()
  const { push } = useRouter()
  const user = useUserStore((s) => s.user)

  const actionTextMap: Record<string, string> = {
    mine: 'to mine an entry',
    download: 'to download this file',
    like: 'to like this entry',
    playback: 'to keep streaming',
  }

  const title = 'Top up required'
  const subtitle = context
    ? `You need at least ${context.requiredXLM} XLM available (excluding the minimum account reserve) ${actionTextMap[context.action] || ''}.`
    : ''

  return (
    <Modal visible={visible} onClose={closeTopUpModal}>
      <YStack
        width="100%"
        maxWidth={520}
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
        backgroundColor="$background"
        padding="$6"
      >
        <H1 fontSize="$6" fontFamily="$heading">{title}</H1>
        {subtitle ? (
          <P marginTop="$3" fontSize="$3" color="$color11">{subtitle}</P>
        ) : null}
        <P marginTop="$2" fontSize="$3" color="$color11">
          Available balance: {context ? context.availableXLM.toFixed(2) : '0.00'} XLM
        </P>
        <YStack marginTop="$4">
          <P fontSize="$3">1) Buy XLM from our top up page.</P>
          <P fontSize="$3" marginTop="$2">2) Send XLM directly to your Stellar address:</P>
          <P fontSize="$2" marginTop="$1" wordWrap="break-word">{user?.publicKey}</P>
        </YStack>
        <XStack marginTop="$6" gap="$3">
          <Button text="Go to Top Up" onPress={() => { closeTopUpModal(); push('/top-up') }} />
          <Button text="Close" onPress={closeTopUpModal} variant="secondary" />
        </XStack>
      </YStack>
    </Modal>
  )
}

export default TopUpRequiredModal


