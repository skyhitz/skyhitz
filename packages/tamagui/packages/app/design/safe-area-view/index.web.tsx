import { View } from 'react-native'
import { NativeSafeAreaViewProps } from 'react-native-safe-area-context'

export function SafeAreaView({
  className,
  style,
  ...rest
}: NativeSafeAreaViewProps & { className?: string }) {
  return <View style={style} className={className} {...rest} />
}
