'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { useEntryParam } from 'app/hooks/param/useEntryParam'
import { Entry } from 'app/api/graphql/types'
import { ScrollView, YStack, XStack, Text } from 'tamagui'
import { EntryDetails } from './Details'
import { imageUrlMedium } from 'app/utils/entry'
import { EntrySummaryColumn } from './SummaryColumn'
import { r2Gateway } from 'app/constants/constants'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { SolitoImage } from 'app/design/solito-image'

// EntryScreen component props
type Props = {
  entry?: Entry
  id?: string // Allow passing id directly for native
}

export function EntryScreen({ entry: serverEntry, id: passedId }: Props) {
  // Use passed id if available (for native), otherwise use param from URL (for web)
  const paramId = useEntryParam()
  const id = passedId || paramId

  // Manual check instead of assert.ok
  if (id === undefined) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text>Error: Entry ID is required</Text>
      </YStack>
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
      <YStack flex={1} alignItems="center" justifyContent="center">
        {/* Could add a proper loading skeleton here */}
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <XStack
          width="100%"
          marginHorizontal="auto"
          maxWidth="$7xl"
          flexDirection={{ xs: 'column', md: 'row' }}
          gap="$4"
          paddingTop={{ md: '$4' }}
          paddingBottom="$16"
        >
          <YStack width={{ xs: '100%', md: '50%' }}>
            <YStack
              aspectRatio={1}
              width="100%"
              overflow="hidden"
              borderRadius="$3"
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.25}
              shadowRadius={3.84}
              elevation={5}
            >
              <SolitoImage
                src={imageUrlMedium(entry.imageUrl)}
                fill={true}
                alt={entry.title}
                style={{ borderRadius: 8 }}
                contentFit="cover"
              />
            </YStack>

            <EntryDetails id={entry.id} link={`${r2Gateway}/${entry.id}/index`} />
          </YStack>

          <EntrySummaryColumn entry={entry} />
        </XStack>
      </ScrollView>
    </YStack>
  )
}
