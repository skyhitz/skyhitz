'use client'
import { useState, useCallback, useEffect } from 'react'
import { SearchInputField } from 'app/features/search/searchInputField'
import { isEmpty } from 'ramda'
import { CombinedSearchResultList } from 'app/features/search/search-result-lists/combinedSearchResultList'
import { SafeAreaView } from 'app/design/safe-area-view'
import { FlatList, View } from 'react-native'
import { H1, P, ActivityIndicator } from 'app/design/typography'
import { Entry } from 'app/api/graphql/types'
import { BeatListEntry } from 'app/ui/beat-list-entry'
import { algoliaClient, indexNames } from 'app/api/algolia'

const PAGE_SIZE = 20

type SearchScreenSSRProps = {
  initialEntries: Entry[]
}

// Component that handles "Recently Added" with SSR initial data
function RecentlyAddedWithSSR({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(initialEntries.length === PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)

  // Function to fetch more entries for pagination
  const fetchMoreEntries = useCallback(async (pageNumber: number) => {
    if (pageNumber === 0) return // Skip first page, already have SSR data

    setLoadingMore(true)
    try {
      const result = await algoliaClient.searchSingleIndex({
        indexName: indexNames.entriesTimestampDesc,
        searchParams: {
          query: '',
          hitsPerPage: PAGE_SIZE,
          page: pageNumber,
          attributesToRetrieve: ['*'],
        },
      })

      const hits = (result.hits || []) as unknown as Entry[]
      setHasMore(hits.length === PAGE_SIZE)

      if (hits.length > 0) {
        setEntries((prev) => [...prev, ...hits])
      }
    } catch (error) {
      console.error(`Error fetching page ${pageNumber}:`, error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [])

  const onNextPage = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMoreEntries(nextPage)
    }
  }, [loadingMore, hasMore, page, fetchMoreEntries])

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
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => <BeatListEntry entry={item} playlist={entries} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        onEndReached={onNextPage}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
      />
    </View>
  )
}

export function SearchScreenSSR({ initialEntries }: SearchScreenSSRProps) {
  const [searchPhrase, setSearchPhrase] = useState('')

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[--bg-color]">
      <View className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4">
        <SearchInputField
          value={searchPhrase}
          autoCapitalize="none"
          onChangeText={setSearchPhrase}
          showX={!isEmpty(searchPhrase)}
          onXClick={() => {
            setSearchPhrase('')
          }}
        />

        {/* Title for the content section */}
        <View className="mt-2 mb-2">
          <H1 className="text-base font-unbounded">
            {!searchPhrase ? 'Recently Added' : 'Search Results'}
          </H1>
        </View>

        {/* Show recently added when no search (with SSR data), combined results when searching */}
        {!searchPhrase ? (
          <RecentlyAddedWithSSR initialEntries={initialEntries} />
        ) : (
          <CombinedSearchResultList searchPhrase={searchPhrase} />
        )}
      </View>
    </SafeAreaView>
  )
}

