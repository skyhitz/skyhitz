'use client'
import { FlatList, View } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { ActivityIndicator, H1 } from 'app/design/typography'
import { Entry } from 'app/api/graphql/types'
import { SafeAreaView } from 'app/design/safe-area-view'
import Footer from 'app/ui/footer'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { algoliaClient, indexNames } from 'app/api/algolia'

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
    <SafeAreaView className="bg-[--bg-color] mx-auto flex w-full flex-1">
      <View className="mx-auto mb-32 w-full max-w-7xl px-2 lg:px-8">
        {/* Trending header */}
        <View className="mb-4">
          <H1 className="py-2 text-xl font-bold sm:text-2xl">Trending</H1>
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: 'var(--border-color)',
            }}
          />
        </View>

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
              <View className="py-4 items-center">
                <ActivityIndicator size={'small'} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
        <Footer />
      </View>
    </SafeAreaView>
  )
}
