'use client'
import { View, FlatList } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { useEntriesSearchLazyQuery } from 'app/api/graphql/mutations'
import { useState, useEffect } from 'react'
import { isSome } from 'app/utils'
import { P, ActivityIndicator } from 'app/design/typography'

type BeatsSearchResultListProps = {
  searchPhrase: string
}

export function BeatsSearchResultList({
  searchPhrase,
}: BeatsSearchResultListProps) {
  const [search, { data, loading }] = useEntriesSearchLazyQuery()
  const [debouncedSearchPhrase, setDebouncedSearchPhrase] = useState(searchPhrase)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchPhrase(searchPhrase)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchPhrase])

  useEffect(() => {
    if (debouncedSearchPhrase) {
      search({
        variables: {
          query: debouncedSearchPhrase,
        },
      })
    }
  }, [debouncedSearchPhrase, search])

  const entries = data?.entriesSearch?.filter(isSome) ?? []

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
