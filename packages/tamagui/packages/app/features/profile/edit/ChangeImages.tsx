'use client'
import { YStack, XStack } from 'tamagui'
import { ChangeImage } from 'app/types'
import { P } from 'app/design/typography'
import { ChangeImageButton } from 'app/ui/buttons/ChangeImageButton'
import { useMemo } from 'react'

type ChangeImagesProps = {
  avatar: ChangeImage
  setAvatar: (image: ChangeImage) => void
  background: ChangeImage
  setBackground: (image: ChangeImage) => void
  progress: number
}

export function ChangeImages({
  avatar,
  setAvatar,
  background,
  setBackground,
  progress,
}: ChangeImagesProps) {
  const progressText = useMemo(() => {
    if (progress === 0) return ''
    if (progress === 100) return '100%'
    return `${progress.toFixed(0)}%`
  }, [progress])

  return (
    <YStack width="100%" maxWidth={512}>
      <XStack flexDirection="row" flexWrap="wrap" justifyContent="center">
        <YStack margin="$2">
          <P marginBottom="$1" textAlign="center" color="$white1">Avatar</P>
          <ChangeImageButton
            onImageSelected={setAvatar}
            progress={progress}
            progressText={progressText}
            text="Change Avatar"
            current={avatar}
          />
        </YStack>
        <YStack margin="$2">
          <P marginBottom="$1" textAlign="center" color="$white1">Background</P>
          <ChangeImageButton
            onImageSelected={setBackground}
            progress={progress}
            progressText={progressText}
            text="Change Background"
            current={background}
          />
        </YStack>
      </XStack>
    </YStack>
  )
}
