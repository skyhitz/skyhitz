import { View, StyleProp, ViewStyle } from 'react-native'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'

export type SafeAreaViewProps = {
  children: React.ReactNode
  className?: string
  style?: StyleProp<ViewStyle>
  edges?: string[]
}

export function SafeAreaView({ className, children, style, edges }: SafeAreaViewProps) {
  const insets = useSafeArea()
  
  // Calculate padding based on edges prop
  const padding = {
    paddingTop: edges?.includes('top') ? insets.top : 0,
    paddingBottom: edges?.includes('bottom') ? insets.bottom : insets.bottom,
    paddingLeft: edges?.includes('left') ? insets.left : 0,
    paddingRight: edges?.includes('right') ? insets.right : 0,
  }
  
  // If no edges specified, use all edges
  if (!edges) {
    padding.paddingTop = insets.top
    padding.paddingBottom = insets.bottom
    padding.paddingLeft = insets.left
    padding.paddingRight = insets.right
  }

  return (
    <View
      className={className}
      style={[padding, style]}
    >
      {children}
    </View>
  )
}
