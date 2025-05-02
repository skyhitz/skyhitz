'use client'
import { FlatList, View } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { useRecentlyAddedEntriesQuery } from 'app/api/graphql/mutations'
import { isSome } from 'app/utils'
import { P, ActivityIndicator } from 'app/design/typography'

export default function RecentlyAddedList() {
  const { data, loading } = useRecentlyAddedEntriesQuery()
  const entries = data?.recentlyAddedEntries?.filter(isSome) ?? []

  if (loading) {
    return (
      <View className="flex h-40 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!entries.length) {
    return (
      <View className="flex items-center justify-center py-8">
        <P className="text-gray-400">No recently added MFTs</P>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <P className="mb-4 font-medium text-white">Recently Added</P>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <BeatListEntry entry={item} playlist={entries} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
