'use client'
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  size?: number
  fill?: string
  className?: string
}

export default function Hitz({ size = 18, fill = 'currentColor', className }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <Path
        d="M12 2L4 6v6c0 4.97 3.2 9.59 8 11 4.8-1.41 8-6.03 8-11V6l-8-4zm0 4 4 2v2c0 3.31-2.02 6.37-5 7.45C8.02 14.37 6 11.31 6 8V8l6-2z"
        fill={fill}
      />
    </Svg>
  )
}


