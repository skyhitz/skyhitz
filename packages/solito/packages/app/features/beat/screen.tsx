'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { useBeatParam } from 'app/hooks/param/useBeatParam'
import { Entry } from 'app/api/graphql/types'
import { ScrollView, View, Text } from 'react-native'
import { Details } from './BeatDetails'
import { imageUrlMedium } from 'app/utils/entry'
import { BeatSummaryColumn } from './BeatSummaryColumn'
import { pinataGateway } from 'app/constants/constants'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { SolitoImage } from 'app/design/solito-image'

// BeatScreen component props
type Props = {
  entry?: Entry
  id?: string // Allow passing id directly for native
}

export function BeatScreen({ entry: serverEntry, id: passedId }: Props) {
  // Use passed id if available (for native), otherwise use param from URL (for web)
  const paramId = useBeatParam()
  const id = passedId || paramId

  // Manual check instead of assert.ok
  if (id === undefined) {
    return (
      <View className="flex flex-1 items-center justify-center">
        <Text>Error: Beat ID is required</Text>
      </View>
    )
  }

  // Track loading state ourselves
  const [loading, setLoading] = useState(!serverEntry)

  const { entry, refetch } = useGetEntry({
    id,
    serverEntry,
  })

  // Once we have an entry, we're no longer loading
  useEffect(() => {
    if (entry) {
      setLoading(false)
    }
  }, [entry])

  if (loading || !entry) {
    // Loading state
    return (
      <View className="flex flex-1 items-center justify-center">
        {/* Could add a proper loading skeleton here */}
      </View>
    )
  }

  return (
    <View className="flex flex-1 bg-[--bg-color]">
      <ScrollView contentContainerClassName="flex w-full mx-auto max-w-screen-xl md:flex-row gap-4 p-4">
        <View className="w-full md:w-1/2">
          <View className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
            <SolitoImage
              src={imageUrlMedium(entry.imageUrl)}
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
