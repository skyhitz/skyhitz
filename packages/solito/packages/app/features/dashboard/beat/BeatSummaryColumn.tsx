'use client'
import { Entry } from 'app/api/graphql/types'
import { View } from 'react-native'
import InfoCircle from 'app/ui/icons/info-circle'
import { H1, P } from 'app/design/typography'
import { CollapsableView } from 'app/ui/CollapsableView'

type Props = {
  entry: Entry
}

export function BeatSummaryColumn({ entry }: Props) {
  // Format values for display
  const tvl = entry.tvl || 1; // Default to 1 XLM if not provided
  const apr = entry.apr || 40; // Default to 40% if not provided
  // No theme variables needed anymore
  
  return (
    <View className="flex w-full md:ml-4 md:flex-1">
      <View>
        <H1 
          className="font-unbounded mb-2 text-3xl font-bold md:text-5xl"
        >
          {entry.title}
        </H1>
        <P 
          className="md:text-2xl"
        >
          {entry.artist}
        </P>
      </View>

      {/* TVL and APR information */}
      <View className="mt-6 mb-4">
        <View className="flex-row">
          <P className="text-[--text-secondary-color] mr-1">TVL: </P>
          <P>{tvl} XLM</P>
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
            className="mr-2 stroke-[--text-secondary-color]" 
            width="16" 
            height="16"
          />
          <P className="text-[--text-secondary-color]">Amount (XLM)</P>
        </View>
        <View className="flex-row items-center">
          <InfoCircle 
            className="mr-2 stroke-[--text-secondary-color]" 
            width="16" 
            height="16"
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
          className="p-5 text-sm leading-6"
        >
          {entry.description}
        </P>
      </CollapsableView>
    </View>
  )
}

// Removed unused PlayButton component
