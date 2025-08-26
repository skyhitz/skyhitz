'use client'
import { View, FlatList } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { useState, useEffect } from 'react'
import { P, ActivityIndicator } from 'app/design/typography'
import { entriesIndex } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'

type BeatsSearchResultListProps = {
  searchPhrase: string
}

export function BeatsSearchResultList({
  searchPhrase,
}: BeatsSearchResultListProps) {
  const [debouncedSearchPhrase, setDebouncedSearchPhrase] = useState(searchPhrase)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)

  // Debounce search phrase to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchPhrase(searchPhrase)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchPhrase])

  // Search directly with Algolia
  useEffect(() => {
    if (debouncedSearchPhrase) {
      console.log('Searching for entries with Algolia:', debouncedSearchPhrase)
      setLoading(true)
      
      entriesIndex.search(debouncedSearchPhrase)
        .then(result => {
          console.log('Algolia search result:', result)
          if (result.hits && result.hits.length > 0) {
            // Convert Algolia hits to Entry objects
            const searchResults = result.hits.map(hit => hit as unknown as Entry)
            setEntries(searchResults)
          } else {
            setEntries([])
          }
          setLoading(false)
        })
        .catch(error => {
          console.error('Algolia search error:', error)
          setLoading(false)
          setEntries([])
        })
    } else {
      // Clear results when search is empty
      setEntries([])
    }
  }, [debouncedSearchPhrase])

  if (loading) {
    return (
      <View className="flex h-40 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!entries.length) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <P className="text-center text-gray-400">
          No MFTs found for "{searchPhrase}"
        </P>
      </View>
    )
  }

  return (
    <View className="flex-1">
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
