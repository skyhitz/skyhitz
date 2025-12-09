'use client'
import { View } from 'react-native'
import { Modal } from 'app/design/modal'
import { H1, P } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useRouter } from 'solito/navigation'
import { useTopUpModalStore } from 'app/state/topup'
import { useUserStore } from 'app/state/user'

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
    ? `You need at least ${context.requiredHITZ} HITZ available ${actionTextMap[context.action] || ''}.`
    : ''

  return (
    <Modal visible={visible} onClose={closeTopUpModal}>
      <View className="w-full max-w-[520px] rounded-xl border border-[--border-color] bg-[--bg-color] p-6">
        <H1 className="text-lg font-unbounded">{title}</H1>
        {subtitle ? (
          <P className="mt-3 text-sm text-[--text-secondary-color]">{subtitle}</P>
        ) : null}
        <P className="mt-2 text-sm text-[--text-secondary-color]">
          Available balance: {context ? context.availableHITZ.toFixed(2) : '0.00'} HITZ
        </P>
        <View className="mt-4">
          <P className="text-sm">1) Buy HITZ from our top up page.</P>
          <P className="text-sm mt-2">2) Send HITZ directly to your Stellar address:</P>
          <P className="text-xs mt-1 break-all">{user?.publicKey}</P>
        </View>
        <View className="mt-6 flex-row gap-3">
          <Button text="Go to Top Up" onPress={() => { closeTopUpModal(); push('/top-up') }} />
          <Button text="Close" onPress={closeTopUpModal} variant="secondary" />
        </View>
      </View>
    </Modal>
  )
}

export default TopUpRequiredModal
