import { ActivityIndicator, View } from 'react-native'
import { P } from 'app/design/typography'

export default function SearchingIndicator({
  visible,
  searchPhrase,
}: {
  visible: boolean
  searchPhrase: string
}) {
  if (!visible) return null

  return (
    <View className="flex flex-row items-center">
      <ActivityIndicator color={'#FFFFFF'} />
      <P className="ml-2 text-xs">Searching for &quot;{searchPhrase}&quot;</P>
    </View>
  )
}
