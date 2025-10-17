'use client'
import * as React from 'react'
import { View, Text, Platform, StyleSheet } from 'react-native'
import { 
  gradientPairs, 
  textColors, 
  getGradientIndex, 
  getInitials,
} from 'app/utils/avatar'

type Size = 'small' | 'medium' | 'large'

const sizeMap = {
  small: 48,
  medium: 200,
  large: 400,
}

const fontSizeMap = {
  small: 16,
  medium: 64,
  large: 128,
}

type EntryImagePlaceholderProps = {
  title?: string
  entryId?: string
  size?: Size
  className?: string
  style?: any
}

/**
 * Squared gradient placeholder for entry images
 * Similar to gradient avatars but squared and uses entry title for initials
 */
export function EntryImagePlaceholder({
  title,
  entryId,
  size = 'medium',
  className = '',
  style,
}: EntryImagePlaceholderProps) {
  
  // Get initials from title
  const initials = React.useMemo(() => {
    if (title) {
      return getInitials(title)
    }
    return '?'
  }, [title])

  // Use entry ID or title to get a consistent gradient
  const identifier = React.useMemo(() => {
    return entryId || title || 'default'
  }, [entryId, title])
  
  const gradientIndex = React.useMemo(() => {
    return getGradientIndex(identifier)
  }, [identifier])
  
  // Get gradient colors
  const gradientColors = React.useMemo(() => {
    const colors = gradientIndex !== undefined ? gradientPairs[gradientIndex] : gradientPairs[0]
    return colors && colors.length >= 2 ? colors as [string, string] : ['#FF5E3A', '#FF2A68'] as [string, string]
  }, [gradientIndex])
  
  const textColor = React.useMemo(() => {
    return gradientIndex !== undefined ? textColors[gradientIndex] : textColors[0]
  }, [gradientIndex])

  const sizeValue = sizeMap[size]
  const fontSize = fontSizeMap[size]
  
  return (
    <View 
      className={`flex items-center justify-center ${className}`}
      style={[
        {
          width: '100%',
          height: '100%',
          minWidth: sizeValue,
          minHeight: sizeValue,
          backgroundColor: gradientColors[0],
          ...(Platform.OS === 'web' ? {
            // @ts-ignore - this is valid in web but not in React Native types
            backgroundImage: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
          } : {})
        },
        style
      ]}
    >
      <Text 
        className="font-medium"
        style={{ 
          color: textColor,
          fontSize: fontSize,
        }}
      >
        {initials}
      </Text>
    </View>
  )
}

