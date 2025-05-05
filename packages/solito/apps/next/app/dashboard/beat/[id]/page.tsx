/** @jsxImportSource react */

import type { Metadata } from 'next'
import React from 'react'
import BeatScreen from 'app/features/dashboard/beat'
import { getEntry } from 'app/hooks/algolia/getEntry'
import { imageUrlMedium, videoSrc } from 'app/utils/entry'
import { Config } from 'app/config'
import { redirect } from 'next/navigation'
import { Entry } from 'app/api/graphql/types'

type Props = {
  params: { id: string }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  // read route params - properly await params object in Next.js 15
  const { id } = await props.params

  // fetch data
  const entry = await getEntry(id)

  if (!entry) {
    return {
      title: 'Skyhitz',
    }
  }

  const url = `${Config.APP_URL}/dashboard/beat/${entry.id}`

  return {
    title: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
    description: entry.description,
    twitter: {
      card: 'player',
      title: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
      description: entry.description || 'Listen to this beat on Skyhitz',
      // Next.js expects 'players' property with these specific fields
      players: {
        playerUrl: videoSrc(entry.videoUrl),
        streamUrl: videoSrc(entry.videoUrl),
        width: 480,
        height: 480
      },
      // Adding image for fallback when player isn't supported
      images: {
        url: imageUrlMedium(entry.imageUrl),
        alt: `${entry.artist} - ${entry.title}`
      }
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

export default async function BeatPage(props: Props) {
  // Properly await params in Next.js 15
  const { id } = await props.params
  
  // Use server component to pre-fetch entry data
  const entry = await getEntry(id)

  // Redirect if entry doesn't exist
  if (!entry) {
    redirect('/dashboard')
  }

  // Cast the entry to handle the type mismatch between Entry|null and Entry|undefined
  return <BeatScreen entry={entry as Entry} />
}
