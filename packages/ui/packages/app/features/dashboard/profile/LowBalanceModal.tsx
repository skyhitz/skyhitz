import { Modal, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'app/design/safe-area-view'
import XIcon from 'app/ui/icons/x'
import DollarIcon from 'app/ui/icons/dollar'
import { FormInputWithIcon } from 'app/ui/inputs/FormInputWithIcon'
import WalletIcon from 'app/ui/icons/wallet'

type Props = {
  visible: boolean
  onClose: () => void
  availableBalance: number
  publicKey: string
}
export function LowBalanceModal({
  visible,
  onClose,
  availableBalance,
  publicKey,
}: Props) {
  return (
    <Modal visible={visible} transparent>
      <SafeAreaView className="bg-blue-field/70 flex flex-1 items-center justify-center px-2">
        <View className="bg-blue-field flex w-full max-w-lg items-center rounded-xl p-4">
          <View className="w-full flex-row items-center">
            <Text className="flex-1 text-center text-base font-bold text-white">
              Balance Too Low!
            </Text>
            <Pressable onPress={onClose}>
              <XIcon className="text-white" size={22} />
            </Pressable>
          </View>
          <Text className="mt-5 text-center text-sm">
            We require a minimum balance of 2 XLM before you can mint a new NFT.
          </Text>
          <View className="mt-5 flex-row items-center">
            <Text className="mr-3 text-sm">Available Balance:</Text>
            <DollarIcon className="text-white" size={22} />
            <Text className="ml-1 text-sm text-white">
              {availableBalance.toFixed(2)}
            </Text>
          </View>
          <View className="mt-5 flex-row items-center">
            <Text className="mr-3 text-sm">Required Minimum:</Text>
            <DollarIcon className="text-white" size={22} />
            <Text className="ml-1 text-sm text-white">2</Text>
          </View>
          <Text className="my-5 text-center text-sm text-white">
            Please transfer more XLM to your account:
          </Text>

          <FormInputWithIcon
            icon={WalletIcon}
            containerClassNames="w-full"
            style={{ fontWeight: 'bold' }}
            value={publicKey}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}
