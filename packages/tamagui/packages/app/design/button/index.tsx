'use client'
import * as React from 'react'
import { Button as TamaguiButton, Spinner, XStack, GetProps } from 'tamagui'

type ButtonSize = 'small' | 'medium' | 'large'
type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger'

type ButtonProps = {
  text: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
} & Omit<GetProps<typeof TamaguiButton>, 'onPress' | 'disabled' | 'size'>

export function Button({
  text,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  ...props
}: ButtonProps) {
  // Size mapping to Tamagui tokens
  const sizeMapping = {
    small: { paddingHorizontal: '$3', paddingVertical: '$1.5', fontSize: '$2' },
    medium: { paddingHorizontal: '$4', paddingVertical: '$2.5', fontSize: '$3' },
    large: { paddingHorizontal: '$5', paddingVertical: '$3.5', fontSize: '$4' },
  }

  // Variant styles
  const variantStyles = {
    primary: { 
      backgroundColor: '$blue9', 
      borderColor: '$blue9',
      color: '$white1',
      hoverStyle: { backgroundColor: '$blue10' }
    },
    secondary: { 
      backgroundColor: '$gray8', 
      borderColor: '$gray8',
      color: '$white1',
      hoverStyle: { backgroundColor: '$gray9' }
    },
    outlined: { 
      backgroundColor: 'transparent', 
      borderColor: '$gray8',
      color: '$white1',
      hoverStyle: { backgroundColor: '$gray3' }
    },
    danger: { 
      backgroundColor: '$red9', 
      borderColor: '$red9',
      color: '$white1',
      hoverStyle: { backgroundColor: '$red10' }
    },
  }

  const isDisabled = disabled || loading

  return (
    <TamaguiButton
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      borderRadius="$3"
      borderWidth={1}
      opacity={isDisabled ? 0.5 : 1}
      {...sizeMapping[size]}
      {...variantStyles[variant]}
      {...props}
    >
      {loading ? (
        <Spinner size="small" color="$white1" />
      ) : (
        <XStack gap="$2" alignItems="center">
          {icon && iconPosition === 'left' && icon}
          <TamaguiButton.Text fontSize={sizeMapping[size].fontSize} fontWeight="500">
            {text}
          </TamaguiButton.Text>
          {icon && iconPosition === 'right' && icon}
        </XStack>
      )}
    </TamaguiButton>
  )
}
