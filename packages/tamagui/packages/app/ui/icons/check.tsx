'use client'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

function Check({ size = 24, color = 'currentColor' }: Props) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size}>
      <Path
        d="M5 13L9 17L19 7"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

export default Check
