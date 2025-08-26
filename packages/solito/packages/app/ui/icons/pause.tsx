import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
  className?: string
  stroke?: string
}

export default function PauseIcon({
  size = 24,
  color = 'currentColor',
  stroke,
  ...rest
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      fill="none"
      stroke={stroke || color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      {...rest}
    >
      <Path d="M6 4H10V20H6z" />
      <Path d="M14 4H18V20H14z" />
    </Svg>
  )
}
