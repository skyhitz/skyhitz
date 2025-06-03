/**
 * Unified Player State Management using Zustand
 * Handles both ReactPlayer (web) and expo-av (native) with a single interface
 */
import { create } from 'zustand'
import { Entry } from 'app/api/graphql/types'
import { Platform } from 'react-native'

// Player adapter interface for unified control
interface PlayerAdapter {
  play(): void | Promise<void>
  pause(): void | Promise<void>
  seekTo(seconds: number): void | Promise<void>
  setVolume(volume: number): void | Promise<void>
  buffered?: any
  getDuration(): number
  getCurrentTime(): number
  isPlaying(): boolean
}

// ReactPlayer adapter
class ReactPlayerAdapter implements PlayerAdapter {
  constructor(private player: any) {}
  buffered?: any

  play() {
    // Both update state and try imperative approach
    if (this.player && this.player.getInternalPlayer) {
      const videoElement = this.player.getInternalPlayer()
      if (videoElement && videoElement.paused) {
        try {
          videoElement.play()
        } catch (e) {
          console.error('Error calling play():', e)
        }
      }
    }
  }

  pause() {
    // Both update state and try imperative approach
    if (this.player && this.player.getInternalPlayer) {
      const videoElement = this.player.getInternalPlayer()
      if (videoElement && !videoElement.paused) {
        try {
          videoElement.pause()
        } catch (e) {
          console.error('Error calling pause():', e)
        }
      }
    }
  }

  seekTo(seconds: number) {
    if (this.player) {
      console.log('calling seek to', seconds)
      this.player.seekTo(seconds)
    }
  }

  setVolume(volume: number) {
    // ReactPlayer volume is controlled via props
  }

  getDuration(): number {
    return this.player?.getDuration() || 0
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime() || 0
  }

  isPlaying(): boolean {
    return this.player?.player.isPlaying || false
  }
}

// Expo Video adapter
class ExpoVideoAdapter implements PlayerAdapter {
  constructor(private player: any) {}
  buffered?: any
  getDuration(): number {
    throw new Error('Method not implemented.')
  }
  getCurrentTime(): number {
    throw new Error('Method not implemented.')
  }

  async play() {
    if (this.player?.playAsync) {
      await this.player.playAsync()
    }
  }

  async pause() {
    if (this.player?.pauseAsync) {
      await this.player.pauseAsync()
    }
  }

  async seekTo(seconds: number) {
    if (this.player?.setPositionAsync) {
      await this.player.setPositionAsync(seconds * 1000) // Convert to milliseconds
    }
  }

  async setVolume(volume: number) {
    if (this.player?.setVolumeAsync) {
      await this.player.setVolumeAsync(volume)
    }
  }

  isPlaying(): boolean {
    throw new Error('Method not implemented.')
  }
}

export enum PlaybackState {
  IDLE = 'IDLE', // Initial state, nothing loaded
  LOADING = 'LOADING', // Loading media
  PLAYING = 'PLAYING', // Currently playing
  PAUSED = 'PAUSED', // Paused but loaded
  SEEKING = 'SEEKING', // User is seeking
  ERROR = 'ERROR', // Error occurred
  ENDED = 'ENDED', // Playback ended
}

export interface PlayerState {
  // Track metadata
  entry: Entry | null
  playbackUri: string

  // Playback state
  playbackState: PlaybackState
  duration: number // in seconds
  position: number // in seconds
  loadedSeconds: number // in seconds
  volume: number
  playbackRate: number

  // Player settings
  loop: boolean
  muted: boolean

  // Loaded progress tracking 0 - 0.999
  loaded: number

  // position progress tracking 0 - 0.999
  positionProgress: number

  // History and playlists
  playingHistory: Entry[]
  playlist: Entry[]

  // Internal player management
  playerRef: any | null
  playerAdapter: PlayerAdapter | null
  shouldPlay: boolean

  shuffle: boolean
  isReady: boolean

  // Actions
  setEntry: (entry: Entry | null) => void
  setPlaybackUri: (uri: string) => void
  setPlayerRef: (player: any) => void

  // Unified playback controls
  play: (uri?: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  stop: () => Promise<void>
  // fraction from 0 to 1
  seekTo: (fraction: number) => Promise<void>
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  toggleMute: () => void
  toggleLoop: () => void

  // State updates (called by player components)
  setProgress: () => void
  setPlaybackState: (state: PlaybackState) => void
  setPosition: () => void
  setPositionProgress: (positionProgress: number) => void
  setError: (error: string | null) => void
  setDuration: () => void
  setSeeking: () => void
  setIsReady: (isReady: boolean) => void

  // Reset
  reset: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  entry: null,
  playbackUri: '',
  playbackState: PlaybackState.IDLE,
  duration: 0,
  position: 0,
  positionProgress: 0,
  loadedSeconds: 0,
  loaded: 0,
  volume: 1.0,
  playbackRate: 1.0,
  loop: false,
  muted: false,
  shuffle: false,
  playingHistory: [],
  playlist: [],
  playerRef: null,
  playerAdapter: null,
  shouldPlay: false,
  isReady: false,

  // Basic setters
  setEntry: (entry) => set({ entry }),
  setPlaybackUri: (playbackUri) => set({ playbackUri }),

  setPlayerRef: (player) => {
    if (!player) {
      set({ playerRef: null, playerAdapter: null })
      return
    }

    // Create appropriate adapter based on platform
    let adapter: PlayerAdapter
    if (Platform.OS === 'web') {
      adapter = new ReactPlayerAdapter(player)
    } else {
      adapter = new ExpoVideoAdapter(player)
    }

    set({ playerRef: player, playerAdapter: adapter })

    // If we were playing before the ref was set, resume playback
    const { playbackState, playbackUri } = get()
    if (playbackState === PlaybackState.PLAYING && playbackUri) {
      // Small delay to ensure player is ready
      setTimeout(() => {
        get().resume()
      }, 100)
    }
  },

  // Unified playback controls
  play: async (uri?: string) => {
    const { playerAdapter } = get()
    if (uri) {
      set({
        playbackUri: uri,
        playbackState: PlaybackState.PLAYING,
        position: 0,
        shouldPlay: true,
      })
    }

    set({ playbackState: PlaybackState.PLAYING, shouldPlay: true })

    if (playerAdapter) {
      try {
        await playerAdapter.play()
      } catch (error) {
        console.error('Error playing:', error)
        set({ playbackState: PlaybackState.ERROR })
      }
    }
  },

  pause: async () => {
    const { playerAdapter } = get()
    set({ playbackState: PlaybackState.PAUSED, shouldPlay: false })

    if (playerAdapter) {
      try {
        await playerAdapter.pause()
      } catch (error) {
        console.error('Error pausing:', error)
      }
    }
  },

  resume: async () => {
    const { playerAdapter } = get()
    set({ playbackState: PlaybackState.PLAYING, shouldPlay: true })

    if (playerAdapter) {
      try {
        await playerAdapter.play()
      } catch (error) {
        console.error('Error resuming:', error)
        set({ playbackState: PlaybackState.ERROR })
      }
    }
  },

  stop: async () => {
    const { playerAdapter } = get()
    set({
      playbackState: PlaybackState.PAUSED,
      position: 0,
    })

    if (playerAdapter) {
      try {
        await playerAdapter.pause()
        await playerAdapter.seekTo(0)
      } catch (error) {
        console.error('Error stopping:', error)
      }
    }
  },

  setVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    const { playerAdapter } = get()

    set({ volume: clampedVolume })

    if (playerAdapter) {
      try {
        playerAdapter.setVolume(clampedVolume)
      } catch (error) {
        console.error('Error setting volume:', error)
      }
    }
  },

  setPlaybackRate: (rate: number) => {
    set({ playbackRate: rate })
    // Platform-specific implementation would be needed for this
  },

  toggleMute: () => {
    const { muted } = get()
    set({ muted: !muted })
  },

  toggleLoop: () => {
    const { loop } = get()
    set({ loop: !loop })
  },

  // State updates from player components
  setProgress: () => {
    // Web implementation
    const { playerAdapter, playbackState } = get()

    if (
      !playerAdapter ||
      playbackState === PlaybackState.SEEKING ||
      playerAdapter.buffered?.length
    )
      return

    set({
      loadedSeconds: playerAdapter.buffered?.end(
        playerAdapter.buffered?.length - 1
      ),
      loaded:
        playerAdapter.buffered?.end(playerAdapter.buffered?.length - 1) /
        playerAdapter.getDuration(),
    })
  },

  setDuration: () => {
    const { playerAdapter } = get()

    if (!playerAdapter) return

    set({ duration: playerAdapter.getDuration() })
  },

  setPlaybackState: (playbackState: PlaybackState) => {
    set({ playbackState })
  },

  setIsReady: (isReady: boolean) => {
    set({ isReady })
  },

  setError: (error: string | null) => {
    if (error) {
      set({ playbackState: PlaybackState.ERROR })
      console.error('Player error:', error)
    }
  },

  setPosition: () => {
    const { playerAdapter, playbackState } = get()

    if (!playerAdapter || playbackState === PlaybackState.SEEKING) return

    set({
      position: playerAdapter.getCurrentTime(),
      positionProgress:
        playerAdapter.getCurrentTime() / playerAdapter.getDuration(),
    })
  },

  setPositionProgress: (positionProgress: number) => {
    set({ positionProgress })
  },

  setSeeking: () => {
    set({ playbackState: PlaybackState.SEEKING })
  },

  seekTo: async (fraction: number) => {
    const { playerAdapter } = get()

    if (!playerAdapter) return

    playerAdapter.seekTo(fraction)

    console.log('isPlaying  ', playerAdapter.isPlaying())

    set({
      playbackState: playerAdapter.isPlaying()
        ? PlaybackState.PLAYING
        : PlaybackState.PAUSED,
      shouldPlay: playerAdapter.isPlaying(),
    })
  },

  reset: () => {
    set({
      entry: null,
      playbackUri: '',
      playbackState: PlaybackState.IDLE,
      shouldPlay: false,
      duration: 0,
      position: 0,
      volume: 1.0,
      playbackRate: 1.0,
      loop: false,
      muted: false,
      playingHistory: [],
      playlist: [],
      playerRef: null,
      playerAdapter: null,
      isReady: false,
    })
  },
}))
