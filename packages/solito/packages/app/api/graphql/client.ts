import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { Config } from 'app/config'
import { SecureStorage } from 'app/utils/secure-storage'

// Create the http link
const httpLink = createHttpLink({
  uri: Config.GRAPHQL_URL || 'https://api.skyhitz.io/api/graphql',
})

// Add the auth token to the headers
const authLink = setContext(async (_, { headers }) => {
  // Get the authentication token from SecureStorage
  const token = await SecureStorage.get('auth-token')
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
})

// Create the Apollo Client instance with optimized caching
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Cache entries by ID for better deduplication
          entry: {
            keyArgs: ['id'],
          },
          // Cache user queries
          user: {
            keyArgs: ['id'],
          },
        },
      },
      Entry: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['id'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      // Use cache-and-network for better UX - show cached data immediately, then update
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      // Return partial data from cache while fetching
      returnPartialData: true,
    },
    query: {
      // Use cache-first for queries - only fetch from network if not in cache
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})
