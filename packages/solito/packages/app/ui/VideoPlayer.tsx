/**
 * Unified Video Player Component for Web and Native
 * Uses the unified player store with adapter pattern
 */
import { useCallback, useRef, useState, useEffect } from 'react'
import { View, Platform } from 'react-native'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { PlaybackState, usePlayerStore } from 'app/state/player'
import { logPlayerError as logPlayerErrorUtil } from 'app/utils/player-logging'

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

  // Structured error logging helper
  const logPlayerError = useCallback((...args: any[]) => {
    const internal = (playerRef.current && playerRef.current.getInternalPlayer)
      ? playerRef.current.getInternalPlayer()
      : null
    logPlayerErrorUtil(args && args.length ? args[0] : null, internal, playbackUri)
  }, [playbackUri])

  // Determine if current source is audio-only (our raw audio endpoint)
  const isAudioOnly = /\/index$/i.test(playbackUri || '')

  // Build fallback URIs for R2 when HLS/MP4 are missing
  const buildFallbackUri = useCallback(() => {
    const { entry, playbackUri } = usePlayerStore.getState()
    if (!entry?.videoUrl || !playbackUri) return null
    if (!entry.videoUrl.startsWith('ipfs://')) return null

    const hash = entry.videoUrl.replace('ipfs://', '')
    // Desired order: HLS -> raw -> MP4
    if (playbackUri.includes('/hls/')) return `https://r2.skyhitz.io/${hash}/index`
    if (/\/index$/i.test(playbackUri)) return `https://r2.skyhitz.io/${hash}/mp4/index.mp4`
    if (playbackUri.includes('/mp4/')) return null
    return null
  }, [])

  // Initial source selection per entry: set HLS first and rely on onError fallback
  const preflightTunedUrlForIOS = useRef<string | null>(null)
  useEffect(() => {
    const { entry } = usePlayerStore.getState()
    if (!entry?.videoUrl) return
    if (!entry.videoUrl.startsWith('ipfs://')) return
    if (preflightTunedUrlForIOS.current === entry.id) return

    const hash = entry.videoUrl.replace('ipfs://', '')
    // iOS WebKit: run HEAD preflight (HLS → raw → MP4). Desktop: set HLS directly.
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const isIOSDevice = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))
    const isIOSWebKit = isIOSDevice

    if (isIOSWebKit) {
      const candidates = [
        {
          url: `https://r2.skyhitz.io/${hash}/hls/index.m3u8`,
          test: (ct: string | null) =>
            !!ct && /(application\/vnd\.apple\.mpegurl|application\/x-mpegURL)/i.test(ct),
        },
        {
          url: `https://r2.skyhitz.io/${hash}/index`,
          test: (ct: string | null) => !!ct && /(^|\s|;)audio\//i.test(ct),
        },
        {
          url: `https://r2.skyhitz.io/${hash}/mp4/index.mp4`,
          test: (ct: string | null) => !!ct && /(^|\s|;)video\/mp4/i.test(ct),
        },
      ] as const

      const headOk = (url: string, test: (ct: string | null) => boolean) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 2000)
        return fetch(url, {
          method: 'HEAD',
          mode: 'cors',
          signal: controller.signal,
          headers: {
            Accept: 'application/x-mpegURL,application/vnd.apple.mpegurl,audio/*,video/mp4,*/*;q=0.1',
          },
        }).then((res) => {
          clearTimeout(timer)
          if (!res.ok) throw new Error('not ok')
          const ct = res.headers.get('content-type')
          if (test(ct)) return url
          throw new Error('wrong content-type')
        })
      }

      const selectBest = async () => {
        const checks = candidates.map((c) => headOk(c.url, c.test).catch(() => null))
        const results = await Promise.all(checks)
        for (let i = 0; i < results.length; i++) {
          if (results[i]) return results[i] as string
        }
        return null
      }

      selectBest()
        .then((best) => {
          if (best && usePlayerStore.getState().playbackUri !== best) {
            usePlayerStore.getState().setPlaybackUri(best)
          }
          preflightTunedUrlForIOS.current = entry.id
        })
        .catch(() => {
          preflightTunedUrlForIOS.current = entry.id
        })
      return
    }

    const hls = `https://r2.skyhitz.io/${hash}/hls/index.m3u8`
    if (usePlayerStore.getState().playbackUri !== hls) {
      usePlayerStore.getState().setPlaybackUri(hls)
    }
    preflightTunedUrlForIOS.current = entry.id
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
            // Detect iOS devices reliably; do not treat Android Chrome as iOS
            const isIOSDevice = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))
            const isIOSWebKit = isIOSDevice
            const isHls = /m3u8/i.test(playbackUri) || /\/hls\//i.test(playbackUri)
            const isMp4 = /\.mp4($|\?)/i.test(playbackUri)
            const isRawAudio = /\/index$/i.test(playbackUri)
            const forceHlsJs = isHls && !isIOSWebKit
            // Only force audio element for the raw audio endpoint, not for MP4
            const forceAudio = isRawAudio
            return (
          <ReactPlayer
            ref={handleRef}
            url={playbackUri}
            width="100%"
            height="100%"
            playing={shouldPlay}
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
            onError={(e?: any) => {
              const msg = (e && (e.message || e.reason || '')) || ''
              if (typeof msg === 'string' && msg.includes('interrupted by a new load request')) {
                return
              }
              logPlayerError(e)
              // Ensure fallback only for the current active entry and URI
              const state = usePlayerStore.getState()
              const currentEntryId = state.entry?.id
              if (currentEntryId !== preflightTunedUrlForIOS.current) {
                return
              }
              if (state.playbackUri !== playbackUri) {
                return
              }
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
                  // iOS inline playback hint
                  'webkit-playsinline': 'true',
                  // Hint MIME to iOS when using extensionless raw object
                  ...( /\/index$/i.test(playbackUri)
                      ? { type: 'audio/mpeg' }
                      : /\.mp4($|\?)/i.test(playbackUri)
                      ? { type: 'video/mp4' }
                      : (/m3u8/i.test(playbackUri) || /\/hls\//i.test(playbackUri))
                      ? { type: 'application/x-mpegURL' }
                      : {}),
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
