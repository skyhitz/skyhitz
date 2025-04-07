import { useEffect } from 'react'
import { SkeletonContainer } from 'app/ui/skeletons/SkeletonContainer'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { View } from 'react-native'
import { FlatList } from 'react-native'

type CollectionSkeletonProps = {
  duplicates: number
}

export function CollectionSkeleton({ duplicates }: CollectionSkeletonProps) {
  const x = useSharedValue(-0.2)

  useEffect(() => {
    x.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1)
  }, [])

  const EntrySkeleton = () => {
    return (
      <View className="mx-auto my-2 w-full max-w-6xl flex-row px-5">
        <SkeletonContainer className="h-10 w-10" sharedValue={x} />
        <SkeletonContainer className="mx-5 mr-1 h-10 flex-1" sharedValue={x} />
      </View>
    )
  }
  return (
    <>
      <FlatList
        data={Array(duplicates)
          .fill(0)
          .map((_, i) => {
            return { key: i }
          })}
        renderItem={() => <EntrySkeleton />}
      />
    </>
  )
}
