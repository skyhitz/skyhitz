'use client'
import Svg, { Path } from 'react-native-svg'

function Close({ className = '', size = 24, color = 'currentColor' }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} className={className}>
      <Path
        d="M6.75 6.75L17.25 17.25M17.25 6.75L6.75 17.25"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export default Close
