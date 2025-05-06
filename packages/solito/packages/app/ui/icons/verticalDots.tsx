import * as React from 'react'
import Svg, { SvgProps, G, Circle } from 'react-native-svg'

interface Props extends SvgProps {
  size?: number
  stroke?: string
}

const VerticalDots = ({
  size = 24,
  stroke = "#6B7280",
  ...props
}: Props) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <G>
        <Circle cx="12" cy="6" r="2" fill={stroke} />
        <Circle cx="12" cy="12" r="2" fill={stroke} />
        <Circle cx="12" cy="18" r="2" fill={stroke} />
      </G>
    </Svg>
  )
}

export default VerticalDots
