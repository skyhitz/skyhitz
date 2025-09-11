---
id: overview
title: Architecture Overview
---

Skyhitz is a multi-package monorepo:

- `packages/api`: Cloudflare Worker GraphQL API + Soroban/Algolia/R2 clients
- `packages/solito`: Cross-platform app (Next.js web + Expo RN)
- `packages/api/contract`: Soroban Rust contract and TS client bindings
- `packages/docs`: This documentation site (Docusaurus)

Core services:

- GraphQL API: authentication, search, investing/mining, earnings
- Soroban contract: on-chain state for entries, tvl, escrow, shares, earnings
- Algolia: search indices (`entriesIndex`, `ratingReplicaIndex`, `sharesIndex`)
- Cloudflare R2: object storage for metadata and media (audio/video/images)

Key flows:

- Search: internal entries (Algolia) + external providers (Audius, Sound.xyz)
- Preview: resolve external audio URLs, play via unified player
- Mine: pin media/metadata to R2, compute partition, run Soroban ops, then index entry & sync shares to Algolia
- Invest: user invests, contract updates, Algolia tvl/apr/escrow and shares synced
- Claim: preview earnings read-only; only invoke claim when claimable > 0


