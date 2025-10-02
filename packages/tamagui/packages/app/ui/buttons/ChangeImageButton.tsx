'use client'
import * as React from 'react'
import { Platform } from 'react-native'
import { ChangeImage } from 'app/types'
import { imageSrc } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { YStack, Button, Text } from 'tamagui'

type ChangeImageButtonProps = {
  onImageSelected: (image: ChangeImage) => void
  progress: number
  progressText: string
  text: string
  current: ChangeImage
}

export function ChangeImageButton({
  onImageSelected,
  progress,
  progressText,
  text,
  current,
}: ChangeImageButtonProps) {
  const handleSelectImage = async () => {
    if (Platform.OS === 'web') {
      // Web implementation
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      input.onchange = async (e) => {
        // @ts-ignore
        const file = e.target.files[0]
        if (!file) return

        const url = URL.createObjectURL(file)
        onImageSelected({
          url,
          blob: file,
        })
      }

      input.click()
    } else {
      // React Native implementation would go here
      // (Would use expo-image-picker, but that would require additional setup)
      console.warn('Image selection not implemented for native platforms')
    }
  }

  return (
    <YStack position="relative" height={128} width={128} overflow="hidden" borderRadius="$2" backgroundColor="$gray8">
      {current.url ? (
        <SolitoImage
          src={imageSrc(current.url)}
          alt="Profile image"
          fill={true}
          style={{ height: '100%', width: '100%' }}
        />
      ) : (
        <YStack height="100%" width="100%" backgroundColor="$gray8" />
      )}

      {progress > 0 && progress < 100 ? (
        <YStack position="absolute" bottom={0} left={0} right={0} backgroundColor="$gray8" padding="$2">
          <Text textAlign="center" color="$white1">{progressText}</Text>
        </YStack>
      ) : (
        <Button
          onPress={handleSelectImage}
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          backgroundColor="$gray8"
          opacity={0.8}
          padding="$2"
          borderWidth={0}
        >
          <Text textAlign="center" fontSize="$3" color="$white1">{text}</Text>
        </Button>
      )}
    </YStack>
  )
}
