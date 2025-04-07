import React, { useState, useEffect } from 'react'
import {
  View,
  PanResponder,
  Pressable,
  useWindowDimensions,
} from 'react-native'
import { MotiView } from 'moti'
import { theme } from 'app/design/tailwind/theme'

export const Slider = ({
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
  progress,
}: {
  onValueChange: (val: number) => void
  onSlidingStart?: (val: number) => void
  onSlidingComplete?: (val: number) => void
  progress: number
}) => {
  const [sliderWidth, setSliderWidth] = useState(0)
  const [progressSync, setProgressSync] = useState(true)
  const [sliderPosition, setSliderPosition] = useState(0)
  const { width: screenWidth } = useWindowDimensions()

  useEffect(() => {
    if (progressSync) {
      const newPosition = progress * sliderWidth
      setSliderPosition(newPosition)
    }
  }, [progress, sliderWidth, progressSync])

  const calculateValue = (newLeft: number) => {
    return newLeft / sliderWidth
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
      const value = calculateValue(sliderPosition)
      onSlidingStart && onSlidingStart(value)
    },
    onPanResponderMove: (event, gestureState) => {
      updatePosition(gestureState.moveX - (screenWidth - sliderWidth) / 2)
    },
    onPanResponderRelease: () => {
      const value = calculateValue(sliderPosition)
      onSlidingComplete && onSlidingComplete(value)
    },
    onPanResponderTerminationRequest: () => true, // Handle responder termination for complex gestures
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
      style={{
        width: '100%',
        height: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View className="relative w-full rounded-full">
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: 4,
            backgroundColor: (theme as any)?.extend?.colors?.['grey']['light'],
            width: sliderWidth,
            borderRadius: 9999,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            height: 4,
            backgroundColor: (theme as any)?.extend?.colors?.['blue']['brand'], // Color of the progress part
            width: sliderPosition,
            borderRadius: 9999,
          }}
        />
        <MotiView
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: (theme as any)?.extend?.colors?.['blue']['brand'],
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
