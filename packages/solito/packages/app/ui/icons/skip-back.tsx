'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  className?: string
  color?: string
}

export default function SkipBack({
  size = 24,
  className = '',
  color = 'currentColor',
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
      className={className}
    >
      <Path d="M19 20L9 12l10-8v16z" />
      <Path d="M5 19V5" />
    </Svg>
  )
}
