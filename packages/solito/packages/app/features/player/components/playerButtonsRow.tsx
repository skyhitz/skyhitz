'use client'
/**
 * Player buttons row component
 * Migrated from legacy implementation to use Zustand
 */
import { View, Pressable } from 'react-native'
import SkipBack from 'app/ui/icons/skip-back'
import SkipForward from 'app/ui/icons/skip-forward'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'
import Shuffle from 'app/ui/icons/shuffle'
import Repeat from 'app/ui/icons/repeat'
import { usePlayback } from 'app/hooks/usePlayback'
import { ActivityIndicator } from 'app/design/typography'
import { usePlayerStore } from 'app/state/player'

type Props = {
  size?: 'small' | 'large'
  className?: string
}

export function PlayerButtonsRow({ size = 'small', className = '' }: Props) {
  const { 
    skipBackward, 
    skipForward, 
    playPause, 
    toggleLoop, 
    toggleShuffle
  } = usePlayback()
  
  const { playbackState, looping, shuffle } = usePlayerStore()
  
  const iconSize = size === 'large' ? 36 : 16
  const shuffleSize = size === 'large' ? 20 : 12

  return (
    <View
      className={`flex flex-row items-center md:justify-center ${className}`}
    >
      <Pressable
        className={`mr-4 ${
          shuffle ? 'text-primary' : 'text-gray-500'
        }`}
        onPress={toggleShuffle}
      >
        <Shuffle size={shuffleSize} />
      </Pressable>
      <Pressable onPress={skipBackward}>
        <SkipBack
          size={iconSize}
          className="mr-8 text-gray-600 md:mr-4"
        />
      </Pressable>

      {playbackState === 'LOADING' || playbackState === 'FALLBACK' ? (
        <ActivityIndicator className="md:mx-2" />
      ) : (
        <Pressable onPress={playPause} className="md:mx-2">
          {playbackState === 'PLAYING' ? (
            <PauseIcon size={iconSize} className="text-gray-600" />
          ) : (
            <PlayIcon size={iconSize} className="text-gray-600" />
          )}
        </Pressable>
      )}

      <Pressable onPress={skipForward}>
        <SkipForward
          size={iconSize}
          className="ml-8 text-gray-600 md:ml-4"
        />
      </Pressable>
      <Pressable
        className={`ml-4 ${
          looping ? 'text-primary' : 'text-gray-500'
        }`}
        onPress={toggleLoop}
      >
        <Repeat size={shuffleSize} />
      </Pressable>
    </View>
  )
}
