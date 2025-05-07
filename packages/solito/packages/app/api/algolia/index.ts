import { Config } from 'app/config'
import * as algoliaModule from 'algoliasearch'
const { algoliasearch } = algoliaModule

export const appDomain = Config.APP_URL.replace('https://', '')

// Initialize the Algolia client with v5 API
export const algoliaClient = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_SEARCH_KEY
)

// Define index names for use with v5 API
export const indexNames = {
  entries: `${appDomain}:entries`,
  users: `${appDomain}:users`,
  blog: `${appDomain}:blog`,
  shares: `${appDomain}:shares`,
  entriesRatingDesc: `${appDomain}:entries_rating_desc`,
  entriesTimestampDesc: `${appDomain}:entries_timestamp_desc`,
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
    const result = await searchIndex(indexNames.entriesRatingDesc, query, options)
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
