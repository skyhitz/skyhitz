'use client'
/**
 * Cross-platform Video component for both native and web
 * Platform-specific implementations are in index.web.tsx and index.native.tsx
 */

// Define the resize modes for the video component
export enum ResizeMode {
  CONTAIN = 'contain',
  COVER = 'cover',
  STRETCH = 'stretch',
}

// Define the props expected by our video component
export interface VideoProps {
  style?: any
  source?: { uri: string } | number | null
  resizeMode?: ResizeMode
  posterSource?: { uri: string } | number
  posterStyle?: any
  repeat?: boolean
  rate?: number
  muted?: boolean
  volume?: number
  onLoadStart?: () => void
  onLoad?: (event: any) => void
  onError?: (error: any) => void
  onProgress?: (progress: any) => void
  onSeek?: (event: any) => void
  onEnd?: () => void
  onPlaybackStatusUpdate?: (status: any) => void
  shouldPlay?: boolean
  isLooping?: boolean
  useNativeControls?: boolean
}

// Import the default implementation based on platform
import { VideoPlayer } from './index.web'
export const Video = React.forwardRef<any, VideoProps>((props, ref) => {
  const {
    className,
    style,
    source,
    resizeMode = ResizeMode.CONTAIN,
    repeat = false,
    muted = false,
    volume = 1.0,
    rate = 1.0,
    shouldPlay = false,
    useNativeControls = true,
    isLooping = false,
    ...rest
  } = props

  // Create video player instance with the source
  const player = useVideoPlayer(source as VideoSource, player => {
    // Configure the player based on props
    player.muted = muted
    player.volume = volume
    player.playbackRate = rate
    player.loop = isLooping || repeat
    
    // Start playing if shouldPlay is true
    if (shouldPlay) {
      player.play()
    }
    
    // Forward the ref to the player
    if (ref) {
      if (typeof ref === 'function') {
        ref(player)
      } else {
        ref.current = player
      }
    }
  })

  // Map resizeMode to contentFit
  const contentFit = resizeMode as VideoContentFit

  return (
    <View style={[styles.container, style]} className={className}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit={contentFit}
        nativeControls={useNativeControls}
        {...rest}
      />
    </View>
  )
})

Video.displayName = 'Video'

const styles = {
  container: {
    flex: 1,
  },
  video: {
    width: '100%',
    height: '100%',
  },
}
