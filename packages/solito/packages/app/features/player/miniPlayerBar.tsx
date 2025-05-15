'use client'
/**
 * Mini Player Bar component that shows at the bottom of the screen on mobile
 * Migrated from legacy implementation to use Zustand
 */
import { View, Pressable, ViewStyle } from 'react-native'
import ChevronUp from 'app/ui/icons/chevron-up'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'
import { usePlayback } from 'app/hooks/usePlayback'
import { ActivityIndicator, P } from 'app/design/typography'
import { MotiView } from 'moti'
import { usePlayerStore } from 'app/state/player'

type Props = {
  onTogglePress?: () => void
  animatedStyle: ViewStyle
}

export function MiniPlayerBar({ onTogglePress, animatedStyle }: Props) {
  const { playPause } = usePlayback()
  const { playbackState, entry } = usePlayerStore()

  return (
    <MotiView
      className="z-10 flex h-10 flex-row items-center justify-between px-2.5 opacity-100 md:hidden"
      style={[animatedStyle]}
    >
      <Pressable onPress={onTogglePress}>
        <View className="flex flex-row items-center md:hidden">
          <ChevronUp className="text-gray-600" />
          <P className="ml-2.5 pl-1 text-sm">
            {entry?.title} - {entry?.artist}
          </P>
        </View>
      </Pressable>
      {playbackState === 'LOADING' || playbackState === 'FALLBACK' ? (
        <ActivityIndicator />
      ) : (
        <Pressable onPress={playPause}>
          {playbackState === 'PLAYING' ? (
            <PauseIcon className="text-gray-600" size={22} />
          ) : (
            <PlayIcon className="text-gray-600" size={22} />
          )}
        </Pressable>
      )}
    </MotiView>
  )
}
