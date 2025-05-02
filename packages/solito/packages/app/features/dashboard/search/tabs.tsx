'use client'
import { View, Pressable } from 'react-native'
import { P } from 'app/design/typography'

export type Tabs = 'MFTs' | 'Collectors'

type TabBarProps = {
  selected: Tabs
  onTabClick: (tab: Tabs) => void
}

export function TabBar({ selected, onTabClick }: TabBarProps) {
  return (
    <View className="mb-4 mt-4 flex flex-row">
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
    </View>
  )
}

type TabProps = {
  text: string
  isSelected: boolean
  onPress: () => void
}

function Tab({ text, isSelected, onPress }: TabProps) {
  return (
    <Pressable
      className={`mr-4 rounded-full py-1 pl-3 pr-3 ${
        isSelected ? 'bg-primary' : 'bg-gray-600'
      }`}
      onPress={onPress}
    >
      <P
        className={`text-md font-medium ${
          isSelected ? 'text-white' : 'text-gray-300'
        }`}
      >
        {text}
      </P>
    </Pressable>
  )
}
