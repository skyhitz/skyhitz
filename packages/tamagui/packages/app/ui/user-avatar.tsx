'use client'
import * as React from 'react'
import { Image, Platform } from 'react-native'
import { imageSrc } from 'app/utils/entry'
import { 
  gradientPairs, 
  textColors, 
  getGradientIndex, 
  getInitials, 
  getUserIdentifier,
} from 'app/utils/avatar'
import { YStack, Text } from 'tamagui'

type Size = 'small' | 'medium' | 'large' | 'xlarge'

const sizeMap = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 96,
}

const fontSizeMap = {
  small: '$2',
  medium: '$4',
  large: '$6',
  xlarge: '$8',
}

type UserAvatarProps = {
  avatarUrl?: string | null
  displayName?: string | null
  userId?: string | null
  email?: string | null
  size?: Size
}

export function UserAvatar({
  avatarUrl,
  displayName,
  userId,
  email,
  size = 'medium',
}: UserAvatarProps) {
  // State to track if the image failed to load
  const [imageError, setImageError] = React.useState(false)
  // Get initials from display name, fallback to email if no display name
  const initials = React.useMemo(() => {
    // Try to get initials from display name first
    if (displayName) {
      return getInitials(displayName)
    }
    
    // If no display name, try to use first character of email
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    
    // Fallback to question mark
    return '?'
  }, [displayName, email])

  // Process the avatar URL and validate it
  const processedAvatarUrl = React.useMemo(() => {
    // Early return if we already know the image has errors
    if (imageError) return null;
    
    if (!avatarUrl) return null;
    
    // Handle empty strings, undefined, or null
    if (avatarUrl.trim() === '') return null;
    
    // Handle potentially invalid ipfs:// URLs that might not have been properly formatted
    if (avatarUrl.startsWith('ipfs://') && avatarUrl.length < 15) return null;
    
    // Process the URL with imageSrc helper
    return imageSrc(avatarUrl);
  }, [avatarUrl, imageError])
  
  // Use nullish coalescing for safety with size
  const sizeValue = size ? sizeMap[size] : sizeMap.medium
  const fontSize = size ? fontSizeMap[size] : fontSizeMap.medium
  
  // Get a consistent gradient based on user identifier
  const identifier = React.useMemo(() => {
    return getUserIdentifier(userId, displayName)
  }, [userId, displayName])
  
  const gradientIndex = React.useMemo(() => {
    return getGradientIndex(identifier)
  }, [identifier])
  
  // Get gradient colors - ensure we have a valid gradient pair and fallback if not
  const gradientColors = React.useMemo(() => {
    const colors = gradientIndex !== undefined ? gradientPairs[gradientIndex] : gradientPairs[0]
    // Ensure we have at least two colors for the gradient
    return colors && colors.length >= 2 ? colors as [string, string] : ['#FF5E3A', '#FF2A68'] as [string, string]
  }, [gradientIndex])
  
  const textColor = React.useMemo(() => {
    return gradientIndex !== undefined ? textColors[gradientIndex] : textColors[0]
  }, [gradientIndex])
  
  return (
    <YStack
      overflow="hidden"
      borderRadius="$10"
      height={sizeValue}
      width={sizeValue}
    >
      {processedAvatarUrl && !imageError ? (
        <Image
          source={{ uri: processedAvatarUrl }}
          style={{ height: '100%', width: '100%' }}
          alt={displayName || 'User avatar'}
          onError={() => {
            // Mark this image as failed so we show the placeholder
            console.log('Avatar image failed to load:', processedAvatarUrl);
            setImageError(true);
          }}
        />
      ) : (
        <YStack 
          flex={1}
          height="100%"
          width="100%"
          alignItems="center"
          justifyContent="center"
          style={{
            backgroundColor: gradientColors[0],
            ...(Platform.OS === 'web' ? {
              // @ts-ignore - this is valid in web but not in React Native types
              backgroundImage: `linear-gradient(135deg, ${gradientColors[0]} 0%, ${gradientColors[1]} 100%)`
            } : {})
          }}
        >
          <Text 
            fontWeight="500"
            fontSize={fontSize}
            color={textColor}
          >
            {initials}
          </Text>
        </YStack>
      )}
    </YStack>
  )
}
