'use client'
import * as React from 'react'
import Svg, { Path, Circle } from 'react-native-svg'

type Props = React.ComponentProps<typeof Svg>

export default function Moon(props: Props) {
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
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </Svg>
  )
}
