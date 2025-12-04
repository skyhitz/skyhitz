import { ratingEntriesIndex } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { Config } from 'app/config'
import { ChartScreen } from 'app/features/chart'
import JsonLdScript from 'app/seo/jsonLd'
import { Metadata } from 'next'
import { isEmpty } from 'ramda'

export const metadata: Metadata = {
  title: 'Top Trending Music NFTs | Skyhitz Chart',
  description:
    'Discover the hottest trending music NFTs on Skyhitz. Our interactive chart ranks tracks by user engagement - buying, streaming, and likes drive the rankings. Find your next favorite music collectible.',
  keywords: [
    'trending music NFTs',
    'top music NFTs',
    'music NFT chart',
    'popular music NFTs',
    'best music NFTs',
    'NFT music rankings',
    'blockchain music chart',
  ],
  alternates: {
    canonical: `${Config.APP_URL}/chart`,
  },
  openGraph: {
    title: 'Top Trending Music NFTs | Skyhitz Chart',
    description:
      'Discover the hottest trending music NFTs on Skyhitz. Rankings driven by real user engagement.',
    url: `${Config.APP_URL}/chart`,
    type: 'website',
    images: [
      {
        url: `${Config.APP_URL}/img/landing-3.webp`,
        width: 1200,
        height: 630,
        alt: 'Skyhitz Trending Music NFT Chart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Trending Music NFTs | Skyhitz Chart',
    description:
      'Discover the hottest trending music NFTs on Skyhitz. Rankings driven by real user engagement.',
    images: [`${Config.APP_URL}/img/landing-3.webp`],
  },
  robots: { index: true, follow: true },
}

// Revalidate chart every 5 minutes for fresh rankings
export const revalidate = 300

async function getChart(): Promise<Entry[]> {
  try {
    const res = await ratingEntriesIndex.search<Entry>('', {
      page: 0,
      hitsPerPage: 20,
      attributesToRetrieve: ['*'],
      facets: ['apr'],
    })

    if (isEmpty(res.hits)) {
      return []
    }

    // Convert Algolia search results to Entry objects
    return res.hits.map((hit: any) => hit as unknown as Entry)
  } catch (error) {
    console.error('Chart fetch error:', error)
    return []
  }
}

export default async function ChartPage() {
  const chart = await getChart()

  return (
    <>
      <ChartScreen entries={chart} />
      <JsonLdScript chart={chart} />
    </>
  )
}
