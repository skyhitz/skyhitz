import { Modal, Pressable, Text, View } from 'react-native'
import { useState } from 'react'
import { Linking, Platform, Share, SafeAreaView } from 'react-native'
import { ShareIcon } from 'app/ui/icons/share'
import XIcon from 'app/ui/icons/x'
import X from 'app/ui/icons/twitter'
import { CopyBeatUrlButton } from 'app/ui/buttons/CopyBeatUrlButton'

type Props = {
  url: string
  title: string
}
export function ShareButton({ url, title }: Props) {
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const onShare = async () => {
    try {
      if (Platform.OS === 'web') {
        setModalVisible(true)
      } else if (Platform.OS === 'ios') {
        await Share.share({
          url,
        })
      } else {
        await Share.share({
          message: url,
        })
      }
    } catch (error) {
      // no-op
    }
  }
  return (
    <>
      <Pressable className="flex-row items-center" onPress={onShare}>
        <ShareIcon />
      </Pressable>
      <Modal visible={modalVisible} transparent>
        <SafeAreaView className="bg-blue-field/70 flex flex-1 items-center justify-center px-2">
          <View className="bg-blue-field flex max-w-md items-center rounded-xl p-4">
            <View className="w-full flex-row items-center">
              <Text className="flex-1 text-center text-base font-bold text-white">
                {title}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <XIcon className="text-white" size={22} />
              </Pressable>
            </View>
            <Text className="mt-5 text-center text-sm text-white">
              Copy link or tweet directly.
            </Text>
            <View className="mt-5 flex-row items-center justify-center">
              <CopyBeatUrlButton beatUrl={url} />
              <Text className="mx-3 text-center text-sm text-white">or</Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://twitter.com/intent/tweet?url=${url}`)
                }
                aria-label="Read more about Skyhitz on twitter"
              >
                <X size={20} className="text-white" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}
