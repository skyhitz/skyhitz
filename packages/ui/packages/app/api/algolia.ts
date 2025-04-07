import { Config } from 'app/config'
import algoliasearch from 'algoliasearch'
import { createFetchRequester } from '@algolia/requester-fetch'

export const appDomain = Config.APP_URL.replace('https://', '')
export const algoliaClient = algoliasearch(
  Config.ALGOLIA_APP_ID,
  Config.ALGOLIA_SEARCH_KEY,
  {
    requester: createFetchRequester(),
  },
)
export const entriesIndex = algoliaClient.initIndex(`${appDomain}:entries`)
export const usersIndex = algoliaClient.initIndex(`${appDomain}:users`)
export const blogIndex = algoliaClient.initIndex(`${appDomain}:blog`)
export const sharesIndex = algoliaClient.initIndex(`${appDomain}:shares`)
export const ratingEntriesIndex = algoliaClient.initIndex(
  `${appDomain}:entries_rating_desc`,
)
export const timestampDescEntriesIndex = algoliaClient.initIndex(
  `${appDomain}:entries_timestamp_desc`,
)
