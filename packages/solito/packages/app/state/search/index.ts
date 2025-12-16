'use client'
import { create } from 'zustand'
import { Platform } from 'react-native'

// Rate limits
export const LOGGED_OUT_SEARCH_LIMIT = 2 // words
export const LOGGED_IN_SEARCH_LIMIT = 5 // words
export const UNLIMITED_SEARCH_HITZ_THRESHOLD = 20 // HITZ balance required for unlimited

type SearchRateLimitState = {
  searchCount: number
  signInModalVisible: boolean
  incrementSearchCount: () => void
  resetSearchCount: () => void
  openSignInModal: () => void
  closeSignInModal: () => void
  getSearchCount: () => number
  setSearchCountFromStorage: (count: number) => void
}

// Storage key for persisting search count
const SEARCH_COUNT_KEY = 'search_rate_limit_count'

// Helper to get search count from storage (for initial load)
export async function getStoredSearchCount(): Promise<number> {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(SEARCH_COUNT_KEY)
      return stored ? parseInt(stored, 10) : 0
    } catch {
      return 0
    }
  }
  return 0
}

// Helper to persist search count to storage
function persistSearchCount(count: number) {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(SEARCH_COUNT_KEY, count.toString())
    } catch {
      // Silently fail
    }
  }
}

export const useSearchRateLimitStore = create<SearchRateLimitState>((set, get) => ({
  searchCount: 0,
  signInModalVisible: false,
  
  incrementSearchCount: () => {
    const newCount = get().searchCount + 1
    set({ searchCount: newCount })
    persistSearchCount(newCount)
  },
  
  resetSearchCount: () => {
    set({ searchCount: 0 })
    persistSearchCount(0)
  },
  
  getSearchCount: () => get().searchCount,
  
  setSearchCountFromStorage: (count: number) => {
    set({ searchCount: count })
  },
  
  openSignInModal: () => set({ signInModalVisible: true }),
  closeSignInModal: () => set({ signInModalVisible: false }),
}))

// Utility to count complete words in a search phrase
export function countCompleteWords(phrase: string): number {
  if (!phrase.trim()) return 0
  // Split by whitespace and filter empty strings
  const words = phrase.trim().split(/\s+/).filter(Boolean)
  return words.length
}

