# Skyhitz

Skyhitz is a comprehensive music and media platform with blockchain integration, allowing creators to tokenize and monetize their content. The platform consists of both web and mobile applications with a unified backend.

## Project Structure

This is a monorepo containing both the API and UI components of the Skyhitz platform:

```
skyhitz/
├── packages/
│   ├── api/      # Backend API using Cloudflare Workers
│   └── ui/       # Frontend applications and shared components
│       ├── apps/
│       │   ├── appdir/  # Web application (Next.js)
│       │   └── expo/    # Mobile application (React Native/Expo)
│       └── packages/
│           └── app/     # Shared components and functionality
```

## Technology Stack

### Backend (API)

- **Cloudflare Workers**: Serverless edge computing platform for the API
- **Apollo Server**: GraphQL server implementation
- **Stellar SDK**: Integration with Stellar blockchain for NFT functionality
- **Algolia**: Search functionality
- **Stripe**: Payment processing
- **SendGrid**: Email services
- **JWT**: Authentication

### Frontend (UI)

- **Next.js**: Web application framework (production)
- **React Native/Expo**: Mobile application framework (in development)
- **TailwindCSS**: Styling
- **Apollo Client**: GraphQL client
- **Shared Component Library**: Common UI elements and business logic

## Key Features

- User authentication and profile management
- Media content management (entries with video and images)
- Blockchain integration for tokenizing content
- Payment processing and credits system
- Like/favorite functionality
- Activity tracking
- Content discovery

## Smart Contract Integration

The platform includes a Stellar blockchain integration for:

- Tokenizing media entries
- Managing ownership and investments
- Tracking transaction history
- Claiming earnings

## Development Setup

### Prerequisites

- Node.js
- Yarn package manager
- Cloudflare Wrangler CLI (for API development)
- Expo CLI (for mobile development)

### Getting Started

1. **Install dependencies**:

   ```
   yarn install
   ```

2. **Run the API locally**:

   ```
   yarn api:dev
   ```

3. **Run the web application**:

   ```
   yarn ui:dev
   ```

   Or more specifically:

   ```
   cd packages/ui && yarn web
   ```

4. **Run the mobile application**:
   ```
   cd packages/ui && yarn native
   ```

### Deployment

Deploy the API to Cloudflare Workers:

```
yarn deploy
```

## Project Structure Details

### API Structure

- `src/`: Main source code

  - `algolia/`: Search integration
  - `auth/`: Authentication services
  - `config/`: Application configuration
  - `constants/`: Constant values
  - `graphql/`: GraphQL schema and resolvers
  - `kraken/`: Exchange rate services
  - `sendgrid/`: Email service integration
  - `stellar/`: Blockchain integration
  - `stripe/`: Payment processing
  - `util/`: Utility functions
  - `webhooks/`: Webhook handlers

- `contract/`: Stellar smart contract implementation

### UI Structure

- `apps/appdir/`: Next.js web application
- `apps/expo/`: React Native mobile application
- `packages/app/`: Shared components and functionality
  - `api/`: API client
  - `config/`: Application configuration
  - `constants/`: Constant values
  - `design/`: Design system
  - `features/`: Feature-specific components
    - `accounts/`: User account management
    - `dashboard/`: Main dashboard
    - `player/`: Media player
    - And others...
  - `hooks/`: Custom React hooks
  - `navigation/`: Navigation configuration
  - `provider/`: Context providers
  - `state/`: State management
  - `ui/`: UI components
  - `utils/`: Utility functions

## License

Copyright © Skyhitz, Inc.
