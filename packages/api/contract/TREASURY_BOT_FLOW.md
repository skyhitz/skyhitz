# Treasury Bot V2 - Bitcoin-Like Distribution

## ✅ Post-Exhaustion Model

The HITZ supply is fully issued (~20M of 21M). The Treasury Bot now operates in **distribution-only mode** with rate limiting.

## 🔄 How It Works

### Distribution Rate

```
Daily Distribution = Treasury Balance × 0.05%
                   = Treasury Balance × 5 basis points
```

**Why 0.05%?**
- Creates a 12+ year emission curve
- Matches Bitcoin's proven halving model
- Prevents market flooding
- Ensures sustainable rewards

### Emission Curve

| Year | Treasury Distributed | Cumulative |
|------|---------------------|------------|
| 1 | ~17% | 17% |
| 4 | ~35% | 52% |
| 8 | ~25% | 77% |
| 12 | ~11% | 88% |

## 📊 Treasury Bot Responsibilities

### What It Does

1. ✅ Check treasury HITZ balance
2. ✅ Calculate 0.05% distribution amount
3. ✅ Call `distribute_rewards()` on contract
4. ✅ Sync APRs to Algolia

### What It Doesn't Do

- ❌ Track entry performance (contract handles this)
- ❌ Calculate distribution percentages (contract handles this)
- ❌ Convert XLM to HITZ (no longer needed)
- ❌ Update oracle price (disabled for safety)
- ❌ Mint tokens (supply exhausted)

## 🔧 Implementation

### Bot Code (`packages/api/src/treasury/bot.ts`)

```typescript
// Bitcoin-like distribution rate: 0.05% of treasury balance per day
const DAILY_DISTRIBUTION_RATE_BPS = 5; // 5 basis points = 0.05%

async function runTreasuryBot(env: Env) {
  // 1. Get treasury HITZ balance
  const treasuryBalance = await contract.getHitzBalance(treasuryAddress);
  
  // 2. Calculate rate-limited amount (0.05%)
  const amountToDistribute = treasuryBalance * 5n / 10000n;
  
  // 3. Skip if below minimum (1 HITZ)
  if (amountToDistribute < 10_000_000n) {
    console.log('Below minimum, skipping');
    return;
  }
  
  // 4. Distribute via contract (3-phase batch for scalability)
  await contract.distributeRewardsBatch(treasuryKeys, amountToDistribute);
  
  // 5. Sync APRs to Algolia
  await syncAllAPRsToAlgolia(env);
}
```

### Contract Distribution Logic

```rust
pub fn distribute_rewards(e: Env, caller: Address, hitz_amount: i128) {
    // 1. Verify caller is Treasury
    caller.require_auth();
    if caller != treasury { panic!("Only Treasury") }
    
    // 2. Transfer HITZ from Treasury to contract
    hitz_client.transfer(&caller, &contract, &hitz_amount);
    
    // 3. Calculate total escrow across all entries
    let total_escrow = sum(all entries.escrow);
    
    // 4. Distribute proportionally
    for each entry {
        if entry.escrow > 0 {
            share = (entry.escrow / total_escrow) * hitz_amount;
            entry.reward_pool += share;
        }
    }
}
```

## 📊 Example Distribution

### Scenario

- Treasury balance: 15,000,000 HITZ
- Daily distribution (0.05%): 7,500 HITZ
- Entry A: 500 HITZ escrow (50%)
- Entry B: 300 HITZ escrow (30%)
- Entry C: 200 HITZ escrow (20%)

### Distribution

```
Entry A: (500 / 1000) × 7,500 = 3,750 HITZ
Entry B: (300 / 1000) × 7,500 = 2,250 HITZ  
Entry C: (200 / 1000) × 7,500 = 1,500 HITZ
```

### Result

Entries with more engagement (escrow) receive more rewards.
Stakers in each entry can then claim proportionally.

## 🔐 Security

### Rate Limiting

- Only 0.05% per day prevents liquidity drain
- Even if compromised, attacker can only distribute normally

### No Oracle Updates

- Oracle price frozen for safety
- No price manipulation possible
- Staking uses 1:1 ratio (fee = stake)

### Wallet Separation

| Wallet | Purpose | Risk |
|--------|---------|------|
| Admin | Governance, upgrades | Low (cold storage) |
| Treasury | Daily distributions | Low (rate-limited) |

## 📈 3-Phase Batch Distribution

For large numbers of entries, the bot uses batched distribution:

### Phase 1: Calculate Total Escrow

```typescript
// Calculate escrow in batches of 40
for (start = 0; start < entryCount; start += 40) {
  await contract.calculateTotalEscrowBatch(start, 40);
}
```

### Phase 2: Initialize Distribution

```typescript
// Transfer HITZ and prepare distribution
await contract.initializeDistribution(hitzAmount);
```

### Phase 3: Distribute in Batches

```typescript
// Distribute to entries in batches of 15
for (start = 0; start < entryCount; start += 15) {
  await contract.distributeRewardsBatch(start, 15);
}
```

## 📊 Monitoring

### Key Metrics

1. **Treasury Balance**: Track remaining HITZ
2. **Daily Distribution**: 0.05% of balance
3. **Entries Updated**: Count per run
4. **APR Changes**: Track across entries

### Logging

```
🏦 TREASURY BOT - BITCOIN-LIKE DISTRIBUTION
================================================
Timestamp: 2024-01-10T00:00:00Z

ℹ️  Supply fully issued - distribution only mode
ℹ️  No oracle updates (price fixed for safety)
ℹ️  Distribution rate: 0.05% of treasury per day (12-year curve)

📊 Checking treasury HITZ balance...
   Treasury balance: 15,000,000 HITZ
   Today's distribution (0.05%): 7,500 HITZ

💰 Distributing 7,500 HITZ to entries...
   (14,992,500 HITZ will remain in treasury)

✅ Distribution complete!
   Entries with escrow: 125
   Total escrow: 50,000 HITZ
   HITZ distributed: 7,500 HITZ

📈 Syncing APRs to Algolia...
✅ APR sync: 125 entries updated
```

## 🔄 Schedule

The bot runs once per day via Cloudflare Worker scheduled trigger:

```toml
# wrangler.toml
[triggers]
crons = ["0 0 * * *"]  # Daily at midnight UTC
```

## ✅ Summary

The V2 Treasury Bot:

1. **Simple**: Just distributes 0.05% of treasury daily
2. **Safe**: Rate-limited, no oracle, no minting
3. **Sustainable**: 12+ year emission curve
4. **Automatic**: Contract handles all distribution logic
5. **Scalable**: Batched operations for many entries

---

**Status**: Implemented and running ✅
