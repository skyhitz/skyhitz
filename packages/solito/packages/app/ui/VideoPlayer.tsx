/**
 * Unified Video Player Component for Web and Native
 * Uses the unified player store with adapter pattern
 */
import { useCallback, useRef, useState } from 'react'
import { View, Platform } from 'react-native'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { PlaybackState, usePlayerStore } from 'app/state/player'

// Web-specific imports
import dynamic from 'next/dynamic'

// Dynamically import ReactPlayer with no SSR
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => null,
})

// Poster component
function Poster() {
  const { entry } = usePlayerStore()

  if (!entry?.imageUrl) return null

  const posterUri = imageUrlMedium(entry.imageUrl)

  return (
    <View className="absolute aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md">
      <SolitoImage
        fill
        src={posterUri}
        className="aspect-square md:rounded-md"
        alt="player"
        contentFit="cover"
        sizes="(max-width: 768px) 100vw"
      />
    </View>
  )
}

// Web Video Player Component
function WebVideoPlayer() {
  const playerRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)

  const {
    playbackUri,
    playbackState,
    volume,
    muted,
    loop,
    playbackRate,
    setPlayerRef,
    setProgress,
    setPlaybackState,
    // setError,
    setPosition,
    setDuration,
  } = usePlayerStore()

  // Register player ref with store
  const handleRef = useCallback(
    (player: any) => {
      playerRef.current = player

      console.log('ReactPlayer ref set', player)
      setPlayerRef(player)
    },
    [setPlayerRef]
  )

  // Player event handlers
  const handleReady = useCallback(() => {
    console.log('ReactPlayer ready')
    setIsReady(true)
    setPlaybackState(PlaybackState.PAUSED) // Ready but not playing yet
  }, [setPlaybackState])

  const handlePlay = useCallback(() => {
    console.log('ReactPlayer started playing')
    setPlaybackState(PlaybackState.PLAYING)
  }, [setPlaybackState])

  const handlePause = useCallback(() => {
    console.log('ReactPlayer paused')
    setPlaybackState(PlaybackState.PAUSED)
  }, [setPlaybackState])

  const handleEnded = useCallback(() => {
    console.log('ReactPlayer ended')
    setPlaybackState(PlaybackState.ENDED)
  }, [setPlaybackState])

  // const handleError = useCallback(
  //   (error: any) => {
  //     console.error('ReactPlayer error:', error)
  //     setError(error?.message || 'Playback error')
  //   },
  //   [setError]
  // )

  const handleDurationChange = useCallback(() => {
    setDuration()
  }, [setDuration])

  const handleProgress = useCallback(() => {
    setProgress()
  }, [setProgress])

  const handleTimeUpdate = useCallback(() => {
    console.log('ReactPlayer time update')
    setPosition()
  }, [setPosition])

  if (!playbackUri) {
    return <Poster />
  }

  return (
    <View className="aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md">
      <ReactPlayer
        ref={handleRef}
        url={playbackUri}
        width="100%"
        height="100%"
        volume={muted ? 0 : volume}
        muted={muted}
        loop={loop}
        playbackRate={playbackRate}
        onLoadStart={() => console.log('onLoadStart')}
        onStart={() => console.log('onStart')}
        onReady={() => console.log('onReady')}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={(e) => console.log(e)}
        onDurationChange={handleDurationChange}
        onProgress={handleProgress}
        onTimeUpdate={handleTimeUpdate}
        config={{
          file: {
            forceHLS: true,
            attributes: {
              preload: 'metadata',
            },
          },
        }}
      />
      {!isReady && <Poster />}
    </View>
  )
}

// Native Video Player Component (placeholder for expo-av)
function NativeVideoPlayer() {
  const {
    playbackUri,
    playbackState,
    volume,
    muted,
    loop,
    setPlayerRef,
    setProgress,
    setPlaybackState,
    setError,
  } = usePlayerStore()

  // This would be implemented with expo-av Video component
  // const handleRef = useCallback((player: any) => {
  //   setPlayerRef(player)
  // }, [setPlayerRef])

  // const handleStatusUpdate = useCallback((status: any) => {
  //   if (status.isLoaded) {
  //     updateProgress(
  //       status.positionMillis / 1000,
  //       status.durationMillis / 1000
  //     )
  //
  //     if (status.didJustFinish) {
  //       setPlaybackState('ENDED')
  //     } else if (status.isPlaying) {
  //       setPlaybackState('PLAYING')
  //     } else {
  //       setPlaybackState('PAUSED')
  //     }
  //   }
  //
  //   if (status.error) {
  //     setError(status.error)
  //   }
  // }, [updateProgress, setPlaybackState, setError])

  // Placeholder implementation
  return (
    <View className="aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md">
      <Poster />
      {/* 
      <Video
        ref={handleRef}
        source={{ uri: playbackUri }}
        shouldPlay={playbackState === 'PLAYING'}
        volume={muted ? 0 : volume}
        isLooping={loop}
        onPlaybackStatusUpdate={handleStatusUpdate}
        style={{ width: '100%', height: '100%' }}
      />
      */}
    </View>
  )
}

// Main VideoPlayer component
export function VideoPlayer() {
  const { playbackState } = usePlayerStore()

  // Show loading state
  if (playbackState === 'LOADING') {
    return (
      <View className="aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md">
        <Poster />
        {/* Add loading indicator here */}
      </View>
    )
  }

  // Render platform-specific player
  if (Platform.OS === 'web') {
    return <WebVideoPlayer />
  } else {
    return <NativeVideoPlayer />
  }
}
