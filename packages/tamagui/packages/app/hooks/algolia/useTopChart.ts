import { ratingEntriesIndex } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { filter } from 'ramda'
import { isSome } from 'app/utils'
import { usePaginatedAlgoliaSearch } from './usePaginatedAlgoliaSearch'

export const topChartQueryKey = 'topChart?page='
const pageSize = 20

const fetchChart = async (key: string) => {
  const page = parseInt(key.replace(topChartQueryKey, ''), 10)
  const response = await ratingEntriesIndex.search<Entry>('', {
    page,
    hitsPerPage: pageSize,
    attributesToRetrieve: ['*'],
    facets: ['apr']
  })
  // Convert Algolia hits to Entry objects with proper type casting
  return filter(isSome, response.hits.map(hit => hit as unknown as Entry)) as NonNullable<Entry>[]
}

export function useTopChart(pageStart?: number) {
  return usePaginatedAlgoliaSearch({
    fetcher: async (key: string) => {
      if (pageStart) {
        const page = parseInt(key.replace(topChartQueryKey, ''), 10) + pageStart

        return fetchChart(topChartQueryKey + page)
      }
      return fetchChart(key)
    },
    commonKey: topChartQueryKey,
    pageSize,
  })
}
