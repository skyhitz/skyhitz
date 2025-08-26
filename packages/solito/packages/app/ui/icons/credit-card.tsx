'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export default function CreditCard({
  className,
  ...props
}: React.ComponentProps<typeof Svg>) {
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
      className={className}
      {...props}
    >
      <Path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <Path d="M1 10h22" />
    </Svg>
  )
}
