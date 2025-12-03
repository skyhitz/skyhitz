'use client'
/**
 * Full screen player component
 * Migrated from legacy implementation to use Zustand
 * 
 * Shows poster image + audio controls. Video only appears on entry page.
 */
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'solito/navigation'
import ChevronDown from 'app/ui/icons/chevron-down'
import { PlayerButtonsRow } from './components/playerButtonsRow'
import { PlayerSlider } from './components/playerSlider'
import { MotiView } from 'moti'
import { usePlayerStore } from 'app/state/player'
import { imageUrlMedium } from 'app/utils/entry'
import { SolitoImage } from 'app/design/solito-image'

type Props = {
  onTogglePress: () => void
  animatedStyle: any
}

function EntryInfo() {
  const { entry } = usePlayerStore()

  return (
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
  )
}

// Poster image container - video only shows on entry page
function PosterContainer() {
  const { entry } = usePlayerStore()

  return (
    <View className="aspect-square max-h-[50vh] w-screen items-center justify-center md:max-w-[3.5rem] md:rounded-md md:mx-4 relative overflow-hidden">
      <SolitoImage
        fill
        src={imageUrlMedium(entry?.imageUrl || '')}
        className="aspect-square md:rounded-md"
        alt="player"
        contentFit="cover"
        sizes="(max-width: 768px) 100vw, 56px"
      />
    </View>
  )
}

// Desktop-only pressable link to entry page (artwork + title)
function EntryLink() {
  const { entry } = usePlayerStore()
  const { push } = useRouter()

  const handlePress = () => {
    if (entry?.id) {
      push(`/music/${entry.id}`)
    }
  }

  return (
    <Pressable 
      onPress={handlePress}
      className="hidden md:flex md:flex-row md:items-center cursor-pointer hover:opacity-80 transition-opacity"
    >
      <PosterContainer />
      <EntryInfo />
    </Pressable>
  )
}

export function FullScreenPlayer({ onTogglePress, animatedStyle }: Props) {
  return (
    <MotiView
      style={[animatedStyle]}
      className="absolute z-[1] inset-0 opacity-0 md:z-10 md:flex md:flex-row md:flex-grow md:!opacity-100"
    >
      {/* Mobile header with collapse button */}
      <View className="flex w-full flex-row items-center justify-between py-3 md:hidden">
        <Pressable className="mx-2" onPress={onTogglePress} hitSlop={10}>
          <ChevronDown className="text-[--text-color]" size={24} />
        </Pressable>
      </View>
      
      <View className="w-full items-center justify-between gap-y-8 md:flex-row">
        {/* Mobile: Poster only */}
        <View className="md:hidden">
          <PosterContainer />
        </View>
        
        {/* Desktop: Clickable artwork + title that links to entry page */}
        <EntryLink />

        {/* Mobile controls */}
        <PlayerSlider className="md:hidden w-full" />
        <View className="md:hidden">
          <EntryInfo />
        </View>
        <PlayerButtonsRow size="large" className="md:hidden" />
        
        {/* Desktop controls */}
        <View className="hidden grow justify-end md:flex h-full gap-1">
          <PlayerButtonsRow />
          <PlayerSlider />
        </View>
        <View className="hidden h-full w-64 lg:flex" />
      </View>
    </MotiView>
  )
}
