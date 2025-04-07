import { Text, View } from 'react-native'
import { compose, head, join, map, split, take, toUpper } from 'ramda'
import { imageUrlSmall } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'

const classNames = {
  default: {
    size: 'h-10 w-10',
    border: '',
    textSize: 'text-sm',
  },

  large: {
    size: 'h-20 w-20',
    border: 'border border-white',
    textSize: 'text-lg',
  },

  small: {
    size: 'h-8 w-8',
    border: '',
    textSize: 'text-xs',
  },

  xlarge: {
    size: 'h-28 w-28',
    border: 'border border-white',
    textSize: 'text-xl',
  },
}

export type UserAvatarProps = {
  avatarUrl?: string | null
  displayName?: string | null
  size?: 'default' | 'large' | 'small' | 'xlarge'
}

export function UserAvatar({
  avatarUrl,
  displayName,
  size = 'default',
}: UserAvatarProps) {
  const classes = classNames[size]

  if (avatarUrl) {
    return (
      <View className={`${classes.size} rounded-full`}>
        <SolitoImage
          fill
          src={imageUrlSmall(avatarUrl)}
          contentFit="cover"
          alt="Avatar"
          // @ts-ignore
          className="rounded-full"
        />
      </View>
    )
  }

  let initials = ''
  if (displayName) {
    initials = compose(
      join(''),
      take(2),
      map((part) => toUpper(head(part))),
      split(' '),
    )(displayName)
  }

  return (
    <View
      className={`${classes.size} ${classes.border} bg-blue-light flex items-center justify-center rounded-full`}
    >
      <Text className={`${classes.textSize} text-center text-black`}>
        {initials}
      </Text>
    </View>
  )
}
