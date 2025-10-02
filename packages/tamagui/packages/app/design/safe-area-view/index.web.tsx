import { YStack } from 'tamagui'
import { NativeSafeAreaViewProps } from 'react-native-safe-area-context'

export function SafeAreaView({
  style,
  ...rest
}: NativeSafeAreaViewProps) {
  return <YStack style={style} {...rest} />
}
