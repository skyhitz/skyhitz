import { algoliaClient, indexNames } from 'app/api/algolia'
import { filter } from 'ramda'
import { isSome } from 'app/utils'
import { usePaginatedAlgoliaSearch } from './usePaginatedAlgoliaSearch'
import type { Post } from 'app/types/index'

export const queryKey = 'blog?page='
export const pageSize = 20

const fetchBlog = async (key: string) => {
  const page = parseInt(key.replace(queryKey, ''), 10)
  const response = await algoliaClient.searchSingleIndex({
    indexName: indexNames.blog,
    searchParams: {
      query: '',
      page,
      hitsPerPage: pageSize,
      attributesToRetrieve: ['*'],

      // Ensure we only get published posts
      filters: 'publishedAtTimestamp>0',
      // Prefer recent first if index supports timestamp sorting
      // sort based on replica if configured; otherwise rely on index settings
    }
  })
  return filter(isSome, response.hits as unknown as Post[]) as NonNullable<Post>[]
}

export function useBlogPosts(pageStart?: number) {
  return usePaginatedAlgoliaSearch({
    fetcher: async (key: string) => {
      // Always start from page 0; SWR will pass 0 for the first page
      const page = parseInt(key.replace(queryKey, ''), 10)
      const normalized = Math.max(0, pageStart ? page + pageStart : page)
      return fetchBlog(queryKey + normalized)
    },
    commonKey: queryKey,
    pageSize,
  })
}
