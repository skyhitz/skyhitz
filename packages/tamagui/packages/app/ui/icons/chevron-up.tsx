'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export default function ChevronUp({
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
      <Path d="m18 15-6-6-6 6" />
    </Svg>
  )
}
