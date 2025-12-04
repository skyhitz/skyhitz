import { Metadata } from 'next'
import { Config } from 'app/config'
import { algoliaClient, indexNames } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { SearchScreenSSR } from './search-screen-ssr'

export const metadata: Metadata = {
  title: 'Search Music NFTs | Skyhitz',
  description:
    'Discover and search for the best music NFTs on Skyhitz. Browse recently added tracks, find trending artists, and explore exclusive music collections on the Stellar blockchain.',
  keywords: [
    'music NFT search',
    'find music NFTs',
    'music NFT marketplace',
    'discover music NFTs',
    'blockchain music',
    'Stellar NFTs',
  ],
  alternates: {
    canonical: `${Config.APP_URL}/search`,
  },
  openGraph: {
    title: 'Search Music NFTs | Skyhitz',
    description:
      'Discover and search for the best music NFTs on Skyhitz. Browse recently added tracks and explore exclusive music collections.',
    url: `${Config.APP_URL}/search`,
    type: 'website',
    images: [
      {
        url: `${Config.APP_URL}/img/landing-2.webp`,
        width: 1200,
        height: 630,
        alt: 'Skyhitz Music NFT Search',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Music NFTs | Skyhitz',
    description:
      'Discover and search for the best music NFTs on Skyhitz. Browse recently added tracks and explore exclusive music collections.',
    images: [`${Config.APP_URL}/img/landing-2.webp`],
  },
  robots: { index: true, follow: true },
}

// Revalidate search page every 5 minutes for fresh content
export const revalidate = 300

async function getRecentlyAddedEntries(): Promise<Entry[]> {
  try {
    const result = await algoliaClient.searchSingleIndex({
      indexName: indexNames.entriesTimestampDesc,
      searchParams: {
        query: '',
        hitsPerPage: 20,
        page: 0,
        attributesToRetrieve: ['*'],
      },
    })

    return (result.hits || []) as unknown as Entry[]
  } catch (error) {
    console.error('Error fetching recently added entries:', error)
    return []
  }
}

export default async function SearchPage() {
  // Pre-fetch recently added entries for SSR
  const recentlyAddedEntries = await getRecentlyAddedEntries()

  return <SearchScreenSSR initialEntries={recentlyAddedEntries} />
}
