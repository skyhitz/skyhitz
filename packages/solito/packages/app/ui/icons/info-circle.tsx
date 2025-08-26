'use client'
import * as React from 'react'
import Svg, { Path, Circle, Line } from 'react-native-svg'

type Props = React.ComponentProps<typeof Svg>

export default function InfoCircle(props: Props) {
  return (
    <Svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <Circle cx="12" cy="12" r="10" />
      <Line x1="12" y1="16" x2="12" y2="12" />
      <Line x1="12" y1="8" x2="12.01" y2="8" />
    </Svg>
  )
}
