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
}

// Disable Next.js cache for this route
export const revalidate = 0
export const dynamic = 'force-dynamic'

async function getChart() {
  const res = await ratingEntriesIndex.search<Entry>('', {
    attributesToRetrieve: ['*'],
    facets: ['apr'],
  })

  if (isEmpty(res.hits)) {
    return []
  }

  // Convert Algolia search results to Entry objects
  return res.hits.map((hit: any) => {
    return hit as unknown as Entry
  })
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
