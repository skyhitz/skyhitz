---
id: stellar-soroban
title: Stellar & Soroban Contracts
---

This page documents the on-chain Soroban contracts that power Skyhitz: the HITZ Token contract and the Skyhitz Core contract. It covers storage layout, public methods, units, and the interaction between the two contracts.

## Dual-Contract Architecture

Skyhitz uses two separate but interconnected Soroban smart contracts:

### 1. HITZ Token Contract

**Purpose**: SEP-41 compatible fungible token with controlled emission

**Features**:
- Max supply: 21,000,000 HITZ
- No pre-mint (all tokens released through rewards)
- Bitcoin-style halving every 4 years
- 7 decimals precision (1 HITZ = 10,000,000 stroops)
- Ownable, Mintable, Upgradeable

### 2. Skyhitz Core Contract

**Purpose**: Handles user actions, staking, and XLM fee management

**Features**:
- Records all user actions (stream, like, download, mine, invest)
- Manages HITZ token staking for equity actions
- Collects XLM fees to Treasury
- Distributes HITZ rewards to entry pools

---

## HITZ Token Contract

### Storage

**Token Info**:
- `name`: "Hitz"
- `symbol`: "HITZ"
- `decimals`: 7
- `total_supply`: i128 (current supply in stroops)
- `max_supply`: 210,000,000,000,000 stroops (21M HITZ)

**Emission State**:
- `halving_start_ts`: u64 (Unix timestamp when emission started)
- `halving_interval_sec`: u64 (126,144,000 seconds = 4 years)
- `epoch0_unit_reward`: i128 (3,000,000 stroops = 0.3 HITZ)
- `total_released`: i128 (tracking for max supply enforcement)

**Token State** (per SEP-41):
- `balances`: `Map<Address, i128>`
- `allowances`: `Map<(Address, Address), i128>`
- `admin`: Address (owner with privileged operations)

### Public Methods

#### Token Standard (SEP-41)

```rust
// Standard token operations
transfer(from: Address, to: Address, amount: i128)
transfer_from(spender: Address, from: Address, to: Address, amount: i128)
approve(from: Address, spender: Address, amount: i128, expiration: u32)
balance(id: Address) -> i128
allowance(from: Address, spender: Address) -> i128
```

#### Emission & Minting

```rust
// Get current emission info
emission_info() -> EmissionInfo {
    current_epoch: u32,
    unit_reward: i128,      // Current reward per unit (halves each epoch)
    total_released: i128,   // Total HITZ minted so far
    remaining: i128,        // Remaining supply until max
}

// Mint rewards (called by Core contract)
mint_reward(to: Address, difficulty: i128) -> i128
// Returns: difficulty × unit_reward (current epoch)
// Only Core contract can call (Core is admin)
// Enforces max supply

// Admin mint (for special cases)
mint(to: Address, amount: i128)
// Only admin can call
// Enforces max supply
```

#### Administrative

```rust
// Initialize token (one-time)
__constructor(
    owner: Address,
    halving_start_ts: u64,
    halving_interval_sec: u64,
    epoch0_unit_reward: i128
)

// Upgrade contract
upgrade(new_wasm_hash: BytesN<32>)
// Only admin can call

// Transfer ownership
transfer_ownership(new_owner: Address)
// Only admin can call
```

### Emission Schedule

**Formula**: `unit_reward = epoch0_reward / (2^epoch_index)`

**Epoch Calculation**: `epoch = (current_time - halving_start_ts) / halving_interval_sec`

**Examples**:
- Epoch 0 (Years 0-4): 0.3 HITZ per unit
- Epoch 1 (Years 4-8): 0.15 HITZ per unit
- Epoch 2 (Years 8-12): 0.075 HITZ per unit
- ...continues until epoch 64

### Max Supply Enforcement

Every mint operation checks:
```rust
if total_released + amount > max_supply {
    panic!("Max supply exceeded")
}
```

---

## Skyhitz Core Contract

### Storage

**Global State** (`DataKey`):
- `Admin`: Address (admin for privileged operations)
- `Treasury`: Address (receives XLM fees, distributes HITZ)
- `HitzToken`: Address (HITZ token contract address)
- `XlmToken`: Address (native XLM token address)
- `StakeUnitHitz`: i128 (HITZ required per difficulty unit, default: 50,000,000)
- `BaseFee`: i128 (base XLM fee in stroops, default: 100,000 = 0.01 XLM)
- `EntryIds`: `Vec<String>` (list of all entry IDs)

**Entry State** (`Entry` struct):
```rust
struct Entry {
    id: String,
    created_at: u64,           // Unix timestamp
    escrow_xlm: i128,          // XLM from micro-spends (stroops)
    tvl_xlm: i128,             // XLM from equity actions (stroops)
    total_staked: i128,        // Total HITZ staked by all users
    reward_pool: i128,         // HITZ allocated from Treasury distributions
    apr: i128,                 // Annualized return rate (basis points)
}
```

**User State** (per entry):
- `Stakes`: `Map<(user, entry_id), i128>` (user's HITZ stake in entry)
- `ClaimedRewards`: `Map<(user, entry_id), i128>` (HITZ already claimed by user)

### Action Types

```rust
enum ActionKind {
    Stream,    // difficulty = 1
    Like,      // difficulty = 2
    Download,  // difficulty = 3
    Mine,      // difficulty = 10
    Invest,    // difficulty = dynamic (10 per 1 XLM)
}
```

### Public Methods

#### User Actions

```rust
// Record user action (unified endpoint)
record_action(
    caller: Address,
    entry_id: String,
    kind: ActionKind,
    amount_xlm: Option<i128>  // Only for 'invest' action
) -> ActionResult {
    difficulty: i128,
    xlm_fee: i128,
    hitz_reward: i128,
    hitz_staked: i128,
}

// Flow:
// 1. Calculate difficulty based on action kind
// 2. Calculate XLM fee: difficulty × base_fee
// 3. Transfer XLM from caller to Treasury
// 4. Update entry (escrow_xlm or tvl_xlm)
// 5. For mine/invest: pull HITZ stake from caller
// 6. Request HITZ reward from token contract
// 7. Transfer HITZ reward to caller
// 8. Update entry stats (stakes, reward pool, APR)
```

#### Rewards & Claims

```rust
// Claim rewards from entry pool
claim_rewards(entry_id: String, claimer: Address) -> i128
// Returns: amount claimed (HITZ stroops)
// Flow:
// 1. Verify claimer has stake in entry
// 2. Calculate ownership: user_stake / total_staked
// 3. Calculate claimable: ownership × reward_pool - already_claimed
// 4. Update claimed_rewards[user]
// 5. Transfer HITZ from contract to user
// 6. Return claimed amount

// Preview claimable (read-only)
get_claimable_rewards(entry_id: String, user: Address) -> i128

// Get user's stake in entry
get_stake(entry_id: String, owner: Address) -> i128

// Get entry's total stake
get_stake_total(entry_id: String) -> i128
```

#### Treasury Distribution

```rust
// Distribute HITZ rewards to entry pools (Treasury bot)
distribute_rewards(caller: Address, hitz_amount: i128)
// Auth: caller must be Treasury address
// Flow:
// 1. Verify caller == Treasury
// 2. Transfer hitz_amount from Treasury to contract
// 3. Calculate total_escrow = sum(all entry.escrow_xlm)
// 4. For each entry with escrow > 0:
//    entry_share = (entry.escrow_xlm / total_escrow) × hitz_amount
//    entry.reward_pool += entry_share
// 5. Update APRs for all entries

// Allocate rewards to specific entry (Admin manual)
allocate_rewards(entry_id: String, hitz_amount: i128)
// Auth: Admin only
// Use: Promotions, bonuses, special events

// Batch allocate (Admin manual)
batch_allocate_rewards(entry_ids: Vec<String>, amounts: Vec<i128>)
// Auth: Admin only
```

#### Entry Management

```rust
// Create new entry
create_entry(entry_id: String) -> Entry
// Creates entry with zero values
// Called automatically during first mine

// Get entry stats
get_entry(entry_id: String) -> Entry

// Get entry statistics
get_entry_stats(entry_id: String) -> EntryStats {
    total_staked: i128,
    reward_pool: i128,
    apr: i128,
}

// Calculate APR (on-chain)
calculate_apr(entry_id: String) -> i128
// Formula: (reward_pool / total_staked / days) × 365 × 10000
// Returns: basis points (10000 = 100%)

// Remove entry (Admin only)
remove_entry(entry_id: String)
// Deletes entry from contract
// Backend should also remove from Algolia and R2
```

#### Administrative

```rust
// Initialize contract (one-time)
init(
    admin: Address,
    treasury: Address,
    hitz_token: Address,
    xlm_token: Address,
    stake_unit_hitz: i128,  // e.g., 50,000,000 (5 HITZ per unit)
    base_fee: i128,         // e.g., 100,000 (0.01 XLM)
)

// Update base fee
set_base_fee(new_fee: i128)
// Auth: Admin only
// All action fees scale proportionally

// Upgrade contract
upgrade(new_wasm_hash: BytesN<32>)
// Auth: Admin only

// Get contract version
version() -> u32
```

---

## Contract Interaction Flow

### Example: User Mines a Track

```
1. User (Frontend) → Backend GraphQL
   "Mine this track"

2. Backend → Core Contract
   record_action(user, entry_id, ActionKind::Mine, None)

3. Core Contract:
   a) Calculate difficulty = 10
   b) Calculate XLM fee = 10 × 0.01 = 0.1 XLM
   c) Calculate HITZ stake = 10 × 5 = 50 HITZ

4. Core Contract → XLM Token
   transfer(user → Treasury, 0.1 XLM)

5. Core Contract → HITZ Token
   transfer(user → Core, 50 HITZ)  // Stake

6. Core Contract:
   - Update entry.tvl_xlm += 0.1
   - Update stakes[user][entry] = 50
   - Update entry.total_staked = 50

7. Core Contract → HITZ Token
   mint_reward(user, difficulty=10)

8. HITZ Token:
   - Calculate epoch (current time vs halving schedule)
   - Calculate reward = 10 × 0.3 = 3.0 HITZ (epoch 0)
   - Mint 3.0 HITZ
   - Transfer to user

9. Core Contract:
   - Calculate APR
   - Return success with results

10. Backend:
    - Index entry to Algolia
    - Update user's stakes
```

---

## Units & Precision

| Asset | Decimals | Stroops per Unit | Example |
|-------|----------|------------------|---------|
| **XLM** | 7 | 10,000,000 | 1 XLM = 10,000,000 stroops |
| **HITZ** | 7 | 10,000,000 | 1 HITZ = 10,000,000 stroops |

**Precision Constants**:
- `SCALE = 1_000_000` (6 decimals) for proportional math
- All contract values use `i128` stroops
- UI displays in XLM/HITZ with appropriate formatting

---

## Security & Authorization

### HITZ Token

| Function | Authorization |
|----------|--------------|
| `transfer`, `approve`, etc. | Standard SEP-41 (caller auth) |
| `mint_reward` | Only Core contract (Core is admin) |
| `mint`, `upgrade`, `transfer_ownership` | Only admin (initially admin, then Core) |

### Skyhitz Core

| Function | Authorization |
|----------|--------------|
| `record_action` | Caller must sign (user performing action) |
| `claim_rewards` | Caller must sign (user claiming) |
| `distribute_rewards` | Only Treasury address |
| `allocate_rewards`, `batch_allocate_rewards` | Only Admin |
| `create_entry`, `remove_entry` | Only Admin |
| `set_base_fee`, `upgrade` | Only Admin |

### Wallet Separation

| Wallet | Purpose | Keys | Risk |
|--------|---------|------|------|
| **Admin** | Governance, upgrades | Cold storage | Low (offline) |
| **Treasury** | Automated distributions | Hot wallet | Medium (online, limited powers) |
| **Users** | Actions, claims | User-controlled | Per-user |

---

## Key Differences from Old System

| Aspect | Old System | New System |
|--------|------------|------------|
| **Contracts** | Single contract | Dual contracts (Token + Core) |
| **Token** | XLM only | XLM (fees) + HITZ (rewards/staking) |
| **Actions** | `invest()` for everything | `record_action()` with action types |
| **Rewards** | None (APR only) | Instant HITZ on every action |
| **Equity** | Shares (XLM-based) | Stakes (HITZ-based) |
| **Claiming** | `claim_earnings()` (XLM) | `claim_rewards()` (HITZ) |
| **APR** | Excess XLM escrow | HITZ reward pool growth |
| **Distribution** | N/A | Treasury bot → reward pools |
| **Selling** | `sell_shares()` available | Not available |

---

## Contract Addresses

### Testnet

```
HITZ Token: [TBD - deploy and update]
Core Contract: [TBD - deploy and update]
Treasury: [TBD - deploy and update]
```

### Mainnet

```
HITZ Token: [TBD - deploy and update]
Core Contract: [TBD - deploy and update]
Treasury: [TBD - deploy and update]
```

---

## Development & Deployment

### Building Contracts

```bash
cd packages/api/contract
cargo build --target wasm32-unknown-unknown --release
```

### Testing

```bash
cargo test
```

### Deploying

For detailed deployment instructions, see the [Contract README](https://github.com/skyhitz/skyhitz/tree/master/packages/api/contract) in the repository.

---

## Further Reading

- **Token Economics**: See [Tokenomics & Flows](../tokenomics/flows)
- **APR Calculation**: See [APR Math](../tokenomics/apr-math)
- **Rewards System**: See [Rewards Overview](../tokenomics/rewards)
- **Contract Source**: `packages/api/contract/src/lib.rs`


