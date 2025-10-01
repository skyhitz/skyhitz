import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  WithTimingConfig,
} from 'react-native-reanimated'

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

const styles = StyleSheet.create({
  autoBottom: {
    bottom: 'auto',
  },
  hidden: {
    overflow: 'hidden',
  },
})

const defaultTransition: WithTimingConfig = {
  duration: 200,
} as const

/**
 * Animates the height change of its children
 */
export function AnimateHeight({
  children,
  heightTransition = defaultTransition,
  childrenTransition = defaultTransition,
  hide = false,
  initialHeight = 0,
  onHeightDidAnimate,
  style,
  shouldAnimateInitialHeight = false,
}: Props) {
  // as long as we should animate the initial height (or the content is hidden), we can animate the next height change
  const canAnimateNext = React.useRef(hide || shouldAnimateInitialHeight)

  const measuredHeight = useSharedValue(initialHeight)

  const childStyle = useAnimatedStyle(
    () => ({
      opacity: withTiming(
        !measuredHeight.value || hide ? 0 : 1,
        childrenTransition,
      ),
    }),
    [hide, measuredHeight],
  )

  const containerStyle = useAnimatedStyle(() => {
    return {
      height: withTiming(
        hide ? 0 : measuredHeight.value,
        heightTransition,
        () => {
          if (onHeightDidAnimate) {
            runOnJS(onHeightDidAnimate)(measuredHeight.value)
          }
        },
      ),
    }
  }, [hide, measuredHeight])

  // just return a normal View with the children if we shouldn't animate yet
  if (!canAnimateNext.current) {
    return (
      <View
        style={[styles.hidden, style]}
        onLayout={({ nativeEvent }) => {
          // once we have a height, we can animate the next height changes
          if (nativeEvent.layout.height > 0) {
            // make sure we set the correct height so the children don't jump
            // on the first animation
            measuredHeight.value = Math.ceil(nativeEvent.layout.height)
            // give it a render loop since we need the containerStyle to update to the
            // starting height or it'll animate initially still if a re-render is triggered
            // (eg. this can happen if this is within a scrollview in a screen that is being pushed onto the stack.)
            setTimeout(() => {
              canAnimateNext.current = true
            })
          }
        }}
      >
        {children}
      </View>
    )
  }

  return (
    <Animated.View style={[styles.hidden, style, containerStyle]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.autoBottom, childStyle]}
        onLayout={({ nativeEvent }) => {
          measuredHeight.value = Math.ceil(nativeEvent.layout.height)
        }}
      >
        {children}
      </Animated.View>
    </Animated.View>
  )
}
