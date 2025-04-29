'use client'
import Svg, { Path, G } from 'react-native-svg'

function Icon({ size = 24, color = 'currentColor' }) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <G
        fill="none"
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M8 10.36a1.25 1.25 0 102.5 0 1.25 1.25 0 10-2.5 0M13 8.86a1.25 1.25 0 102.5 0 1.25 1.25 0 10-2.5 0" />
        <Path d="M10.5 10.36V5.83a1 1 0 01.68-1l3-.83a1 1 0 01.9.14 1 1 0 01.42.86v3.86" />
        <G>
          <Path d="M19.5 14.5v-13a1 1 0 00-1-1h-13a1 1 0 00-1 1v13M23.5 22.5a1 1 0 01-1 1h-21a1 1 0 01-1-1v-6h7v1a2 2 0 002 2h5a2 2 0 002-2v-1h7zM.5 16.5l4-6M19.5 10.5l4 6" />
        </G>
      </G>
    </Svg>
  )
}

export default Icon
