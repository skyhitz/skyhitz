---
id: apr-math
title: APR Math & Mining Partition
---

Units:

- 1 XLM = 10,000,000 stroops
- Contract values use i128 stroops

Top APR:

- Fetched from Algolia `ratingReplicaIndex` (desc by APR)
- Escrow allocation (does not exceed 0.3 XLM) = `min(1 XLM * topAPR% / 100, 0.3 XLM)`

Mining partition on 1 XLM:

1. Escrow invest: `escrow = min(1 * apr% / 100, 0.3)`
2. Remaining: `rem = 1 - escrow`
3. Issuer payment: `pay = rem / 2`
4. User equity invest: `equity = rem / 2`

Both escrow and equity invests are converted to stroops (× 1e7) before calling `invest`.

Example:

- topAPR = 25%
- escrow = min(1 * 0.25, 0.3) = 0.25
- rem = 0.75
- pay = 0.375
- equity = 0.375
- invest calls receive 2,500,000 and 3,750,000 stroops respectively.
