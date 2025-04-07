import { View } from 'react-native'
import { ActivityIndicator } from 'app/design/typography'

export function SplashScreen() {
  return (
    <View className="flex h-full w-full flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  )
}
