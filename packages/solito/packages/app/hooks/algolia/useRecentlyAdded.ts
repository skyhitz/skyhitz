import { algoliaClient, indexNames } from 'app/api/algolia'
import { Entry } from 'app/api/graphql/types'
import { filter } from 'ramda'
import { isSome } from 'app/utils'
import { usePaginatedAlgoliaSearch } from './usePaginatedAlgoliaSearch'

export const recentlyAddedQueryKey = 'recentlyAdded?page='
const pageSize = 20

const fetcher = async (key: string) => {
  const page = parseInt(key.replace(recentlyAddedQueryKey, ''), 10)
  const response = await algoliaClient.searchSingleIndex({
    indexName: indexNames.entriesTimestampDesc,
    searchParams: {
      query: '',
      page,
      hitsPerPage: pageSize,
      attributesToRetrieve: ['*'],
    }
  })
  // First cast to unknown, then to Entry type to handle Algolia v5 response format
  return filter(isSome, response.hits as unknown as Entry[]) as NonNullable<Entry>[]
}

export function useRecentlyAdded() {
  return usePaginatedAlgoliaSearch({
    fetcher,
    commonKey: recentlyAddedQueryKey,
    pageSize,
  })
}
