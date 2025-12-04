import { ratingEntriesIndex } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { Config } from 'app/config'
import { ChartScreen } from 'app/features/chart'
import JsonLdScript from 'app/seo/jsonLd'
import { Metadata } from 'next'
import { isEmpty } from 'ramda'

export const metadata: Metadata = {
  title: 'Skyhitz - Top Chart',
  description: 'Discover trending music NFTs',
  alternates: {
    canonical: `${Config.APP_URL}/chart`,
  },
  robots: { index: true, follow: true },
}

// Enable ISR caching - revalidate every 2 minutes for chart freshness
export const revalidate = 120

async function getChart() {
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
