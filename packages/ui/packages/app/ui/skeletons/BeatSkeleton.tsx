import { View } from 'react-native'
import { useEffect } from 'react'
import { SkeletonContainer } from './SkeletonContainer'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

export function BeatSkeleton() {
  const x = useSharedValue(-0.2)

  useEffect(() => {
    x.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1)
  }, [])

  const EntrySkeleton = () => {
    return (
      <View className="m-2 h-20 w-full flex-row items-start">
        <SkeletonContainer className="w-15 h-15" sharedValue={x} />
        <SkeletonContainer className="mx-5 h-5 flex-1" sharedValue={x} />
      </View>
    )
  }
  return (
    <>
      {Array(8)
        .fill(true)
        .map((_, i) => (
          <EntrySkeleton key={i} />
        ))}
    </>
  )
}
