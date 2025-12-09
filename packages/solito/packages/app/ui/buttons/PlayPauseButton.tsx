'use client'
import { Pressable } from 'react-native'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'
import { ActivityIndicator } from 'app/design/typography'
import { PlaybackState, usePlayerStore } from 'app/state/player'

interface PlayPauseButtonProps {
  onPress: () => void
  size?: number
  className?: string
  iconClassName?: string
  showLoadingState?: boolean
  /** Optional: override the playing state check. Useful for entry-specific buttons */
  isPlaying?: boolean
}

/**
 * Reusable Play/Pause button component
 * Shows play icon when paused, pause icon when playing, and loading indicator when loading
 */
export function PlayPauseButton({
  onPress,
  size = 24,
  className = '',
  iconClassName = 'text-[--text-color]',
  showLoadingState = false,
  isPlaying: isPlayingOverride,
}: PlayPauseButtonProps) {
  const { playbackState, shouldPlay } = usePlayerStore()

  // Use override if provided, otherwise check global playback state
  const isPlaying = isPlayingOverride !== undefined 
    ? isPlayingOverride
    : playbackState === PlaybackState.PLAYING ||
      (playbackState === PlaybackState.SEEKING && shouldPlay)

  const isLoading = playbackState === PlaybackState.LOADING

  // Show loading indicator if requested and state is loading
  if (showLoadingState && isLoading) {
    return <ActivityIndicator className={className} size={size - 4} />
  }

  return (
    <Pressable onPress={onPress} className={className}>
      {isPlaying ? (
        <PauseIcon size={size} className={iconClassName} />
      ) : (
        <PlayIcon size={size} className={iconClassName} />
      )}
    </Pressable>
  )
}

