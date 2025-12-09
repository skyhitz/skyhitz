'use client'
/**
 * Player buttons row component
 * Migrated from legacy implementation to use Zustand
 */
import { View, Pressable } from 'react-native'
import SkipBack from 'app/ui/icons/skip-back'
import SkipForward from 'app/ui/icons/skip-forward'
import Shuffle from 'app/ui/icons/shuffle'
import Repeat from 'app/ui/icons/repeat'
import { usePlayback } from 'app/hooks/usePlayback'
import { usePlayerStore } from 'app/state/player'
import { PlayPauseButton } from 'app/ui/buttons/PlayPauseButton'

type Props = {
  size?: 'small' | 'large'
  className?: string
}

export function PlayerButtonsRow({ size = 'small', className = '' }: Props) {
  const { skipBackward, skipForward, playPause, toggleLoop, toggleShuffle } =
    usePlayback()

  const { loop, shuffle } = usePlayerStore()

  const iconSize = size === 'large' ? 36 : 22
  const shuffleSize = size === 'large' ? 20 : 18

  return (
    <View
      className={`flex flex-row items-center md:justify-center ${className}`}
    >
      <Pressable
        className={`mr-4 ${shuffle ? 'text-primary' : 'text-[--text-color]'}`}
        onPress={toggleShuffle}
      >
        <Shuffle size={shuffleSize} />
      </Pressable>
      <Pressable onPress={skipBackward}>
        <SkipBack
          size={iconSize}
          className="mr-8 text-[--text-color] md:mr-4"
        />
      </Pressable>

      <PlayPauseButton
        onPress={playPause}
        size={iconSize}
        className="md:mx-2"
        showLoadingState={true}
      />

      <Pressable onPress={skipForward}>
        <SkipForward
          size={iconSize}
          className="ml-8 text-[--text-color] md:ml-4"
        />
      </Pressable>
      <Pressable
        className={`ml-4 ${loop ? 'text-primary' : 'text-[--text-color]'}`}
        onPress={toggleLoop}
      >
        <Repeat size={shuffleSize} />
      </Pressable>
    </View>
  )
}
