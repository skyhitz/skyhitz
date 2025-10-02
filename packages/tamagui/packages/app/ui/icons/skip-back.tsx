'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { GetProps } from 'tamagui'

type Props = {
  size?: number
  color?: string
  marginRight?: any
  marginLeft?: any
}

export default function SkipBack({
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
      <Path d="M19 20L9 12l10-8v16z" />
      <Path d="M5 19V5" />
    </Svg>
  )
}
