'use client'
import * as React from 'react'
import { View, Image as RNImage, Platform } from 'react-native'
import { SolitoImage } from 'app/design/solito-image'
import { EntryImagePlaceholder } from 'app/ui/entry-image-placeholder'
import { isExternalUrl } from 'app/utils/external-entry'

type Size = 'small' | 'medium' | 'large'

type EntryImageWithFallbackProps = {
  src?: string
  alt: string
  title?: string
  entryId?: string
  size?: Size
  fill?: boolean
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  sizes?: string
  style?: any
  className?: string
  placeholderSize?: Size
}

/**
 * Entry image component that shows a gradient placeholder on error
 * Especially useful for external music sources that may have unreliable images
 */
export function EntryImageWithFallback({
  src,
  alt,
  title,
  entryId,
  size,
  fill,
  contentFit = 'cover',
  sizes,
  style,
  className = '',
  placeholderSize = 'small',
}: EntryImageWithFallbackProps) {
  const [imageError, setImageError] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  
  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false)
    setIsLoading(true)
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // For external URLs, test if the image can load
    if (src && isExternalUrl(src)) {
      // Set a timeout to show placeholder if image takes too long
      timeoutRef.current = setTimeout(() => {
        if (isLoading) {
          console.log('[EntryImageWithFallback] Image load timeout:', src)
          setImageError(true)
          setIsLoading(false)
        }
      }, 5000) // 5 second timeout
      
      // Test if image can load using Image.prefetch (web) or just Image (native)
      if (Platform.OS === 'web') {
        // On web, try to load the image
        const img = new window.Image()
        img.onload = () => {
          setIsLoading(false)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
        img.onerror = () => {
          console.log('[EntryImageWithFallback] Image load error:', src)
          setImageError(true)
          setIsLoading(false)
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
        }
        img.src = src
      } else {
        // On native, use RNImage.prefetch
        RNImage.prefetch(src)
          .then(() => {
            setIsLoading(false)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          })
          .catch(() => {
            console.log('[EntryImageWithFallback] Image prefetch failed:', src)
            setImageError(true)
            setIsLoading(false)
            if (timeoutRef.current) clearTimeout(timeoutRef.current)
          })
      }
    } else {
      setIsLoading(false)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [src])

  // Show placeholder if no src or if image failed to load
  if (!src || imageError) {
    return (
      <View className={className} style={style}>
        <EntryImagePlaceholder
          title={title || alt}
          entryId={entryId}
          size={placeholderSize}
          style={style}
          className={className}
        />
      </View>
    )
  }

  // Show placeholder while loading external images
  if (isExternalUrl(src) && isLoading) {
    return (
      <View className={className} style={style}>
        <EntryImagePlaceholder
          title={title || alt}
          entryId={entryId}
          size={placeholderSize}
          style={style}
          className={className}
        />
      </View>
    )
  }

  // For external URLs that passed validation, show the image
  if (isExternalUrl(src)) {
    return (
      <View className={className} style={style}>
        <SolitoImage
          src={src}
          alt={alt}
          fill={fill}
          contentFit={contentFit}
          sizes={sizes}
          style={style}
        />
      </View>
    )
  }

  // For IPFS/R2 images, just use the image directly
  return (
    <SolitoImage
      src={src}
      alt={alt}
      fill={fill}
      contentFit={contentFit}
      sizes={sizes}
      style={style}
      className={className}
    />
  )
}

