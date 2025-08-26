'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export default function PlayIcon({
  className,
  size = 24,
  ...props
}: React.ComponentProps<typeof Svg> & { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <Path d="M8 5.14v14l11-7-11-7z" fill="currentColor" stroke="none" />
    </Svg>
  )
}
