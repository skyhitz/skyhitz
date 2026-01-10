'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchInputField } from './searchInputField'
import RecentlyAddedList from './recently-added'
import { isEmpty } from 'ramda'
import { CombinedSearchResultList } from './search-result-lists/combinedSearchResultList'
import { SafeAreaView } from 'app/design/safe-area-view'
import { View } from 'react-native'
import { H1 } from 'app/design/typography'
import { useUserStore } from 'app/state/user'
import { useQuery } from '@apollo/client'
import { USER_HITZ_BALANCE } from 'app/api/graphql/operations'
import { useTopUpModalStore } from 'app/state/topup'
import {
  useSearchRateLimitStore,
  countCompleteWords,
  getStoredSearchCount,
  LOGGED_OUT_SEARCH_LIMIT,
  LOGGED_IN_SEARCH_LIMIT,
  UNLIMITED_SEARCH_HITZ_THRESHOLD,
} from 'app/state/search'
import { SignInRequiredModal } from 'app/ui/search/SignInRequiredModal'

// Shared UI component for both web and native
export function SearchScreen() {
  const [searchPhrase, setSearchPhrase] = useState('')
  const [allowedSearchPhrase, setAllowedSearchPhrase] = useState('')
  const previousWordCount = useRef(0)
  
  // Auth and balance state
  const user = useUserStore((s) => s.user)
  const isAuthenticated = !!user
  const { data: hitzBalanceData } = useQuery(USER_HITZ_BALANCE, { 
    skip: !isAuthenticated,
    fetchPolicy: 'network-only' 
  })
  const hitzBalance = Number(hitzBalanceData?.userHitzBalance ?? 0)
  const hasUnlimitedSearch = hitzBalance >= UNLIMITED_SEARCH_HITZ_THRESHOLD
  
  // Rate limiting state
  const { 
    searchCount, 
    incrementSearchCount, 
    openSignInModal,
    setSearchCountFromStorage,
    resetSearchCount 
  } = useSearchRateLimitStore()
  const { openTopUpModal } = useTopUpModalStore()
  
  // Load stored search count on mount
  useEffect(() => {
    getStoredSearchCount().then(setSearchCountFromStorage)
  }, [setSearchCountFromStorage])
  
  // Reset search count when user logs in with sufficient balance
  useEffect(() => {
    if (isAuthenticated && hasUnlimitedSearch) {
      resetSearchCount()
    }
  }, [isAuthenticated, hasUnlimitedSearch, resetSearchCount])
  
  // Determine the current limit based on auth status
  const currentLimit = isAuthenticated ? LOGGED_IN_SEARCH_LIMIT : LOGGED_OUT_SEARCH_LIMIT
  
  // Handle search input changes with rate limiting
  const handleSearchChange = useCallback((newPhrase: string) => {
    const newWordCount = countCompleteWords(newPhrase)
    const prevWordCount = previousWordCount.current
    
    // Allow clearing and reducing the search
    if (newWordCount <= prevWordCount || newPhrase === '') {
      setSearchPhrase(newPhrase)
      setAllowedSearchPhrase(newPhrase)
      previousWordCount.current = newWordCount
      return
    }
    
    // A new word was completed (detected by space after word or increased word count)
    const completedNewWord = newWordCount > prevWordCount
    
    if (completedNewWord) {
      // Check if user has unlimited search
      if (hasUnlimitedSearch) {
        setSearchPhrase(newPhrase)
        setAllowedSearchPhrase(newPhrase)
        previousWordCount.current = newWordCount
        return
      }
      
      // Check if user is at their limit
      if (searchCount >= currentLimit) {
        // User is at limit, show appropriate modal
        if (!isAuthenticated) {
          openSignInModal()
        } else {
          openTopUpModal({
            action: 'search',
            requiredHITZ: UNLIMITED_SEARCH_HITZ_THRESHOLD,
            availableHITZ: hitzBalance,
          })
        }
        // Don't update the phrase or count - keep them at the limit
        setSearchPhrase(newPhrase) // Allow typing but...
        // Don't update allowedSearchPhrase - this blocks the actual search
        return
      }
      
      // Under limit, allow the search and increment counter
      incrementSearchCount()
      setSearchPhrase(newPhrase)
      setAllowedSearchPhrase(newPhrase)
      previousWordCount.current = newWordCount
    } else {
      // Still typing within a word, allow it
      setSearchPhrase(newPhrase)
      setAllowedSearchPhrase(newPhrase)
    }
  }, [
    searchCount, 
    currentLimit, 
    isAuthenticated, 
    hasUnlimitedSearch, 
    hitzBalance,
    incrementSearchCount, 
    openSignInModal, 
    openTopUpModal
  ])
  
  const handleClearSearch = useCallback(() => {
    setSearchPhrase('')
    setAllowedSearchPhrase('')
    previousWordCount.current = 0
  }, [])

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[--bg-color]">
      <View className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4">
        <SearchInputField
          value={searchPhrase}
          autoCapitalize="none"
          onChangeText={handleSearchChange}
          showX={!isEmpty(searchPhrase)}
          onXClick={handleClearSearch}
        />

        {/* Title for the content section */}
        <View className="mt-2 mb-2">
          <H1 className="text-base font-unbounded">
            {!searchPhrase ? 'Recently Added' : 'Search Results'}
          </H1>
        </View>

        {/* Show recently added when no search, combined results when searching */}
        {!allowedSearchPhrase ? (
          <RecentlyAddedList />
        ) : (
          <CombinedSearchResultList searchPhrase={allowedSearchPhrase} />
        )}
      </View>
      
      {/* Sign in modal for logged out users */}
      <SignInRequiredModal />
    </SafeAreaView>
  )
}
