import DashboardTabBar from 'app/ui/navigation/dashboardTabBar'
import { useCallback, useEffect, useMemo } from 'react'
import { MiniPlayerBar } from 'app/features/player/miniPlayerBar'
import { FullScreenPlayer } from 'app/features/player/fullScreenPlayer'
import {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming,
} from 'react-native-reanimated'
import { View, useWindowDimensions } from 'react-native'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { MotiView } from 'moti'

const fullAnimationDuration = 400

export function MobileTabBarWrapper({
  currentTabName,
}: {
  currentTabName: string
}) {
  const insets = useSafeArea()
  const { height } = useWindowDimensions()

  const tabBarHeight = 54 + insets.bottom + 40 // 52 + 2 border + 40 miniplayer

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
      Extrapolation.CLAMP,
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
      Extrapolation.CLAMP,
    )
    const translation = interpolate(
      y.value,
      [tabBarHeight, maxHeight],
      [0, tabBarHeight],
      Extrapolation.CLAMP,
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
      Extrapolation.CLAMP,
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
      className="md:!h-20 md:border-t md:border-gray-200"
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
        <DashboardTabBar
          currentTabName={currentTabName}
          className="md:hidden"
        />
      </MotiView>
    </MotiView>
  )
}
