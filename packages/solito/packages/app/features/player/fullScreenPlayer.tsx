'use client'
/**
 * Full screen player component
 * Migrated from legacy implementation to use Zustand
 * 
 * Now uses portal targets for the PersistentPlayer to render video content
 */
import { Pressable, Text, View, Platform } from 'react-native'
import ChevronDown from 'app/ui/icons/chevron-down'
import { PlayerButtonsRow } from './components/playerButtonsRow'
import { PlayerSlider } from './components/playerSlider'
import { MotiView } from 'moti'
import { usePlayerStore } from 'app/state/player'
import { PLAYER_PORTAL_TARGETS } from 'app/ui/player/PersistentPlayer'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'

type Props = {
  onTogglePress: () => void
  animatedStyle: any
}

function EntryInfo() {
  const { entry } = usePlayerStore()

  return (
    <>
      <View className="flex-1 items-center justify-center md:max-w-[200px] md:items-start md:px-4">
        <Text
          className="text-center text-sm font-bold text-[--text-color]"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {entry?.title}
        </Text>
        <Text
          className="text-center text-base text-[--text-color] md:text-xs"
          ellipsizeMode="tail"
          numberOfLines={1}
        >
          {entry?.artist}
        </Text>
      </View>
    </>
  )
}

// Video container component that serves as a portal target
function VideoContainer() {
  const { entry } = usePlayerStore()

  return (
    <View className="aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md md:mx-4 relative overflow-hidden">
      {/* Portal target for video - MOBILE ONLY */}
      {/* PersistentPlayer will move video here on mobile */}
      {Platform.OS === 'web' ? (
        <div 
          id={PLAYER_PORTAL_TARGETS.FULLSCREEN_PLAYER}
          className="absolute inset-0 w-full h-full md:hidden"
        />
      ) : null}
      
      {/* Image poster - DESKTOP ONLY */}
      {/* On desktop, always show the poster image in the fullscreen player bar */}
      <View className="hidden md:flex w-full h-full">
        <SolitoImage
          fill
          src={imageUrlMedium(entry?.imageUrl || '')}
          className="aspect-square md:rounded-md"
          alt="player"
          contentFit="cover"
          sizes="56px"
        />
      </View>
    </View>
  )
}

export function FullScreenPlayer({ onTogglePress, animatedStyle }: Props) {
  return (
    <MotiView
      style={[animatedStyle]}
      className="absolute z-[1] inset-0 opacity-0 md:z-10 md:flex md:flex-row md:flex-grow md:!opacity-100"
    >
      <View className="flex w-full flex-row items-center justify-between py-3 md:hidden">
        <Pressable className="mx-2" onPress={onTogglePress} hitSlop={10}>
          <ChevronDown className="text-[--text-color]" size={24} />
        </Pressable>
      </View>
      <View className="w-full items-center justify-between gap-y-8 md:flex-row">
        {/* Video container with portal target - PersistentPlayer renders here */}
        <VideoContainer />

        <PlayerSlider className="md:hidden w-full" />
        <EntryInfo />
        <PlayerButtonsRow size="large" className="md:hidden" />
        <View className="hidden grow justify-end md:flex h-full gap-1">
          <PlayerButtonsRow />
          <PlayerSlider />
        </View>
        <View className="hidden h-full w-64 lg:flex" />
        {/* Like list commented out for now */}
      </View>
    </MotiView>
  )
}
