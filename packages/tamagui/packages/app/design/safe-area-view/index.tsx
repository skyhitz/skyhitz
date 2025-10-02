'use client'
import {
  NativeSafeAreaViewProps,
  SafeAreaView as NativeSafeAreaView,
} from 'react-native-safe-area-context'

export function SafeAreaView({
  style,
  ...rest
}: NativeSafeAreaViewProps) {
  return <NativeSafeAreaView style={style} {...rest} />
}
