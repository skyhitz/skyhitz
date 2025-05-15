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
  
  // Audio control functions - these would be connected to actual implementations
  // in platform-specific code
  const playAudio = (uri: string) => {
    console.log(`[PlaybackProvider] Playing audio: ${uri}`)
    // Update state
    setCurrentUri(uri)
    setIsPlaying(true)
    shouldPlayRef.current = true
    
    // This is where you would connect to platform-specific audio player
    // For now, we just update the state
  }
  
  const pauseAudio = () => {
    console.log('[PlaybackProvider] Pausing audio')
    setIsPlaying(false)
    shouldPlayRef.current = false
    
    // This is where you would pause the platform-specific audio player
  }
  
  const resumeAudio = () => {
    console.log('[PlaybackProvider] Resuming audio')
    setIsPlaying(true)
    shouldPlayRef.current = true
    
    // This is where you would resume the platform-specific audio player
  }
  
  const stopAudio = () => {
    console.log('[PlaybackProvider] Stopping audio')
    setIsPlaying(false)
    shouldPlayRef.current = false
    
    // This is where you would stop the platform-specific audio player
  }
  
  const setVolume = (newVolume: number) => {
    // Clamp volume between 0 and 1
    const safeVolume = Math.max(0, Math.min(1, newVolume))
    console.log(`[PlaybackProvider] Setting volume: ${safeVolume}`)
    setVolumeState(safeVolume)
    
    // This is where you would set volume on the platform-specific audio player
  }
  
  // Legacy setter functions for backward compatibility
  const setPlayback = (playback: GenericPlayer | null) => {
    if (playback) {
      playbackRef.current = playback
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
