'use client'
import * as React from 'react'
import { Pressable, View, Text, Platform } from 'react-native'
import { ChangeImage } from 'app/types'
import { Button } from 'app/design/button'
import Image from 'app/design/image'
import { imageSrc } from 'app/utils/entry'

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
    <View className="relative h-32 w-32 overflow-hidden rounded-md bg-gray-800">
      {current.url ? (
        <Image
          source={{ uri: imageSrc(current.url) }}
          className="h-full w-full"
          alt="Profile image"
          width={128}
          height={128}
          fill={true}
        />
      ) : (
        <View className="h-full w-full bg-gray-800" />
      )}
      
      {progress > 0 && progress < 100 ? (
        <View className="absolute bottom-0 left-0 right-0 bg-gray-800 p-2">
          <Text className="text-center text-white">{progressText}</Text>
        </View>
      ) : (
        <Pressable
          onPress={handleSelectImage}
          className="absolute bottom-0 left-0 right-0 bg-gray-800/80 p-2"
        >
          <Text className="text-center text-sm text-white">{text}</Text>
        </Pressable>
      )}
    </View>
  )
}
