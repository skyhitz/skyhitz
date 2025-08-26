import { ConfigInterface } from './config'

// Development/test configuration
export const DevelopmentConfig: ConfigInterface = {
  GRAPHQL_URL: 'http://localhost:8787/graphql',
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  STELLAR_EXPERT_URL: 'https://testnet.stellar.expert',
  APP_URL: 'http://localhost:3000',
  ALGOLIA_APP_ID: 'HSVI9OH0KZ',
  ALGOLIA_SEARCH_KEY: '0f262dbb7c5d256fe235f9a726b77f68',
}
