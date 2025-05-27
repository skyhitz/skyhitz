'use client'
import * as React from 'react'
import { useEffect, useRef, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { View } from 'react-native'

// Dynamically import ReactPlayer with no SSR to avoid hydration issues
// This is crucial for preventing hydration mismatches in Next.js
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => null, // Don't show any loading state to prevent flicker
})

// Import ResizeMode from the shared barrel file to ensure consistency
import { ResizeMode } from './'

// Define the playback status type for better type safety
interface PlaybackStatus {
  isLoaded?: boolean;
  isBuffering?: boolean;
  isPlaying?: boolean;
  positionMillis?: number;
  durationMillis?: number;
  didJustFinish?: boolean;
  shouldPlay?: boolean;
  volume?: number;
  isMuted?: boolean;
  isLooping?: boolean;
  error?: string;
}

interface VideoProps {
  source?: { uri?: string }
  style?: any
  videoStyle?: any
  videoClassName?: string
  className?: string
  resizeMode?: ResizeMode
  onPlaybackStatusUpdate?: (status: PlaybackStatus) => void
  onReadyForDisplay?: () => void
  onLoadStart?: () => void
  onError?: (error: any) => void
  shouldPlay?: boolean
  isLooping?: boolean
  isMuted?: boolean
  volume?: number
  posterSource?: { uri?: string }
  useNativeControls?: boolean;
  playsInline?: boolean;
}

// Use forwardRef to handle the ref from the parent component
// Define the VideoRef interface for better type safety
interface VideoRef {
  playAsync: () => Promise<{ isPlaying: boolean }>;
  pauseAsync: () => Promise<{ isPlaying: boolean }>;
  getStatusAsync: () => Promise<PlaybackStatus>;
  setStatusAsync: (status: Partial<PlaybackStatus>) => Promise<{}>;
  getVideoElement: () => HTMLVideoElement | null;
}

export const Video = React.forwardRef<VideoRef, VideoProps>(
  (
    props: VideoProps,
    ref
  ) => {
    // Destructure props as defined in VideoProps
    const {
      source,
      posterSource,
      useNativeControls = false,
      style,
      videoStyle,
      className,
      videoClassName,
      resizeMode = ResizeMode.CONTAIN,
      isLooping = false,
      shouldPlay = false,
      isMuted = false,
      volume = 1.0,
      playsInline = true, // Default playsInline to true
      onPlaybackStatusUpdate,
      onReadyForDisplay,
      onLoadStart,
      onError,
    } = props;

    // Reference to the ReactPlayer component
    const playerRef = useRef<any>(null);

    // Local state for controlling playback when using imperative methods
    const [internalShouldPlay, setInternalShouldPlay] = useState<boolean | undefined>(undefined);
    
    // Determine the actual playing state, preferring the internal state if set
    const actualPlaying = internalShouldPlay !== undefined ? internalShouldPlay : shouldPlay;
    
    // Track if the player is ready
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    
    // Reset internal state when props change
    useEffect(() => {
      setInternalShouldPlay(undefined);
    }, [shouldPlay]);
    
    // Client-side only state to track if we're mounted (for hydration safety)
    const [isMounted, setIsMounted] = useState(false);
    
    // Set mounted state after hydration
    useEffect(() => {
      setIsMounted(true);
      
      // Return cleanup function to handle component unmounting
      return () => {
        // Pause the video when component unmounts to prevent memory leaks
        if (playerRef.current) {
          try {
            // Safely attempt to pause and clean up
            setInternalShouldPlay(false);
          } catch (e) {
            console.error('Error during video cleanup:', e);
          }
        }
      };
    }, []);
    
    // Log when source changes to help with debugging
    useEffect(() => {
      if (source?.uri) {
        console.log(`[Video] Source changed to: ${source.uri}`);
      }
    }, [source?.uri]);

    // Memoize the getStatusAsync function to prevent unnecessary re-renders
    const getStatusAsync = React.useCallback(async (): Promise<PlaybackStatus> => {
      if (!playerRef.current) return { isLoaded: false };
      
      // Use ReactPlayer's methods to get current state
      const currentTime = playerRef.current.getCurrentTime() || 0;
      const duration = playerRef.current.getDuration() || 0;
      const isPlaying = actualPlaying || false;
      
      return {
        isLoaded: duration > 0,
        isBuffering: false, // We can't reliably determine this without the callback
        isPlaying,
        positionMillis: currentTime * 1000,
        durationMillis: duration * 1000,
        didJustFinish: currentTime >= duration && duration > 0,
        shouldPlay: isPlaying,
        volume,
        isMuted,
        isLooping,
      };
    }, [playerRef, actualPlaying, volume, isMuted, isLooping]);
    
    // Expose imperative API to the parent via ref
    React.useImperativeHandle(
      ref,
      () => {

        return {
          playAsync: async () => { 
            if (playerRef.current) {
              console.log('[Video] playAsync called');
              setInternalShouldPlay(true);
              // Ensure we return a promise
              return Promise.resolve({ isPlaying: true });
            }
            return Promise.resolve({ isPlaying: false });
          },
          pauseAsync: async () => { 
            if (playerRef.current) {
              console.log('[Video] pauseAsync called');
              setInternalShouldPlay(false);
              // Ensure we return a promise
              return Promise.resolve({ isPlaying: false });
            }
            return Promise.resolve({ isPlaying: false });
          },
          getStatusAsync: async () => {
            console.log('[Video] getStatusAsync called');
            return getStatusAsync();
          },
          setStatusAsync: async (status: Partial<PlaybackStatus>) => { 
            console.log('[Video] setStatusAsync called with:', status);
            if (status.shouldPlay !== undefined) {
              setInternalShouldPlay(status.shouldPlay);
            }
            if (status.positionMillis !== undefined && playerRef.current) {
              // Seek to position if provided
              try {
                playerRef.current.seekTo(status.positionMillis / 1000, 'seconds');
              } catch (e) {
                console.error('Error seeking to position:', e);
              }
            }
            // Return a promise
            return Promise.resolve({});
          },
          getVideoElement: () => {
            try {
              return playerRef.current?.getInternalPlayer() || null;
            } catch (e) {
              console.error('Error getting video element:', e);
              return null;
            }
          },
        }
      },
      [getStatusAsync, setInternalShouldPlay, playerRef]
    )

    // Only render ReactPlayer on the client to avoid hydration issues
    // Memoize event handlers to prevent unnecessary re-renders
    const handleReady = React.useCallback(() => {
      console.log('ReactPlayer: onReady');
      setIsPlayerReady(true);
      if (onReadyForDisplay) {
        onReadyForDisplay();
      }
      if (onLoadStart) {
        onLoadStart();
      }
    }, [onReadyForDisplay, onLoadStart]);

    const handleStart = React.useCallback(() => {
      console.log('ReactPlayer: onStart');
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isPlaying: true,
          shouldPlay: true,
        });
      }
    }, [onPlaybackStatusUpdate]);

    const handlePlay = React.useCallback(() => {
      console.log('ReactPlayer: onPlay');
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isPlaying: true,
          shouldPlay: true,
        });
      }
    }, [onPlaybackStatusUpdate]);

    const handlePause = React.useCallback(() => {
      console.log('ReactPlayer: onPause');
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isPlaying: false,
          shouldPlay: false,
        });
      }
    }, [onPlaybackStatusUpdate]);

    const handleEnded = React.useCallback(() => {
      console.log('ReactPlayer: onEnded');
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isPlaying: false,
          shouldPlay: false,
          didJustFinish: true,
        });
      }
    }, [onPlaybackStatusUpdate]);

    const handleError = React.useCallback((e: any) => {
      console.error('ReactPlayer: onError', e);
      if (onError) {
        onError(e);
      }
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: false,
          error: e?.toString() || 'Video playback error',
        });
      }
    }, [onError, onPlaybackStatusUpdate]);

    const handleProgress = React.useCallback((state: any) => {
      // Only send updates if the player is ready
      if (isPlayerReady && onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isPlaying: actualPlaying,
          shouldPlay: actualPlaying,
          positionMillis: state.playedSeconds * 1000,
          durationMillis: state.loadedSeconds * 1000,
          isBuffering: state.loaded < 1 && state.played > 0,
        });
      }
    }, [isPlayerReady, onPlaybackStatusUpdate, actualPlaying]);

    const handleDuration = React.useCallback((duration: number) => {
      console.log('ReactPlayer: onDuration', duration);
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          durationMillis: duration * 1000,
        });
      }
    }, [onPlaybackStatusUpdate]);

    const handleBuffer = React.useCallback(() => {
      console.log('ReactPlayer: onBuffer');
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isBuffering: true,
        });
      }
    }, [onPlaybackStatusUpdate]);

    const handleBufferEnd = React.useCallback(() => {
      console.log('ReactPlayer: onBufferEnd');
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate({
          isLoaded: true,
          isBuffering: false,
        });
      }
    }, [onPlaybackStatusUpdate]);

    // Memoize config to prevent unnecessary re-renders
    const playerConfig = React.useMemo(() => ({
      file: {
        attributes: {
          // Apply the resize mode to the video element
          style: {
            objectFit: resizeMode === ResizeMode.CONTAIN
              ? 'contain'
              : resizeMode === ResizeMode.COVER
              ? 'cover'
              : 'fill',
          },
          poster: posterSource?.uri || '',
        },
        // Enable HLS for m3u8 streams
        forceHLS: source?.uri?.includes('.m3u8'),
      },
    }), [resizeMode, posterSource?.uri, source?.uri]);

    return (
      <div style={style} className={className}>
        {isMounted ? (
          <ReactPlayer
            ref={playerRef}
            url={source?.uri}
            playing={actualPlaying}
            loop={isLooping}
            muted={isMuted}
            volume={volume}
            width="100%"
            height="100%"
            style={videoStyle}
            className={videoClassName}
            playsinline={playsInline}
            controls={useNativeControls}
            config={playerConfig}
            onReady={handleReady}
            onStart={handleStart}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
          />
        ) : (posterSource && posterSource.uri) ? (
          // Show poster image as placeholder during client-side rendering if available
          <div 
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              backgroundImage: `url(${posterSource.uri})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        ) : (
          // Fallback placeholder if no poster is available
          <div 
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        )}
      </div>
    )
  }
)

Video.displayName = 'Video'

// Export for compatibility with older code
export { Video as VideoPlayer }

export default Video
