'use client'
import { XStack, YStack, Text, Separator as TamaguiSeparator } from 'tamagui'

export function Line({ text = '' }: { text?: string }) {
  if (text) {
    return (
      <XStack
        marginBottom="$6"
        width="100%"
        alignItems="center"
        gap="$2"
      >
        <TamaguiSeparator borderColor="$white1" flex={1} />
        <Text paddingHorizontal="$2" color="$white1">{text}</Text>
        <TamaguiSeparator borderColor="$white1" flex={1} />
      </XStack>
    )
  }
  
  return <TamaguiSeparator borderColor="$white1" width="100%" />
}

export function Separator() {
  return (
    <XStack
      marginVertical="$8"
      width="100%"
      alignItems="center"
      gap="$2"
    >
      <TamaguiSeparator borderColor="$white1" flex={1} />
      <Text paddingHorizontal="$2" color="$white1">or</Text>
      <TamaguiSeparator borderColor="$white1" flex={1} />
    </XStack>
  )
}
