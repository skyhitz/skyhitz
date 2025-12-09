# Skyhitz Token Contracts

## Overview

The Skyhitz platform uses two main smart contracts:
1. **HITZ Token Contract**: OpenZeppelin SEP-41 compatible fungible token with emission logic
2. **Skyhitz Core Contract**: Handles user actions, staking, and XLM fee management

## HITZ Token Contract

### Features

- ✅ **Max Supply Cap**: 21,000,000 HITZ (210,000,000,000,000 stroops with 7 decimals)
- ✅ **No Pre-mint**: Tokens are minted on-demand through rewards only
- ✅ **Bitcoin-style Halving**: Emission halves every 4 years (126,144,000 seconds)
- ✅ **SEP-41 Compatible**: Will appear on Stellar Expert as a proper asset
- ✅ **Ownable**: Admin controls for privileged operations
- ✅ **Mintable**: With automatic max supply enforcement
- ✅ **Upgradeable**: Contract can be upgraded by owner when needed

### Token Economics

- **Initial Unit Reward**: 0.3 HITZ (3,000,000 stroops)
- **Halving Interval**: 126,144,000 seconds (exactly 4 years)
- **Reward Formula**: `unit_reward = epoch0_reward / (2^epoch_index)`
- **Max Epochs**: 64 (after which reward becomes negligible)

### Key Functions (SAC-based HITZ)

```rust
// Initialize token
__constructor(owner, halving_start_ts, halving_interval_sec, epoch0_unit_reward)

// Core computes unit reward and mints via HITZ SAC (core is admin)
// Reward = unit_reward(epoch) × difficulty
// SAC mint is invoked by core; users must have trustline to receive liquid HITZ

// Get emission info
emission_info() -> (epoch, unit_reward, released, remaining)

// Admin mint (only owner, respects max supply)
mint(account, amount)

// Upgrade contract (only owner)
upgrade(new_wasm_hash)
```

## Skyhitz Core Contract

### Features

- Records user actions (stream, like, download, mine, invest)
- Manages HITZ token staking for invest/mine actions
- Handles XLM fee transfers to Treasury
- Allocates and distributes HITZ rewards to entry pools

### Action Types

| Action | Difficulty | Base Fee Multiplier | Adds to TVL | Auto-Stake |
|--------|-----------|-------------------|-------------|------------|
| stream | 1 | 1× | No (escrow) | No |
| like | 2 | 2× | No (escrow) | No |
| download | 3 | 3× | No (escrow) | No |
| mine | 10 | 10× | Yes | Yes |
| invest | Dynamic | Dynamic (min 0.3 XLM) | Yes | Yes |

### Base Fee

- Default: 0.01 XLM (100,000 stroops)
- Admin can update via `set_base_fee()`
- All action fees scale proportionally

### Key Functions

```rust
// Initialize contract
init(admin, treasury, hitz_token, xlm_token, base_fee)

// Record user action and mint rewards
record_action(caller, entry_id, kind, amount_xlm)

// Distribute rewards proportionally (Treasury bot)
distribute_rewards(caller, hitz_amount)

// Manually allocate to specific entry (Admin)
allocate_rewards(entry_id, hitz_amount)

// Claim rewards from entry pool
claim_rewards(entry_id, claimer) -> i128

// Calculate APR for entry
calculate_apr(entry_id) -> i128

// Artist Equity (Non-Dilutable)
set_artist_equity(entry_id, artist, equity_bps)  // Admin-only, sets artist's equity
claim_artist_equity(entry_id, artist) -> i128    // Artist claims their share
get_artist_equity(entry_id, artist) -> (equity_bps, claimed, claimable)
get_total_artist_equity(entry_id) -> u32         // Total artist equity in bps
```

### Artist Equity

Verified artists can receive non-dilutable equity on their entries:

- **Max equity per artist**: 99.9% (9990 basis points)
- **Max total equity**: 99.9% across all artists
- **Supports collaborations**: Multiple artists can have equity on the same entry
- **Non-dilutable**: Fan investments don't affect artist percentage

## Architecture

```
┌─────────────────────────────┐
│  HITZ Token Contract        │
│                             │
│  - Max supply: 21M HITZ     │
│  - Emission logic           │
│  - Halving schedule         │
│  - Mint with limits         │
│  - Upgradeable              │
└──────────────┬──────────────┘
               │
               │ mint_reward(to, difficulty)
               │
               ▼
┌─────────────────────────────┐
│  Skyhitz Core Contract      │
│                             │
│  - Record actions           │
│  - Manage stakes            │
│  - Allocate rewards         │
│  - Handle XLM fees          │
│  - Calculate APR            │
└─────────────────────────────┘
```

## Deployment

### 1. Build Contracts

```bash
cd packages/api/contract
cargo build --target wasm32-unknown-unknown --release
```

### 2. Deploy HITZ Token

```bash
# Deploy token contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/hitz_token.wasm \
  --source-account ADMIN_KEY \
  --network testnet

# Initialize with emission parameters
soroban contract invoke \
  --id HITZ_TOKEN_ID \
  --source-account ADMIN_KEY \
  --network testnet \
  -- __constructor \
  --owner ADMIN_ADDRESS \
  --halving-start-ts 1700000000 \
  --halving-interval-sec 126144000 \
  --epoch0-unit-reward 3000000
```

### 3. Deploy Skyhitz Core

```bash
# Deploy core contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/skyhitz.wasm \
  --source-account ADMIN_KEY \
  --network testnet

# Initialize
soroban contract invoke \
  --id SKYHITZ_CORE_ID \
  --source-account ADMIN_KEY \
  --network testnet \
  -- init \
  --admin ADMIN_ADDRESS \
  --treasury TREASURY_ADDRESS \
  --hitz-token HITZ_TOKEN_ID \
  --xlm-token XLM_TOKEN_ID \
  --stake-unit-hitz 50000000 \
  --base-fee 100000
```

### 4. Set Skyhitz Core as HITZ Token Owner

```bash
# Transfer ownership of HITZ token to Skyhitz Core contract
soroban contract invoke \
  --id HITZ_TOKEN_ID \
  --source-account ADMIN_KEY \
  --network testnet \
  -- transfer_ownership \
  --new-owner SKYHITZ_CORE_ID
```

## Upgrading the HITZ Token

When you need to upgrade the token contract:

```bash
# 1. Build new version
cargo build --target wasm32-unknown-unknown --release

# 2. Install new WASM (get hash)
soroban contract install \
  --wasm target/wasm32-unknown-unknown/release/hitz_token_v2.wasm \
  --source-account ADMIN_KEY \
  --network testnet

# 3. Upgrade via owner
soroban contract invoke \
  --id HITZ_TOKEN_ID \
  --source-account OWNER_KEY \
  --network testnet \
  -- upgrade \
  --new-wasm-hash WASM_HASH
```

## Testing

```bash
# Run all tests
cargo test

# Run specific test
cargo test test_name
```

## Security

- **Max Supply**: Enforced at token level, cannot be exceeded
- **Owner Controls**: Critical functions require owner authentication
- **Upgradeable**: Allows fixing bugs or adding features without redeployment
- **SEP-41 Compliance**: Standard token interface for ecosystem compatibility

## Support

For security issues or questions:
- Email: security@skyhitz.io
- Documentation: https://docs.skyhitz.io
