import { IconProps } from 'app/types'
import Svg, { Path } from 'react-native-svg'

import { remapProps } from 'nativewind'

remapProps(Svg, { className: 'style' })

export function ShareIcon({
  color = 'currentColor',
  size = 24,
  className,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      fill={color}
      viewBox="0 0 24 24"
      className={className}
    >
      <Path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z" />
    </Svg>
  )
}
