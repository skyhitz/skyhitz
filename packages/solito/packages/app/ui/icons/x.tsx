'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function X(props: React.ComponentProps<typeof Svg>) {
  return (
    <Svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M18 6L6 18M6 6l12 12" />
    </Svg>
  )
}
