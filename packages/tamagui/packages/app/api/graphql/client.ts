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

// Create the Apollo Client instance
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
})
