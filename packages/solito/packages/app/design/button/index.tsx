'use client'
import * as React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

type ButtonSize = 'small' | 'medium' | 'large'
type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger'

type ButtonProps = {
  text: string
  onPress: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  className?: string
  textClassName?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export function Button({
  text,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  className = '',
  textClassName = '',
  icon,
  iconPosition = 'left',
}: ButtonProps) {
  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1',
    medium: 'px-4 py-2',
    large: 'px-5 py-3',
  }

  // Text size classes
  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }

  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 border-blue-600',
    secondary: 'bg-gray-700 border-gray-700',
    outlined: 'bg-transparent border-gray-600',
    danger: 'bg-red-600 border-red-600',
  }

  // Text color classes
  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outlined: 'text-white',
    danger: 'text-white',
  }

  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={`
        flex-row items-center justify-center rounded-lg border
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${isDisabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View className="flex-row items-center">
          {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
          
          <Text 
            className={`
              font-medium
              ${textSizeClasses[size]} 
              ${textColorClasses[variant]}
              ${textClassName}
            `}
          >
            {text}
          </Text>
          
          {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  )
}
