---
id: flows
title: Flows (Mine, Invest, Claim, Remove)
---

Mine external entry:

1. Resolve audio URL; pin audio and image to R2
2. Build metadata JSON; pin to R2 → `metaCid` (entry id)
3. Compute partition using top APR
4. Contract `invest(user, metaCid, escrow_stroops)`
5. Payment `userPay(ISSUER_ID, pay)` in lumens
6. Contract `invest(user, metaCid, equity_stroops)`
7. Index to Algolia; sync shares and tvl/apr/escrow

Invest on existing entry:

1. Contract `invest(user, id, amount_stroops)`
2. Fetch on-chain; update Algolia tvl/apr/escrow; update shares

Claim earnings:

- Preview with read-only query; only invoke contract if `claimable > 0`

Remove entry:

- Remove from contract (admin)
- Delete Algolia record
- Delete R2 prefixes for metadata and content hashes (image/audio/video)
