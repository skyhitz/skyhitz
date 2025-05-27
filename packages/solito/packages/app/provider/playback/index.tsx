'use client'
/**
 * Platform-agnostic playback provider that works for both web and native
 */
import * as React from 'react'
import { createContext, useContext, useRef, ReactNode, useState, useEffect } from 'react'
import { Platform } from 'react-native'

// Define a generic player type that can be adapted to different implementations
type GenericPlayer = any

// Define our context interface
interface PlaybackContextProps {
  // Playback state
  isPlaying: boolean
  currentUri: string | null
  volume: number
  
  // Audio control functions
  playAudio: (uri: string) => void
  pauseAudio: () => void
  resumeAudio: () => void
  stopAudio: () => void
  setVolume: (volume: number) => void
  
  // Legacy refs for backward compatibility
  playbackRef: React.MutableRefObject<GenericPlayer | null>
  shouldPlayRef: React.MutableRefObject<boolean>
  timeoutIdRef: React.MutableRefObject<NodeJS.Timeout | null>
  
  // Legacy setters for backward compatibility
  setPlayback: (playback: GenericPlayer | null) => void
  setShouldPlay: (shouldPlay: boolean) => void
  setTimeoutId: (timeoutId: NodeJS.Timeout | null) => void
}

const PlaybackContext = createContext<PlaybackContextProps | undefined>(undefined)

export function PlaybackProvider({ children }: { children: ReactNode }) {
  // State for tracking audio playback
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentUri, setCurrentUri] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(1.0) // Default volume: 100%
  
  // Legacy refs for backward compatibility
  const playbackRef = useRef<GenericPlayer | null>(null)
  const shouldPlayRef = useRef<boolean>(false)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  
  // Audio control functions that actually control the video player through the ref
  const playAudio = (uri: string) => {
    console.log(`[PlaybackProvider] Playing audio: ${uri}`)
    // Update state
    setCurrentUri(uri)
    setIsPlaying(true)
    shouldPlayRef.current = true
    
    // Try to control the player directly if it exists
    if (playbackRef.current) {
      try {
        // Check if we have a ReactPlayer instance (web)
        const isReactPlayer = Platform.OS === 'web' && 
          playbackRef.current && 
          typeof playbackRef.current === 'object' && 
          'getInternalPlayer' in playbackRef.current;
        
        if (isReactPlayer) {
          // ReactPlayer is controlled through props, so we don't need to call methods
          // The VideoPlayer component will respond to the isPlaying state change
          console.log('[PlaybackProvider] ReactPlayer will auto-play based on props');
        } else {
          // Native Video component control
          console.log('[PlaybackProvider] Controlling native Video component');
          // If the player has a setStatusAsync method (our Video component)
          if (typeof playbackRef.current.setStatusAsync === 'function') {
            playbackRef.current.setStatusAsync({ shouldPlay: true });
          }
          // If the player has a playAsync method (our Video component)
          else if (typeof playbackRef.current.playAsync === 'function') {
            playbackRef.current.playAsync();
          }
        }
      } catch (e) {
        console.error('[PlaybackProvider] Error playing audio:', e);
      }
    }
  }
  
  const pauseAudio = () => {
    console.log('[PlaybackProvider] Pausing audio')
    setIsPlaying(false)
    shouldPlayRef.current = false
    
    // Try to control the player directly if it exists
    if (playbackRef.current) {
      try {
        // Check if we have a ReactPlayer instance (web)
        const isReactPlayer = Platform.OS === 'web' && 
          playbackRef.current && 
          typeof playbackRef.current === 'object' && 
          'getInternalPlayer' in playbackRef.current;
        
        if (isReactPlayer) {
          // ReactPlayer is controlled through props, so we don't need to call methods
          // The VideoPlayer component will respond to the isPlaying state change
          console.log('[PlaybackProvider] ReactPlayer will pause based on props');
        } else {
          // Native Video component control
          console.log('[PlaybackProvider] Controlling native Video component');
          // If the player has a setStatusAsync method (our Video component)
          if (typeof playbackRef.current.setStatusAsync === 'function') {
            playbackRef.current.setStatusAsync({ shouldPlay: false });
          }
          // If the player has a pauseAsync method (our Video component)
          else if (typeof playbackRef.current.pauseAsync === 'function') {
            playbackRef.current.pauseAsync();
          }
        }
      } catch (e) {
        console.error('[PlaybackProvider] Error pausing audio:', e);
      }
    }
  }
  
  const resumeAudio = () => {
    console.log('[PlaybackProvider] Resuming audio')
    setIsPlaying(true)
    shouldPlayRef.current = true
    
    // Try to control the player directly if it exists
    if (playbackRef.current) {
      try {
        // If the player has a setStatusAsync method (our Video component)
        if (typeof playbackRef.current.setStatusAsync === 'function') {
          playbackRef.current.setStatusAsync({ shouldPlay: true });
        }
        // If the player has a playAsync method (our Video component)
        else if (typeof playbackRef.current.playAsync === 'function') {
          playbackRef.current.playAsync();
        }
      } catch (e) {
        console.error('[PlaybackProvider] Error resuming audio:', e);
      }
    }
  }
  
  const stopAudio = () => {
    console.log('[PlaybackProvider] Stopping audio')
    setIsPlaying(false)
    shouldPlayRef.current = false
    
    // Try to control the player directly if it exists
    if (playbackRef.current) {
      try {
        // If the player has a setStatusAsync method (our Video component)
        if (typeof playbackRef.current.setStatusAsync === 'function') {
          playbackRef.current.setStatusAsync({ shouldPlay: false, positionMillis: 0 });
        }
        // If the player has a pauseAsync method (our Video component)
        else if (typeof playbackRef.current.pauseAsync === 'function') {
          playbackRef.current.pauseAsync();
          // Try to seek to beginning if possible
          if (typeof playbackRef.current.setStatusAsync === 'function') {
            playbackRef.current.setStatusAsync({ positionMillis: 0 });
          }
        }
      } catch (e) {
        console.error('[PlaybackProvider] Error stopping audio:', e);
      }
    }
  }
  
  const setVolume = (newVolume: number) => {
    // Clamp volume between 0 and 1
    const safeVolume = Math.max(0, Math.min(1, newVolume))
    console.log(`[PlaybackProvider] Setting volume: ${safeVolume}`)
    setVolumeState(safeVolume)
    
    // Try to control the player's volume directly if it exists
    if (playbackRef.current) {
      try {
        // If the player has a setStatusAsync method (our Video component)
        if (typeof playbackRef.current.setStatusAsync === 'function') {
          playbackRef.current.setStatusAsync({ volume: safeVolume });
        }
      } catch (e) {
        console.error('[PlaybackProvider] Error setting volume:', e);
      }
    }
  }
  
  // Setter function for the player reference
  const setPlayback = (playback: GenericPlayer | null) => {
    console.log('[PlaybackProvider] setPlayback called with player:', !!playback);
    
    // If we're setting to null (cleanup), update the ref and return
    if (!playback) {
      playbackRef.current = null;
      return;
    }
    
    // If the reference is the same, do nothing more
    if (playbackRef.current === playback) {
      console.log('[PlaybackProvider] Player reference unchanged');
      return;
    }
    
    // Store the player reference
    playbackRef.current = playback;
    console.log('[PlaybackProvider] Player reference updated');
    
    // Check if we have a ReactPlayer instance (web)
    const isReactPlayer = Platform.OS === 'web' && 
      playback && 
      typeof playback === 'object' && 
      'getInternalPlayer' in playback;
    
    // Only attempt to auto-play if we're explicitly in a playing state
    // This prevents unwanted auto-play when the component is just mounting
    if (isPlaying && currentUri) {
      console.log('[PlaybackProvider] Auto-playing newly set player');
      
      // Use setTimeout to ensure the player is fully initialized
      setTimeout(() => {
        // Make sure the ref is still valid when the timeout fires
        if (!playbackRef.current) return;
        
        try {
          if (isReactPlayer) {
            // ReactPlayer specific control
            console.log('[PlaybackProvider] Controlling ReactPlayer');
            // No need to do anything as ReactPlayer will auto-play based on its props
          } else {
            // Native Video component control
            console.log('[PlaybackProvider] Controlling native Video component');
            // If the player has a setStatusAsync method (our Video component)
            if (typeof playbackRef.current.setStatusAsync === 'function') {
              playbackRef.current.setStatusAsync({ shouldPlay: true });
            }
            // If the player has a playAsync method (our Video component)
            else if (typeof playbackRef.current.playAsync === 'function') {
              playbackRef.current.playAsync();
            }
          }
        } catch (e) {
          console.error('[PlaybackProvider] Error auto-playing newly set player:', e);
        }
      }, 100);
    }
  }
  
  const setShouldPlay = (shouldPlay: boolean) => {
    shouldPlayRef.current = shouldPlay
    if (shouldPlay && !isPlaying && currentUri) {
      resumeAudio();
    } else if (!shouldPlay && isPlaying) {
      pauseAudio();
    }
  }
  
  const setTimeoutId = (timeoutId: NodeJS.Timeout | null) => {
    timeoutIdRef.current = timeoutId
  }
  
  // Create context value
  const value = {
    // Playback state
    isPlaying,
    currentUri,
    volume,
    
    // Audio control functions
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    setVolume,
    
    // Legacy refs for backward compatibility
    playbackRef,
    shouldPlayRef,
    timeoutIdRef,
    
    // Legacy setters for backward compatibility
    setPlayback,
    setShouldPlay,
    setTimeoutId
  }
  
  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  )
}

export function usePlaybackContext() {
  const context = useContext(PlaybackContext)
  if (context === undefined) {
    throw new Error('usePlaybackContext must be used within a PlaybackProvider')
  }
  return context
}
