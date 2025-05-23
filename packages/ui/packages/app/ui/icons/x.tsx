import Svg, { Path } from 'react-native-svg'
import { IconProps } from 'app/types'

function Icon({ color = 'currentColor', size = 24, ...props }: IconProps) {
  return (
    <Svg
      fill="none"
      stroke={color}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      {...props}
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </Svg>
  )
}

export default Icon
