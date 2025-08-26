import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

function SvgComponent(props) {
  return (
    <Svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="feather feather-arrow-up-circle"
      {...props}
    >
      <Circle cx={12} cy={12} r={10} />
      <Path d="M16 12L12 8 8 12" />
      <Path d="M12 16L12 8" />
    </Svg>
  )
}

export default SvgComponent
