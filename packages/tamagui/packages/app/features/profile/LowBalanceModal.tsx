'use client'
import { Modal } from 'app/design/modal'
import { Button } from 'app/design/button'
import { H1, P } from 'app/design/typography'
import { YStack } from 'tamagui'

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
      <YStack
        alignItems="center"
        justifyContent="center"
        borderRadius="$3"
        backgroundColor="$black1"
        paddingHorizontal="$6"
        paddingVertical="$8"
      >
        <H1
          marginBottom="$4"
          textAlign="center"
          fontSize="$7"
          fontWeight="bold"
          color="$white1"
        >
          Insufficient Balance
        </H1>
        <P
          marginBottom="$6"
          textAlign="center"
          color="$white1"
        >
          You need a minimum of {minWithdrawalAmount} XLM to withdraw funds from your account.
        </P>
        <Button text="OK" onPress={onClose} />
      </YStack>
    </Modal>
  )
}
