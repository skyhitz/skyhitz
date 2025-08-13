/** @jsxImportSource react */

import type { Metadata } from 'next'
import React from 'react'
import EntryScreen from 'app/features/entry'
import { getEntry } from 'app/hooks/algolia/getEntry'
import { imageUrlMedium, videoSrc } from 'app/utils/entry'
import { Config } from 'app/config'
import { redirect } from 'next/navigation'
import { Entry } from 'app/api/graphql/types'
import JsonLdScript from 'app/seo/jsonLd'

type Props = {
  params: { id: string }
}

export async function generateEntryMetadata(props: Props): Promise<Metadata> {
  // read route params - properly await params object in Next.js 15
  const { id } = await props.params

  // fetch data
  const entry = await getEntry(id)

  if (!entry) {
    return {
      title: 'Skyhitz',
    }
  }

  const url = `${Config.APP_URL}/music/${entry.id}`

  return {
    title: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
    description: entry.description,
    alternates: { canonical: url },
    twitter: {
      card: 'player',
      title: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
      description: entry.description || 'Listen to this music on Skyhitz',
      // Next.js expects 'players' property with these specific fields
      players: {
        playerUrl: videoSrc(entry.videoUrl),
        streamUrl: videoSrc(entry.videoUrl),
        width: 480,
        height: 480,
      },
      // Adding image for fallback when player isn't supported
      images: {
        url: imageUrlMedium(entry.imageUrl),
        alt: `${entry.artist} - ${entry.title}`,
      },
    },
    openGraph: {
      type: 'music.song',
      title: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
      url: url,
      images: [
        {
          url: imageUrlMedium(entry.imageUrl),
          width: 800,
          height: 600,
          alt: entry.title,
        },
      ],
      description: entry.description,
    },
  }
}

export async function EntryPageComponent(props: Props) {
  // Properly await params in Next.js 15
  const { id } = await props.params

  // Use server component to pre-fetch entry data
  const entry = await getEntry(id)

  // Redirect if entry doesn't exist
  if (!entry) {
    redirect('/search')
  }

  // Cast the entry to handle the type mismatch between Entry|null and Entry|undefined
  return (
    <>
      <EntryScreen entry={entry as Entry} />
      <JsonLdScript entry={entry as Entry} />
    </>
  )
}