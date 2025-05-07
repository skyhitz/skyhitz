'use client'
import { Entry } from 'app/api/graphql/types'
import { Pressable, View } from 'react-native'
import InfoCircle from 'app/ui/icons/info-circle'
import { H1, P } from 'app/design/typography'
import { useTheme } from 'app/state/theme/useTheme'
import { CollapsableView } from 'app/ui/CollapsableView'
import PlayIcon from 'app/ui/icons/play'
import { Config } from 'app/config'

type Props = {
  entry: Entry
}

export function BeatSummaryColumn({ entry }: Props) {
  // Format values for display
  const tvl = entry.tvl || 1; // Default to 1 XLM if not provided
  const apr = entry.apr || 40; // Default to 40% if not provided
  const { isDark } = useTheme();
  
  return (
    <View className="flex w-full md:ml-4 md:flex-1">
      <View>
        <H1 
          className="font-unbounded mb-2 text-3xl font-bold md:text-5xl text-[--text-color]"
        >
          {entry.title}
        </H1>
        <P 
          className="md:text-2xl text-[--text-color]"
        >
          {entry.artist}
        </P>
      </View>

      {/* TVL and APR information */}
      <View className="mt-6 mb-4">
        <View className="flex-row">
          <P className="text-[--text-secondary-color] mr-1">TVL: </P>
          <P className="text-[--text-color]">{tvl} XLM</P>
        </View>
        <View className="flex-row mt-1">
          <P className="text-[--text-secondary-color] mr-1">APR: </P>
          <P className="text-[--primary-color]">{apr}%</P>
        </View>
      </View>
      
      {/* Investment info section */}
      <View className="mt-2 mb-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <InfoCircle 
            className="mr-2" 
            width="16" 
            height="16" 
            className="stroke-[--text-secondary-color]"
          />
          <P className="text-[--text-secondary-color]">Amount (XLM)</P>
        </View>
        <View className="flex-row items-center">
          <InfoCircle 
            className="mr-2" 
            width="16" 
            height="16" 
            className="stroke-[--text-secondary-color]"
          />
          <P className="text-[--text-secondary-color]">Pool share %</P>
        </View>
      </View>

      <CollapsableView 
        headerText="Description" 
        icon={InfoCircle}
        className="bg-[--bg-secondary-color]"
      >
        <P 
          className="p-5 text-sm leading-6 text-[--text-color]"
        >
          {entry.description}
        </P>
      </CollapsableView>
    </View>
  )
}

function PlayButton({ entry }: { entry: Entry }) {
  const handlePlay = () => {
    console.log('Play entry:', entry.id)
    // Playback functionality will be implemented in a future PR
  }

  return (
    <Pressable onPress={handlePlay}>
      <PlayIcon className="text-gray-600" size={24} />
    </Pressable>
  )
}
