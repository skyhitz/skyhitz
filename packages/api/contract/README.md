# Skyhitz Core Contract V2

## Overview

The Skyhitz platform runs on a single Soroban smart contract that operates in **post-exhaustion distribution mode**. The HITZ token supply is fully issued (~20M of 21M max), so the contract no longer mints tokens. Instead, it manages user actions, staking, and reward distribution from treasury.

### Post-Exhaustion Model

Following the supply exhaustion, the V2 contract operates with:
- **No minting** - supply is fully issued
- **1:1 staking** - fee paid = stake amount (no oracle dependency)
- **HITZ-only economy** - all fees and rewards in HITZ tokens
- **Treasury distribution** - 0.05% of treasury distributed daily (12-year curve)

## HITZ Token (SAC-based)

### Token Info
- **Asset**: HITZ (Stellar Asset Contract)
- **Max Supply**: 21,000,000 HITZ (210,000,000,000,000 stroops with 7 decimals)
- **Current Supply**: ~20M HITZ (fully issued)
- **Status**: Distribution-only mode (no new minting)

### Why SAC?
The HITZ token is now managed as a Stellar Asset Contract (SAC), with the Core contract as admin for minting capabilities (legacy). Since supply is exhausted, minting is effectively disabled.

## Skyhitz Core Contract

### Features

- ✅ **Records user actions** (stream, like, download, mine, invest)
- ✅ **Manages HITZ staking** for mine/invest actions (1:1 ratio)
- ✅ **Handles fee collection** to treasury (non-staking actions)
- ✅ **Distributes rewards** from treasury to entry pools
- ✅ **Artist equity** (non-dilutable creator rewards)
- ✅ **APR calculation** for stakers
- ✅ **Entry management** (create, merge, remove)
- ✅ **Upgradeable** via admin

### Action Types

| Action | Difficulty | Fee (HITZ) | Stake? | Destination |
|--------|-----------|------------|--------|-------------|
| stream | 1 | 0.1 HITZ | No | Treasury (escrow) |
| like | 2 | 0.2 HITZ | No | Treasury (escrow) |
| download | 3 | 0.3 HITZ | No | Treasury (escrow) |
| mine | 10 | 1.0 HITZ | Yes (1:1) | Contract (stake) |
| invest | Dynamic | 3+ HITZ | Yes (1:1) | Contract (stake) |

### Fee & Stake Model

**Non-staking actions** (stream, like, download):
- Fee transferred to Treasury wallet
- Increases entry's `escrow` value
- Used for proportional reward distribution

**Staking actions** (mine, invest):
- Fee transferred to Contract as stake (1:1 ratio)
- Increases entry's `tvl` value
- Stake = Fee (no oracle dependency)
- User earns proportional rewards from entry pool

### Base Fee

- Default: 0.1 HITZ (1,000,000 stroops)
- Admin can update via `set_base_fee()`
- All action fees scale proportionally: `fee = base_fee × difficulty`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HITZ Token (SAC)                          │
│                                                              │
│  - Max supply: 21M HITZ (fully issued)                      │
│  - Core contract is admin (legacy minting disabled)         │
│  - Standard SEP-41 token operations                         │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ transfer() for fees/stakes/claims
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Skyhitz Core Contract                     │
│                                                              │
│  POST-EXHAUSTION MODE:                                       │
│  - No minting (supply exhausted)                            │
│  - 1:1 staking (fee = stake)                                │
│  - Treasury → entries (0.05% daily distribution)            │
│                                                              │
│  FUNCTIONS:                                                  │
│  - record_action() - user actions                           │
│  - distribute_rewards() - treasury distribution             │
│  - claim_rewards() - staker claims                          │
│  - claim_artist_equity() - artist claims                    │
│  - unstake() - withdraw stake                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Functions

### User Actions

```rust
// Record a user action (main entrypoint)
record_action(
    caller: Address,     // User performing action
    entry_id: String,    // Target entry
    kind: Symbol,        // stream, like, download, mine, invest
    amount: Option<i128> // For invest: HITZ amount (min 3 HITZ)
)
```

### Reward Distribution

```rust
// Treasury bot distributes rewards (Treasury-only)
distribute_rewards(caller: Address, hitz_amount: i128)

// Admin allocates to specific entry (Admin-only)
allocate_rewards(entry_id: String, hitz_amount: i128)

// Batch allocate (Admin-only)
batch_allocate_rewards(entry_ids: Vec<String>, amounts: Vec<i128>)
```

### Claiming

```rust
// Staker claims proportional rewards
claim_rewards(entry_id: String, claimer: Address) -> i128

// Artist claims equity rewards
claim_artist_equity(entry_id: String, artist: Address) -> i128

// Preview claimable amount (read-only)
get_claimable_rewards(entry_id: String, user: Address) -> i128
```

### Staking

```rust
// Get user's stake in entry
get_stake(entry_id: String, owner: Address) -> i128

// Get total stake for entry
get_stake_total(entry_id: String) -> i128

// Withdraw stake
unstake(entry_id: String, caller: Address, amount: i128) -> i128
```

### Artist Equity

```rust
// Set non-dilutable artist equity (Admin-only)
set_artist_equity(entry_id: String, artist: Address, equity_bps: u32)

// Get artist equity info
get_artist_equity(entry_id: String, artist: Address) -> (u32, i128, i128)
// Returns: (equity_bps, claimed, claimable)

// Get total artist equity for entry
get_total_artist_equity(entry_id: String) -> u32
```

### Entry Management

```rust
// Create new entry (Admin-only)
create_entry(entry_id: String)

// Merge entries (Admin-only)
merge_entries(from_id: String, into_id: String, stakers: Vec<Address>)

// Remove entry (Admin-only)
remove_entry(entry_id: String, stakers: Vec<Address>)
```

### Administrative

```rust
// Initialize contract (one-time)
init(admin: Address, treasury: Address, hitz_token: Address, base_fee: i128)

// Update base fee
set_base_fee(new_base_fee: i128)

// Upgrade contract
upgrade_core(new_wasm_hash: BytesN<32>)

// Get contract version
version() -> u32
```

## Treasury Distribution

### Bitcoin-Like Emission Curve

The treasury distributes **0.05% of balance daily**, creating a 12+ year emission curve:

| Year | Treasury Distributed | Daily Amount (est.) |
|------|---------------------|---------------------|
| 1 | ~17% | Highest |
| 4 | ~52% | Declining |
| 8 | ~77% | Lower |
| 12 | ~88% | Minimal |

### Distribution Formula

```
For each entry with escrow > 0:
  entry_share = (entry.escrow / total_escrow) × hitz_amount
  entry.reward_pool += entry_share
```

Entries with more engagement (streams, likes, downloads) receive proportionally more rewards.

## Security Features

### Post-Exhaustion Protections

| Attack Vector | V1 (Vulnerable) | V2 (Protected) |
|--------------|-----------------|----------------|
| Oracle manipulation | Vulnerable | Eliminated (no oracle-dependent calculations) |
| Minting overflow | Possible | Eliminated (no minting) |
| Reward inflation | Critical | Eliminated (fixed supply) |
| Stake manipulation | Possible | Eliminated (1:1 fee-to-stake) |
| Liquidity drain | Possible | Mitigated (0.05% daily cap) |

### Additional Security

- **Safe transfers**: All token transfers verified with balance checks
- **Entry limits**: Maximum 10,000 entries to prevent DOS
- **Distribution limits**: Maximum 1,000 entries per single distribution
- **Atomic index operations**: Prevents index corruption on merge/remove
- **Fair dust distribution**: Rounding dust stays in contract

## Building

```bash
cd packages/api/contract
cargo build --target wasm32-unknown-unknown --release
```

Output: `target/wasm32-unknown-unknown/release/skyhitz.wasm`

## Testing

```bash
# Run all tests (requires Rust 1.84.0+)
cargo test

# Run specific test
cargo test test_name
```

## Deployment

### Prerequisites

1. Core contract WASM built
2. HITZ token SAC deployed
3. Core contract set as HITZ token admin
4. Treasury wallet funded with HITZ

### Deploy Core Contract

```bash
# Deploy WASM
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Initialize
soroban contract invoke \
  --id CORE_CONTRACT_ID \
  --source-account ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- init \
  --admin ADMIN_ADDRESS \
  --treasury TREASURY_ADDRESS \
  --hitz-token HITZ_TOKEN_ID \
  --base-fee 1000000
```

### Upgrade Core Contract

```bash
# Install new WASM
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015"

# Upgrade
soroban contract invoke \
  --id CORE_CONTRACT_ID \
  --source-account ADMIN_KEY \
  --rpc-url https://soroban-rpc.mainnet.stellar.gateway.fm:443 \
  --network-passphrase "Public Global Stellar Network ; September 2015" \
  -- upgrade_core \
  --new-wasm-hash NEW_WASM_HASH
```

## Support

For security issues or questions:
- Email: security@skyhitz.io
- Documentation: https://docs.skyhitz.io
