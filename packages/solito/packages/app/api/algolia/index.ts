import { Config } from 'app/config'
// Use the standard client; on Workers we only call it from client-side paths now
import { algoliasearch } from 'algoliasearch'
import { createFetchRequester } from '@algolia/requester-fetch'
import { filter, isEmpty } from 'ramda'
import { isSome } from 'app/utils'
import { Post } from 'app/types/index'

export const appDomain = Config.APP_URL.replace('https://', '')
// Cloudflare worker hosts (workers.dev or custom domain) should also map to the
// production appDomain. Normalize known hosts to avoid mismatched index names.
const normalizedHost = (host: string) =>
  host
    .replace('https://', '')
    .replace('http://', '')
    .replace('.workers.dev', '')
    .replace('skyhitz-app.', '')


// Initialize the Algolia client with v5 API
export const algoliaClient = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_SEARCH_KEY,
  { requester: createFetchRequester() }
)

// Define index names for use with v5 API
export const indexNames = {
  entries: `${normalizedHost(appDomain)}:entries`,
  users: `${normalizedHost(appDomain)}:users`,
  blog: `${normalizedHost(appDomain)}:blog`,
  shares: `${normalizedHost(appDomain)}:shares`,
  entriesRatingDesc: `${normalizedHost(appDomain)}:entries_rating_desc`,
  entriesTimestampDesc: `${normalizedHost(appDomain)}:entries_timestamp_desc`,
}

/**
 * Helper function to search a specific index using the v5 API
 * @param indexName The name of the index to search
 * @param query The search query
 * @param options Additional search options
 * @returns Search results
 */
export async function searchIndex(
  indexName: string,
  query: string,
  options: any = {}
) {
  const result = await algoliaClient.searchSingleIndex({
    indexName,
    searchParams: {
      query,
      ...options,
    },
  })
  return result
}

/**
 * Helper function to get a single object by ID from an index
 * @param indexName The name of the index
 * @param objectID The ID of the object to retrieve
 * @returns The requested object
 */
export async function getObject(indexName: string, objectID: string) {
  const result = await algoliaClient.getObject({
    indexName,
    objectID,
  })
  return result
}

// Create index interfaces for direct use
export const entriesIndex = {
  search: async <T>(query: string, options: any = {}) => {
    const result = await searchIndex(indexNames.entries, query, options)
    return result
  },
  getObject: async <T>(objectID: string) => {
    const result = await getObject(indexNames.entries, objectID)
    return result as T
  },
}

// Users index for users/collectors search
export const usersIndex = {
  search: async <T>(query: string, options: any = {}) => {
    const result = await searchIndex(indexNames.users, query, options)
    return result
  },
  getObject: async <T>(objectID: string) => {
    const result = await getObject(indexNames.users, objectID)
    return result as T
  },
}

// Rating entries index for the chart functionality
export const ratingEntriesIndex = {
  search: async <T>(query: string, options: any = {}) => {
    const result = await searchIndex(
      indexNames.entriesRatingDesc,
      query,
      options
    )
    return result
  },
  getObject: async <T>(objectID: string) => {
    const result = await getObject(indexNames.entriesRatingDesc, objectID)
    return result as T
  },
}

export const blogIndex = {
  search: async <T>(query: string, options: any = {}) => {
    const result = await searchIndex(indexNames.blog, query, options)
    return result
  },
  getObject: async <T>(objectID: string) => {
    const result = await getObject(indexNames.blog, objectID)
    return result as T
  },
}

export async function fetchPost(slug: string) {
  try {
    const response = await algoliaClient.searchSingleIndex({
      indexName: indexNames.blog,
      searchParams: {
        query: '',
        filters: `objectID:${slug}`,
      },
    })

    if (isEmpty(response.hits)) {
      return {} as Post
    }

    return response.hits[0] as unknown as Post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return {} as Post
  }
}

export async function fetchBlogPosts(page = 0, hitsPerPage = 20) {
  try {
    const response = await algoliaClient.searchSingleIndex({
      indexName: indexNames.blog,
      searchParams: {
        query: '',
        page,
        hitsPerPage,
        attributesToRetrieve: ['*'],
        filters: 'publishedAtTimestamp>0',
      },
    })

    return filter(
      isSome,
      response.hits as unknown as Post[]
    ) as NonNullable<Post>[]
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return []
  }
}

/**
 * Fetches blog posts for the home page
 * @param hitsPerPage Number of posts to fetch
 * @returns An array of HomePost objects
 */
export async function fetchHomePagePosts(hitsPerPage = 3) {
  try {
    const response = await blogIndex.search('', { hitsPerPage })

    if (isEmpty(response.hits)) {
      return []
    }

    return response.hits.map((hit) => {
      const postData = hit as unknown as Record<string, any>
      return {
        id: postData.objectID || '',
        title: postData.title || '',
        content: postData.content || '',
        excerpt: postData.excerpt || '',
        slug: postData.slug || '',
        publishedAt: postData.publishedAt || Date.now(),
        imageUrl: postData.imageUrl || '',
        author: postData.author || '',
        tag: postData.tag || 'general', // Default tag value
        publishedAtTimestamp:
          postData.publishedAtTimestamp || Math.floor(Date.now() / 1000),
      } as Post
    })
  } catch (error) {
    console.error('Error fetching home page posts:', error)
    return []
  }
}

// Shares index for ownership data access
export const sharesIndex = {
  search: async <T>(query: string, options: any = {}) => {
    const result = await searchIndex(indexNames.shares, query, options)
    return result
  },
  getObject: async <T>(objectID: string) => {
    const result = await getObject(indexNames.shares, objectID)
    return result as T
  },
}
