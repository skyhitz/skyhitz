'use client'
import * as React from 'react'
import { Modal, Pressable, Text, View, Platform } from 'react-native'
import { Linking, Share as RNShare, SafeAreaView } from 'react-native'
import Share from 'app/ui/icons/share'
import { X } from 'app/ui/icons/x'
import XLogo from 'app/ui/icons/x-logo'
import { CopyBeatUrlButton } from 'app/ui/buttons/CopyBeatUrlButton'

type ShareButtonProps = {
  url: string
  title: string
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [modalVisible, setModalVisible] = React.useState<boolean>(false)
  
  const onShare = React.useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        setModalVisible(true)
      } else if (Platform.OS === 'ios') {
        await RNShare.share({
          url,
        })
      } else {
        await RNShare.share({
          message: url,
        })
      }
    } catch (error) {
      // no-op
    }
  }, [url])

  return (
    <>
      <Pressable className="flex-row items-center" onPress={onShare}>
        <Share className="h-6 w-6 text-[--text-color]" />
      </Pressable>
      <Modal visible={modalVisible} transparent>
        <SafeAreaView className="bg-black/70 flex-1 items-center justify-center px-2">
          <View className="bg-[--bg-color] max-w-md items-center rounded-xl p-4 border border-[--border-color]">
            <View className="w-full flex-row items-center">
              <Text className="flex-1 text-center text-base font-bold text-[--text-color]">
                {title}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X className="text-[--text-color]" width={22} height={22} />
              </Pressable>
            </View>
            <Text className="mt-5 text-center text-sm text-[--text-color-secondary]">
              Copy link or post directly.
            </Text>
            <View className="mt-5 flex-row items-center justify-center">
              <CopyBeatUrlButton beatUrl={url} />
              <Text className="mx-3 text-center text-sm text-[--text-color-secondary]">or</Text>
              <Pressable
                onPress={() =>
                  Linking.openURL(`https://x.com/intent/tweet?url=${url}`)
                }
                aria-label="Read more about Skyhitz on X"
              >
                <XLogo width={20} height={20} className="text-[--text-color]" />
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}
