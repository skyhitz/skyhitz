/**
 * Player state management using Zustand
 * Migrated from the legacy Recoil implementation
 */
import { create } from 'zustand'
import { Entry } from 'app/api/graphql/types'

// Player state types
export type PlaybackState = 
  | 'IDLE'      // Initial state, nothing loaded
  | 'LOADING'   // Loading media
  | 'PLAYING'   // Currently playing
  | 'PAUSED'    // Paused but loaded
  | 'SEEKING'   // User is seeking
  | 'ERROR'     // Error occurred
  | 'FALLBACK'  // Using fallback source

export interface PlayerState {
  // Track metadata
  entry: Entry | null
  playbackUri: string
  
  // Playback state
  playbackState: PlaybackState
  duration: number
  position: number
  
  // Playback settings
  looping: boolean
  shuffle: boolean
  
  // History and playlists
  playingHistory: Entry[]
  playlist: Entry[]
  
  // Actions
  setEntry: (entry: Entry | null) => void
  setPlaybackUri: (uri: string) => void
  setPlaybackState: (state: PlaybackState) => void
  setDuration: (duration: number) => void
  setPosition: (position: number) => void
  setLooping: (looping: boolean) => void
  setShuffle: (shuffle: boolean) => void
  setPlayingHistory: (history: Entry[]) => void
  setPlaylist: (playlist: Entry[]) => void
  resetPlayer: () => void
}

// Create the Zustand store
export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial state
  entry: null,
  playbackUri: '',
  playbackState: 'IDLE',
  duration: 0,
  position: 0,
  looping: false,
  shuffle: false,
  playingHistory: [],
  playlist: [],
  
  // Actions
  setEntry: (entry) => set({ entry }),
  setPlaybackUri: (playbackUri) => set({ playbackUri }),
  setPlaybackState: (playbackState) => set({ playbackState }),
  setDuration: (duration) => set({ duration }),
  setPosition: (position) => set({ position }),
  setLooping: (looping) => set({ looping }),
  setShuffle: (shuffle) => set({ shuffle }),
  setPlayingHistory: (playingHistory) => set({ playingHistory }),
  setPlaylist: (playlist) => set({ playlist }),
  
  // Reset all player state
  resetPlayer: () => set({
    entry: null,
    playbackUri: '',
    playbackState: 'IDLE',
    duration: 0,
    position: 0,
    playingHistory: [],
    playlist: []
  })
}))
