'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export default function Search(props: React.ComponentProps<typeof Svg>) {
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
      <Path d="M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z" />
      <Path d="M16 16l4.5 4.5" />
    </Svg>
  )
}
