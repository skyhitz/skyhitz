'use client'
import React from 'react'
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

  const bgColor = isError
    ? 'bg-red-500'
    : isSuccess
    ? 'bg-green-500'
    : 'bg-blue-500'

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
