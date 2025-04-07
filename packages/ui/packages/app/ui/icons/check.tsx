import { View } from 'react-native'
import Svg, { G, Path } from 'react-native-svg'

function Icon({ size = 20, ...props }: any) {
  return (
    <View className="p-0.5">
      <Svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        {...props}
      >
        <G
          fill="none"
          stroke="currentcolor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        >
          <Path d="M18 7l-6.38 8.66a1 1 0 01-.68.4 1 1 0 01-.75-.21L6 12.5" />
          <Path d="M.5 12a11.5 11.5 0 1023 0 11.5 11.5 0 10-23 0" />
        </G>
      </Svg>
    </View>
  )
}

export default Icon
