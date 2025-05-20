'use client'
import Svg, { Path } from 'react-native-svg'
import { cssInterop } from 'nativewind'

cssInterop(Svg, { className: 'style' })

function Icon({ size = 24 }) {
  return (
    <Svg
      fill="none"
      viewBox="0 0 10 10"
      height={size}
      width={size}
      className="text-[--text-color]"
    >
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 0.5v6"
        strokeWidth="1"
      ></Path>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m7 4.5 -2 2 -2 -2"
        strokeWidth="1"
      ></Path>
      <Path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M0.5 7.5v1a1 1 0 0 0 1 1h7a1 1 0 0 0 1 -1v-1"
        strokeWidth="1"
      ></Path>
    </Svg>
  )
}

export default Icon
