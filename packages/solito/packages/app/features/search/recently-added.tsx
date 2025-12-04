'use client'
import { FlatList, View } from 'react-native'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { P, ActivityIndicator } from 'app/design/typography'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { useCallback, useEffect, useState, useMemo, memo } from 'react'

// Constants
const PAGE_SIZE = 20

// Memoized loading footer component
const LoadingFooter = memo(() => (
  <View className="py-4 items-center">
    <ActivityIndicator size="small" />
  </View>
))
LoadingFooter.displayName = 'LoadingFooter'

export default function RecentlyAddedList() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Function to fetch entries with pagination
  const fetchEntries = useCallback(async (pageNumber: number) => {
    try {
      if (pageNumber === 0) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }

      const result = await algoliaClient.searchSingleIndex({
        indexName: indexNames.entriesTimestampDesc,
        searchParams: {
          query: '',
          hitsPerPage: PAGE_SIZE,
          page: pageNumber,
          attributesToRetrieve: ['*'],
        },
      })

      if (result.hits && result.hits.length > 0) {
        // Convert Algolia hits to Entry objects
        const newEntries = result.hits.map((hit) => hit as unknown as Entry)

        // Check if we've reached the end
        setHasMore(newEntries.length === PAGE_SIZE)

        // Append entries or replace them if this is the first page
        if (pageNumber === 0) {
          setEntries(newEntries)
        } else {
          setEntries((prevEntries) => [...prevEntries, ...newEntries])
        }
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error(
        `Error fetching recently added entries page ${pageNumber}:`,
        error
      )
      if (pageNumber === 0) {
        setEntries([])
      }
      setHasMore(false)
    } finally {
      if (pageNumber === 0) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }, [])

  // Initial fetch on component mount
  useEffect(() => {
    fetchEntries(0)
  }, [])

  // Handle loading more entries when reaching the end
  const onNextPage = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchEntries(nextPage)
    }
  }, [loadingMore, hasMore, page, fetchEntries])

  // Memoized renderItem for better FlatList performance
  const renderItem = useCallback(
    ({ item }: { item: Entry }) => (
      <BeatListEntry entry={item} playlist={entries} />
    ),
    [entries]
  )

  // Memoized key extractor
  const keyExtractor = useCallback((item: Entry) => item.id!, [])

  // Memoized footer component
  const listFooter = useMemo(
    () => (loadingMore ? <LoadingFooter /> : null),
    [loadingMore]
  )

  // Loading state
  if (loading) {
    return (
      <View className="flex h-40 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  // Empty state
  if (!entries.length) {
    return (
      <View className="flex items-center justify-center py-8">
        <P className="text-[--text-secondary-color]">No recently added MFTs</P>
      </View>
    )
  }

  return (
    <View className="flex-1">
      <FlatList
        data={entries}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        onEndReached={onNextPage}
        onEndReachedThreshold={0.3}
        ListFooterComponent={listFooter}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
      />
    </View>
  )
}
