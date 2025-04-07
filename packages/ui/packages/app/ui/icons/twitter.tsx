import Svg, { Path } from 'react-native-svg'
import { IconProps } from 'app/types'

function Icon({ size = 24, color = 'currentColor', ...props }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 1200 1227"
      fill="none"
      {...props}
    >
      <Path
        d="M714.163 519.284L1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026zM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026z"
        fill={color}
      />
    </Svg>
  )
}

export default Icon
