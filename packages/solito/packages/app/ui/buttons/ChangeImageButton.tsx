'use client'
import * as React from 'react'
import { useRef, useCallback } from 'react'
import { Pressable, View, Text, Platform } from 'react-native'
import { ChangeImage } from 'app/types'
import { imageSrc } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { useToast } from 'app/provider/toast'

type ChangeImageButtonProps = {
  onImageSelected: (image: ChangeImage) => void
  progress: number
  progressText: string
  text: string
  current: ChangeImage
  requireSquare?: boolean
}

export function ChangeImageButton({
  onImageSelected,
  progress,
  progressText,
  text,
  current,
  requireSquare = false,
}: ChangeImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const isWeb = Platform.OS === 'web'

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (!file) return

      if (requireSquare) {
        // Validate square dimensions for avatars
        const img = new Image()
        img.onload = () => {
          URL.revokeObjectURL(img.src)
          if (img.width !== img.height) {
            toast?.show('Avatar must be a square image (same width and height)', { type: 'danger' })
          } else {
            const url = URL.createObjectURL(file)
            onImageSelected({
              url,
              blob: file,
            })
          }
        }
        img.onerror = () => {
          URL.revokeObjectURL(img.src)
          toast?.show('Failed to load image', { type: 'danger' })
        }
        img.src = URL.createObjectURL(file)
      } else {
        const url = URL.createObjectURL(file)
        onImageSelected({
          url,
          blob: file,
        })
      }
    }
    // Reset input value to allow re-selecting the same file
    if (e.target) {
      e.target.value = ''
    }
  }, [onImageSelected, requireSquare, toast])

  const handlePress = useCallback(() => {
    if (isWeb && inputRef.current) {
      inputRef.current.click()
    } else if (!isWeb) {
      console.warn('Image selection not implemented for native platforms')
    }
  }, [isWeb])

  return (
    <View className="relative h-32 w-32 overflow-hidden rounded-md bg-gray-800">
      {current.url ? (
        <SolitoImage
          src={imageSrc(current.url)}
          className="h-full w-full"
          alt="Profile image"
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
          onPress={handlePress}
          className="absolute bottom-0 left-0 right-0 bg-gray-800/80 p-2"
        >
          <Text className="text-center text-sm text-white">{text}</Text>
        </Pressable>
      )}

      {isWeb && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}
    </View>
  )
}
