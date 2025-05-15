'use client'
import { useState } from 'react'
import { SearchInputField } from 'app/features/search/searchInputField'
import RecentlyAddedList from 'app/features/search/recently-added'
import { isEmpty } from 'ramda'
import { CombinedSearchResultList } from 'app/features/search/search-result-lists/combinedSearchResultList'
import { SafeAreaView } from 'app/design/safe-area-view'
import { View } from 'react-native'
import { H1 } from 'app/design/typography'

export function SearchScreen() {
  const [searchPhrase, setSearchPhrase] = useState('')

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[--bg-color]">
      <View className="mx-auto w-full max-w-7xl flex-1 px-4 pb-0 pt-4">
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
          {/* <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: 'var(--border-color)',
              marginTop: 8,
            }}
          /> */}
        </View>

        {/* Show recently added when no search, combined results when searching */}
        {!searchPhrase ? (
          <RecentlyAddedList />
        ) : (
          <CombinedSearchResultList searchPhrase={searchPhrase} />
        )}
      </View>
    </SafeAreaView>
  )
}
