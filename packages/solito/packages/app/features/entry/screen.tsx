'use client'
import * as React from 'react'
import { useState, useEffect } from 'react'
import { useEntryParam } from 'app/hooks/param/useEntryParam'
import { Entry } from 'app/api/graphql/types'
import { ScrollView, View, Text, Platform } from 'react-native'
import { EntryDetails } from './Details'
import { imageUrlMedium, videoSrc } from 'app/utils/entry'
import { EntrySummaryColumn } from './SummaryColumn'
import { r2Gateway } from 'app/constants/constants'
import { useGetEntry } from 'app/hooks/algolia/useGetEntry'
import { SolitoImage } from 'app/design/solito-image'
import { usePlayerStore } from 'app/state/player'

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
      <View className="flex flex-1 items-center justify-center">
        <Text>Error: Entry ID is required</Text>
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

  // Check if this entry is currently playing and has video
  const { entry: currentEntry } = usePlayerStore()
  const hasVideo = entry.videoUrl && videoSrc(entry.videoUrl)
  const isCurrentVideoEntry = currentEntry?.id === entry.id && hasVideo

  // Set the portal target ID for this entry (CSS handles desktop/mobile visibility)
  useEffect(() => {
    if (Platform.OS === 'web' && isCurrentVideoEntry) {
      // Store the portal target ID in the player store
      usePlayerStore.getState().setVideoPortalTarget(`video-portal-${entry.id}`)
    }
    
    // Clear portal target when component unmounts or is no longer current
    return () => {
      if (Platform.OS === 'web') {
        const currentTarget = usePlayerStore.getState().videoPortalTarget
        if (currentTarget === `video-portal-${entry.id}`) {
          usePlayerStore.getState().setVideoPortalTarget(null)
        }
      }
    }
  }, [isCurrentVideoEntry, entry.id])

  return (
    <View className="flex flex-1 bg-[--bg-color]">
      <ScrollView contentContainerClassName="flex w-full mx-auto max-w-screen-xl md:flex-row gap-4 md:pt-4 pb-32">
        <View className="w-full md:w-1/2">
          <View className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
            {/* Portal target for video player on desktop */}
            {Platform.OS === 'web' && isCurrentVideoEntry && (
              <div 
                id={`video-portal-${entry.id}`} 
                className="flex aspect-square w-full absolute inset-0 z-10"
              />
            )}
            
            <SolitoImage
              src={imageUrlMedium(entry.imageUrl)}
              fill={true}
              alt={entry.title}
              style={{ borderRadius: 8 }}
              className={`h-full w-full object-cover ${isCurrentVideoEntry ? 'blur-lg' : ''}`}
              contentFit="cover"
            />
          </View>

          <EntryDetails id={entry.id} link={`${r2Gateway}/${entry.id}/index`} />
        </View>

        <EntrySummaryColumn entry={entry} />
      </ScrollView>
    </View>
  )
}
