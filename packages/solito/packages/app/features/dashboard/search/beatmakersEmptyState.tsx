'use client'
import { View } from 'react-native'
import { P } from 'app/design/typography'

export default function BeatmakersEmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-8">
      <P className="text-center text-gray-400">
        Search for collectors by name or username
      </P>
    </View>
  )
}
