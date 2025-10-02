'use client'
import * as React from 'react'
import { Platform, Linking, Share as RNShare } from 'react-native'
import { Share2, X } from '@tamagui/lucide-icons'
import XLogo from 'app/ui/icons/x-logo'
import { CopyBeatUrlButton } from 'app/ui/buttons/CopyBeatUrlButton'
import { Dialog, Sheet, YStack, XStack, Button, Text, Adapt } from 'tamagui'
import { P } from 'app/design/typography'

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
      <Button
        flexDirection="row"
        alignItems="center"
        onPress={onShare}
        backgroundColor="transparent"
        padding="$0"
      >
        <Share2 size={24} color="$color12" />
      </Button>
      
      <Dialog open={modalVisible} onOpenChange={(open) => !open && setModalVisible(false)}>
        <Adapt when="sm" platform="touch">
          <Sheet modal dismissOnSnapToBottom>
            <Sheet.Frame padding="$4" backgroundColor="$background">
              <Sheet.Handle />
              <YStack alignItems="center">
                <XStack width="100%" flexDirection="row" alignItems="center">
                  <Text flex={1} textAlign="center" fontSize="$4" fontWeight="bold" color="$color12">
                    {title}
                  </Text>
                  <Button
                    onPress={() => setModalVisible(false)}
                    backgroundColor="transparent"
                    padding="$0"
                  >
                    <X color="$color12" size={22} />
                  </Button>
                </XStack>
                <P marginTop="$5" textAlign="center" fontSize="$3" color="$gray10">
                  Copy link or post directly.
                </P>
                <XStack marginTop="$5" flexDirection="row" alignItems="center" justifyContent="center">
                  <CopyBeatUrlButton beatUrl={url} />
                  <P marginHorizontal="$3" textAlign="center" fontSize="$3" color="$gray10">or</P>
                  <Button
                    onPress={() => Linking.openURL(`https://x.com/intent/tweet?url=${url}`)}
                    aria-label="Read more about Skyhitz on X"
                    backgroundColor="transparent"
                    padding="$0"
                  >
                    <XLogo width={20} height={20} color="$color12" />
                  </Button>
                </XStack>
              </YStack>
            </Sheet.Frame>
            <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
          </Sheet>
        </Adapt>

        <Dialog.Portal>
          <Dialog.Overlay
            key="overlay"
            animation="quick"
            opacity={0.7}
            backgroundColor="$black1"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
          <Dialog.Content
            bordered
            elevate
            key="content"
            animation="quick"
            enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
            exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
            backgroundColor="$background"
            borderRadius="$4"
            padding="$4"
            maxWidth={480}
            borderColor="$borderColor"
          >
            <YStack alignItems="center">
              <XStack width="100%" flexDirection="row" alignItems="center">
                <Text flex={1} textAlign="center" fontSize="$4" fontWeight="bold" color="$color12">
                  {title}
                </Text>
                <Dialog.Close asChild>
                  <Button backgroundColor="transparent" padding="$0">
                    <X color="$color12" width={22} height={22} />
                  </Button>
                </Dialog.Close>
              </XStack>
              <P marginTop="$5" textAlign="center" fontSize="$3" color="$gray10">
                Copy link or post directly.
              </P>
              <XStack marginTop="$5" flexDirection="row" alignItems="center" justifyContent="center">
                <CopyBeatUrlButton beatUrl={url} />
                <P marginHorizontal="$3" textAlign="center" fontSize="$3" color="$gray10">or</P>
                <Button
                  onPress={() => Linking.openURL(`https://x.com/intent/tweet?url=${url}`)}
                  aria-label="Read more about Skyhitz on X"
                  backgroundColor="transparent"
                  padding="$0"
                >
                  <XLogo width={20} height={20} color="$color12" />
                </Button>
              </XStack>
            </YStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
