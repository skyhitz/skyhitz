---
id: graphql
title: GraphQL API
---

The GraphQL API runs on Cloudflare Workers. Key areas:

- Search: internal (`entriesIndex`, `usersIndex`) and `searchExternalMusic`
- Playback helpers: `externalAudioUrl` resolving for Audius/Sound.xyz
- Mining: `mineExternalEntry` orchestrates R2 pinning, Soroban ops, Algolia index
- Investing: `investEntry` invokes contract and syncs Algolia fields
- Earnings: `claimableEarningsPreview` (read-only) and `claimEarnings`
 - Share lifecycle: `sellShares(id, amount)` invokes contract `sell_shares`, then updates Algolia for the sold entry and refreshes APR/escrow for impacted entries
 - Admin tools: `mergeEntries(fromId, toId)` merges two entries on-chain and updates Algolia; `removeEntry(id)` removes an entry and its R2 assets (admin‑only)

Mining highlights:

- Balance check uses available credits (excludes reserve)
- Media pinned as-is to R2; content-type detection ensures streaming
- Metadata pinned to R2; CID becomes Algolia id
- Partition: escrow = min(1 XLM * topAPR%, 0.3); remaining split 50/50 (issuer payment, user equity invest)
- Strict ordering: only index in Algolia after Soroban ops succeed


