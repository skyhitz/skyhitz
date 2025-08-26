'use client'
import { Modal } from 'app/design/modal'
import { Button } from 'app/design/button'
import { H1, P } from 'app/design/typography'
import { View } from 'react-native'

type LowBalanceModalProps = {
  visible: boolean
  onClose: () => void
  minWithdrawalAmount: number
}

export function LowBalanceModal({
  visible,
  onClose,
  minWithdrawalAmount,
}: LowBalanceModalProps) {
  return (
    <Modal visible={visible} onClose={onClose}>
      <View className="flex items-center justify-center rounded-lg bg-black px-6 py-8">
        <H1 className="mb-4 text-center text-2xl font-bold text-white">Insufficient Balance</H1>
        <P className="mb-6 text-center text-white">
          You need a minimum of {minWithdrawalAmount} XLM to withdraw funds from your account.
        </P>
        <Button text="OK" onPress={onClose} />
      </View>
    </Modal>
  )
}
