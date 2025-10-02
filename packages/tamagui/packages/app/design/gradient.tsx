import { LinearGradient } from '@tamagui/linear-gradient'
import { YStack, styled } from 'tamagui'
import { ComponentProps } from 'react'

// Gradient component using Tamagui's LinearGradient
export const Gradient = styled(LinearGradient, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
})

// Blue gradient for hero sections
export const BlueGradient = ({
  children,
  ...props
}: ComponentProps<typeof YStack>) => {
  return (
    <YStack position="relative" {...props}>
      <Gradient
        colors={['$blue7', '$blue9', '$blue11']}
        start={[0, 0]}
        end={[1, 1]}
      />
      {children}
    </YStack>
  )
}

// Dark gradient for backgrounds
export const DarkGradient = ({
  children,
  ...props
}: ComponentProps<typeof YStack>) => {
  return (
    <YStack position="relative" {...props}>
      <Gradient
        colors={['$color2', '$color4', '$color6']}
        start={[0, 0]}
        end={[1, 1]}
      />
      {children}
    </YStack>
  )
}

// Alias for compatibility
export const GradientBackground = BlueGradient
