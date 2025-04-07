'use client'
import { useState } from 'react'
import { TabBar, Tabs } from 'app/features/dashboard/search/tabs'
import { SearchInputField } from 'app/features/dashboard/search/searchInputField'
import RecentlyAddedList from 'app/features/dashboard/search/recently-added'
import { isEmpty } from 'ramda'
import { BeatmakersSearchResultList } from 'app/features/dashboard/search/search-result-lists/beatmakersSearchResultList'
import { BeatsSearchResultList } from 'app/features/dashboard/search/search-result-lists/beatsSearchResultList'
import BeatmakersEmptyState from 'app/features/dashboard/search/beatmakersEmptyState'
import { SafeAreaView } from 'app/design/safe-area-view'

export function SearchScreen() {
  const [searchPhrase, setSearchPhrase] = useState('')
  const [tab, setTab] = useState<Tabs>('MFTs')

  return (
    <SafeAreaView
      edges={['top']}
      className="mx-auto flex w-full max-w-7xl flex-1 px-2 pb-0 pt-4 lg:px-8"
    >
      <SearchInputField
        // @ts-ignore
        value={searchPhrase}
        autoCapitalize="none"
        onChangeText={setSearchPhrase}
        showX={!isEmpty(searchPhrase)}
        onXClick={() => {
          setSearchPhrase('')
        }}
      />
      <TabBar selected={tab} onTabClick={setTab} />
      {!searchPhrase && tab === 'MFTs' && <RecentlyAddedList />}
      {!searchPhrase && tab === 'Collectors' && <BeatmakersEmptyState />}
      {!!searchPhrase && tab === 'MFTs' && (
        <BeatsSearchResultList searchPhrase={searchPhrase} />
      )}
      {!!searchPhrase && tab === 'Collectors' && (
        <BeatmakersSearchResultList searchPhrase={searchPhrase} />
      )}
    </SafeAreaView>
  )
}
