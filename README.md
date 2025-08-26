# Skyhitz

Skyhitz is a music and media platform with blockchain integration, allowing creators to tokenize and monetize their content. The platform includes a Next.js web app and an API deployed on Cloudflare Workers.

## Project Structure

Monorepo with API and Web app plus shared packages:

```
skyhitz/
├── packages/
│   ├── api/                      # GraphQL API (Cloudflare Workers)
│   └── solito/                   # Web/Mobile apps and shared code
│       ├── apps/
│       │   ├── next/             # Web app (Next.js + OpenNext Cloudflare)
│       │   └── expo/             # Mobile app (React Native/Expo)
│       └── packages/
│           └── app/              # Shared components and functionality
```

## Technology Stack

### Backend (API)

- Cloudflare Workers (Wrangler)
- Apollo Server (GraphQL)
- Stellar/Soroban SDK (smart contracts)
- Algolia, Stripe, Postmark, JWT

### Frontend (Web/Mobile)

- Next.js 15 (React 19) for web
- OpenNext Cloudflare runtime (`@opennextjs/cloudflare`)
- React Native/Expo for mobile (optional)
- TailwindCSS

## Development

### Prerequisites

- Node.js and Yarn
- Cloudflare Wrangler CLI

### Install dependencies

```
yarn install
```

### Run locally

- API (Cloudflare Worker dev server):
```
yarn api:dev
```

- Web (Next.js):
```
cd packages/solito/apps/next && yarn dev
```

- Mobile (Expo):
```
cd packages/solito && yarn native
```

## Deployment

### Web (Cloudflare via OpenNext)

Wrangler config: `packages/solito/apps/next/wrangler.toml`

From repo root:
```
yarn cf:build                 # Build web for Cloudflare
yarn cf:preview               # Preview locally using CF
yarn cf:deploy                # Deploy (default env)
yarn cf:deploy:staging        # Deploy to staging
yarn cf:deploy:production     # Deploy to production
```

Environments configured in `wrangler.toml`:
- production: `skyhitz-app`
- staging: `skyhitz-app-staging`

### API (Cloudflare Workers)

Wrangler config: `packages/api/wrangler.toml`

From repo root:
```
yarn api:deploy
```

Or from `packages/api/`:
```
yarn deploy
```

## Environment Variables

Use Wrangler environment variables or `.dev.vars` for local dev.

### API
- `ALGOLIA_ADMIN_KEY`
- `ALGOLIA_APP_ID`
- `ISSUER_SEED`
- `JWT_SECRET`
- `POSTMARK_SERVER_TOKEN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STELLAR_NETWORK` (e.g. `testnet` | `mainnet`)

### Web (public)
- `NEXT_PUBLIC_EXPO_SKYHITZ_ENV` (e.g. `production` | `staging` | `test` | `local-prod`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

These can be set per-environment under `[env.<name>.vars]` in `packages/solito/apps/next/wrangler.toml`.

## Smart Contract (Soroban)

Located under `packages/api/contract/`.

Testnet:
```
yarn workspace @skyhitz/api testnet:contract:setup
yarn workspace @skyhitz/api testnet:contract:upgrade
```

Mainnet:
```
yarn workspace @skyhitz/api mainnet:contract:setup
yarn workspace @skyhitz/api mainnet:contract:upgrade
yarn workspace @skyhitz/api mainnet:contract:bindings
```

## Notes

- API uses Wrangler v4 with `nodejs_compat` enabled in `packages/api/wrangler.toml`.
- Web app is built and deployed with OpenNext for Cloudflare.
- Email provider is Postmark.

## License

Copyright © Skyhitz, Inc.
