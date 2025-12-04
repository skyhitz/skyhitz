import React from 'react'
import EntryScreen from 'app/features/entry'
import { getEntry } from 'app/hooks/algolia/getEntry'
import { imageUrlMedium, videoSrc } from 'app/utils/entry'
import { Config } from 'app/config'
import { redirect } from 'next/navigation'
import { Entry } from 'app/api/graphql/types'
import JsonLdScript from 'app/seo/jsonLd'

type Props = {
  params: Promise<{ id: string }>
}

// Enable ISR with 5 minute revalidation for fresh content
export const revalidate = 300

export async function generateEntryMetadata(props: Props) {
  // read route params - properly await params object in Next.js 15
  const { id } = await props.params

  // fetch data
  const entry = await getEntry(id)

  if (!entry) {
    return {
      title: 'Track Not Found | Skyhitz',
      description: 'This music NFT could not be found on Skyhitz.',
      robots: { index: false, follow: true },
    }
  }

  const url = `${Config.APP_URL}/music/${entry.id}`
  const title = entry.artist ? `${entry.artist} - ${entry.title}` : entry.title
  const description =
    entry.description ||
    `Listen to "${entry.title}"${entry.artist ? ` by ${entry.artist}` : ''} on Skyhitz - the music NFT marketplace on Stellar.`
  const imageUrl = imageUrlMedium(entry.imageUrl)

  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      'music NFT',
      entry.title,
      entry.artist,
      'Stellar blockchain',
      'music collectible',
      'NFT music',
      'blockchain music',
    ].filter(Boolean),
    twitter: {
      card: 'player',
      title,
      description,
      // Next.js expects 'players' property with these specific fields
      players: {
        playerUrl: videoSrc(entry.videoUrl),
        streamUrl: videoSrc(entry.videoUrl),
        width: 480,
        height: 480,
      },
      // Adding image for fallback when player isn't supported
      images: {
        url: imageUrl,
        alt: title,
      },
    },
    openGraph: {
      type: 'music.song',
      title,
      url: url,
      siteName: 'Skyhitz',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
      description,
      audio: videoSrc(entry.videoUrl)
        ? [
            {
              url: videoSrc(entry.videoUrl),
              type: 'audio/mpeg',
            },
          ]
        : undefined,
    },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    other: {
      // Music-specific meta tags
      'music:musician': entry.artist || undefined,
      'music:release_date': entry.publishedAt || undefined,
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
