'use client'
import { useState, useEffect } from 'react'
import {
  View,
  PanResponder,
  Pressable,
  useWindowDimensions,
} from 'react-native'
import { MotiView } from 'moti'

export const Slider = ({
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  progress,
  minimumValue = 0,
  maximumValue = 1,
  value = 0,
  minimumTrackTintColor = '#19aafe',
  maximumTrackTintColor = '#d3d3d3',
  thumbTintColor = '#19aafe',
  style,
}: {
  onValueChange?: (val: number) => void
  onSlidingStart?: (val: number) => void
  onSlidingComplete?: (val: number) => void
  progress?: number
  minimumValue?: number
  maximumValue?: number
  value?: number
  minimumTrackTintColor?: string
  maximumTrackTintColor?: string
  thumbTintColor?: string
  style?: any
}) => {
  const [sliderWidth, setSliderWidth] = useState(0)
  const [progressSync, setProgressSync] = useState(true)
  const [sliderPosition, setSliderPosition] = useState(0)
  const { width: screenWidth } = useWindowDimensions()

  // Handle both progress-based (0-1) and value-based (min-max) APIs
  useEffect(() => {
    if (progressSync) {
      if (progress !== undefined) {
        // If using progress API (0-1)
        const newPosition = progress * sliderWidth
        setSliderPosition(newPosition)
      } else if (value !== undefined && maximumValue !== minimumValue) {
        // If using value API (min-max)
        const normalizedValue =
          (value - minimumValue) / (maximumValue - minimumValue)
        const newPosition = normalizedValue * sliderWidth
        setSliderPosition(newPosition)
      }
    }
  }, [progress, value, sliderWidth, progressSync, minimumValue, maximumValue])

  const calculateValue = (newLeft: number) => {
    const ratio = newLeft / sliderWidth
    if (progress !== undefined) {
      // If using progress API (0-1)
      return ratio
    } else {
      // If using value API (min-max)
      return minimumValue + ratio * (maximumValue - minimumValue)
    }
  }

  const updatePosition = (newPosition: number) => {
    if (newPosition < 0) {
      newPosition = 0
    } else if (newPosition > sliderWidth) {
      newPosition = sliderWidth
    }
    setSliderPosition(newPosition)
    const value = calculateValue(newPosition)
    onValueChange && onValueChange(value)
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setProgressSync(false)
      const value = calculateValue(sliderPosition)
      onSlidingStart && onSlidingStart(value)
    },
    onPanResponderMove: (event, gestureState) => {
      updatePosition(gestureState.moveX - (screenWidth - sliderWidth) / 2)
    },
    onPanResponderRelease: () => {
      const value = calculateValue(sliderPosition)
      onSlidingComplete && onSlidingComplete(value)
      setProgressSync(true)
    },
    onPanResponderTerminationRequest: () => true,
  })

  const handleBarPress = (event: any) => {
    let touchPosition
    if (event.nativeEvent.locationX !== undefined) {
      // For mobile
      touchPosition = event.nativeEvent.locationX
    } else if (event.nativeEvent.clientX !== undefined) {
      // For web
      const sliderBar = event.currentTarget.getBoundingClientRect()
      touchPosition = event.nativeEvent.clientX - sliderBar.left
    }

    if (touchPosition !== undefined) {
      setProgressSync(false)
      updatePosition(touchPosition)
      const value = calculateValue(touchPosition)
      onSlidingComplete && onSlidingComplete(value)
      setProgressSync(true)
    }
  }

  return (
    <Pressable
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout
        setSliderWidth(width)
      }}
      onPress={handleBarPress}
      style={style}
      className={'flex justify-center items-center flex-grow h-10'}
    >
      <View className="relative w-full rounded-full -top-[0.175rem]">
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: 4,
            backgroundColor: maximumTrackTintColor,
            width: sliderWidth,
            borderRadius: 9999,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: 4,
            backgroundColor: minimumTrackTintColor,
            width: sliderPosition,
            borderRadius: 9999,
          }}
        />
        <MotiView
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: thumbTintColor,
            position: 'absolute',
            left: sliderPosition - 6, // Center the slider
            top: -4,
          }}
          {...panResponder.panHandlers}
        />
      </View>
    </Pressable>
  )
}
