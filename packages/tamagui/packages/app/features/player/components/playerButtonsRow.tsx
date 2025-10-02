'use client'
/**
 * Player buttons row component
 * Migrated from legacy implementation to use Zustand
 */
import { XStack, Button, GetProps } from 'tamagui'
import { SkipBack, SkipForward, Play, Pause, Shuffle, Repeat } from '@tamagui/lucide-icons'
import { usePlayback } from 'app/hooks/usePlayback'
import { ActivityIndicator } from 'app/design/typography'
import { usePlayerStore, PlaybackState } from 'app/state/player'

type Props = {
  size?: 'small' | 'large'
} & GetProps<typeof XStack>

export function PlayerButtonsRow({ size = 'small', ...props }: Props) {
  const { skipBackward, skipForward, playPause, toggleLoop, toggleShuffle } =
    usePlayback()

  const { playbackState, loop, shuffle, shouldPlay } = usePlayerStore()

  const iconSize = size === 'large' ? 36 : 22
  const shuffleSize = size === 'large' ? 20 : 18

  return (
    <XStack
      flexDirection="row"
      alignItems="center"
      justifyContent={{ md: 'center' }}
      {...props}
    >
      <Button
        backgroundColor="transparent"
        padding="$0"
        marginRight="$4"
        onPress={toggleShuffle}
      >
        <Shuffle size={shuffleSize} color={shuffle ? '$blue9' : '$color'} />
      </Button>
      <XStack marginRight={{ xs: '$8', md: '$4' }}>
        <Button backgroundColor="transparent" padding="$0" onPress={skipBackward}>
          <SkipBack size={iconSize} color="$color" />
        </Button>
      </XStack>

      {playbackState === PlaybackState.LOADING ? (
        <ActivityIndicator marginHorizontal={{ md: '$2' }} size="large" />
      ) : (
        <Button 
          backgroundColor="transparent" 
          padding="$0" 
          marginHorizontal={{ md: '$2' }} 
          onPress={playPause}
        >
          {playbackState === PlaybackState.PLAYING ||
          (playbackState === PlaybackState.SEEKING && shouldPlay) ? (
            <Pause size={iconSize} color="$color" />
          ) : (
            <Play size={iconSize} color="$color" />
          )}
        </Button>
      )}

      <XStack marginLeft={{ xs: '$8', md: '$4' }}>
        <Button backgroundColor="transparent" padding="$0" onPress={skipForward}>
          <SkipForward size={iconSize} color="$color" />
        </Button>
      </XStack>
      <Button
        backgroundColor="transparent"
        padding="$0"
        marginLeft="$4"
        onPress={toggleLoop}
      >
        <Repeat size={shuffleSize} color={loop ? '$blue9' : '$color'} />
      </Button>
    </XStack>
  )
}
