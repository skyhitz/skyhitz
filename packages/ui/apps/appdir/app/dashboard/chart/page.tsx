/** @jsxImportSource react */

import { ratingEntriesIndex } from 'app/api/algolia'
import { Entry } from 'app/api/graphql'
import { Config } from 'app/config'
import { ChartScreen } from 'app/features/dashboard/chart'
import JsonLdScript from 'app/seo/jsonLd'
import { Metadata } from 'next'
import { isEmpty } from 'ramda'

export const metadata: Metadata = {
  title: 'Skyhitz - Top Chart',
  description: 'Discover trending music NFTs',
  alternates: {
    canonical: `${Config.APP_URL}/dashboard/chart`,
  },
}

// Disable Next.js cache for this route
export const revalidate = 0
export const dynamic = 'force-dynamic'

const getChart = async () => {
  const res = await ratingEntriesIndex.search<Entry>('', {
    attributesToRetrieve: ['*'],
    cacheable: false,
    facets: ['apr'],
  })

  if (isEmpty(res.hits)) {
    return []
  }

  return res.hits as Entry[]
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
