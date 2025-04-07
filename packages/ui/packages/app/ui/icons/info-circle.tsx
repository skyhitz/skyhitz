import React from 'react'
import Svg, { Path } from 'react-native-svg'
import { IconProps } from 'app/types'

function Icon({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <Svg fill="none" viewBox="0 0 24 24" width={size} height={size} {...props}>
      <Path
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 23.001c6.075 0 11-4.925 11-11s-4.925-11-11-11-11 4.925-11 11 4.925 11 11 11z"
      />
      <Path
        stroke="currentcolor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 17.005H13a1 1 0 01-1-1v-6.5a.5.5 0 00-.5-.5H10"
      />
      <Path
        stroke="currentcolor"
        d="M11.741 7a.25.25 0 110-.5M11.741 7a.25.25 0 000-.5"
      />
    </Svg>
  )
}

export default Icon
