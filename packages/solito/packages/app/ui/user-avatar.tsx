'use client'
import * as React from 'react'
import { Image, View, Text } from 'react-native'
import { imageSrc } from 'app/utils/entry'

type Size = 'small' | 'medium' | 'large' | 'xlarge'

const sizeMap = {
  small: 'h-8 w-8',
  medium: 'h-12 w-12',
  large: 'h-16 w-16',
  xlarge: 'h-24 w-24',
}

type UserAvatarProps = {
  avatarUrl?: string | null
  displayName?: string | null
  size?: Size
  className?: string
}

export function UserAvatar({
  avatarUrl,
  displayName,
  size = 'medium',
  className = '',
}: UserAvatarProps) {
  // Get initials from display name for fallback
  const initials = React.useMemo(() => {
    if (!displayName) return '?'
    
    const parts = displayName.trim().split(/\s+/)
    if (parts.length === 1) {
      // Safely handle possible undefined first part
      return parts[0]?.charAt(0)?.toUpperCase() || '?'
    }
    
    // Safely handle possible undefined first or last part
    const firstInitial = parts[0]?.charAt(0) || ''
    const lastInitial = parts[parts.length - 1]?.charAt(0) || ''
    return `${firstInitial}${lastInitial}`.toUpperCase()
  }, [displayName])

  // Use imageSrc to handle IPFS URLs
  const processedAvatarUrl = avatarUrl ? imageSrc(avatarUrl) : null
  
  // Use nullish coalescing for safety with size
  const sizeClass = size ? sizeMap[size] : sizeMap.medium
  
  return (
    <View
      className={`overflow-hidden rounded-full bg-gray-700 ${sizeClass} ${className}`}
    >
      {processedAvatarUrl ? (
        <Image
          source={{ uri: processedAvatarUrl }}
          className="h-full w-full"
          alt={displayName || 'User avatar'}
        />
      ) : (
        <View className="flex h-full w-full items-center justify-center">
          <View className="flex-1 items-center justify-center">
            <Text className="text-center text-white">{initials}</Text>
          </View>
        </View>
      )}
    </View>
  )
}
