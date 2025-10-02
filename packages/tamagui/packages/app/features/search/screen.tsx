'use client'
import { useState } from 'react'
import { SearchInputField } from './searchInputField'
import RecentlyAddedList from './recently-added'
import { isEmpty } from 'ramda'
import { CombinedSearchResultList } from './search-result-lists/combinedSearchResultList'
import { SafeAreaView } from 'app/design/safe-area-view'
import { H1 } from 'app/design/typography'
import { YStack } from 'tamagui'

// Shared UI component for both web and native
export function SearchScreen() {
  const [searchPhrase, setSearchPhrase] = useState('')

  return (
    <SafeAreaView edges={['top']} flex={1} backgroundColor="$background">
      <YStack
        marginHorizontal="auto"
        width="100%"
        maxWidth="$7xl"
        flex={1}
        paddingHorizontal="$4"
        paddingTop="$4"
      >
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
        <YStack marginTop="$2" marginBottom="$2">
          <H1
            fontSize="$4"
            fontFamily="$heading"
          >
            {!searchPhrase ? 'Recently Added' : 'Search Results'}
          </H1>
        </YStack>

        {/* Show recently added when no search, combined results when searching */}
        {!searchPhrase ? (
          <RecentlyAddedList />
        ) : (
          <CombinedSearchResultList searchPhrase={searchPhrase} />
        )}
      </YStack>
    </SafeAreaView>
  )
}
