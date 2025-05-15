'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  className?: string
  color?: string
}

export default function Repeat({
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
      <Path d="M17 1l4 4-4 4" />
      <Path d="M3 11V9a4 4 0 014-4h14" />
      <Path d="M7 23l-4-4 4-4" />
      <Path d="M21 13v2a4 4 0 01-4 4H3" />
    </Svg>
  )
}
