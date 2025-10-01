'use client'
import { View } from 'react-native'
import { SharedValue } from 'react-native-reanimated'
import Animated from 'react-native-reanimated'

type SkeletonContainerProps = {
  className: string
  sharedValue: SharedValue<number>
}

export function SkeletonContainer({
  className,
  sharedValue,
}: SkeletonContainerProps) {
  return (
    <View className={`overflow-hidden rounded-md bg-gray-800 ${className}`}>
      <Animated.View
        className="h-full w-[300%] bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800"
        style={{
          transform: [{ translateX: sharedValue }],
        }}
      />
    </View>
  )
}
