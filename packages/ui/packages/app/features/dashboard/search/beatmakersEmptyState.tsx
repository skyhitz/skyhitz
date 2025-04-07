import { View } from 'react-native'
import Search from 'app/ui/icons/search'
import { P } from 'app/design/typography'

export default function BeatmakersEmptyState() {
  return (
    <View className="mx-auto flex-1 flex-row justify-center py-8">
      <Search color="white" size={22} />
      <P className="ml-3 text-xs">Search for Collectors</P>
    </View>
  )
}
