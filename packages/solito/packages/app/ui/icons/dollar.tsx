'use client'
import * as React from 'react'
import Svg, { Path, Circle } from 'react-native-svg'

type Props = React.ComponentProps<typeof Svg>

export default function Dollar(props: Props) {
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
      <Path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
      <Path d="M12 6v12" />
    </Svg>
  )
}
