'use client'
import * as React from 'react'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { YStack, XStack, Text, Button } from 'tamagui'

interface ToastProps {
  message: string
  type: string
  onDismiss: () => void
}

const Toast = ({ message, type, onDismiss }: ToastProps) => {
  const insets = useSafeArea()
  const isError = type === 'error'
  const isSuccess = type === 'success'

  // Use theme colors instead of hardcoded colors
  const bgColor = isError
    ? '$red9'
    : isSuccess
    ? '$green9'
    : '$blue9'

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      zIndex={50}
      paddingHorizontal="$4"
      backgroundColor={bgColor}
      paddingTop={insets.top}
    >
      <XStack flexDirection="row" alignItems="center" justifyContent="space-between" paddingVertical="$4">
        <Text flex={1} color="$white1" fontWeight="500">{message}</Text>
        <Button onPress={onDismiss} backgroundColor="transparent" padding="$0" borderWidth={0}>
          <Text color="$white1" marginLeft="$2">✕</Text>
        </Button>
      </XStack>
    </YStack>
  )
}

export default Toast
