import { Pressable, View } from 'react-native'
import ChevronRight from 'app/ui/icons/chevron-right'
import { ReactElement } from 'react'
import { P } from 'app/design/typography'

type ProfileRowProps = {
  icon: ReactElement
  title: string
  trailingNumber?: number
  onPress?: () => void
}

export function ProfileRow({
  icon,
  trailingNumber,
  title,
  onPress,
}: ProfileRowProps) {
  return (
    <Pressable
      className="flex flex-row justify-between py-1.5"
      onPress={onPress}
    >
      <View className="flex flex-row items-center">
        {icon}
        <P className="ml-2 text-sm font-bold">{title}</P>
      </View>
      <View className="flex flex-row items-center">
        <P className="text-sm">{trailingNumber || ''}</P>
        <ChevronRight size={28} className="text-gray-600" />
      </View>
    </Pressable>
  )
}
