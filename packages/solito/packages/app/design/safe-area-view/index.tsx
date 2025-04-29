import { View } from 'react-native'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'

export type SafeAreaViewProps = {
  children: React.ReactNode
  className?: string
}

export function SafeAreaView({ className, children }: SafeAreaViewProps) {
  const insets = useSafeArea()

  return (
    <View
      className={className}
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      {children}
    </View>
  )
}
