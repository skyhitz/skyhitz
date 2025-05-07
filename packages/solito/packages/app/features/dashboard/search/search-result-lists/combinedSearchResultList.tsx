'use client'
import { useState, useEffect, useCallback } from 'react'
import { View, FlatList, Text, Image } from 'react-native'
import { ActivityIndicator, P } from 'app/design/typography'
import { entriesIndex, usersIndex } from 'app/api/algolia'
import { Entry, User } from 'app/api/graphql/types'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { imageSrc } from 'app/utils/entry'
import { TextLink } from 'solito/link'

// Define a union type for our search results
type SearchResult = {
  id: string
  type: 'entry' | 'user'
  data: Entry | User
}

type CombinedSearchResultListProps = {
  searchPhrase: string
}

// A simpler component to render user cards that strictly follows React Native rules
function UserCard({ user }: { user: User }) {
  const avatarUrl = imageSrc(user.avatarUrl || '')
  const displayName = user.displayName || user.username || 'User'
  
  return (
    <View className="mb-4 rounded-lg bg-[--card-bg-color] border border-[--border-color] overflow-hidden">
      <TextLink href={`/profile/${user.id}`}>
        <View className="flex-row items-center p-4">
          <Image
            source={{ uri: avatarUrl }}
            className="h-14 w-14 rounded-full"
          />
          <View className="ml-3 flex-1">
            <Text className="text-[--text-color] font-medium text-base">
              {displayName}
            </Text>
            {user.description ? (
              <Text className="text-[--text-secondary-color] text-sm mt-1" numberOfLines={2}>
                {user.description}
              </Text>
            ) : null}
          </View>
        </View>
      </TextLink>
    </View>
  )
}

export function CombinedSearchResultList({
  searchPhrase,
}: CombinedSearchResultListProps) {
  const [debouncedSearchPhrase, setDebouncedSearchPhrase] = useState(searchPhrase)
  const [results, setResults] = useState<SearchResult[]>([])
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

  // Search both indices and combine results
  useEffect(() => {
    if (debouncedSearchPhrase) {
      setLoading(true)
      
      // Run both searches in parallel
      Promise.all([
        entriesIndex.search(debouncedSearchPhrase),
        usersIndex.search(debouncedSearchPhrase)
      ])
        .then(([entriesResult, usersResult]) => {
          console.log('Combined search results:', { 
            entries: entriesResult.hits.length, 
            users: usersResult.hits.length 
          })
          
          // Convert entries to SearchResult objects
          const entryResults: SearchResult[] = entriesResult.hits.map(hit => ({
            id: (hit as unknown as Entry).id,
            type: 'entry',
            data: hit as unknown as Entry
          }))
          
          // Convert users to SearchResult objects
          const userResults: SearchResult[] = usersResult.hits.map(hit => ({
            id: (hit as unknown as User).id,
            type: 'user',
            data: hit as unknown as User
          }))
          
          // Combine and sort by relevance
          const combinedResults = interleaveResults(entryResults, userResults)
          setResults(combinedResults)
          setLoading(false)
        })
        .catch(error => {
          console.error('Combined search error:', error)
          setLoading(false)
        })
    } else {
      setResults([])
    }
  }, [debouncedSearchPhrase])

  // Function to interleave results to combine both types
  const interleaveResults = (entries: SearchResult[], users: SearchResult[]): SearchResult[] => {
    const maxLength = Math.max(entries.length, users.length)
    const combined: SearchResult[] = []
    
    // Push entries and users alternately
    for (let i = 0; i < maxLength; i++) {
      // For entries - check existence and push
      if (i < entries.length) {
        const entry = entries[i];
        if (entry !== undefined) {
          combined.push(entry);
        }
      }
      
      // For users - check existence and push
      if (i < users.length) {
        const user = users[i];
        if (user !== undefined) {
          combined.push(user);
        }
      }
    }
    
    return combined
  }

  // Render different items based on their type
  const renderSearchResultItem = useCallback(({ item }: { item: SearchResult }) => {
    if (item.type === 'entry') {
      return <BeatListEntry entry={item.data as Entry} />
    } else {
      return <UserCard user={item.data as User} />
    }
  }, [])

  // Element to show when no results are found
  const NoResultsComponent = useCallback(() => (
    <View className="flex-1 items-center justify-center pt-4">
      <P className="text-center text-[--text-secondary-color]">
        {`No results found for "${debouncedSearchPhrase}"`}
      </P>
    </View>
  ), [debouncedSearchPhrase])
  
  // Loading indicator component
  const LoadingComponent = useCallback(() => (
    <View className="flex-1 items-center justify-center pt-4">
      <ActivityIndicator size="large" />
    </View>
  ), [])

  return (
    <View className="flex-1">
      {loading ? (
        <LoadingComponent />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderSearchResultItem}
          className="flex-1"          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      ) : debouncedSearchPhrase ? (
        <NoResultsComponent />
      ) : null}
    </View>
  )
}
