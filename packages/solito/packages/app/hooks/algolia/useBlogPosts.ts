import { algoliaClient, indexNames } from 'app/api/algolia'
import { filter } from 'ramda'
import { isSome } from 'app/utils'
import { usePaginatedAlgoliaSearch } from './usePaginatedAlgoliaSearch'
import { Post } from 'app/types'

export const queryKey = 'blog?page='
const pageSize = 20

const fetchBlog = async (key: string) => {
  const page = parseInt(key.replace(queryKey, ''), 10)
  const response = await algoliaClient.searchSingleIndex({
    indexName: indexNames.blog,
    searchParams: {
      query: '',
      page,
      hitsPerPage: pageSize,
    }
  })
  return filter(isSome, response.hits as unknown as Post[]) as NonNullable<Post>[]
}

export function useBlogPosts(pageStart?: number) {
  return usePaginatedAlgoliaSearch({
    fetcher: async (key: string) => {
      if (pageStart) {
        const page = parseInt(key.replace(queryKey, ''), 10) + pageStart

        return fetchBlog(queryKey + page)
      }
      return fetchBlog(key)
    },
    commonKey: queryKey,
    pageSize,
  })
}
