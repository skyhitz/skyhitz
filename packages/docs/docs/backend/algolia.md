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


