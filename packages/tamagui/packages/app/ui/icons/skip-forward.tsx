'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
  marginRight?: any
  marginLeft?: any
}

export default function SkipForward({
  size = 24,
  color = 'currentColor',
  marginRight,
  marginLeft,
  ...props
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M5 4l10 8-10 8V4z" />
      <Path d="M19 5v14" />
    </Svg>
  )
}
