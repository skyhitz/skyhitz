'use client'
import { FlatList, View } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { P, ActivityIndicator } from 'app/design/typography'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { useEffect, useState } from 'react'

export default function RecentlyAddedList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch recently added entries from Algolia on component mount
  useEffect(() => {
    // Use the timestamp replica index sorted by descending order (newest first)
    algoliaClient.searchSingleIndex({
      indexName: indexNames.entriesTimestampDesc,
      searchParams: {
        query: '',
        hitsPerPage: 10,  // Limit to 10 recent entries
        attributesToRetrieve: ['*']
      }
    })
      .then(result => {
        console.log('Recently added entries result:', result)
        if (result.hits && result.hits.length > 0) {
          // Convert Algolia hits to Entry objects
          const recentEntries = result.hits.map(hit => hit as unknown as Entry)
          setEntries(recentEntries)
        } else {
          setEntries([])
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error fetching recently added entries:', error)
        setEntries([])
        setLoading(false)
      })
  }, [])

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
