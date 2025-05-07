import * as React from 'react'
import { Pressable } from 'react-native'
import Svg, { SvgProps, Path } from 'react-native-svg'
import { Entry } from 'app/api/graphql/types'
import { useTheme } from 'app/state/theme/useTheme'

interface Props {
  size?: number
  entry: Entry
}

const LikeIcon = ({
  size = 24,
  fill = "none",
  stroke = "#6B7280",
  ...props
}: SvgProps & { size?: number }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </Svg>
  )
}

const LikeButton = ({ size = 24, entry }: Props) => {
  const { isDark } = useTheme()
  // For the prototype, we're using local state since Entry type doesn't have a liked property
  const [liked, setLiked] = React.useState(false)

  const handlePress = () => {
    // In the real implementation, this would call an API to like/unlike
    setLiked(!liked)
  }

  return (
    <Pressable onPress={handlePress} className="mr-3">
      <LikeIcon 
        size={size} 
        fill={liked ? 'var(--primary-color)' : 'none'} 
        stroke={liked ? 'var(--primary-color)' : 'var(--text-secondary-color)'}
      />
    </Pressable>
  )
}

export default LikeButton
