'use client'
import { useBeatParam } from 'app/hooks/param/useBeatParam'
import { Entry } from 'app/api/graphql/types'
import { ScrollView, View } from 'react-native'
import { Details } from './BeatDetails'
import { imageUrlMedium } from 'app/utils/entry'
import { BeatSummaryColumn } from './BeatSummaryColumn'
import * as assert from 'assert'
import { pinataGateway } from 'app/constants/constants'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import Image from 'app/design/image'
import { PlayButton } from './PlayButton'
import { ActionButtons } from './ActionButtons'
import CreateBid from './bids/CreateBid'
import ClientLikesList from './ClientLikesList'

// BeatScreen component props
type Props = {
  entry?: Entry
}

const Content = ({ entry }: { entry: Entry }) => {
  return (
    <View className="w-full">
      <View className="hidden md:flex">
        <View className="w-full flex-row">
          <View className="mr-4 flex flex-1 items-center">
            <View className="relative aspect-square w-full rounded-md">
              <Image
                source={{ uri: imageUrlMedium(entry.imageUrl) }}
                fill={true}
                alt={entry.title}
                style={{ borderRadius: 12 }}
                className="h-full w-full"
                width={500}
                height={500}
              />
            </View>

            <PlayButton entry={entry} />
            <ActionButtons entry={entry} />

            <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
            <CreateBid entry={entry} />
            <ClientLikesList entry={entry} />
          </View>
          <BeatSummaryColumn entry={entry} />
        </View>
      </View>
      <View className="md:hidden">
        <View className="max-w-125 max-h-125 mb-3 aspect-square w-full">
          <Image
            source={{ uri: imageUrlMedium(entry.imageUrl) }}
            fill={true}
            alt={entry.title}
            style={{ borderRadius: 12 }}
            className="h-full w-full"
            width={400}
            height={400}
          />
        </View>

        <PlayButton entry={entry} />
        <ActionButtons entry={entry} />

        <BeatSummaryColumn entry={entry} />
        <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
        <CreateBid entry={entry} />
        <ClientLikesList entry={entry} />
      </View>
    </View>
  )
}

export default function BeatScreen({ entry: serverEntry }: Props) {
  const id = useBeatParam()
  assert.ok(id !== undefined)
  const { entry } = useGetEntry({
    id,
    serverEntry,
  })

  if (!entry) {
    // Todo: implement loading skeleton
    return null
  }

  return (
    <View className="flex flex-1">
      <ScrollView className="flex min-h-full items-start w-full max-w-screen-xl mx-auto p-4">
        <Content entry={entry} />
      </ScrollView>
    </View>
  )
}
