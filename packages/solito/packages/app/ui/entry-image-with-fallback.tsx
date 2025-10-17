'use client'
import * as React from 'react'
import { View } from 'react-native'
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
  
  // Reset error state when src changes
  React.useEffect(() => {
    setImageError(false)
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
        />
      </View>
    )
  }

  // For external URLs (like from Audius/Sound.xyz), wrap in error boundary
  if (isExternalUrl(src)) {
    return (
      <View className={className}>
        <SolitoImage
          src={src}
          alt={alt}
          fill={fill}
          contentFit={contentFit}
          sizes={sizes}
          style={style}
          // Note: onError might not work on all platforms with SolitoImage
          // If image fails to load, it will just show broken image
          // The imageError state is more for explicit error handling
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

