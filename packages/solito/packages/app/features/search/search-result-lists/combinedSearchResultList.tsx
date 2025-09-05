'use client'
import { useState, useEffect, useCallback } from 'react'
import { View, FlatList } from 'react-native'
import { ActivityIndicator, P } from 'app/design/typography'
import { entriesIndex, usersIndex } from 'app/api/algolia'
import { useLazyQuery } from '@apollo/client'
import { SEARCH_EXTERNAL_MUSIC, EXTERNAL_AUDIO_URL } from 'app/api/graphql/operations'
import Pickaxe from 'app/ui/icons/pickaxe'
import { Pressable } from 'react-native'
import { Entry, User } from 'app/api/graphql/types'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { TextLink } from 'solito/link'
import { UserAvatar } from 'app/ui/user-avatar'
import { usePlayback } from 'app/hooks/usePlayback'
import { SolitoImage } from 'app/design/solito-image'

// Define a union type for our search results
type SearchResult = {
  id: string
  type: 'entry' | 'user' | 'external'
  data: Entry | User | ExternalTrack
}

type CombinedSearchResultListProps = {
  searchPhrase: string
}

// A simpler component to render user cards that strictly follows React Native rules
function UserCard({ user }: { user: User }) {
  const displayName = user.displayName || user.username || 'User'

  return (
    <View
      className="rounded-lg bg-[--card-bg-color] overflow-hidden border-b border-[--border-color]"
      style={{ borderBottomWidth: 0.5 }}
    >
      <TextLink href={`/profile/${user.id}`}>
        <View className="flex-row items-center py-2">
          {/* Use our enhanced UserAvatar component with gradient placeholder */}
          <UserAvatar
            avatarUrl={user.avatarUrl}
            displayName={displayName}
            userId={user.id}
            email={user.email}
            size="medium"
          />
          <View className="ml-3 flex-1">
            <P className="text-[--text-color] font-medium text-sm">
              {displayName}
            </P>
            {user.description ? (
              <P
                className="text-[--text-secondary-color] text-sm mt-1"
                numberOfLines={2}
              >
                {user.description}
              </P>
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
  const [debouncedSearchPhrase, setDebouncedSearchPhrase] =
    useState(searchPhrase)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadExternal, { data: externalData }] = useLazyQuery(SEARCH_EXTERNAL_MUSIC)
  const [resolveAudioUrl] = useLazyQuery(EXTERNAL_AUDIO_URL)
  const { playEntry } = usePlayback()

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
        usersIndex.search(debouncedSearchPhrase),
        loadExternal({ variables: { query: debouncedSearchPhrase, limit: 20 } }),
      ])
        .then(([entriesResult, usersResult, externalResult]) => {
          console.log('Combined search results:', {
            entries: entriesResult.hits.length,
            users: usersResult.hits.length,
          })

          // Convert entries to SearchResult objects
          const entryResults: SearchResult[] = entriesResult.hits.map(
            (hit) => ({
              id: (hit as unknown as Entry).id,
              type: 'entry',
              data: hit as unknown as Entry,
            })
          )

          // Convert users to SearchResult objects
          const userResults: SearchResult[] = usersResult.hits.map((hit) => ({
            id: (hit as unknown as User).id,
            type: 'user',
            data: hit as unknown as User,
          }))

          // Map external tracks directly from this promise result
          const externalTracks = ((externalResult as any)?.data?.searchExternalMusic || []) as ExternalTrack[]
          const externalResults: SearchResult[] = externalTracks.map((t) => ({
            id: t.id,
            type: 'external',
            data: t,
          }))

          // Combine and sort by relevance (entries + users + external)
          const combinedResults = interleaveResults(entryResults, userResults, externalResults)
          setResults(combinedResults)
          setLoading(false)
        })
        .catch((error) => {
          console.error('Combined search error:', error)
          setLoading(false)
        })
    } else {
      setResults([])
    }
  }, [debouncedSearchPhrase])

  // Function to interleave results to combine both types
  const interleaveResults = (
    entries: SearchResult[],
    users: SearchResult[],
    externals: SearchResult[],
  ): SearchResult[] => {
    const maxLength = Math.max(entries.length, users.length, externals.length)
    const combined: SearchResult[] = []

    // Push entries and users alternately
    for (let i = 0; i < maxLength; i++) {
      // For entries - check existence and push
      if (i < entries.length) {
        const entry = entries[i]
        if (entry !== undefined) {
          combined.push(entry)
        }
      }

      // For users - check existence and push
      if (i < users.length) {
        const user = users[i]
        if (user !== undefined) {
          combined.push(user)
        }
      }

      // For external - check existence and push
      if (i < externals.length) {
        const ext = externals[i]
        if (ext !== undefined) {
          combined.push(ext)
        }
      }
    }

    return combined
  }

  // Render different items based on their type
  const renderSearchResultItem = useCallback(
    ({ item }: { item: SearchResult }) => {
      if (item.type === 'entry') {
        return <BeatListEntry entry={item.data as Entry} />
      } else if (item.type === 'external') {
        const t = item.data as ExternalTrack
        return (
          <ExternalTrackRow
            track={t}
            onSelect={async () => {
              const { data } = await resolveAudioUrl({ variables: { id: t.id } })
              const url = data?.externalAudioUrl as string | undefined
              if (!url) return
              const fakeEntry: Entry = {
                id: t.id,
                title: t.title,
                artist: t.artist || '',
                imageUrl: t.imageUrl || '',
                videoUrl: url,
              } as any
              await playEntry(fakeEntry, [])
            }}
          />
        )
      } else {
        return <UserCard user={item.data as User} />
      }
    },
    []
  )

  // Element to show when no results are found
  const NoResultsComponent = useCallback(
    () => (
      <View className="flex-1 items-center justify-center pt-4">
        <P className="text-center text-[--text-secondary-color]">
          {`No results found for "${debouncedSearchPhrase}"`}
        </P>
      </View>
    ),
    [debouncedSearchPhrase]
  )

  // Loading indicator component
  const LoadingComponent = useCallback(
    () => (
      <View className="flex-1 items-center justify-center pt-4">
        <ActivityIndicator size="large" />
      </View>
    ),
    []
  )

  return (
    <View className="flex-1">
      {loading ? (
        <LoadingComponent />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderSearchResultItem}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      ) : debouncedSearchPhrase ? (
        <NoResultsComponent />
      ) : null}
    </View>
  )
}

// Local types and simple row for external tracks
type ExternalTrack = {
  id: string
  title: string
  artist?: string
  genre?: string
  source: 'audius' | 'soundxyz'
  url?: string
  imageUrl?: string
}

function ExternalTrackRow({ track, onSelect }: { track: ExternalTrack; onSelect: () => void }) {
  return (
    <Pressable onPress={onSelect} className="flex">
      <View
        className="flex flex-row items-center py-2 border-b border-[--border-color]"
        style={{ borderBottomWidth: 0.5 }}
      >
        <View className="aspect-[2/2] w-12 object-cover">
          <SolitoImage
            src={track.imageUrl || 'https://skyhitz.io/icon.png'}
            alt={track.title || ''}
            contentFit="cover"
            fill
            sizes="4rem"
            style={{ borderRadius: 6 }}
          />
        </View>
        <View className="ml-2 flex flex-1 justify-center pr-2">
          <P numberOfLines={1} className="text-sm font-bold leading-6">
            {track.title}
          </P>
          <P numberOfLines={1} className="text-xs leading-6 text-[--text-secondary-color]">
            {track.artist}
          </P>
        </View>
        <View className="flex flex-row items-center">
          <Pressable onPress={() => {}}>
            <Pickaxe size={20} color="var(--text-color)" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}
