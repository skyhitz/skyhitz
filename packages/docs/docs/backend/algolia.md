---
id: algolia
title: Algolia Indices
---

Indices:

- `entriesIndex`: core entry documents
- `ratingReplicaIndex`: replica sorted by APR desc (used to compute top APR)
- `sharesIndex`: per-user shares per entry

Update flows:

- After invest/mine, fetch on-chain entry and:
  - `partialUpdateEntry` with tvl, apr, escrow
  - `updateShares(entryId, userId, userShares)`

- After sellShares:
  - Update sold entry’s `tvl`, `escrow`, `apr`
  - Update seller’s shares document in `sharesIndex`
  - Refresh APR/escrow for entries impacted by commission distribution (current implementation refreshes all entries; can be narrowed by parsing on-chain events)

- Admin helpers for merges/removals:
  - `getSharesByEntry(entryId)` / `deleteSharesByEntry(entryId)`
  - `bulkUpdateShares(updates)` to sync on-chain shares → Algolia documents


