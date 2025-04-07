import { Text, View } from 'react-native'

export function Line({ className = 'w-full' }) {
  return (
    <View className={`border border-transparent border-b-white ${className}`} />
  )
}

export function Separator() {
  return (
    <View className="my-8 flex w-full flex-row items-center">
      <Line className="grow" />
      <Text className="px-2">or</Text>
      <Line className="grow" />
    </View>
  )
}
