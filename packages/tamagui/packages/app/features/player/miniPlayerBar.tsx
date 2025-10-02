'use client'
/**
 * Mini Player Bar component that shows at the bottom of the screen on mobile
 * Migrated from legacy implementation to use Zustand
 */
import { ViewStyle } from 'react-native'
import { ChevronUp, Play, Pause } from '@tamagui/lucide-icons'
import { usePlayback } from 'app/hooks/usePlayback'
import { ActivityIndicator, P } from 'app/design/typography'
import { PlaybackState, usePlayerStore } from 'app/state/player'
import { XStack, Button } from 'tamagui'

type Props = {
  onTogglePress?: () => void
  animatedStyle?: ViewStyle
}

export function MiniPlayerBar({ onTogglePress, animatedStyle }: Props) {
  const { playPause } = usePlayback()
  const { playbackState, entry } = usePlayerStore()

  return (
    <XStack
      zIndex={10}
      height={40}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$2.5"
      opacity={1}
      display={{ xs: 'flex', md: 'none' }}
      animation="quick"
      style={animatedStyle}
    >
      <Button
        onPress={onTogglePress}
        backgroundColor="transparent"
        padding="$0"
      >
        <XStack
          flexDirection="row"
          alignItems="center"
          display={{ xs: 'flex', md: 'none' }}
        >
          <ChevronUp color="$gray10" />
          <P marginLeft="$2.5" paddingLeft="$1" fontSize="$3">
            {entry?.title} - {entry?.artist}
          </P>
        </XStack>
      </Button>
      {playbackState === PlaybackState.LOADING ? (
        <ActivityIndicator />
      ) : (
        <Button
          onPress={playPause}
          backgroundColor="transparent"
          padding="$0"
        >
          {playbackState === 'PLAYING' ? (
            <Pause color="$gray10" size={22} />
          ) : (
            <Play color="$gray10" size={22} />
          )}
        </Button>
      )}
    </XStack>
  )
}
