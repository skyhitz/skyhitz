import { remapProps } from 'nativewind'
import { SolitoImageProps } from 'solito/build/image/image.types'
import { ImageLoaderProps } from 'solito/build/image/default-loader'
import { SolitoImage as Image } from 'solito/image'

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

export const SolitoImage = (props: SolitoImageProps) => (
  <Image
    {...props}
    loader={cloudflareLoader}
    unoptimized={__DEV__ ? true : props.unoptimized}
  />
)
