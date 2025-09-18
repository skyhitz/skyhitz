/**
 * Unified Video Player Component for Web and Native
 * Uses the unified player store with adapter pattern
 */
import { useCallback, useRef, useState, useEffect } from 'react'
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

  const posterUri = imageUrlMedium(entry?.imageUrl || '')

  return (
    <View className="absolute aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md md:mx-4">
      {!!entry?.imageUrl && (
        <SolitoImage
          fill
          src={posterUri}
          className="aspect-square md:rounded-md"
          alt="player"
          contentFit="cover"
          sizes="(max-width: 768px) 100vw"
        />
      )}
    </View>
  )
}

// Web Video Player Component
function WebVideoPlayer() {
  const playerRef = useRef<any>(null)

  const {
    playbackUri,
    volume,
    muted,
    loop,
    playbackRate,
    isReady,
    shouldPlay,
    play,
    setPlayerRef,
    setProgress,
    setPlaybackState,
    // setError,
    setPosition,
    setDuration,
    setIsReady,
  } = usePlayerStore()

  // Register player ref with store
  const handleRef = useCallback(
    (player: any) => {
      playerRef.current = player
      setPlayerRef(player)
    },
    [setPlayerRef]
  )


  const handlePlay = useCallback(() => {
    // setPlaybackState(PlaybackState.PLAYING)
  }, [setPlaybackState])

  const handlePause = useCallback(() => {
    setPlaybackState(PlaybackState.PAUSED)
  }, [setPlaybackState])

  const handleEnded = useCallback(() => {
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

  const handleLoadedData = useCallback(() => {
    console.log('ReactPlayer loaded data - ready to play')
    // Don't set to PLAYING yet, wait for time updates
  }, [])

  const handleTimeUpdate = useCallback(() => {
    // console.log('ReactPlayer time update')
    setPosition() // This will now accurately set PLAYING when time progresses
  }, [setPosition])

  const handleLoadStart = useCallback(() => {
    // console.log('ReactPlayer load start')
    setPlaybackState(PlaybackState.LOADING)
  }, [])

  const handleReady = useCallback(() => {
    // console.log('ReactPlayer ready')
    setIsReady(true)
    
    // If shouldPlay is true, start playing now that we're ready
    if (shouldPlay) {
      play()
    }
  }, [setIsReady, shouldPlay])


  const handleOnStart = useCallback(() => {
    // console.log('ReactPlayer onStart')
    // setPlaybackState(PlaybackState.PLAYING)
  }, [])

  // Determine if current source is audio-only
  const isAudioOnly = !!playbackUri && !/m3u8/i.test(playbackUri)

  // Build fallback URIs for R2 when HLS/MP4 are missing
  const buildFallbackUri = useCallback(() => {
    const { entry, playbackUri } = usePlayerStore.getState()
    if (!entry?.videoUrl || !playbackUri) return null
    if (!entry.videoUrl.startsWith('ipfs://')) return null

    const hash = entry.videoUrl.replace('ipfs://', '')
    // If HLS failed, try MP4
    if (playbackUri.includes('/hls/')) return `https://r2.skyhitz.io/${hash}/mp4/index.mp4`
    // If MP4 failed, try raw index (audio/mpeg)
    if (playbackUri.includes('/mp4/')) return `https://r2.skyhitz.io/${hash}/index`
    return null
  }, [])

  // Preflight HEAD the R2 candidates and pick first available (all platforms)
  const preflightTunedUrlForIOS = useRef<string | null>(null)
  useEffect(() => {
    const { entry } = usePlayerStore.getState()
    if (!entry?.videoUrl) return
    if (!entry.videoUrl.startsWith('ipfs://')) return
    // Avoid re-running for the same entry
    if (preflightTunedUrlForIOS.current === entry.id) return

    const hash = entry.videoUrl.replace('ipfs://', '')
    const candidates = [
      `https://r2.skyhitz.io/${hash}/hls/index.m3u8`,
      `https://r2.skyhitz.io/${hash}/mp4/index.mp4`,
      `https://r2.skyhitz.io/${hash}/index`,
    ]

    const headOk = (url: string) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 1500)
      return fetch(url, { method: 'HEAD', mode: 'cors', signal: controller.signal })
        .then((res) => {
          clearTimeout(timer)
          if (res.ok) return url
          throw new Error('not ok')
        })
    }

    // Race the HEADs; pick the first that returns 200 quickly
    const raceFirstOk = async () => {
      const checks = candidates.map((u) => headOk(u).catch(() => null))
      const results = await Promise.all(checks)
      return results.find((u) => !!u) as string | null
    }
    raceFirstOk()
      .then((best) => {
        if (best && usePlayerStore.getState().playbackUri !== best) {
          usePlayerStore.getState().setPlaybackUri(best)
        }
        preflightTunedUrlForIOS.current = entry.id
      })
      .catch(() => {
        preflightTunedUrlForIOS.current = entry.id
      })
  }, [playbackUri])

  // (Removed Android-specific raw preference; unified preflight handles all platforms.)

  return (
    <>
      <View
        className={`aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md md:mx-4 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Always render poster behind for artwork, useful for audio-only */}
        <Poster />
        {!!playbackUri && (
          // Detect if the engine supports native HLS (iOS Safari/Chrome on iOS)
          // On those, do NOT force hls.js
          (() => {
            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
            const isIOSWebKit = /iPad|iPhone|iPod/i.test(ua) || /WebKit/i.test(ua) && /Mobile/i.test(ua)
            const isHls = /m3u8/i.test(playbackUri) || /\/hls\//i.test(playbackUri)
            const forceHlsJs = isHls && !isIOSWebKit
            const forceAudio = /^https?:\/\//i.test(playbackUri) && !/m3u8/i.test(playbackUri)
            return (
          <ReactPlayer
            ref={handleRef}
            url={playbackUri}
            width="100%"
            height="100%"
            style={isAudioOnly ? { opacity: 0, position: 'absolute' } : undefined}
            volume={muted ? 0 : volume}
            muted={muted}
            loop={loop}
            playbackRate={playbackRate}
            playsinline
            controls={false}
            onLoadStart={handleLoadStart}
            onStart={handleOnStart}
            onReady={handleReady}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={() => {
              // Attempt fallback sequence: HLS -> MP4 -> raw index
              const next = buildFallbackUri()
              if (next) {
                usePlayerStore.getState().setPlaybackUri(next)
                // keep state LOADING and let onReady resume
              }
            }}
            onDurationChange={handleDurationChange}
            onProgress={handleProgress}
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={handleLoadedData}
            config={{
              file: {
                // Use native HLS on iOS WebKit. Else, allow hls.js for HLS.
                forceHLS: forceHlsJs,
                forceAudio,
                attributes: {
                  preload: 'metadata',
                  // Allow CORS credentials-less fetches if needed
                  crossOrigin: 'anonymous',
                },
              },
            }}
          />
            )
          })()
        )}
      </View>
    </>
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
  // Render platform-specific player
  if (Platform.OS === 'web') {
    return <WebVideoPlayer />
  } else {
    return <NativeVideoPlayer />
  }
}
