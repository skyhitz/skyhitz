---
id: stellar-soroban
title: Stellar & Soroban Contracts
---

This page documents the on-chain Soroban contract that powers Skyhitz: the Skyhitz Core contract operating in post-exhaustion distribution mode.

## Architecture Overview

Skyhitz uses a single Soroban smart contract with the HITZ token as a Stellar Asset Contract (SAC).

### Components

**HITZ Token (SAC)**
- Stellar Asset Contract for the HITZ token
- Max supply: 21,000,000 HITZ (fully issued)
- Core contract is admin (for legacy minting capability)
- Standard SEP-41 token operations

**Skyhitz Core Contract**
- Handles user actions, staking, and reward distribution
- Post-exhaustion mode: no minting, distribution only
- 1:1 staking model (fee = stake)
- Treasury distribution at 0.05% daily rate

---

## Post-Exhaustion Model

The HITZ supply is fully issued (~20M of 21M). The contract operates in distribution-only mode:

| Feature | Before | After |
|---------|--------|-------|
| Token source | Minted on action | Treasury distribution |
| Oracle dependency | Yes (staking calc) | No (1:1 staking) |
| Fee currency | XLM | HITZ |
| Supply risk | Inflation | Fixed |

### Key Changes

1. **No minting**: `mint_reward()` removed, supply exhausted
2. **1:1 staking**: `stake = fee` (no oracle calculation)
3. **HITZ fees**: All fees in HITZ, not XLM
4. **Rate-limited distribution**: 0.05% of treasury daily

---

## Skyhitz Core Contract

### Storage

**Instance Storage** (Config):
```rust
DataKey::Admin         // Address: admin for privileged ops
DataKey::Treasury      // Address: receives non-staking fees
DataKey::HitzToken     // Address: HITZ token contract
DataKey::BaseFee       // i128: base fee (default 0.1 HITZ)
DataKey::OraclePrice   // i128: informational only (not used)
```

**Persistent Storage** (Entry Data):
```rust
DataKey::Entry(id)           // Entry struct
DataKey::Stake((id, user))   // User's stake in entry
DataKey::StakeTotal(id)      // Total stake for entry
DataKey::RewardPool(id)      // HITZ rewards allocated
DataKey::Claimed((id, user)) // HITZ claimed by user
DataKey::EntryAt(i)          // Index → entry_id
DataKey::EntryCount          // Total entries
DataKey::TotalMinted         // Historical minting (legacy)

// Artist equity
DataKey::ArtistEquity((id, artist))  // ArtistEquityClaim
DataKey::ArtistEquityTotal(id)       // Total equity bps
```

### Entry Struct

```rust
struct Entry {
    tvl_xlm: i128,      // Total Value Locked (stake value)
    escrow_xlm: i128,   // Accumulated fees (distribution metric)
    created_at: u64,    // Timestamp
}
```

### Action Types

```rust
ActionKind::Stream   // difficulty = 1,  fee = 0.1 HITZ
ActionKind::Like     // difficulty = 2,  fee = 0.2 HITZ
ActionKind::Download // difficulty = 3,  fee = 0.3 HITZ
ActionKind::Mine     // difficulty = 10, fee = 1.0 HITZ, stakes
ActionKind::Invest   // dynamic (min 3 HITZ), stakes
```

---

## Public Methods

### User Actions

```rust
/// Record a user action
pub fn record_action(
    e: Env,
    caller: Address,      // User performing action
    entry_id: String,     // Target entry
    kind: Symbol,         // stream, like, download, mine, invest
    amount: Option<i128>  // For invest: amount in stroops
)
```

**Flow for non-staking actions** (stream/like/download):
1. Calculate fee: `base_fee × difficulty`
2. Transfer fee from user to Treasury
3. Update `entry.escrow += fee`

**Flow for staking actions** (mine/invest):
1. Calculate fee (for invest: use amount, min 3 HITZ)
2. Transfer fee from user to Contract (becomes stake)
3. Update `stakes[user][entry] += fee`
4. Update `entry.total_stake += fee`
5. Update `entry.tvl += fee`

### Reward Distribution

```rust
/// Distribute HITZ to entry pools (Treasury-only)
pub fn distribute_rewards(
    e: Env,
    caller: Address,   // Must be Treasury
    hitz_amount: i128  // Amount to distribute
)
```

**Flow**:
1. Verify caller is Treasury
2. Transfer HITZ from Treasury to Contract
3. Calculate `total_escrow = sum(all entry.escrow)`
4. For each entry with escrow > 0:
   - `share = (entry.escrow / total_escrow) × hitz_amount`
   - `entry.reward_pool += share`

```rust
/// Allocate to specific entry (Admin-only)
pub fn allocate_rewards(
    e: Env,
    entry_id: String,
    hitz_amount: i128
)

/// Batch allocate (Admin-only)
pub fn batch_allocate_rewards(
    e: Env,
    entry_ids: Vec<String>,
    amounts: Vec<i128>
)
```

### Batched Distribution (3-Phase)

For large numbers of entries, use batched distribution:

```rust
/// Phase 1: Calculate total escrow in batches
pub fn calculate_total_escrow_batch(
    e: Env,
    caller: Address,   // Treasury
    start_index: u32,
    batch_size: u32    // max 40
) -> (u32, i128)       // (next_index, running_total)

/// Phase 2: Initialize with HITZ transfer
pub fn initialize_distribution(
    e: Env,
    caller: Address,   // Treasury
    hitz_amount: i128
)

/// Phase 3: Distribute in batches
pub fn distribute_rewards_batch(
    e: Env,
    caller: Address,   // Treasury
    start_index: u32,
    batch_size: u32    // max 15
) -> u32               // next_index
```

### Claiming

```rust
/// Claim staker rewards
pub fn claim_rewards(
    e: Env,
    entry_id: String,
    claimer: Address
) -> i128  // Amount claimed

/// Get claimable amount (read-only)
pub fn get_claimable_rewards(
    e: Env,
    entry_id: String,
    user: Address
) -> i128
```

**Formula**:
```
staker_pool = reward_pool × (10000 - total_artist_equity_bps) / 10000
claimable = (user_stake / total_stake) × staker_pool - already_claimed
```

### Staking

```rust
/// Get user's stake
pub fn get_stake(e: Env, entry_id: String, owner: Address) -> i128

/// Get total stake for entry
pub fn get_stake_total(e: Env, entry_id: String) -> i128

/// Unstake (withdraw stake)
pub fn unstake(
    e: Env,
    entry_id: String,
    caller: Address,
    amount: i128
) -> i128  // Amount unstaked
```

### Artist Equity

```rust
/// Set artist equity (Admin-only)
pub fn set_artist_equity(
    e: Env,
    entry_id: String,
    artist: Address,
    equity_bps: u32  // 1-9990 (0.01% - 99.9%)
)

/// Claim artist equity rewards
pub fn claim_artist_equity(
    e: Env,
    entry_id: String,
    artist: Address
) -> i128

/// Get artist equity info
pub fn get_artist_equity(
    e: Env,
    entry_id: String,
    artist: Address
) -> (u32, i128, i128)  // (equity_bps, claimed, claimable)

/// Get total artist equity for entry
pub fn get_total_artist_equity(
    e: Env,
    entry_id: String
) -> u32  // Total bps (0-9990)
```

### Entry Management

```rust
/// Create new entry (Admin-only)
pub fn create_entry(e: Env, entry_id: String)

/// Get entry data
pub fn get_entry(e: Env, entry_id: String) -> Option<Entry>

/// List entries (paginated)
pub fn list_entries(e: Env, start: u32, limit: u32) -> Vec<String>

/// Get entry stats
pub fn get_entry_stats(e: Env, entry_id: String) 
    -> (i128, i128, i128, i128, i128)
    // (tvl, escrow, total_stake, reward_pool, apr_bps)

/// Calculate APR
pub fn calculate_apr(e: Env, entry_id: String) -> i128  // basis points

/// Get reward pool size
pub fn get_reward_pool(e: Env, entry_id: String) -> i128

/// Merge entries (Admin-only)
pub fn merge_entries(
    e: Env,
    from_id: String,
    into_id: String,
    stakers: Vec<Address>  // List of stakers to migrate
)

/// Remove entry (Admin-only)
pub fn remove_entry(
    e: Env,
    entry_id: String,
    stakers: Vec<Address>  // Stakes returned to these users
)
```

### Administrative

```rust
/// Initialize contract (one-time)
pub fn init(
    e: Env,
    admin: Address,
    treasury: Address,
    hitz_token: Address,
    base_fee: i128  // e.g., 1,000,000 = 0.1 HITZ
)

/// Update base fee
pub fn set_base_fee(e: Env, new_base_fee: i128)

/// Upgrade contract
pub fn upgrade_core(e: Env, new_wasm_hash: BytesN<32>)

/// Get contract version
pub fn version() -> u32

/// Get base fee
pub fn get_base_fee(e: Env) -> i128

/// Get total minted (legacy, historical)
pub fn get_total_supply(e: Env) -> i128

/// Get entry count
pub fn entry_count(e: Env) -> u32
```

---

## Units & Precision

| Asset | Decimals | Stroops per Unit |
|-------|----------|------------------|
| **HITZ** | 7 | 10,000,000 |

**Examples**:
- 1 HITZ = 10,000,000 stroops
- 0.1 HITZ = 1,000,000 stroops (default base fee)
- 3 HITZ = 30,000,000 stroops (minimum invest)

**APR**: Returned in basis points (100 = 1%, 10000 = 100%)

---

## Security & Authorization

### Authorization Matrix

| Function | Authorization |
|----------|--------------|
| `record_action` | Caller must sign |
| `claim_rewards` | Claimer must sign |
| `claim_artist_equity` | Artist must sign |
| `unstake` | Caller must sign |
| `distribute_rewards` | Only Treasury |
| `allocate_rewards` | Only Admin |
| `set_artist_equity` | Only Admin |
| `create_entry` | Only Admin |
| `merge_entries` | Only Admin |
| `remove_entry` | Only Admin |
| `set_base_fee` | Only Admin |
| `upgrade_core` | Only Admin |

### Wallet Separation

| Wallet | Purpose | Risk Level |
|--------|---------|------------|
| **Admin** | Governance, upgrades | Low (cold storage) |
| **Treasury** | Daily distributions | Low (rate-limited) |
| **Users** | Actions, claims | Per-user |

---

## Security Features

### Post-Exhaustion Protections

| Attack Vector | Protection |
|--------------|------------|
| Oracle manipulation | Eliminated (1:1 staking) |
| Minting overflow | Eliminated (no minting) |
| Reward inflation | Eliminated (fixed supply) |
| Stake manipulation | Eliminated (fee = stake) |
| Liquidity drain | Rate-limited (0.05% daily) |

### Additional Security

- **Safe transfers**: All transfers verified with balance checks
- **Entry limits**: Maximum 10,000 entries
- **Distribution limits**: Maximum 1,000 entries per distribution
- **Fair dust**: Rounding dust stays in contract
- **Atomic operations**: Index operations are atomic

---

## APR Calculation

```rust
pub fn calculate_apr(e: Env, entry_id: String) -> i128 {
    let entry = get_entry(&e, &entry_id);
    let total_stake = get_stake_total(&e, entry_id);
    let reward_pool = get_reward_pool(&e, entry_id);
    
    if total_stake == 0 { return 0; }
    
    let days_elapsed = (now - entry.created_at) / 86400;
    if days_elapsed == 0 { return 0; }
    
    // (pool / stake / days) × 365 × 10000
    let daily_rate = (reward_pool * 10000) / total_stake;
    let annual_rate = (daily_rate * 365) / days_elapsed;
    
    annual_rate.min(10_000_000) // Cap at 100,000%
}
```

---

## Contract Addresses

### Mainnet

```
Core Contract: [See deployment docs]
HITZ Token: [Stellar Asset Contract]
Treasury: [See deployment docs]
```

---

## Development

### Building

```bash
cd packages/api/contract
cargo build --target wasm32-unknown-unknown --release
```

### Testing

```bash
cargo test
```

### Deploying

See [Deployment Procedures](../operations/deploy) for detailed instructions.

---

## Further Reading

- **Token Economics**: See [Rewards Overview](../tokenomics/rewards)
- **User Flows**: See [User Action Flows](../tokenomics/flows)
- **APR Math**: See [APR Calculation](../tokenomics/apr-math)
- **Treasury Bot**: See [Treasury Bot](../operations/treasury-bot)
- **Contract Source**: `packages/api/contract/src/lib.rs`
