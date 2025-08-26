'use client'
import * as React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'

interface ToastProps {
  message: string
  type: string
  onDismiss: () => void
}

const Toast = ({ message, type, onDismiss }: ToastProps) => {
  const insets = useSafeArea()
  const isError = type === 'error'
  const isSuccess = type === 'success'

  // Use theme CSS variables instead of hardcoded colors
  const bgColor = isError
    ? 'bg-[--error-bg-color]'
    : isSuccess
    ? 'bg-[--success-bg-color]'
    : 'bg-[--primary-color]'

  return (
    <View
      className={`absolute top-0 left-0 right-0 z-50 px-4 ${bgColor}`}
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between py-4">
        <Text className="flex-1 text-white font-medium">{message}</Text>
        <Pressable onPress={onDismiss}>
          <Text className="text-white ml-2">✕</Text>
        </Pressable>
      </View>
    </View>
  )
}

export default Toast
