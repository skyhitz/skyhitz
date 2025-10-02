'use client'
import { YStack, GetProps } from 'tamagui'
import { SharedValue } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'

type SkeletonContainerProps = GetProps<typeof YStack> & {
  sharedValue: SharedValue<number>
}

export function SkeletonContainer({
  sharedValue,
  ...props
}: SkeletonContainerProps) {
  return (
    <YStack overflow="hidden" borderRadius="$2" backgroundColor="$gray8" {...props}>
      <Animated.View
        style={{
          height: '100%',
          width: '300%',
          transform: [{ translateX: sharedValue }],
        }}
      />
    </YStack>
  )
}
