'use client'
import { Text, View } from 'react-native'

export function Line({ className = 'w-full', text = '' }: { className?: string, text?: string }) {
  if (text) {
    return (
      <View className="mb-6 flex w-full flex-row items-center">
        <View className={`border border-transparent border-b-white grow ${className}`} />
        <Text className="px-2 text-white">{text}</Text>
        <View className={`border border-transparent border-b-white grow ${className}`} />
      </View>
    )
  }
  
  return (
    <View className={`border border-transparent border-b-white ${className}`} />
  )
}

export function Separator() {
  return (
    <View className="my-8 flex w-full flex-row items-center">
      <Line className="grow" />
      <Text className="px-2 text-white">or</Text>
      <Line className="grow" />
    </View>
  )
}
