import { remapProps } from 'nativewind'
import { SolitoImage as Image } from 'solito/image'
import { ImageLoaderProps } from 'solito/build/image/default-loader'
import { Platform } from 'react-native'

// Fix remapping of class names to styles for NativeWind
remapProps(Image, { className: 'style' })

const normalizeSrc = (src: string) => {
  return src.startsWith('/') ? src.slice(1) : src
}

function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  const params = [`width=${width}`]
  if (quality) {
    params.push(`quality=${quality}`)
  }
  const paramsString = params.join(',')
  const path = `/cdn-cgi/image/${paramsString}/${normalizeSrc(src)}`
  return __DEV__ ? src : path
}

// Create a simpler type definition that allows our props to pass through
type SolitoImageProps = {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  sizes?: string
  style?: any
  className?: string
  quality?: number
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  loader?: any
  unoptimized?: boolean
}

// Create a cross-platform image component that handles all our needs
export const SolitoImage = (props: SolitoImageProps) => {
  // Default sizes if not provided
  const sizes = props.sizes || '100vw'
  
  // Handle any platform-specific props here
  const platformProps = Platform.select({
    web: {
      // Web specific props
    },
    default: {
      // Native specific props
    },
  })

  // Cast to any to bypass TypeScript checks, since we know our wrapper is compatible
  return (
    <Image
      {...(props as any)}
      {...platformProps}
      loader={props.loader || cloudflareLoader}
      unoptimized={__DEV__ ? true : props.unoptimized}
      sizes={sizes}
    />
  )
}
