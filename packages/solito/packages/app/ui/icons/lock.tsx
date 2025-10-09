'use client'
import { cssInterop } from 'nativewind'
import Svg, { Path } from 'react-native-svg'

cssInterop(Svg, { className: 'style' })

function Icon({ size = 18 }) {
  return (
    <Svg viewBox="0 0 24 24" height={size} width={size} className="text-[--text-color]">
      <Path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 11V7a5 5 0 10-10 0v4M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
      />
    </Svg>
  )
}

export default Icon


