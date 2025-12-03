'use client'
/**
 * PersistentPlayer - Always mounted at the root level
 * 
 * This component ensures the actual media player (ReactPlayer/expo-av) never unmounts
 * during navigation, providing continuous playback like Spotify or YouTube Music.
 * 
 * Architecture:
 * - The PersistentPlayer renders the actual media element in a container
 * - Uses manual DOM manipulation (appendChild) to move the container to entry page
 * - This avoids React portal remounting which would reset playback state
 * - Video only shows on the entry page when viewing the currently playing track
 * - Audio continues playing in a hidden container when navigating elsewhere
 * - The player UI (controls, slider, etc.) is rendered separately in MobileTabBarWrapper
 */
import { useEffect, useCallback, useRef } from 'react'
import { View, Platform } from 'react-native'
import { PlaybackState, usePlayerStore } from 'app/state/player'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'
import { logPlayerError as logPlayerErrorUtil } from 'app/utils/player-logging'
import dynamic from 'next/dynamic'

// Dynamically import ReactPlayer with no SSR
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => null,
})

// Poster component for audio-only content
function Poster({ className = '' }: { className?: string }) {
  const { entry } = usePlayerStore()
  const posterUri = imageUrlMedium(entry?.imageUrl || '')

  if (!entry?.imageUrl) return null

  return (
    <View className={`absolute inset-0 ${className}`}>
      <SolitoImage
        fill
        src={posterUri}
        className="w-full h-full"
        alt="player"
        contentFit="cover"
        sizes="(max-width: 768px) 100vw"
      />
    </View>
  )
}

// The actual web player component
function WebPlayer() {
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

  const handlePause = useCallback(() => {
    setPlaybackState(PlaybackState.PAUSED)
  }, [setPlaybackState])

  const handleEnded = useCallback(() => {
    setPlaybackState(PlaybackState.ENDED)
  }, [setPlaybackState])

  const handleDurationChange = useCallback(() => {
    setDuration()
  }, [setDuration])

  const handleProgress = useCallback(() => {
    setProgress()
  }, [setProgress])

  const handleTimeUpdate = useCallback(() => {
    setPosition()
  }, [setPosition])

  const handleLoadStart = useCallback(() => {
    setPlaybackState(PlaybackState.LOADING)
  }, [setPlaybackState])

  const handleReady = useCallback(() => {
    setIsReady(true)
    if (shouldPlay) {
      play()
    }
  }, [setIsReady, shouldPlay, play])

  // Structured error logging helper
  const logPlayerError = useCallback((...args: any[]) => {
    const internal = (playerRef.current && playerRef.current.getInternalPlayer)
      ? playerRef.current.getInternalPlayer()
      : null
    logPlayerErrorUtil(args && args.length ? args[0] : null, internal, playbackUri)
  }, [playbackUri])

  // Determine if current source is audio-only
  const isAudioOnly = /\/index$/i.test(playbackUri || '')

  // Build fallback URIs for R2 when HLS/MP4 are missing
  const buildFallbackUri = useCallback(() => {
    const { entry, playbackUri } = usePlayerStore.getState()
    if (!entry?.videoUrl || !playbackUri) return null
    if (!entry.videoUrl.startsWith('ipfs://')) return null

    const hash = entry.videoUrl.replace('ipfs://', '')
    if (playbackUri.includes('/hls/')) return `https://r2.skyhitz.io/${hash}/index`
    if (/\/index$/i.test(playbackUri)) return `https://r2.skyhitz.io/${hash}/mp4/index.mp4`
    if (playbackUri.includes('/mp4/')) return null
    return null
  }, [])

  // Initial source selection per entry
  const preflightTunedUrlForIOS = useRef<string | null>(null)
  useEffect(() => {
    const { entry } = usePlayerStore.getState()
    if (!entry?.videoUrl) return
    if (!entry.videoUrl.startsWith('ipfs://')) return
    if (preflightTunedUrlForIOS.current === entry.id) return

    const hash = entry.videoUrl.replace('ipfs://', '')
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

  if (!playbackUri) return null

  // Detect platform for HLS handling
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const isIOSDevice = /iPad|iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && /Mobile/i.test(ua))
  const isIOSWebKit = isIOSDevice
  const isHls = /m3u8/i.test(playbackUri) || /\/hls\//i.test(playbackUri)
  const isRawAudio = /\/index$/i.test(playbackUri)
  const forceHlsJs = isHls && !isIOSWebKit
  const forceAudio = isRawAudio

  return (
    <div className="w-full h-full relative">
      {isAudioOnly && <Poster />}
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
        onReady={handleReady}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={(e?: any) => {
          const msg = (e && (e.message || e.reason || '')) || ''
          if (typeof msg === 'string' && msg.includes('interrupted by a new load request')) {
            return
          }
          
          const state = usePlayerStore.getState()
          const currentUri = state.playbackUri
          if (currentUri && (currentUri.includes('audius') || currentUri.includes('sound.xyz'))) {
            console.error('[PersistentPlayer] External audio playback error:', {
              url: currentUri,
              error: e,
              entryId: state.entry?.id
            })
          }
          
          logPlayerError(e, playerRef.current?.getInternalPlayer?.(), currentUri)
          
          const currentEntryId = state.entry?.id
          if (currentEntryId !== preflightTunedUrlForIOS.current) {
            return
          }
          if (state.playbackUri !== playbackUri) {
            return
          }
          const next = buildFallbackUri()
          if (next) {
            usePlayerStore.getState().setPlaybackUri(next)
          }
        }}
        onDurationChange={handleDurationChange}
        onProgress={handleProgress}
        onTimeUpdate={handleTimeUpdate}
        config={{
          file: {
            forceHLS: forceHlsJs,
            forceAudio,
            attributes: {
              preload: 'metadata',
              crossOrigin: 'anonymous',
              'webkit-playsinline': 'true',
              ...(/\/index$/i.test(playbackUri)
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
    </div>
  )
}

/**
 * PersistentPlayer - The main persistent player component
 * 
 * This component:
 * 1. Always stays mounted at the Provider level
 * 2. Renders the actual ReactPlayer element in a container
 * 3. Uses manual DOM manipulation to move the container to entry page
 *    (This avoids React portal remounting which would reset playback)
 * 
 * Video only shows on the entry page when viewing the currently playing track.
 * Otherwise, audio continues in a hidden container.
 */
export function PersistentPlayer() {
  const { entry, playbackState, videoPortalTarget, isReady } = usePlayerStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const fallbackRef = useRef<HTMLDivElement>(null)
  
  const shouldRender = !!entry && playbackState !== PlaybackState.IDLE
  
  // Move the player container to entry page target or hidden fallback
  // This doesn't cause React to remount - the same DOM element just moves
  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return
    
    const container = containerRef.current
    
    const moveToTarget = () => {
      // Only target: Entry page (when viewing the playing entry)
      // Otherwise: Hidden fallback (audio continues playing)
      let target: HTMLElement | null = null
      
      if (videoPortalTarget) {
        target = document.getElementById(videoPortalTarget)
      }
      
      if (!target && fallbackRef.current) {
        target = fallbackRef.current
      }
      
      // Move container to target if it's not already there
      if (target && container.parentElement !== target) {
        target.appendChild(container)
      }
    }
    
    // Initial move
    moveToTarget()
    
    // Watch for DOM changes (targets may appear/disappear)
    const observer = new MutationObserver(() => {
      moveToTarget()
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
    
    return () => observer.disconnect()
  }, [shouldRender, videoPortalTarget])

  // Don't render anything on native (handled separately)
  if (Platform.OS !== 'web') {
    return null
  }

  // Don't render if no media is loaded
  if (!shouldRender) {
    return null
  }

  return (
    <>
      {/* Fallback container - hidden, keeps player alive when no target available */}
      <div 
        ref={fallbackRef}
        style={{ 
          position: 'fixed', 
          width: 1, 
          height: 1, 
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          left: -9999,
        }}
      />
      
      {/* Player container - gets moved between targets via DOM manipulation */}
      <div 
        ref={containerRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      >
        <WebPlayer />
      </div>
    </>
  )
}

