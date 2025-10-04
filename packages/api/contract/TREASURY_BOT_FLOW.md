# Treasury Bot Flow - Corrected Implementation

## ✅ Problem Identified and Fixed

**Previous Issue**: Documentation suggested Treasury bot needs to analyze entry performance and calculate reward distribution.

**Reality**: Treasury bot only handles XLM → HITZ conversion. The Core contract knows entry performance and should handle distribution.

## 🔄 Corrected Flow

### Treasury Bot Responsibilities (Simple)

```
1. Collect accumulated XLM fees from Treasury wallet
2. Buy HITZ on Stellar DEX with collected XLM
3. Send all purchased HITZ to Core contract via distribute_rewards()
```

**That's it!** The bot doesn't need to:
- ❌ Track entry performance
- ❌ Calculate escrow amounts
- ❌ Determine distribution percentages
- ❌ Make multiple transactions to different entries

### Core Contract Responsibilities (Smart)

The Core contract handles all distribution logic:

```rust
distribute_rewards(caller: Address, hitz_amount: i128) {
    // 1. Verify caller is Treasury
    caller.require_auth();
    if caller != treasury { panic!("Only Treasury") }
    
    // 2. Transfer HITZ from Treasury to contract
    hitz_client.transfer(&caller, &contract, &hitz_amount)
    
    // 3. Calculate total escrow across all entries
    let total_escrow = sum(all_entries.escrow_xlm)
    
    // 4. Distribute proportionally
    for each entry {
        entry_share = (entry.escrow_xlm / total_escrow) * hitz_amount
        entry.reward_pool += entry_share
    }
}
```

## 📊 Example Distribution

### Scenario:
- Treasury bot buys 1000 HITZ
- Entry A: 500 XLM escrow (50%)
- Entry B: 300 XLM escrow (30%)
- Entry C: 200 XLM escrow (20%)

### Single Call:
```typescript
// Treasury bot makes ONE call (signs with Treasury keys)
contract.distribute_rewards(
  treasuryAddress,  // caller parameter
  1000_HITZ,
  { signer: treasuryKeypair }
)

// Core contract automatically:
// - Entry A gets 500 HITZ (50%)
// - Entry B gets 300 HITZ (30%)
// - Entry C gets 200 HITZ (20%)
```

## 🔧 Available Functions

### 1. `distribute_rewards()` - Automatic (Treasury Bot)
```rust
pub fn distribute_rewards(e: Env, caller: Address, hitz_amount: i128)
```

**Who calls it**: Treasury bot (automated, scheduled)

**What it does**:
- Verifies caller is the Treasury address
- Accepts total HITZ amount from Treasury wallet
- Calculates total escrow across all entries
- Distributes proportionally based on escrow_xlm
- Updates all reward pools automatically

**Use case**: Normal operations, automated distribution

**Security**: Treasury signs with its own keys (separate from admin)

### 2. `allocate_rewards()` - Manual (Admin)
```rust
pub fn allocate_rewards(e: Env, entry_id: String, hitz_amount: i128)
```

**Who calls it**: Admin (manual intervention)

**What it does**:
- Allocates specific amount to specific entry
- Bypasses automatic distribution logic

**Use cases**:
- Promotions
- Bonuses
- Contests
- Special events
- Corrections

### 3. `batch_allocate_rewards()` - Manual Batch (Admin)
```rust
pub fn batch_allocate_rewards(e: Env, entry_ids: Vec<String>, amounts: Vec<i128>)
```

**Who calls it**: Admin (manual intervention)

**What it does**:
- Allocates specific amounts to multiple entries at once
- More efficient than multiple single calls

**Use cases**:
- Campaign rewards
- Airdrops
- Bulk bonuses

## 🚀 Treasury Bot Implementation

### Simplified Pseudocode

```typescript
// Load Treasury keypair (NOT admin keys!)
const treasuryKeypair = Keypair.fromSecret(process.env.TREASURY_SECRET_KEY);

async function runTreasuryBot() {
  // 1. Check Treasury XLM balance
  const xlmBalance = await getTreasuryBalance('XLM')
  
  if (xlmBalance < MIN_THRESHOLD) {
    return // Wait for more fees to accumulate
  }
  
  // 2. Buy HITZ on DEX
  const hitzBought = await buyHitzOnDex(xlmBalance, treasuryKeypair)
  
  // 3. Send to Core contract (ONE call handles everything)
  // Treasury signs with its own keys
  await coreContract.distribute_rewards(
    treasuryKeypair.publicKey(),  // caller
    hitzBought,
    { signer: treasuryKeypair }   // Treasury signs
  )
  
  // Done! Core handles the rest
}

// Run every hour/day/week as needed
schedule(runTreasuryBot, INTERVAL)
```

### What Treasury Bot Doesn't Need

- ❌ Database of entries
- ❌ Entry performance tracking
- ❌ Escrow calculations
- ❌ Distribution algorithms
- ❌ Multiple contract calls
- ❌ Complex logic

### What Treasury Bot Needs

- ✅ Treasury wallet keypair (separate from admin)
- ✅ Connection to Stellar DEX
- ✅ Connection to Core contract
- ✅ Simple scheduling

## 📈 Benefits of This Approach

### 1. Simplicity
- Treasury bot is just a converter: XLM → HITZ
- All business logic stays in the contract

### 2. Transparency
- Distribution formula is on-chain
- Anyone can verify the calculation
- No off-chain oracle needed

### 3. Efficiency
- One transaction instead of N (where N = number of entries)
- Lower gas costs
- Faster execution

### 4. Maintainability
- Change distribution logic = update contract
- No bot updates needed
- Easier to audit

### 5. Decentralization
- Anyone with Treasury keys can call `distribute_rewards()`
- Not dependent on specific bot implementation
- Distribution logic is trustless

## 🔐 Security Considerations

### Auth Requirements

| Function | Auth Required | Who Can Call |
|----------|--------------|--------------|
| `distribute_rewards()` | Treasury | Treasury bot (with Treasury key) |
| `allocate_rewards()` | Admin | Platform admin only |
| `batch_allocate_rewards()` | Admin | Platform admin only |

### Wallet Separation

- **Admin Wallet**: Cold storage, governance operations
- **Treasury Wallet**: Hot wallet, automated operations
- This separation improves security (admin keys never exposed to bot)

### Safety Checks

1. **Amount validation**: Must be > 0
2. **Escrow check**: Must have entries with escrow to distribute
3. **Transfer validation**: HITZ must be successfully transferred
4. **Proportional math**: Uses safe saturating arithmetic

## 📊 Distribution Formula

```
For each entry with escrow_xlm > 0:
  
  entry_share = (entry.escrow_xlm / total_escrow) × total_hitz
  
Where:
  - entry.escrow_xlm = Entry's accumulated fees from streams/likes/downloads
  - total_escrow = Sum of all entries' escrow_xlm
  - total_hitz = Amount Treasury bot is distributing
```

### Example Calculation

```
Entry A: 1000 XLM escrow
Entry B: 500 XLM escrow
Entry C: 500 XLM escrow
Total: 2000 XLM escrow

Treasury distributes: 1000 HITZ

Entry A gets: (1000 / 2000) × 1000 = 500 HITZ
Entry B gets: (500 / 2000) × 1000 = 250 HITZ
Entry C gets: (500 / 2000) × 1000 = 250 HITZ
```

## 🎯 Key Takeaways

1. **Treasury bot is simple**: Just buy HITZ and send it to the contract
2. **Core contract is smart**: Handles all distribution logic automatically
3. **One transaction**: Distributes to all entries proportionally
4. **On-chain transparency**: Distribution formula is verifiable
5. **Manual override available**: Admin can allocate for special cases

This design separates concerns perfectly:
- **Bot**: Market operations (XLM → HITZ)
- **Contract**: Business logic (distribution)
- **Admin**: Special cases (manual allocation)

---

**Status**: Implemented and ready for testing ✅
