---
id: stellar-soroban
title: Stellar & Soroban
---

This page documents the on-chain Soroban contract that powers Skyhitz: storage layout, public methods, units, thresholds, and the reward math (APR and earnings). It also clarifies when user actions grant equity shares vs. when they are micro‑spends that only boost escrow/APR.

## Storage & Types

Contract state per entry:

- `id: string`
- `tvl: i128` (stroops)
- `escrow: i128` (stroops)
- `apr: i128` (percent integer)
- `shares: Map<address, i128>` (stroops)
- `withdrawn_earnings: Map<address, i128>`
- `share_since: Map<address, i128>` earliest timestamp a holder acquired shares

Global keys (`DataKey`):

- `Index`: Vector of all entry ids
- `Entries(id)`: The `Entry` for a given id
- `Network`: "testnet" | "public" (affects native token address)
- `Admin`: Address authorized to perform administration calls

Precision constants:

- Lumens to stroops: 1 XLM = 10,000,000 stroops
- Internal proportional math scale: `SCALE = 1_000_000` (6 decimals)

## Key calls:

- `invest(user, id, amount i128)`: amount in stroops (1 XLM = 10,000,000)
- `claim_earnings(user, id) -> i128`: returns claimed amount (stroops)
- `sell_shares(user, id, amount) -> i128`: returns payout after commission

Administration and helpers:

- `set_entry(entry)`: Admin only. Upserts an entry and appends to index
- `remove_entry(id)`: Admin only. Removes entry and prunes index
- `get_entry(id) -> Entry`: Read the current on-chain entry
- `merge_entries(from_id, to_id)`: Admin only. Merge source into destination
- `clean_empty_entries() -> u32`: Admin only. Best-effort legacy cleanup
- `clean_empty_entries_batch(limit) -> u32`: Admin only. Batched cleanup
- `clean_empty_entries_page(start, limit) -> u32`: Admin only. Paged cleanup
- `version() -> u32`: Contract version marker
- `init(admin, network, ids[])`: One-time initializer (admin/network/index)
- `upgrade(new_wasm_hash)`: Admin only. Code upgrade
- `get_xlm_address()`: Resolve native token address for current network

## Partition on mining (off-chain logic then on-chain calls):

- Escrow: `min(1 XLM * topAPR%, 0.3 XLM)`
- Remaining: split 50/50 — issuer payment (payment op), user equity invest (contract)

## Notes:
---

## Public Methods – Detailed

### `set_entry(entry: Entry)`
- Auth: Admin
- Effect: Persists/overwrites the entry by id, appends id to `Index`
- Use: Bootstrapping entries or administrative correction

### `remove_entry(id: String)`
- Auth: Admin
- Effect: Deletes `Entries(id)` and rebuilds `Index` without it
- Use: Hard removal when an entry is de-listed. Pairs with off-chain R2/Algolia cleanup

### `get_entry(id: String) -> Entry`
- Read-only state accessor. Panics if not found
- Returned fields are integers (`i128`) in stroops or percent for `apr`

### `version() -> u32`
- Bumped when meaningful changes occur; helpful for client compatibility

### `init(admin: Address, network: String, ids: Vec<String>)`
- Auth: First call only (guards against re-init)
- Effect: Sets admin/network; optionally seeds new zeroed entries for provided ids and adds them to `Index`

### `upgrade(new_wasm_hash: BytesN<32>)`
- Auth: Admin
- Effect: Hot‑swap the contract code to the provided WASM hash

### `invest(user: Address, id: String, amount: i128)`
- Units: `amount` is in stroops
- Threshold: `download_amount = 3_000_000` stroops (0.3 XLM)
- Flow:
  1) `user.require_auth()`
  2) Load or lazily create `Entry` for `id`
  3) If `amount > 3_000_000`, user receives equity shares and `tvl += amount`
     - Also sets/keeps `share_since[user]` to earliest known timestamp
  4) Always `escrow += amount`
  5) Recompute `apr` with `get_apr(entry)`
  6) Persist and call `transfer(user -> contract, amount)` using the native token client

Implications:

- Equity vs Micro‑spend: The comparison is strictly `>` (greater than) the 0.3 XLM threshold.
  - If `amount > 0.3 XLM`: equity shares are credited (user ownership increases) and TVL increases
  - If `amount <= 0.3 XLM`: NO shares are credited; only escrow increases

- Micro‑spend actions in Skyhitz (stream end, like, download) are configured at or below 0.3 XLM, so they do not grant shares but DO increase escrow. Because APR is a function of `(escrow - tvl) / tvl`, these micro‑spends can raise APR, benefiting equity holders.

### `claim_earnings(user: Address, id: String) -> i128`
- Auth: `user`
- Definitions:
  - Earnings pool: `max(escrow - tvl, 0)`
  - User fraction: `user_shares / tvl` (computed with 6‑dec scale)
  - Claimable: `user_fraction * earnings_pool - withdrawn_earnings[user]`
- Flow:
  1) Verify user has non‑zero shares
  2) Compute earnings pool and scaled fraction
  3) Subtract already withdrawn amount, clamp at 0
  4) Update `withdrawn_earnings[user] += claimable`
  5) Reduce `escrow -= claimable`
  6) Recompute `apr`
  7) `transfer(contract -> user, claimable)`
  8) Return `claimable`

### `sell_shares(user: Address, id: String, amount: i128) -> i128`
- Auth: `user`
- Commission tiers by holding duration (based on `share_since[user]`):
  - < 6 months: 10%
  - 6–12 months: 7%
  - 1–3 years: 5%
  - > 3 years: 0%
- Flow:
  1) Verify `shares[user] >= amount`
  2) Compute commission and payout; reduce `shares[user]` and `tvl -= amount`
  3) Keep this entry’s `escrow` unchanged; recompute its APR
  4) Distribute commission proportionally to all other entries with `tvl > 0` by their tvl; recompute recipients’ APR
  5) `transfer(contract -> user, payout)`
  6) Return `payout`

Notes:
- Commission distribution increases other entries’ `escrow`, benefiting holders system‑wide.
- The sold entry’s `escrow` remains intact; only its tvl and user shares drop.

---

## APR Calculation

APR is computed in‑contract as a simple percent derived from excess escrow:

```text
if tvl == 0 or escrow <= tvl:
  apr = 0
else:
  apr = ((escrow - tvl) * 100) / tvl
```

- Internally the contract uses `SCALE = 1_000_000` to avoid precision loss when dividing, but the result is effectively an integer percent.
- Off‑chain we surface this APR in Algolia and use `ratingReplicaIndex` to determine the highest APR for the mining partition.

---

## When do users get shares?

- Equity (shares) is granted only when a single `invest` call uses `amount > 0.3 XLM`.
- Micro‑spends (≤ 0.3 XLM):
  - Stream completion spend
  - Like spend
  - Download spend
  - These increase `escrow` but not `shares` or `tvl`.

### Mining nuances

Mining an external track makes two `invest` calls:

1) Escrow invest (capped by `min(1 XLM * topAPR%/100, 0.3 XLM)`): may or may not exceed the threshold. It's typically ≤ 0.3 XLM and thus does not credit shares.
2) Equity invest with half of the remaining amount: this is typically > 0.3 XLM and credits shares to the miner.

Between those, a separate Stellar payment sends the other half to the issuer (off‑chain payment, not a contract call). Only the two `invest` calls interact with the contract state.

- Always convert lumens to stroops (1e7) when calling contract
- Read-only previews avoid unnecessary invocations


