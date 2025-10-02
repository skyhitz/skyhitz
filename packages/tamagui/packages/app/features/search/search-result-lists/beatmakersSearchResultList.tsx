'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { FlatList } from 'react-native'
import { YStack, XStack, Button, Text } from 'tamagui'
import { ActivityIndicator } from 'app/design/typography'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { User } from 'app/api/graphql/types'

import { imageSrc } from 'app/utils/entry';
import { UserAvatar } from 'app/ui/user-avatar';

// Simplified in-file user entry component to avoid any import issues
function SimpleUserEntry({ user }: { user: User }) {
  if (!user || !user.id) return null;
  
  return (
    <Button
      backgroundColor="transparent"
      padding="$0"
      marginBottom="$4"
      borderRadius="$3"
      paddingHorizontal="$2"
      paddingVertical="$2"
      backgroundColor="$gray8"
    >
      <XStack flexDirection="row" alignItems="center">
        {/* Use the enhanced UserAvatar component that handles placeholders */}
        <UserAvatar 
          avatarUrl={user.avatarUrl}
          displayName={user.displayName || user.username}
          userId={user.id}
          email={user.email}
          size="large"
        />
        <YStack marginLeft="$3" flex={1}>
          <Text color="$white1">
            {user.displayName || user.username || 'User'}
          </Text>
        </YStack>
      </XStack>
    </Button>
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
      <YStack height={160} alignItems="center" justifyContent="center">
        <ActivityIndicator size="large" />
      </YStack>
    )
  }

  if (!users.length) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$8">
        <Text textAlign="center" color="$gray9">
          No collectors found for "{searchPhrase}"
        </Text>
      </YStack>
    )
  }

  return (
    <YStack flex={1}>
      <FlatList
        data={users}
        keyExtractor={(item) => item?.id || 'unknown'}
        renderItem={renderUserItem}
        showsVerticalScrollIndicator={false}
      />
    </YStack>
  )
}
