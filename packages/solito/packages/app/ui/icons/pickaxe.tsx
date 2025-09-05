'use client'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export default function Pickaxe({ size = 24, color = 'currentColor', ...rest }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <Path d="M33 15l1.32 1.68L7 44l-3-3L31.32 13.68 33 15zM41 10l-3.55 3.55C37 13 36.51 12.51 36 12s-1-1-1.55-1.45L38 7z" />
      <Path d="M44 29 34.32 16.68 33 15l-1.68-1.32L19 4a25.81 25.81 0 0 1 15.45 6.55c.52.46 1 .94 1.55 1.45s1 1 1.45 1.55A25.81 25.81 0 0 1 44 29z" />
    </Svg>
  )
}