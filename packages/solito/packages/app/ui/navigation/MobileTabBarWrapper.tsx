'use client'
import DashboardTabBar from './DashboardTabBar'
import { useCallback, useEffect, useMemo } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { useTheme } from 'app/state/theme/useTheme'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  withTiming
} from 'react-native-reanimated'

const fullAnimationDuration = 400

export function MobileTabBarWrapper({
  currentTabName,
}: {
  currentTabName: string
}) {
  const insets = useSafeArea()
  const { height } = useWindowDimensions()
  const { isDark } = useTheme()

  const tabBarHeight = 54 + insets.bottom // 54 for tab bar height + bottom inset

  const maxHeight = useMemo(() => height + insets.top, [insets, height])

  const y = useSharedValue(tabBarHeight)

  useEffect(() => {
    y.value = tabBarHeight
  }, [tabBarHeight])

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

  return (
    <Animated.View 
      className="absolute bottom-0 left-0 right-0 z-10 flex md:!hidden"
      style={[
        {
          transform: [{ translateY: y.value }],
          borderTopWidth: 2,
          borderTopColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-color)',
        }
      ]}
    >
      <Animated.View style={[{ zIndex: 10 }, tabBarStyle]}>
        <DashboardTabBar
          currentTabName={currentTabName}
        />
      </Animated.View>
    </Animated.View>
  )
}
