# Quick Reference: Skyhitz V2 Post-Exhaustion Model

## Overview

The HITZ supply is **fully issued** (~20M of 21M). The contract operates in **distribution-only mode**.

| Feature | Value |
|---------|-------|
| Supply | 21M max, ~20M issued |
| Minting | Disabled (supply exhausted) |
| Staking | 1:1 (fee = stake) |
| Distribution | 0.05% of treasury daily |

## Action Types

| Action | Symbol | Fee (HITZ) | Stakes? | Destination |
|--------|--------|------------|---------|-------------|
| Stream | `stream` | 0.1 | No | Treasury |
| Like | `like` | 0.2 | No | Treasury |
| Download | `download` | 0.3 | No | Treasury |
| Mine | `mine` | 1.0 | Yes | Contract |
| Invest | `invest` | 3+ | Yes | Contract |

## Key Functions

### Record Action
```rust
record_action(caller, entry_id, kind, amount)
// kind: "stream" | "like" | "download" | "mine" | "invest"
// amount: Only for invest (min 3 HITZ = 30,000,000 stroops)
```

### Distribution (Treasury-only)
```rust
distribute_rewards(caller, hitz_amount)
// caller must be Treasury address
// Distributes proportionally by escrow
```

### Claiming
```rust
claim_rewards(entry_id, claimer)        // Staker claims
claim_artist_equity(entry_id, artist)   // Artist claims
get_claimable_rewards(entry_id, user)   // Preview
```

### Staking
```rust
get_stake(entry_id, owner)              // User's stake
get_stake_total(entry_id)               // Entry's total
unstake(entry_id, caller, amount)       // Withdraw stake
```

### Artist Equity
```rust
set_artist_equity(entry_id, artist, equity_bps)  // Admin-only
get_artist_equity(entry_id, artist)              // (bps, claimed, claimable)
get_total_artist_equity(entry_id)                // Total bps
```

## Units

| Unit | Value |
|------|-------|
| 1 HITZ | 10,000,000 stroops |
| Base fee | 1,000,000 stroops (0.1 HITZ) |
| Min invest | 30,000,000 stroops (3 HITZ) |
| APR | Basis points (10000 = 100%) |
| Equity | Basis points (max 9990 = 99.9%) |

## Distribution Formula

```
entry_share = (entry.escrow / total_escrow) × distribution_amount
```

## Staking Formula

```
stake = fee (1:1 ratio)
ownership = user_stake / total_stake
```

## Claim Formula

```
staker_pool = reward_pool × (1 - artist_equity)
claimable = (stake / total) × staker_pool - claimed
```

## Treasury Bot Flow

```typescript
// 1. Check balance
const balance = await contract.getHitzBalance(treasury);

// 2. Calculate 0.05% 
const amount = balance * 5n / 10000n;

// 3. Distribute
await contract.distributeRewardsBatch(treasurySecret, amount);
```

## Security

| Risk | Protection |
|------|------------|
| Minting | Disabled (supply exhausted) |
| Oracle | Not used (1:1 staking) |
| Drain | Rate-limited (0.05%/day) |
| DOS | Entry limit (10,000) |

## Wallet Separation

| Wallet | Purpose | Keys |
|--------|---------|------|
| Admin | Governance | Cold storage |
| Treasury | Distributions | Hot wallet |

## Files

| File | Purpose |
|------|---------|
| `README.md` | Main documentation |
| `TOKENOMICS_AND_FLOWS.md` | Economic flows |
| `TREASURY_BOT_FLOW.md` | Bot documentation |
| `UI_INTEGRATION_GUIDE.md` | Frontend integration |
| `src/lib.rs` | Contract source |
| `src/tests.rs` | Test coverage |

## Build & Test

```bash
# Build
cargo build --target wasm32-unknown-unknown --release

# Test
cargo test
```

## Status

✅ Post-exhaustion mode implemented  
✅ 1:1 staking (no oracle)  
✅ 0.05% daily distribution  
✅ Artist equity  
✅ Unstaking  
✅ 3-phase batch distribution  
✅ Tests passing
