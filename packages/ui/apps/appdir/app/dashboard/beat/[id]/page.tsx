/** @jsxImportSource react */

import type { Metadata } from 'next'
import BeatScreen from 'app/features/dashboard/beat'
import { redirect } from 'next/navigation'
import { imageUrlMedium, videoSrc } from 'app/utils/entry'
import { combinedTitle } from 'app/constants/content'
import { Config } from 'app/config'
import JsonLdScript from 'app/seo/jsonLd'
import { getEntry } from 'app/hooks/algolia/getEntry'

type Props = {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // read route params
  const id = params.id

  // fetch data
  const entry = await getEntry(id)

  if (!entry) {
    return {
      title: combinedTitle,
    }
  }

  const url = `${Config.APP_URL}/dashboard/beat/${entry.id}`

  return {
    title: entry.artist ? `${entry.artist} - ${entry.title}` : entry.title,
    description: entry.description,
    twitter: {
      card: 'player',
      players: {
        playerUrl: `${videoSrc(entry.videoUrl)}`,
        streamUrl: `${videoSrc(entry.videoUrl)}`,
        width: 480,
        height: 480,
      },
      title: entry.title,
      images: {
        url: `${imageUrlMedium(entry.imageUrl)}`,
      },
    },
    openGraph: {
      title: entry.title,
      description: entry.description ? entry.description : '',
      images: [`${imageUrlMedium(entry.imageUrl)}`],
      url: url,
      videos: {
        url: `${videoSrc(entry.videoUrl)}`,
        type: 'video/mp4',
        width: 480,
        height: 480,
      },
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function BeatPage({ params }: { params: { id: string } }) {
  const entry = await getEntry(params.id)

  if (!entry) {
    redirect('/dashboard/search')
  }

  return (
    <>
      <BeatScreen entry={entry} />
      <JsonLdScript entry={entry} />
    </>
  )
}
