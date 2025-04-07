import { P } from 'app/design/typography'
import { Pressable, View } from 'react-native'

export type Tabs = 'MFTs' | 'Collectors'

type TabBarProps = {
  selected: Tabs
  onTabClick?: (tab: Tabs) => void
}

export function TabBar({ onTabClick, selected }: TabBarProps) {
  return (
    <View className="flex w-full flex-row">
      <Pressable className="grow py-4" onPress={() => onTabClick?.('MFTs')}>
        <P
          className={`font-unbounded ${
            selected === 'MFTs' ? 'font-bold text-gray-600' : 'text-neutral-500'
          } mx-auto text-xs`}
        >
          MFTs
        </P>
      </Pressable>
      <Pressable
        className="grow py-4"
        onPress={() => onTabClick?.('Collectors')}
      >
        <P
          className={`font-unbounded ${
            selected === 'Collectors'
              ? 'font-bold text-gray-600'
              : 'text-neutral-500'
          } mx-auto text-xs`}
        >
          Collectors
        </P>
      </Pressable>
    </View>
  )
}
