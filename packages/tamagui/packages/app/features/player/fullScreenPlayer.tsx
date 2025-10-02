'use client'
/**
 * Full screen player component
 * Migrated from legacy implementation to use Zustand
 */
import { Button, YStack, XStack, Text } from 'tamagui'
import ChevronDown from 'app/ui/icons/chevron-down'
import { PlayerButtonsRow } from './components/playerButtonsRow'
import { PlayerSlider } from './components/playerSlider'
import { VideoPlayer } from 'app/ui/VideoPlayer'
import { MotiView } from 'moti'
import { usePlayerStore } from 'app/state/player'

type Props = {
  onTogglePress: () => void
  animatedStyle: any
}

function EntryInfo() {
  const { entry } = usePlayerStore()

  return (
    <YStack 
      flex={1} 
      alignItems="center" 
      justifyContent="center" 
      maxWidth={{ md: 200 }} 
      $md={{ alignItems: 'flex-start', paddingHorizontal: '$4' }}
    >
      <Text
        textAlign="center"
        fontSize="$3"
        fontWeight="bold"
        color="$color"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {entry?.title}
      </Text>
      <Text
        textAlign="center"
        fontSize={{ xs: '$4', md: '$2' }}
        color="$color"
        ellipsizeMode="tail"
        numberOfLines={1}
      >
        {entry?.artist}
      </Text>
    </YStack>
  )
}

export function FullScreenPlayer({ onTogglePress, animatedStyle }: Props) {
  return (
    <MotiView
      style={[
        animatedStyle,
        {
          position: 'absolute',
          zIndex: 1,
          inset: 0,
          opacity: 0,
        }
      ]}
    >
      <XStack 
        width="100%" 
        flexDirection="row" 
        alignItems="center" 
        justifyContent="space-between" 
        paddingVertical="$3" 
        display={{ md: 'none' }}
      >
        <Button backgroundColor="transparent" padding="$0" marginHorizontal="$2" onPress={onTogglePress}>
          <ChevronDown color="$color" size={24} />
        </Button>
      </XStack>
      <YStack 
        width="100%" 
        alignItems="center" 
        justifyContent="space-between" 
        gap="$8" 
        $md={{ flexDirection: 'row' }}
      >
        <VideoPlayer />

        <PlayerSlider display={{ md: 'none' }} width="100%" />
        <EntryInfo />
        <PlayerButtonsRow size="large" display={{ md: 'none' }} />
        <YStack 
          display={{ xs: 'none', md: 'flex' }} 
          flexGrow={1} 
          justifyContent="flex-end" 
          height="100%" 
          gap="$1"
        >
          <PlayerButtonsRow />
          <PlayerSlider />
        </YStack>
        <YStack display={{ xs: 'none', lg: 'flex' }} height="100%" width={256} />
        {/* Like list commented out for now */}
      </YStack>
    </MotiView>
  )
}
