'use client'
import { View } from 'react-native'
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
    <View className="w-full max-w-lg">
      <View className="flex flex-row flex-wrap justify-center">
        <View className="m-2">
          <P className="mb-1 text-center text-white">Avatar</P>
          <ChangeImageButton
            onImageSelected={setAvatar}
            progress={progress}
            progressText={progressText}
            text="Change Avatar"
            current={avatar}
          />
        </View>
        <View className="m-2">
          <P className="mb-1 text-center text-white">Background</P>
          <ChangeImageButton
            onImageSelected={setBackground}
            progress={progress}
            progressText={progressText}
            text="Change Background"
            current={background}
          />
        </View>
      </View>
    </View>
  )
}
