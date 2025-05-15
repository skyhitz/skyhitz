'use client'
import MainTabBar from './MainTabBar'
import { useCallback, useEffect, useMemo } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { useAppNavigation } from 'app/hooks/navigation'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated'
import { MotiView } from 'moti'

// Player components
import { MiniPlayerBar } from 'app/features/player/miniPlayerBar'
import { FullScreenPlayer } from 'app/features/player/fullScreenPlayer'

const fullAnimationDuration = 400

export function MobileTabBarWrapper() {
  // Use our navigation hook to get the current path segment
  const { getCurrentSegment } = useAppNavigation()
  const currentTabName = getCurrentSegment()
  const insets = useSafeArea()
  const { height } = useWindowDimensions()

  // Adding +40 for the mini player
  const tabBarHeight = 54 + insets.bottom + 40 // 54 for tab bar height + 40 for mini player + bottom inset

  const maxHeight = useMemo(() => height + insets.top, [insets, height])

  const y = useSharedValue(tabBarHeight)

  useEffect(() => {
    y.value = tabBarHeight
  }, [tabBarHeight])

  const draggableStyle = useAnimatedStyle(() => {
    return {
      height: y.value,
    }
  }, [y])

  const playerBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      y.value,
      [tabBarHeight, maxHeight / 3],
      [1, 0],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      zIndex: y.value === tabBarHeight ? 10 : -1,
    }
  }, [tabBarHeight, maxHeight, y])

  const tabBarStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      y.value,
      [tabBarHeight, maxHeight / 3],
      [1, 0],
      Extrapolation.CLAMP
    )
    const translation = interpolate(
      y.value,
      [tabBarHeight, maxHeight],
      [0, tabBarHeight],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      transform: [
        {
          translateY: translation,
        },
      ],
    }
  }, [tabBarHeight, maxHeight, y])

  const fullScreenPlayerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      y.value,
      [tabBarHeight, maxHeight / 3],
      [0, 1],
      Extrapolation.CLAMP
    )
    return {
      opacity,
      zIndex: y.value === maxHeight ? 10 : 1,
    }
  }, [tabBarHeight, maxHeight, y])

  const onExpand = useCallback(() => {
    y.value = withTiming(maxHeight, { duration: fullAnimationDuration })
  }, [y, maxHeight])

  const onHide = useCallback(() => {
    y.value = withTiming(tabBarHeight, { duration: fullAnimationDuration })
  }, [y, tabBarHeight])

  return (
    <MotiView
      style={[
        { justifyContent: 'space-between', display: 'flex' },
        draggableStyle,
      ]}
      className="absolute bottom-0 left-0 right-0 z-10 flex md:!hidden border-t-2 border-[--border-color] bg-[--bg-color]"
    >
      <View>
        <MiniPlayerBar
          onTogglePress={onExpand}
          animatedStyle={playerBarStyle}
        />
        <FullScreenPlayer
          onTogglePress={onHide}
          animatedStyle={fullScreenPlayerStyle}
        />
      </View>

      <MotiView style={[{ zIndex: 10 }, tabBarStyle]}>
        <MainTabBar currentTabName={currentTabName} />
      </MotiView>
    </MotiView>
  )
}
