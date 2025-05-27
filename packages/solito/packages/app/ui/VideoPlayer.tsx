'use client'
/**
 * Video Player component for Skyhitz
 * Supports both Cloudflare Stream and IPFS video sources
 * Works on web, iOS, and Android
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { usePlayerStore } from 'app/state/player'

// Web-only implementation for now
// We'll add native support later

// Import ReactPlayer directly for web
// Using dynamic import with Next.js to avoid SSR issues
import dynamic from 'next/dynamic'

// Dynamically import ReactPlayer with no SSR to avoid hydration issues
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => null, // Don't show any loading state to prevent flicker
})

function Poster() {
  const { entry } = usePlayerStore()

  const posterUri = useMemo(() => {
    if (entry?.imageUrl) {
      return imageUrlMedium(entry.imageUrl)
    }
    return undefined
  }, [entry])

  return (
    posterUri && (
      <View className="absolute aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md">
        <SolitoImage
          fill
          src={posterUri}
          // @ts-ignore
          className={'aspect-square md:rounded-md'}
          alt="player"
          contentFit="cover"
          sizes="(max-width: 768px) 100vw"
        />
      </View>
    )
  )
}

// Define a type for the ReactPlayer ref
interface ReactPlayerRef {
  seekTo: (amount: number, type: 'seconds' | 'fraction') => void
  getCurrentTime: () => number
  getDuration: () => number
}

export function VideoPlayer() {
  // Create a ref for the video player with proper typing
  const playerRef = useRef<ReactPlayerRef | null>(null)

  // Get player state from the store
  const {
    playbackUri,
    isPlaying,
    position,
    duration: storeDuration,
    setPlayerRef,
    setPlaybackState,
    setDuration,
    setPosition,
    setPlaybackUri,
  } = usePlayerStore()

  // Local state for the player
  const [loading, setLoading] = useState(true)

  // Define a fallback URL for when no playback URI is set
  const fallbackUrl =
    'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8'

  // Use the URI from the store or fallback
  const videoUrl = playbackUri || fallbackUrl

  // Set the fallback URL in the store if no playback URI is set
  useEffect(() => {
    if (!playbackUri && videoUrl) {
      console.log('Setting fallback URL in store:', videoUrl)
      setPlaybackUri(videoUrl)
    }
    console.log('VideoPlayer using URL:', videoUrl)
  }, [playbackUri, videoUrl, setPlaybackUri])

  // Handle player ready event
  const handleReady = useCallback(() => {
    console.log('Video player is ready')
    setLoading(false)
  }, [])

  // Handle play event
  const handlePlay = useCallback(() => {
    console.log('Video started playing')
    setPlaybackState('PLAYING')
  }, [setPlaybackState])

  // Handle pause event
  const handlePause = useCallback(() => {
    console.log('Video paused')
    setPlaybackState('PAUSED')
  }, [setPlaybackState])

  // Handle video end
  const handleEnded = useCallback(() => {
    console.log('Video ended')
    setPlaybackState('PAUSED')
    setPosition(0)
  }, [setPlaybackState, setPosition])

  // Handle duration change
  const handleDuration = useCallback(
    (duration: number) => {
      console.log('Duration changed:', duration)
      setDuration(duration * 1000) // Convert to milliseconds for the store
    },
    [setDuration]
  )

  // Handle progress updates
  const handleProgress = useCallback(
    (state: any) => {
      setPosition(state.playedSeconds * 1000) // Convert to milliseconds for the store
    },
    [setPosition]
  )

  // Handle errors
  const handleError = useCallback(
    (error: any) => {
      console.error('Video playback error:', error)
      setLoading(false)
      setPlaybackState('ERROR')
    },
    [setPlaybackState]
  )

  // Track the last position to detect when seeking happens
  const lastPositionRef = useRef(position)

  // Effect to handle seeking when position changes significantly
  useEffect(() => {
    // Skip small incremental position updates during normal playback
    // Only respond to significant position changes which indicate seeking
    const positionDifference = Math.abs(position - lastPositionRef.current)
    const isSignificantChange = positionDifference > 1000 // More than 1 second jump

    if (
      isSignificantChange &&
      playerRef.current &&
      typeof playerRef.current.seekTo === 'function'
    ) {
      console.log(
        `Seeking to position: ${position}ms (${
          (position / storeDuration) * 100
        }%)`
      )
      // Convert position (ms) to fraction of total duration for ReactPlayer
      const seekPosition = position / storeDuration
      playerRef.current.seekTo(seekPosition, 'fraction')
    }

    // Update the last position reference
    lastPositionRef.current = position
  }, [position, storeDuration, isPlaying])

  // Register the player ref with the store
  const registerPlayerRef = useCallback(
    (player: any) => {
      setPlayerRef(player)
      if (player) {
        playerRef.current = player
      }
    },
    [setPlayerRef]
  )

  // For web, we'll use a simplified approach focused on ReactPlayer
  return (
    <View className="items-center justify-center">
      {/* Show poster while loading or when no video is playing */}
      {loading && <Poster />}

      {/* Web video player implementation */}
      <View
        className={`aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md`}
        style={{
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ReactPlayer
          ref={registerPlayerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={isPlaying}
          volume={1}
          muted={false}
          onReady={handleReady}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          onDuration={handleDuration}
          onProgress={handleProgress}
          config={{
            file: {
              forceHLS: true,
            },
          }}
        />
      </View>
    </View>
  )
}
