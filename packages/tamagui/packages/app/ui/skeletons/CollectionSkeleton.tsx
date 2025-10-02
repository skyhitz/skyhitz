'use client'
import { useEffect } from 'react'
import { SkeletonContainer } from 'app/ui/skeletons/SkeletonContainer'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { XStack } from 'tamagui'
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
      <XStack marginHorizontal="auto" marginVertical="$2" width="100%" maxWidth="$6xl" flexDirection="row" paddingHorizontal="$5">
        <SkeletonContainer height={40} width={40} sharedValue={x} />
        <SkeletonContainer marginHorizontal="$5" marginRight="$1" height={40} flex={1} sharedValue={x} />
      </XStack>
    )
  }
  
  return (
    <FlatList
      data={Array(duplicates)
        .fill(0)
        .map((_, i) => {
          return { key: i }
        })}
      renderItem={() => <EntrySkeleton />}
    />
  )
}
