import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { YStack, AnimatePresence } from 'tamagui'
import type { WithTimingConfig } from 'react-native-reanimated'

type Props = {
  children?: React.ReactNode
  /**
   * Custom transition for the outer View, which animates the `height`.
   *
   * Defaults to duration of of 200.
   */
  heightTransition?: WithTimingConfig
  /**
   * Custom transition for the inner view that wraps the children, which animates the `opacity`.
   * Defaults to duration of of 200.
   */
  childrenTransition?: WithTimingConfig
  /**
   * If `true`, the height will automatically animate to 0. Default: `false`.
   */
  hide?: boolean
  /**
   * If `true`, the initial height will animate in.
   * Otherwise it will only animate subsequent height changes.
   * Default: `false`.
   */
  shouldAnimateInitialHeight?: boolean
  /**
   * Optionally provide an initial height. You use `shouldAnimateInitialHeight` instead
   * if all you're trying to do is prevent the initial height from animating in.
   */
  initialHeight?: number
  onHeightDidAnimate?: (height: number) => void
  style?: StyleProp<ViewStyle>
}

/**
 * Simplified Tamagui AnimateHeight using AnimatePresence
 */
export function AnimateHeight({
  children,
  hide = false,
  style,
}: Props) {
  return (
    <YStack
      overflow="hidden"
      animation="quick"
      height={hide ? 0 : 'auto'}
      opacity={hide ? 0 : 1}
      style={style as any}
    >
      {children}
    </YStack>
  )
}
