---
id: overview
title: Architecture Overview
---

Skyhitz is a decentralized music platform running on the Stellar blockchain with a post-exhaustion HITZ token model.

## Monorepo Structure

```
skyhitz/
├── packages/
│   ├── api/                  # Cloudflare Worker GraphQL API
│   │   ├── contract/         # Soroban Rust contract + TS bindings
│   │   └── src/              # API resolvers, treasury bot, etc.
│   ├── solito/               # Cross-platform app
│   │   ├── apps/next/        # Web app (Next.js)
│   │   ├── apps/expo/        # Mobile app (React Native)
│   │   └── packages/app/     # Shared components
│   └── docs/                 # This documentation (Docusaurus)
```

## Core Services

### Skyhitz Core Contract (Soroban)

The smart contract manages:
- **User Actions**: stream, like, download, mine, invest
- **Staking**: 1:1 stake model (fee = stake)
- **Reward Pools**: HITZ allocated per entry from treasury
- **Artist Equity**: Non-dilutable creator rewards
- **Entry Management**: create, merge, remove

### HITZ Token (SAC)

Stellar Asset Contract for the HITZ token:
- Max supply: 21M (fully issued)
- Core contract is admin
- No more minting (post-exhaustion)

### GraphQL API (Cloudflare Worker)

Handles all backend operations:
- Authentication (passwordless)
- Action recording (stream, like, mine, invest)
- Claim processing
- Algolia sync
- External search integration

### Algolia

Search indices:
- `entriesIndex`: Music entries with metadata
- `ratingReplicaIndex`: Sorted by engagement
- `usersIndex`: User profiles

### Cloudflare R2

Object storage:
- Audio files
- Cover images
- Metadata JSON

## Post-Exhaustion Model

The HITZ supply is fully issued (~20M of 21M). Key characteristics:

| Feature | Value |
|---------|-------|
| Minting | Disabled |
| Staking | 1:1 (fee = stake) |
| Fees | HITZ only |
| Distribution | 0.05% of treasury daily |

## Key Flows

### Stream/Like/Download (Non-Staking)

```
User → record_action(kind) → Fee to Treasury → Entry escrow++
```

- User pays HITZ fee
- Fee goes to Treasury
- Entry's escrow increases
- Higher escrow = more treasury distributions

### Mine/Invest (Staking)

```
User → record_action(kind) → Fee to Contract → Stake recorded
```

- User pays HITZ as stake
- Stake locked in contract
- User gains ownership %
- Can claim proportional rewards

### Treasury Distribution (Daily)

```
Treasury → 0.05% of balance → Proportional to escrow → Entry reward pools
```

- Treasury bot runs daily
- Calculates 0.05% of balance
- Distributes proportionally by escrow
- Entry reward pools grow

### Claiming

```
User → claim_rewards(entry) → Proportional to stake → HITZ to wallet
```

- Stakers claim from reward pool
- Proportional to ownership
- Artists claim separately (equity)

### Mining External Music

```
Search → Select → Fetch metadata → Pin to R2 → record_action(mine) → Index to Algolia
```

1. User searches external sources (Audius)
2. Selects track to mine
3. Backend fetches metadata and audio
4. Pins to R2 storage
5. Calls record_action with kind='mine'
6. Indexes to Algolia

## Security

### Wallet Separation

| Wallet | Purpose | Keys |
|--------|---------|------|
| Admin | Governance | Cold storage |
| Treasury | Distributions | Hot wallet |

### Contract Security

- No minting (supply exhausted)
- No oracle dependency (1:1 staking)
- Rate-limited distribution (0.05%/day)
- Entry limits (10,000 max)
- Verified transfers

## Related Documentation

- [Tokenomics & Rewards](../tokenomics/rewards)
- [User Action Flows](../tokenomics/flows)
- [Stellar & Soroban](../backend/stellar-soroban)
- [Treasury Bot](../operations/treasury-bot)
