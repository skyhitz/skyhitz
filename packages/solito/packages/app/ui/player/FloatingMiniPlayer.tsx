'use client'
/**
 * FloatingMiniPlayer - A persistent mini player bar that shows on all pages
 * 
 * This component renders at the root level and shows the mini player controls
 * regardless of which page the user is on. It's hidden when:
 * - No media is loaded
 * - User is on a page that already shows the full player UI (via MobileTabBarWrapper)
 */
import { View, Pressable, Platform } from 'react-native'
import { MotiView } from 'moti'
import { useSafeArea } from 'app/provider/safe-area/use-safe-area'
import { PlaybackState, usePlayerStore } from 'app/state/player'
import { usePlayback } from 'app/hooks/usePlayback'
import { P, ActivityIndicator } from 'app/design/typography'
import PlayIcon from 'app/ui/icons/play'
import PauseIcon from 'app/ui/icons/pause'
import { shouldUseNavigationUI } from 'app/constants/routes'
import { usePathname } from 'app/hooks/navigation/usePathname'
import { imageUrlSmall } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'

export function FloatingMiniPlayer() {
  const insets = useSafeArea()
  const pathname = usePathname()
  const { playPause } = usePlayback()
  const { entry, playbackState } = usePlayerStore()

  // Don't render on native (handled by expo navigation)
  if (Platform.OS !== 'web') {
    return null
  }

  const shouldShowPlayer = !!entry && playbackState !== PlaybackState.IDLE
  const hasNavigationUI = shouldUseNavigationUI(pathname || '')
  
  // Don't show if no media or if already on a page with navigation UI
  // (MobileTabBarWrapper already handles the player there)
  if (!shouldShowPlayer || hasNavigationUI) {
    return null
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: 20 }}
      transition={{ type: 'timing', duration: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[--border-color] bg-[--bg-color] shadow-lg"
      style={{ paddingBottom: insets.bottom }}
    >
      <View className="flex h-14 flex-row items-center justify-between px-3">
        {/* Album art thumbnail */}
        <View className="flex-row items-center flex-1 gap-3">
          {entry?.imageUrl && (
            <View className="w-10 h-10 rounded overflow-hidden">
              <SolitoImage
                src={imageUrlSmall(entry.imageUrl)}
                width={40}
                height={40}
                alt={entry.title || 'Album art'}
                contentFit="cover"
              />
            </View>
          )}
          
          {/* Track info */}
          <View className="flex-1">
            <P className="text-sm font-medium" numberOfLines={1}>
              {entry?.title}
            </P>
            <P className="text-xs text-[--text-secondary-color]" numberOfLines={1}>
              {entry?.artist}
            </P>
          </View>
        </View>

        {/* Play/Pause button */}
        <View className="ml-3">
          {playbackState === PlaybackState.LOADING ? (
            <ActivityIndicator />
          ) : (
            <Pressable 
              onPress={playPause}
              className="w-10 h-10 items-center justify-center rounded-full bg-[--accent-color]"
            >
              {playbackState === PlaybackState.PLAYING ? (
                <PauseIcon className="text-white" size={20} />
              ) : (
                <PlayIcon className="text-white" size={20} />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </MotiView>
  )
}

