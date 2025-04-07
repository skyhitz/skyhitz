# Skyhitz Cloudflare GraphQL API

A GraphQL API deployed on Cloudflare Workers that interacts with a Stellar blockchain smart contract to manage digital content, earnings, and investments.

## Overview

This project provides a serverless backend for the Skyhitz platform, handling user authentication, content management, payment processing, and blockchain interactions using the Stellar network. The API is built using Apollo Server and deployed to Cloudflare Workers.

## Key Features

- **GraphQL API**: Comprehensive API for all platform operations
- **Stellar Blockchain Integration**: Smart contract interactions for content monetization
- **User Authentication**: JWT-based authentication
- **Content Management**: Algolia-powered search and indexing
- **Payment Processing**: Stripe integration for payments
- **Earnings Distribution**: Automated earnings claiming and distribution

## Technical Stack

- **Runtime**: Cloudflare Workers
- **API**: Apollo Server GraphQL
- **Blockchain**: Stellar/Soroban smart contracts
- **Database**: Algolia
- **Authentication**: JWT
- **Payments**: Stripe
- **Email**: SendGrid

## Project Structure

```
cloudflare-graphql/
├── contract/                  # Stellar smart contract
│   ├── src/                   # Rust smart contract code
│   ├── .soroban/              # Soroban config
│   ├── client.ts              # Generated client
│   ├── index.ts               # Contract client implementation
│   └── bindings.sh            # Script for generating bindings
├── src/
│   ├── algolia/               # Algolia client and operations
│   ├── auth/                  # Authentication modules
│   ├── config/                # Configuration
│   ├── constants/             # Constants
│   ├── graphql/               # GraphQL schema and resolvers
│   ├── kraken/                # Kraken integration
│   ├── sendgrid/              # Email service
│   ├── stellar/               # Stellar blockchain utilities
│   ├── stripe/                # Payment processing
│   ├── util/                  # Utility functions
│   ├── webhooks/              # Webhook handlers
│   └── index.ts               # Main application entry
└── test/                      # Tests
```

## Smart Contract

The Stellar smart contract (written in Rust) manages:

- Entry storage and retrieval
- Investment processing
- Earnings calculation and distribution
- User share tracking

Key contract functions:
- `set_entry`: Store entry data
- `remove_entry`: Remove an entry
- `get_entry`: Retrieve entry data
- `invest`: Process user investments
- `claim_earnings`: Calculate and distribute user earnings

## GraphQL API

The API provides queries and mutations for all platform operations:

### Queries
- User data (credits, entries, likes)
- Entry details and statistics
- Price information

### Mutations
- User management (creation, authentication, updates)
- Entry processing (investment, likes, removal)
- Earnings distribution (claim_earnings)
- Payment processing (Stripe integration)

## Development Setup

1. Install dependencies:
   ```
   yarn
   ```

2. Set up environment variables in `.dev.vars` file

3. Run locally:
   ```
   yarn dev
   ```

## Contract Deployment

### Testnet
```
yarn testnet:contract:setup
yarn testnet:contract:upgrade
```

### Mainnet
```
yarn mainnet:contract:setup
yarn mainnet:contract:upgrade
yarn mainnet:contract:bindings
```

## API Deployment

Deploy to Cloudflare Workers:
```
yarn deploy
```

## Environment Variables

Required environment variables:
- `ALGOLIA_ADMIN_KEY`: Algolia admin API key
- `ALGOLIA_APP_ID`: Algolia application ID
- `ISSUER_SEED`: Stellar issuer seed 
- `JWT_SECRET`: JWT signing secret
- `SENDGRID_API_KEY`: SendGrid API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `STELLAR_NETWORK`: Network selection ('testnet' or 'mainnet')

## Notes

- The smart contract is designed to handle proper earnings distribution based on user shares
- Recent updates include returning the claimed amount directly from the smart contract
- The system uses Wrangler for deployment (version 4.7.0)
