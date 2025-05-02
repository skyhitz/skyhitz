'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { View, FlatList, Text, Image, Pressable } from 'react-native'
import { ActivityIndicator } from 'app/design/typography'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { User } from 'app/api/graphql/types'

import { imageSrc } from 'app/utils/entry';

// Simplified in-file user entry component to avoid any import issues
function SimpleUserEntry({ user }: { user: User }) {
  if (!user || !user.id) return null;
  
  // Use the imageSrc utility to properly handle IPFS URLs
  const avatarUrl = imageSrc(user.avatarUrl);
  
  return (
    <Pressable
      className="mb-4 flex-row items-center rounded-lg bg-gray-800 p-2"
    >
      <Image
        source={{ uri: avatarUrl }}
        className="h-14 w-14 rounded-full"
      />
      <View className="ml-3 flex-1">
        <Text className="text-white">
          {user.displayName || user.username || 'User'}
        </Text>
      </View>
    </Pressable>
  );
}

type BeatmakersSearchResultListProps = {
  searchPhrase: string
}

export function BeatmakersSearchResultList({
  searchPhrase,
}: BeatmakersSearchResultListProps) {
  const [debouncedSearchPhrase, setDebouncedSearchPhrase] = useState(searchPhrase)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  
  // Define renderUserItem at the component top level to maintain hooks order
  const renderUserItem = React.useCallback(({ item }: { item: User }) => {
    if (!item) return null;
    return <SimpleUserEntry user={item} />;
  }, [])

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
      console.log('Searching for users with Algolia:', debouncedSearchPhrase)
      setLoading(true)
      
      // Search users directly with Algolia
      algoliaClient.searchSingleIndex({
        indexName: indexNames.users,
        searchParams: {
          query: debouncedSearchPhrase
        }
      }).then(result => {
        console.log('Users Algolia search result:', result)
        if (result.hits && result.hits.length > 0) {
          // Convert Algolia hits to User objects
          const searchResults = result.hits.map(hit => hit as unknown as User)
          setUsers(searchResults)
        } else {
          setUsers([])
        }
        setLoading(false)
      }).catch(error => {
        console.error('Users Algolia search error:', error)
        setLoading(false)
        setUsers([])
      })
    } else {
      // Clear results when search is empty
      setUsers([])
    }
  }, [debouncedSearchPhrase])

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
        <Text className="text-center text-gray-400">
          No collectors found for "{searchPhrase}"
        </Text>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <FlatList
        data={users}
        keyExtractor={(item) => item?.id || 'unknown'}
        renderItem={renderUserItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
