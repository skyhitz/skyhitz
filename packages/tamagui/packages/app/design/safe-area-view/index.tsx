'use client'
import {
  NativeSafeAreaViewProps,
  SafeAreaView as NativeSafeAreaView,
} from 'react-native-safe-area-context'



export function SafeAreaView({
  className,
  style,
  ...rest
}: NativeSafeAreaViewProps & { className?: string }) {
  return <NativeSafeAreaView style={style} className={className} {...rest} />
}
