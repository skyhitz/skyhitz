/**
 * Player state management using Zustand
 * Consolidated player state and playback control in one store
 */
import { create } from 'zustand'
import { Entry } from 'app/api/graphql/types'
import { Platform } from 'react-native'

// Define a generic player type that can be adapted to different implementations
type GenericPlayer = any

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
  volume: number
  isPlaying: boolean
  
  // Playback settings
  looping: boolean
  shuffle: boolean
  
  // History and playlists
  playingHistory: Entry[]
  playlist: Entry[]
  
  // Player references
  playerRef: GenericPlayer | null
  shouldPlay: boolean
  timeoutId: NodeJS.Timeout | null
  
  // Basic actions
  setEntry: (entry: Entry | null) => void
  setPlaybackUri: (uri: string) => void
  setPlaybackState: (state: PlaybackState) => void
  setDuration: (duration: number) => void
  setPosition: (position: number) => void
  setLooping: (looping: boolean) => void
  setShuffle: (shuffle: boolean) => void
  setPlayingHistory: (history: Entry[]) => void
  setPlaylist: (playlist: Entry[]) => void
  
  // Player control actions
  setPlayerRef: (player: GenericPlayer | null) => void
  setShouldPlay: (shouldPlay: boolean) => void
  setTimeoutId: (timeoutId: NodeJS.Timeout | null) => void
  setVolume: (volume: number) => void
  
  // Playback control functions
  playAudio: (uri: string) => void
  pauseAudio: () => void
  resumeAudio: () => void
  stopAudio: () => void
  
  // Reset all player state
  resetPlayer: () => void
}

// Create the Zustand store
export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Initial state
  entry: null,
  playbackUri: '',
  playbackState: 'IDLE',
  duration: 0,
  position: 0,
  volume: 1.0,
  isPlaying: false,
  looping: false,
  shuffle: false,
  playingHistory: [],
  playlist: [],
  
  // Player references
  playerRef: null,
  shouldPlay: false,
  timeoutId: null,
  
  // Basic actions
  setEntry: (entry) => set({ entry }),
  setPlaybackUri: (playbackUri) => set({ playbackUri }),
  setPlaybackState: (playbackState) => set({
    playbackState,
    // Update isPlaying based on playbackState for consistency
    isPlaying: playbackState === 'PLAYING'
  }),
  setDuration: (duration) => set({ duration }),
  setPosition: (position) => set({ position }),
  setLooping: (looping) => set({ looping }),
  setShuffle: (shuffle) => set({ shuffle }),
  setPlayingHistory: (playingHistory) => set({ playingHistory }),
  setPlaylist: (playlist) => set({ playlist }),
  
  // Player control actions
  setPlayerRef: (player) => {
    const { playerRef, isPlaying, playbackUri, playbackState } = get();
    
    console.log('[PlayerStore] setPlayerRef called with player:', !!player);
    
    // If we're setting to null (cleanup), update the ref and return
    if (!player) {
      set({ playerRef: null });
      return;
    }
    
    // If the reference is the same, do nothing more
    if (playerRef === player) {
      console.log('[PlayerStore] Player reference unchanged');
      return;
    }
    
    // Store the player reference
    set({ playerRef: player });
    console.log('[PlayerStore] Player reference updated');
    
    // Check if we have a ReactPlayer instance (web)
    const isReactPlayer = Platform.OS === 'web' && 
      player && 
      typeof player === 'object' && 
      'getInternalPlayer' in player;
    
    // Only attempt to auto-play if we're explicitly in a playing state
    // This prevents unwanted auto-play when the component is just mounting
    if (isPlaying && playbackUri && playbackState === 'PLAYING') {
      console.log('[PlayerStore] Auto-playing newly set player');
      
      // Use setTimeout to ensure the player is fully initialized
      setTimeout(() => {
        const { playerRef } = get();
        // Make sure the ref is still valid when the timeout fires
        if (!playerRef) return;
        
        try {
          if (isReactPlayer) {
            // ReactPlayer specific control
            console.log('[PlayerStore] Controlling ReactPlayer');
            // No need to do anything as ReactPlayer will auto-play based on its props
          } else {
            // Native Video component control
            console.log('[PlayerStore] Controlling native Video component');
            // If the player has a setStatusAsync method (our Video component)
            if (typeof playerRef.setStatusAsync === 'function') {
              playerRef.setStatusAsync({ shouldPlay: true });
            }
            // If the player has a playAsync method (our Video component)
            else if (typeof playerRef.playAsync === 'function') {
              playerRef.playAsync();
            }
          }
        } catch (e) {
          console.error('[PlayerStore] Error auto-playing newly set player:', e);
        }
      }, 100);
    }
  },
  setShouldPlay: (shouldPlay) => {
    const { isPlaying, playbackUri } = get();
    set({ shouldPlay });
    
    if (shouldPlay && !isPlaying && playbackUri) {
      get().resumeAudio();
    } else if (!shouldPlay && isPlaying) {
      get().pauseAudio();
    }
  },
  setTimeoutId: (timeoutId) => set({ timeoutId }),
  setVolume: (newVolume) => {
    // Clamp volume between 0 and 1
    const volume = Math.max(0, Math.min(1, newVolume));
    set({ volume });
    
    const { playerRef } = get();
    // Try to control the player's volume directly if it exists
    if (playerRef) {
      try {
        // If the player has a setStatusAsync method (our Video component)
        if (typeof playerRef.setStatusAsync === 'function') {
          playerRef.setStatusAsync({ volume });
        }
      } catch (e) {
        console.error('[PlayerStore] Error setting volume:', e);
      }
    }
  },
  
  // Playback control functions
  playAudio: (uri) => {
    console.log(`[PlayerStore] Playing audio: ${uri}`);
    
    // Update state
    set({
      playbackUri: uri,
      isPlaying: true,
      shouldPlay: true,
      playbackState: 'PLAYING'
    });
    
    const { playerRef } = get();
    // Try to control the player directly if it exists
    if (playerRef) {
      try {
        // Check if we have a ReactPlayer instance (web)
        const isReactPlayer = Platform.OS === 'web' && 
          playerRef && 
          typeof playerRef === 'object' && 
          'getInternalPlayer' in playerRef;
        
        if (isReactPlayer) {
          // ReactPlayer is controlled through props, so we don't need to call methods
          // The VideoPlayer component will respond to the isPlaying state change
          console.log('[PlayerStore] ReactPlayer will auto-play based on props');
        } else {
          // Native Video component control
          console.log('[PlayerStore] Controlling native Video component');
          // If the player has a setStatusAsync method (our Video component)
          if (typeof playerRef.setStatusAsync === 'function') {
            playerRef.setStatusAsync({ shouldPlay: true });
          }
          // If the player has a playAsync method (our Video component)
          else if (typeof playerRef.playAsync === 'function') {
            playerRef.playAsync();
          }
        }
      } catch (e) {
        console.error('[PlayerStore] Error playing audio:', e);
      }
    }
  },
  
  pauseAudio: () => {
    console.log('[PlayerStore] Pausing audio');
    
    set({
      isPlaying: false,
      shouldPlay: false,
      playbackState: 'PAUSED'
    });
    
    const { playerRef } = get();
    // Try to control the player directly if it exists
    if (playerRef) {
      try {
        // Check if we have a ReactPlayer instance (web)
        const isReactPlayer = Platform.OS === 'web' && 
          playerRef && 
          typeof playerRef === 'object' && 
          'getInternalPlayer' in playerRef;
        
        if (isReactPlayer) {
          // ReactPlayer is controlled through props, so we don't need to call methods
          // The VideoPlayer component will respond to the isPlaying state change
          console.log('[PlayerStore] ReactPlayer will pause based on props');
        } else {
          // Native Video component control
          console.log('[PlayerStore] Controlling native Video component');
          // If the player has a setStatusAsync method (our Video component)
          if (typeof playerRef.setStatusAsync === 'function') {
            playerRef.setStatusAsync({ shouldPlay: false });
          }
          // If the player has a pauseAsync method (our Video component)
          else if (typeof playerRef.pauseAsync === 'function') {
            playerRef.pauseAsync();
          }
        }
      } catch (e) {
        console.error('[PlayerStore] Error pausing audio:', e);
      }
    }
  },
  
  resumeAudio: () => {
    console.log('[PlayerStore] Resuming audio');
    
    set({
      isPlaying: true,
      shouldPlay: true,
      playbackState: 'PLAYING'
    });
    
    const { playerRef } = get();
    // Try to control the player directly if it exists
    if (playerRef) {
      try {
        // Check if we have a ReactPlayer instance (web)
        const isReactPlayer = Platform.OS === 'web' && 
          playerRef && 
          typeof playerRef === 'object' && 
          'getInternalPlayer' in playerRef;
        
        if (isReactPlayer) {
          // ReactPlayer is controlled through props, so we don't need to call methods
          // The VideoPlayer component will respond to the isPlaying state change
          console.log('[PlayerStore] ReactPlayer will resume based on props');
        } else {
          // Native Video component control
          console.log('[PlayerStore] Controlling native Video component');
          // If the player has a setStatusAsync method (our Video component)
          if (typeof playerRef.setStatusAsync === 'function') {
            playerRef.setStatusAsync({ shouldPlay: true });
          }
          // If the player has a playAsync method (our Video component)
          else if (typeof playerRef.playAsync === 'function') {
            playerRef.playAsync();
          }
        }
      } catch (e) {
        console.error('[PlayerStore] Error resuming audio:', e);
      }
    }
  },
  
  stopAudio: () => {
    console.log('[PlayerStore] Stopping audio');
    
    set({
      isPlaying: false,
      shouldPlay: false,
      playbackState: 'PAUSED'
    });
    
    const { playerRef } = get();
    // Try to control the player directly if it exists
    if (playerRef) {
      try {
        // Check if we have a ReactPlayer instance (web)
        const isReactPlayer = Platform.OS === 'web' && 
          playerRef && 
          typeof playerRef === 'object' && 
          'getInternalPlayer' in playerRef;
        
        if (isReactPlayer) {
          // For ReactPlayer, we can't directly control it, but we can update our state
          // The VideoPlayer component will respond to the isPlaying state change
          console.log('[PlayerStore] ReactPlayer will stop based on props');
        } else {
          // Native Video component control
          console.log('[PlayerStore] Controlling native Video component');
          // If the player has a setStatusAsync method (our Video component)
          if (typeof playerRef.setStatusAsync === 'function') {
            playerRef.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
          }
          // If the player has a pauseAsync method (our Video component)
          else if (typeof playerRef.pauseAsync === 'function') {
            playerRef.pauseAsync();
            // Try to seek to beginning if possible
            if (typeof playerRef.setStatusAsync === 'function') {
              playerRef.setStatusAsync({ positionMillis: 0 });
            }
          }
        }
      } catch (e) {
        console.error('[PlayerStore] Error stopping audio:', e);
      }
    }
    
    // Also update position to 0
    set({ position: 0 });
  },
  
  // Reset all player state
  resetPlayer: () => {
    const { timeoutId } = get();
    
    // Clear any pending timeouts
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    set({
      entry: null,
      playbackUri: '',
      playbackState: 'IDLE',
      duration: 0,
      position: 0,
      isPlaying: false,
      shouldPlay: false,
      playerRef: null,
      timeoutId: null,
      playingHistory: [],
      playlist: []
    });
  }
}))
