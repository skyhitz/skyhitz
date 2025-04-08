import { ConfigInterface } from './config'

export const LocalProdConfig: ConfigInterface = {
  APP_URL: 'https://skyhitz.io',
  GRAPHQL_URL: 'http://localhost:8000', // Local API with production remote vars
  HORIZON_URL: 'https://horizon.stellar.org',
  STELLAR_EXPERT_URL: 'https://stellar.expert/explorer/public',
  ALGOLIA_APP_ID: 'HSVI9OH0KZ',
  ALGOLIA_SEARCH_KEY: '945b2ada1a0d291c0ee8c278d60fb495',
}
