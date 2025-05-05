'use client'
import { Entry } from 'app/api/graphql/types'
import { Pressable, View } from 'react-native'
import InfoCircle from 'app/ui/icons/info-circle'
import { H1, P } from 'app/design/typography'
import { CollapsableView } from 'app/ui/CollapsableView'
import PlayIcon from 'app/ui/icons/play'
import { Config } from 'app/config'

type Props = {
  entry: Entry
}

export function BeatSummaryColumn({ entry }: Props) {
  return (
    <View className="flex w-full md:ml-4 md:flex-1">
      <View>
        <H1 className="font-unbounded mb-2 text-3xl font-bold md:text-5xl">
          {entry.title}
        </H1>
        <P className="md:text-2xl">{entry.artist}</P>
        <View className="mt-4 flex-row items-center gap-4">
          <PlayButton entry={entry} />
          {/* Like button will be implemented in a future PR */}
          {/* Share button will be implemented in a future PR */}
          {/* Download button will be implemented in a future PR */}
        </View>
      </View>
      
      {/* CreateBid component will be implemented in a future PR */}

      <CollapsableView icon={InfoCircle} headerText="Description">
        <P className="p-5 text-sm leading-6">{entry.description}</P>
      </CollapsableView>
      
      {/* LikesList will be implemented in a future PR */}
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
