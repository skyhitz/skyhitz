'use client'
import { XStack, Button } from 'tamagui'
import { P } from 'app/design/typography'

export type Tabs = 'MFTs' | 'Collectors'

type TabBarProps = {
  selected: Tabs
  onTabClick: (tab: Tabs) => void
}

export function TabBar({ selected, onTabClick }: TabBarProps) {
  return (
    <XStack marginBottom="$4" marginTop="$4" flexDirection="row">
      <Tab
        text="MFTs"
        isSelected={selected === 'MFTs'}
        onPress={() => onTabClick('MFTs')}
      />
      <Tab
        text="Collectors"
        isSelected={selected === 'Collectors'}
        onPress={() => onTabClick('Collectors')}
      />
    </XStack>
  )
}

type TabProps = {
  text: string
  isSelected: boolean
  onPress: () => void
}

function Tab({ text, isSelected, onPress }: TabProps) {
  return (
    <Button
      marginRight="$4"
      borderRadius="$10"
      paddingVertical="$1"
      paddingHorizontal="$3"
      backgroundColor={isSelected ? '$blue9' : '$gray8'}
      onPress={onPress}
    >
      <P
        fontSize="$4"
        fontWeight="500"
        color={isSelected ? '$white1' : '$gray11'}
      >
        {text}
      </P>
    </Button>
  )
}
