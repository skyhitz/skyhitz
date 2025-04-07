import { View, ScrollView } from 'react-native'
import { SkeletonContainer } from './SkeletonContainer'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useEffect } from 'react'

export default function BeatPageSkeleton() {
  const mobile = true
  const x = useSharedValue(-0.2)

  useEffect(() => {
    x.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1)
  }, [])

  const Content = () => {
    if (mobile) {
      return (
        <>
          <View className="w-full flex-row">
            <View className="mr-2 flex flex-1 items-center">
              <SkeletonContainer
                className="max-w-125 max-h-125 aspect-square w-full"
                sharedValue={x}
              />
            </View>
            <View className="flex w-full md:ml-2 md:flex-1">
              <SkeletonContainer className="h-25 mt-5 w-full" sharedValue={x} />
              <SkeletonContainer className="h-25 mt-5 w-full" sharedValue={x} />
              <SkeletonContainer className="h-25 mt-5 w-full" sharedValue={x} />
              <SkeletonContainer className="h-25 mt-5 w-full" sharedValue={x} />
            </View>
          </View>
          <SkeletonContainer className="h-25 mt-4 w-full" sharedValue={x} />
        </>
      )
    } else {
      return (
        <>
          <View className="flex  w-full">
            <SkeletonContainer
              className="max-w-125 max-h-125 aspect-square w-full"
              sharedValue={x}
            />
            <SkeletonContainer className="h-15 mt-5 w-full" sharedValue={x} />
            <SkeletonContainer className="h-15 mt-5 w-full" sharedValue={x} />
            <SkeletonContainer className="h-15 mt-5 w-full" sharedValue={x} />
            <SkeletonContainer className="h-15 mt-5 w-full" sharedValue={x} />
          </View>
        </>
      )
    }
  }

  return (
    <View className="flex flex-1">
      <ScrollView contentContainerClassName="flex min-h-full items-start w-full max-w-screen-xl mx-auto p-4 bg-blue-dark">
        <Content />
      </ScrollView>
    </View>
  )
}
