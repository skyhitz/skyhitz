'use client'
import { View, FlatList } from 'react-native'
import { UserSearchEntry } from 'app/ui/user-search-entry'
import { useUsersSearchLazyQuery } from 'app/api/graphql/mutations'
import { useState, useEffect } from 'react'
import { isSome } from 'app/utils'
import { P, ActivityIndicator } from 'app/design/typography'

type BeatmakersSearchResultListProps = {
  searchPhrase: string
}

export function BeatmakersSearchResultList({
  searchPhrase,
}: BeatmakersSearchResultListProps) {
  const [search, { data, loading }] = useUsersSearchLazyQuery()
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

  const users = data?.usersSearch?.filter(isSome) ?? []

  if (loading) {
    return (
      <View className="flex h-40 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!users.length) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <P className="text-center text-gray-400">
          No collectors found for "{searchPhrase}"
        </P>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <FlatList
        data={users}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => <UserSearchEntry user={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
