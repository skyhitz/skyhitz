import { Entry } from 'app/api/graphql/types'
import { create } from 'zustand'

interface EntryState {
  entry: Entry | undefined
  setEntry: (entry: Entry | undefined) => void
  resetEntry: () => void
}

export const useEntryStore = create<EntryState>((set) => ({
  entry: undefined,
  setEntry: (entry) => set({ entry }),
  resetEntry: () => set({ entry: undefined }),
}))
