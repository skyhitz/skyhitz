'use client'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import { useMemo } from 'react'

// For native, we'll use Expo's Video component from expo-av
import { VideoView as VideoPlayerExpo } from 'expo-video'

// Define our own ResizeMode for consistent API between native and web
export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch',
}

// Define consistent props interface for both platforms
export interface VideoProps {
  source?: { uri?: string }
  style?: any
  videoStyle?: any
  videoClassName?: string
  className?: string
  resizeMode?: ResizeMode
  onPlaybackStatusUpdate?: (status: any) => void
  onLoadStart?: () => void
  onReadyForDisplay?: () => void
  onError?: (error: any) => void
  shouldPlay?: boolean
  isLooping?: boolean
  isMuted?: boolean
  volume?: number
  posterSource?: { uri?: string }
  useNativeControls?: boolean
}

// For native platforms, create a forwardRef component
export const Video = React.forwardRef<any, VideoProps>(
  (
    {
      source,
      style,
      resizeMode = ResizeMode.COVER,
      onPlaybackStatusUpdate,
      onLoadStart,
      onReadyForDisplay,
      videoStyle,
      className,
      onError,
      shouldPlay = false,
      isLooping = false,
      isMuted = false,
      volume = 1.0,
      posterSource,
      useNativeControls = false,
      ...props
    },
    ref
  ) => {
    const videoRef = React.useRef<any>(null)

    // Use a stable reference for playback status handling to prevent recreating handlers
    const handlers = useMemo(
      () => ({
        handlePlaybackStatusUpdate: (status: any) => {
          if (onPlaybackStatusUpdate) {
            onPlaybackStatusUpdate(status)
          }

          // Call onReadyForDisplay when applicable
          if (status.isLoaded && !status.isBuffering && onReadyForDisplay) {
            onReadyForDisplay()
          }
        },
        handleError: (error: any) => {
          if (onError) {
            onError(error)
          }
        },
        handleLoadStart: () => {
          if (onLoadStart) {
            onLoadStart()
          }
        },
      }),
      [onPlaybackStatusUpdate, onReadyForDisplay, onError, onLoadStart]
    )

    // Connect external ref to our internal ref
    React.useImperativeHandle(ref, () => ({
      // Provide the standard video API methods
      playAsync: async () => {
        if (videoRef.current) {
          try {
            await videoRef.current.playAsync()
            return { isPlaying: true }
          } catch (e) {
            console.warn('Error playing video', e)
            return { isPlaying: false }
          }
        }
        return { isPlaying: false }
      },
      pauseAsync: async () => {
        if (videoRef.current) {
          try {
            await videoRef.current.pauseAsync()
            return { isPlaying: false }
          } catch (e) {
            console.warn('Error pausing video', e)
            return { isPlaying: false }
          }
        }
        return { isPlaying: false }
      },
      setStatusAsync: async (status: any) => {
        if (videoRef.current) {
          try {
            return await videoRef.current.setStatusAsync(status)
          } catch (e) {
            console.warn('Error setting video status', e)
            return { error: true }
          }
        }
        return { error: true }
      },
      getStatusAsync: async () => {
        if (videoRef.current) {
          try {
            return await videoRef.current.getStatusAsync()
          } catch (e) {
            console.warn('Error getting video status', e)
            return { isLoaded: false }
          }
        }
        return { isLoaded: false }
      },
      // Match web API for consistency
      getVideoElement: () => videoRef.current,
    }))

    // Map our ResizeMode to Expo's ResizeMode
    const expoResizeMode = {
      [ResizeMode.CONTAIN]: ExpoResizeMode.CONTAIN,
      [ResizeMode.COVER]: ExpoResizeMode.COVER,
      [ResizeMode.STRETCH]: ExpoResizeMode.STRETCH,
    }[resizeMode || ResizeMode.CONTAIN]

    // Render the native video component
    return (
      <View style={[styles.container, style]}>
        <VideoPlayerExpo
          ref={videoRef}
          source={source}
          style={styles.video}
          resizeMode={expoResizeMode}
          shouldPlay={shouldPlay}
          isLooping={isLooping}
          isMuted={isMuted}
          volume={volume}
          onPlaybackStatusUpdate={handlers.handlePlaybackStatusUpdate}
          onReadyForDisplay={onReadyForDisplay}
          onLoadStart={handlers.handleLoadStart}
          useNativeControls={useNativeControls}
          posterSource={posterSource}
        />
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
})

Video.displayName = 'Video'

// Re-export for compatibility with older code
export const VideoPlayer = Video

export default Video
