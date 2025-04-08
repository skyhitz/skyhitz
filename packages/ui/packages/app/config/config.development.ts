import { ConfigInterface } from './config'

// This is for the test environment - local API with local dev vars
export const DevelopmentConfig: ConfigInterface = {
  APP_URL: 'https://skyhitz-expo-next.vercel.app',
  GRAPHQL_URL: 'http://localhost:8000', // Points to local API in test mode
  HORIZON_URL: 'https://horizon-testnet.stellar.org',
  STELLAR_EXPERT_URL: 'https://stellar.expert/explorer/testnet',
  ALGOLIA_APP_ID: 'HSVI9OH0KZ',
  ALGOLIA_SEARCH_KEY: '945b2ada1a0d291c0ee8c278d60fb495',
}
