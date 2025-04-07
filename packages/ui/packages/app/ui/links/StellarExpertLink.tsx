import { Linking, Pressable, View, Text } from 'react-native'
import { Config } from 'app/config'
type Props = {
  id: string
  text?: string
  path: string
  align?: 'start' | 'end' | 'center'
  className?: string
}

export function StellarExpertLink({
  id,
  path,
  text,
  align = 'start',
  className,
}: Props) {
  return (
    <View className={`${className ?? ''}`}>
      <Pressable
        onPress={() => {
          Linking.openURL(`${Config.STELLAR_EXPERT_URL}/${path}/${id}`)
        }}
      >
        <Text className="text-blue-brand flex h-auto shrink overflow-hidden text-ellipsis text-xs font-semibold">
          {text ?? id}
        </Text>
      </Pressable>
    </View>
  )
}
