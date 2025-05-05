'use client'

import * as React from 'react'
import { SolitoImage } from 'solito/image'
import { Platform, Image as RNImage, StyleSheet } from 'react-native'
import type { ImageProps as RNImageProps } from 'react-native'

type CommonImageProps = {
  alt?: string
  width?: number
  height?: number
  quality?: number
  fill?: boolean
  style?: any
}

type WebImageProps = CommonImageProps & {
  src: string
  className?: string
}

type NativeImageProps = CommonImageProps & RNImageProps

export type ImageProps = (WebImageProps | NativeImageProps) & {
  source?: any
  className?: string
}

export default function Image(props: ImageProps) {
  const { source, alt = '', style, className, width, height, quality, fill, ...rest } = props
  
  if (Platform.OS === 'web') {
    // Extract src from source for web
    const src = typeof source === 'object' && source && 'uri' in source 
      ? source.uri 
      : (props as WebImageProps).src || ''
    
    if (!src) {
      console.warn('Image component requires src or source.uri')
      return null
    }

    // Web implementation using Next.js Image
    const imgProps: any = {
      src,
      alt,
      style,
      quality: quality || 90,
      ...rest
    }

    // Next.js Image requires either width+height or fill prop
    if (fill) {
      imgProps.fill = true
    } else {
      imgProps.width = width || 300
      imgProps.height = height || 300
    }

    return <SolitoImage {...imgProps} />
  } else {
    // React Native implementation - className is not applicable in React Native
    // Just use the style prop and pass all other props through
    return <RNImage source={source} style={style} {...rest} />
  }
}
