'use client'
import { useBeatParam } from 'app/hooks/param/useBeatParam'
import { Entry } from 'app/api/graphql'
import { ScrollView, View } from 'react-native'
import { Details } from './BeatDetails'
import { imageUrlMedium } from 'app/utils/entry'
import { BeatSummaryColumn } from './BeatSummaryColumn'
import * as assert from 'assert'
import { ReactNode, useEffect, useState } from 'react'
import BeatPageSkeleton from 'app/ui/skeletons/BeatPageSkeleton'
import { SolitoImage } from 'app/design/solito-image'
import { pinataGateway } from 'app/constants/constants'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'

type Props = {
  entry?: Entry
  children?: ReactNode
}

const Content = ({ entry }: { entry: Entry }) => {
  return (
    <View className="w-full">
      <View className="hidden md:flex">
        <View className="w-full flex-row">
          <View className="mr-4 flex flex-1 items-center">
            <View className="relative aspect-square w-full rounded-md">
              <SolitoImage
                src={imageUrlMedium(entry.imageUrl)}
                fill
                alt={entry.title}
                style={{ borderRadius: 12 }}
                sizes="(max-width: 768px) 100vw"
                priority
                contentFit="cover"
              />
            </View>

            <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
          </View>
          <BeatSummaryColumn entry={entry} />
        </View>
      </View>
      <View className="md:hidden">
        <View className="max-w-125 max-h-125 mb-3 aspect-square w-full">
          <SolitoImage
            src={imageUrlMedium(entry.imageUrl)}
            fill
            alt={entry.title}
            style={{ borderRadius: 12 }}
            sizes="(max-width: 768px) 100vw"
            priority
            contentFit="cover"
          />
        </View>
        <BeatSummaryColumn entry={entry} />
        <Details id={entry.id} link={`${pinataGateway}/${entry.id}`} />
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
    // TO DO: fix loading skeletons
    // return <BeatPageSkeleton/>
    return null
  }

  return (
    <View className="flex flex-1">
      <ScrollView contentContainerClassName="flex min-h-full items-start w-full max-w-screen-xl mx-auto p-4">
        <Content entry={entry} />
      </ScrollView>
    </View>
  )
}
