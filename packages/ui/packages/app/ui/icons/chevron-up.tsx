import Svg, { Path } from 'react-native-svg'
import { IconProps } from 'app/types'

export default function Icon({
  color = 'currentColor',
  size = 24,
  ...rest
}: IconProps) {
  return (
    <Svg
      fill="none"
      stroke={color}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      {...rest}
    >
      <Path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 15l7-7 7 7"
      />
    </Svg>
  )
}
