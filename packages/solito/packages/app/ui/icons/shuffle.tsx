'use client'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export default function Shuffle({
  size = 24,
  color = 'currentColor',
  ...rest
}: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <Path d="M16 3h5v5" />
      <Path d="M4 20L21 3" />
      <Path d="M21 16v5h-5" />
      <Path d="M15 15l6 6" />
      <Path d="M4 4l5 5" />
    </Svg>
  )
}
