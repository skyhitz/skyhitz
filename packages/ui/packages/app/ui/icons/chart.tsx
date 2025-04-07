'use client'
import Svg, { Path, G } from 'react-native-svg'

function Icon({ size = 24, color = 'currentColor' }) {
  return (
    <Svg viewBox="0 0 24 24">
      <G
        fill="none"
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Path d="M20.85 5.42l-6.54-1.45.44 6.68M14.31 4A13.16 13.16 0 0116 22.39" />
        <G>
          <Path d="M5 1.5H4a.5.5 0 00-.5.5v1M8 1.5h1a.5.5 0 01.5.5v1M8 7.5h1a.51.51 0 00.5-.5V6M5 7.5H4a.51.51 0 01-.5-.5V6M5 9.5H4a.5.5 0 00-.5.5v1M8 9.5h1a.5.5 0 01.5.5v1M8 15.5h1a.51.51 0 00.5-.5v-1M5 15.5H4a.51.51 0 01-.5-.5v-1M4 17.5h5s.5 0 .5.5v5s0 .5-.5.5H4s-.5 0-.5-.5v-5s0-.5.5-.5" />
        </G>
      </G>
    </Svg>
  )
}

export default Icon
