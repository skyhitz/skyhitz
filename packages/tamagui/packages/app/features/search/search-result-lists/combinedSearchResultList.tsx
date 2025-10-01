'use client'
import { useState, useEffect, useCallback } from 'react'
import { View, FlatList, ScrollView } from 'react-native'
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
import { useMutation, useQuery } from '@apollo/client'
import { MINE_EXTERNAL_ENTRY, USER_CREDITS } from 'app/api/graphql/operations'
import { useRouter } from 'solito/navigation'
import { useTopUpModalStore } from 'app/state/topup'
import { H1 } from 'app/design/typography'
import { Button } from 'app/design/button'
import { useUserStore } from 'app/state/user'
import { useToast } from 'app/provider/toast'
import { trackMine } from 'app/utils/analytics'

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
  // Progressive, per-section state
  const [entryResults, setEntryResults] = useState<SearchResult[]>([])
  const [userResults, setUserResults] = useState<SearchResult[]>([])
  const [externalResults, setExternalResults] = useState<SearchResult[]>([])

  const [entriesLoading, setEntriesLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [externalLoading, setExternalLoading] = useState(false)
  const [loadExternal, { data: externalData }] = useLazyQuery(SEARCH_EXTERNAL_MUSIC)
  const [resolveAudioUrl] = useLazyQuery(EXTERNAL_AUDIO_URL)
  const { playEntry } = usePlayback()
  const [mineExternal] = useMutation(MINE_EXTERNAL_ENTRY)
  const { data: creditsData } = useQuery(USER_CREDITS, { fetchPolicy: 'network-only' })
  const { push } = useRouter()

  // Debounce search phrase to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchPhrase(searchPhrase)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchPhrase])

  // Progressive searches per section
  useEffect(() => {
    let cancelled = false
    if (!debouncedSearchPhrase) {
      setEntryResults([])
      setUserResults([])
      setExternalResults([])
      setEntriesLoading(false)
      setUsersLoading(false)
      setExternalLoading(false)
      return
    }

    // Reset and trigger each search independently
    setEntriesLoading(true)
    setUsersLoading(true)
    setExternalLoading(true)

    entriesIndex
      .search(debouncedSearchPhrase)
      .then((entriesResult) => {
        if (cancelled) return
        const mapped: SearchResult[] = entriesResult.hits.map((hit) => ({
          id: (hit as unknown as Entry).id,
          type: 'entry',
          data: hit as unknown as Entry,
        }))
        setEntryResults(mapped)
      })
      .finally(() => !cancelled && setEntriesLoading(false))

    usersIndex
      .search(debouncedSearchPhrase)
      .then((usersResult) => {
        if (cancelled) return
        const mapped: SearchResult[] = usersResult.hits.map((hit) => ({
          id: (hit as unknown as User).id,
          type: 'user',
          data: hit as unknown as User,
        }))
        setUserResults(mapped)
      })
      .finally(() => !cancelled && setUsersLoading(false))

    loadExternal({ variables: { query: debouncedSearchPhrase, limit: 20 } })
      .then((externalResult) => {
        if (cancelled) return
        const externalTracks = ((externalResult as any)?.data?.searchExternalMusic || []) as ExternalTrack[]
        const mapped: SearchResult[] = externalTracks.map((t) => ({
          id: t.id,
          type: 'external',
          data: t,
        }))
        setExternalResults(mapped)
      })
      .finally(() => !cancelled && setExternalLoading(false))

    return () => {
      cancelled = true
    }
  }, [debouncedSearchPhrase])

  // Simple section header
  const SectionHeader = ({ title }: { title: string }) => (
    <View className="mt-4 mb-2">
      <P className="text-xs uppercase tracking-wide text-[--text-secondary-color]">{title}</P>
    </View>
  )

  const renderEntryItem = useCallback(
    (item: SearchResult) => <BeatListEntry entry={item.data as Entry} />,
    []
  )

  const renderUserItem = useCallback(
    (item: SearchResult) => <UserCard user={item.data as User} />,
    []
  )

  const renderExternalItem = useCallback(
    (item: SearchResult) => {
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

  const allDone = !entriesLoading && !usersLoading && !externalLoading
  const totalCount = entryResults.length + userResults.length + externalResults.length

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
      {/* Entries section */}
      {/* <SectionHeader title="Beats" /> */}
      {entriesLoading && entryResults.length === 0 ? (
        <LoadingComponent />
      ) : (
        <View>
          {entryResults.map((r) => (
            <View key={`entry-${r.id}`}>{renderEntryItem(r)}</View>
          ))}
        </View>
      )}

      {/* Users section */}
      {/* <SectionHeader title="Users" /> */}
      {usersLoading && userResults.length === 0 ? (
        <LoadingComponent />
      ) : (
        <View>
          {userResults.map((r) => (
            <View key={`user-${r.id}`}>{renderUserItem(r)}</View>
          ))}
        </View>
      )}

      {/* External section */}
      {/* <SectionHeader title="External" /> */}
      {externalLoading && externalResults.length === 0 ? (
        <LoadingComponent />
      ) : (
        <View>
          {externalResults.map((r) => (
            <View key={`external-${r.id}`}>{renderExternalItem(r)}</View>
          ))}
        </View>
      )}

      {debouncedSearchPhrase && allDone && totalCount === 0 ? (
        <NoResultsComponent />
      ) : null}
    </ScrollView>
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
  const { data: creditsData, refetch: refetchCredits } = useQuery(USER_CREDITS, { fetchPolicy: 'network-only' })
  const [mineExternal] = useMutation(MINE_EXTERNAL_ENTRY)
  const { push } = useRouter()
  const openTopUpModal = useTopUpModalStore((s) => s.openTopUpModal)
  const user = useUserStore((s) => s.user)
  const isAuthed = !!user
  const [mining, setMining] = useState(false)
  const toast = useToast()
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
          <Pressable
            className="cursor-pointer"
            disabled={mining}
            onPress={async () => {
              if (!isAuthed) return push('/sign-in')
              // Ensure user has >= 1 XLM available, or prompt top-up
              const available = Number(creditsData?.userCredits ?? 0)
              const required = 1.2 // 1 XLM + ~0.2 XLM fees; reserve already excluded in userCredits
              if (!available || available < required) {
                openTopUpModal({ action: 'mine', requiredXLM: required, availableXLM: available })
                return
              }
              try {
                const { __typename, ...input } = (track as any) || {}
                setMining(true)
                const res = await mineExternal({ variables: { input }, errorPolicy: 'none' as any })
                const failed = !res?.data || !res?.data?.mineExternalEntry
                if (failed) {
                  toast.show('Transaction failed. Please try again later.', { type: 'danger' })
                  return
                }
                
                // Track mine event
                trackMine(track.id, track.title, track.artist)
                
                const refreshed = await refetchCredits()
                const newBal = Number(refreshed?.data?.userCredits ?? 0).toFixed(2)
                toast.show(`Mined successfully. Balance: ${newBal} XLM`, { type: 'success' })
                // Optional: give quick feedback
                // Re-play from our stored copy
                // no-op here; search list will show indexed version later
              } catch (e) {
                console.error('Mine failed', e)
                toast.show('Mining failed. Please try again.', { type: 'danger' })
              } finally {
                setMining(false)
              }
            }}
          >
            {mining ? (
              <ActivityIndicator size="small" />
            ) : (
              <Pickaxe size={20} color="var(--text-color)" />
            )}
          </Pressable>
        </View>
      </View>
      
    </Pressable>
  )
}
