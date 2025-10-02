'use client'
import { FlatList } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { ActivityIndicator, H1 } from 'app/design/typography'
import { Entry } from 'app/api/graphql/types'
import { SafeAreaView } from 'app/design/safe-area-view'
import Footer from 'app/ui/footer'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { YStack } from 'tamagui'

const PAGE_SIZE = 20

export function ChartScreen({ entries = [] }: { entries?: Entry[] }) {
  const [extraEntries, setExtraEntries] = useState<Entry[]>([])
  const [page, setPage] = useState(1) // start after SSR page 0
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const playlist = useMemo(() => [...entries, ...extraEntries], [entries, extraEntries])

  const fetchPage = useCallback(async (pageNumber: number) => {
    setLoadingMore(true)
    try {
      const result = await algoliaClient.searchSingleIndex({
        indexName: indexNames.entriesRatingDesc,
        searchParams: {
          query: '',
          page: pageNumber,
          hitsPerPage: PAGE_SIZE,
          attributesToRetrieve: ['*'],
        },
      })

      const hits = (result.hits || []) as unknown as Entry[]
      setHasMore(hits.length === PAGE_SIZE)
      if (hits.length) {
        setExtraEntries((prev) => [...prev, ...hits])
      }
    } catch (e) {
      console.error('Chart page fetch error:', e)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [])

  const onEnd = useCallback(() => {
    if (loadingMore || !hasMore) return
    const next = page + 1
    setPage(next)
    fetchPage(next)
  }, [loadingMore, hasMore, page, fetchPage])

  // initial client-side fetch for page 1
  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  return (
    <SafeAreaView
      backgroundColor="$background"
      marginHorizontal="auto"
      flex={1}
      width="100%"
    >
      <YStack
        marginHorizontal="auto"
        marginBottom="$32"
        width="100%"
        maxWidth="$7xl"
        paddingHorizontal="$2"
        lg={{ paddingHorizontal: '$8' }}
      >
        {/* Trending header */}
        <YStack marginBottom="$4">
          <H1
            paddingVertical="$2"
            fontSize="$6"
            fontWeight="bold"
            sm={{ fontSize: '$7' }}
          >
            Trending
          </H1>
          <YStack
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
          />
        </YStack>

        {/* Infinite list */}
        <FlatList
          data={playlist}
          keyExtractor={(item, index) => item.id || String(index)}
          renderItem={({ item, index }) => (
            <BeatListEntry entry={item} spot={index + 1} playlist={playlist} />
          )}
          onEndReachedThreshold={0.3}
          onEndReached={onEnd}
          ListFooterComponent={
            loadingMore ? (
              <YStack paddingVertical="$4" alignItems="center">
                <ActivityIndicator size={'small'} />
              </YStack>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
        <Footer />
      </YStack>
    </SafeAreaView>
  )
}
