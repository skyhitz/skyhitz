import { Platform, Image as RNImage, type StyleProp, type ImageStyle } from 'react-native'
import NextImage, { type ImageProps as NextImageProps, type ImageLoaderProps } from 'next/image'
import type { ViewStyle } from 'react-native'

/**
 * Normalize src to work with Cloudflare Image CDN
 */
const normalizeSrc = (src: string) => {
  return src.startsWith('/') ? src.slice(1) : src
}

/**
 * Cloudflare Image CDN loader for Next.js Image optimization
 */
function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  const params = [`width=${width}`]
  if (quality) {
    params.push(`quality=${quality}`)
  }
  const paramsString = params.join(',')
  const path = `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`
  return __DEV__ ? src : path
}

/**
 * Cross-platform image props that work with both Next.js Image and React Native Image
 */
type SolitoImageProps = {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  sizes?: string
  style?: ViewStyle | ImageStyle
  className?: string
  quality?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  loader?: (props: ImageLoaderProps) => string
  unoptimized?: boolean
}

/**
 * Cross-platform Image component that uses Next.js Image on web and React Native Image on native
 * Compatible with Tamagui styling and layout primitives
 */
export const SolitoImage = (props: SolitoImageProps) => {
  const sizes = props.sizes || '100vw'

  if (Platform.OS === 'web') {
    // Web: Use Next.js Image with Cloudflare loader
    const imageProps: Partial<NextImageProps> = {
      src: props.src,
      alt: props.alt,
      fill: props.fill,
      width: props.width,
      height: props.height,
      sizes,
      style: props.style,
      className: props.className,
      priority: props.priority,
      placeholder: props.placeholder,
      blurDataURL: props.blurDataURL,
      loader: props.loader || cloudflareLoader,
      unoptimized: __DEV__ ? true : props.unoptimized,
      quality: props.quality,
    }
    return <NextImage {...(imageProps as NextImageProps)} />
  }

  // Native: Use React Native Image
  const resizeMode = props.contentFit === 'contain' ? 'contain' 
    : props.contentFit === 'fill' ? 'stretch'
    : props.contentFit === 'none' ? 'center'
    : 'cover'

  return (
    <RNImage
      source={{ uri: props.src }}
      accessibilityLabel={props.alt}
      resizeMode={resizeMode}
      style={props.style as StyleProp<ImageStyle>}
    />
  )
}
