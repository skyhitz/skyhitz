'use client'
import { Platform, View, ViewProps, ColorValue } from 'react-native'
import { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'

interface GradientBackgroundProps extends ViewProps {
  children: ReactNode
  className?: string
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]]
  start?: { x: number; y: number }
  end?: { x: number; y: number }
}

/**
 * A wrapper component that renders a LinearGradient on native platforms
 * and uses CSS classes for web
 */
export function GradientBackground({
  children,
  className = '',
  colors = ['#63AADF', '#21ACFE', '#D4EFFF'] as const, // Default blue gradient colors with const assertion
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  ...props
}: GradientBackgroundProps) {
  if (Platform.OS === 'web') {
    return (
      <View className={className} {...props}>
        {children}
      </View>
    )
  }

  // On native, use LinearGradient
  // Make a copy of props without the style to avoid spreading type error
  const { style, ...restProps } = props

  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[{ flex: 1 }, style]}
    >
      <View {...restProps}>{children}</View>
    </LinearGradient>
  )
}
