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
        d="M76 67c-6 1-3-66-3-66s21 72 62 103c25 18-54-37-59-37zm-11 0c-5 0-84 55-59 37C48 73 69 1 69 1s2 67-4 66z"
        fill="currentColor"
      />
    </Svg>
  )
}


