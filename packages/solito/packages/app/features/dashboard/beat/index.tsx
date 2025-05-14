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

// BeatScreen component props
type Props = {
  entry?: Entry
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
      <ScrollView contentContainerClassName="flex w-full mx-auto max-w-screen-xl md:flex-row gap-4 p-4">
        <View className="w-full md:w-1/2">
          <View className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
            <Image
              source={{ uri: imageUrlMedium(entry.imageUrl) }}
              fill={true}
              alt={entry.title}
              style={{ borderRadius: 8 }}
              className="h-full w-full object-cover"
              contentFit="cover"
            />
          </View>

          <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
        </View>

        <BeatSummaryColumn entry={entry} />
      </ScrollView>
    </View>
  )
}
