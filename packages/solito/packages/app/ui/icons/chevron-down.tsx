import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = React.ComponentProps<typeof Svg>

export function ChevronDown(props: Props) {
  return (
    <Svg
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  )
}

export default ChevronDown
