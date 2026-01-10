---
id: treasury-bot
title: Treasury Bot System
---

This page documents the Treasury Bot system, which automates the distribution of HITZ rewards to entry pools using a Bitcoin-like rate-limited emission curve.

## Overview

The Treasury Bot operates in **post-exhaustion distribution mode**:

1. **Checks** treasury HITZ balance
2. **Calculates** daily distribution (0.05% of balance)
3. **Distributes** HITZ to entry reward pools proportionally
4. **Syncs** APRs to Algolia

**Key Point**: The bot only handles rate-limited distribution. The Core contract handles all distribution logic automatically.

---

## Post-Exhaustion Model

Since the HITZ supply is fully issued (~20M of 21M), the Treasury Bot no longer:
- ❌ Converts XLM to HITZ
- ❌ Updates oracle prices
- ❌ Triggers minting

Instead, it:
- ✅ Distributes existing HITZ from treasury
- ✅ Uses rate limiting (0.05% daily)
- ✅ Syncs APRs to Algolia

---

## Bitcoin-Like Emission Curve

### Distribution Rate

```
Daily Distribution = Treasury Balance × 0.05%
                   = Treasury Balance × 5 basis points
```

### 12-Year Emission Timeline

| Year | Daily Distribution | Cumulative |
|------|-------------------|------------|
| 1 | ~7,500 HITZ (from 15M) | ~17% |
| 4 | ~3,600 HITZ | ~52% |
| 8 | ~1,750 HITZ | ~77% |
| 12 | ~850 HITZ | ~88% |

**Why 0.05%?**
- Matches Bitcoin's ~12 year emission curve
- Prevents market flooding
- Ensures sustainable long-term rewards
- Never depletes treasury completely

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Treasury Bot                             │
│  (Cloudflare Worker - runs daily via cron)                  │
│                                                              │
│  1. Check treasury HITZ balance                             │
│  2. Calculate 0.05% distribution amount                     │
│  3. Call Core.distribute_rewards_batch()                    │
│  4. Sync APRs to Algolia                                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Uses Treasury keypair
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                  Treasury Wallet                             │
│  (Hot wallet - separate from admin)                         │
│                                                              │
│  - Holds HITZ from fees and recovered funds                 │
│  - Signs distribute_rewards() transactions                  │
│  - Rate-limited: can only distribute 0.05% daily           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ distribute_rewards_batch()
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                Skyhitz Core Contract                         │
│  (Smart contract - handles distribution logic)              │
│                                                              │
│  Phase 1: Calculate total escrow (batches of 40)            │
│  Phase 2: Transfer HITZ from Treasury to contract           │
│  Phase 3: Distribute proportionally (batches of 15)         │
│                                                              │
│  Formula: share = (entry.escrow / total_escrow) × amount    │
└─────────────────────────────────────────────────────────────┘
```

---

## How It Works

### Step 1: Check Treasury Balance

```typescript
const currentHitzBalance = await contract.getHitzBalance(treasuryAddress);
// e.g., 15,000,000 HITZ
```

### Step 2: Calculate Rate-Limited Amount

```typescript
const DAILY_DISTRIBUTION_RATE_BPS = 5; // 0.05%
const amountToDistribute = balance * 5n / 10000n;
// e.g., 15,000,000 × 0.05% = 7,500 HITZ
```

### Step 3: Distribute via 3-Phase Batch

For scalability with many entries:

**Phase 1**: Calculate total escrow in batches of 40
```typescript
for (start = 0; start < entryCount; start += 40) {
  await contract.calculateTotalEscrowBatch(start, 40);
}
```

**Phase 2**: Initialize distribution
```typescript
await contract.initializeDistribution(amountToDistribute);
```

**Phase 3**: Distribute in batches of 15
```typescript
for (start = 0; start < entryCount; start += 15) {
  await contract.distributeRewardsBatch(start, 15);
}
```

### Step 4: Sync APRs to Algolia

```typescript
await syncAllAPRsToAlgolia(env);
```

---

## Example Distribution

### Scenario

```
Treasury Balance: 15,000,000 HITZ
Daily Distribution (0.05%): 7,500 HITZ

Entry A: 500 HITZ escrow (50% of total)
Entry B: 300 HITZ escrow (30% of total)
Entry C: 200 HITZ escrow (20% of total)
Total Escrow: 1,000 HITZ
```

### Distribution

```
Entry A: (500 / 1000) × 7,500 = 3,750 HITZ
Entry B: (300 / 1000) × 7,500 = 2,250 HITZ
Entry C: (200 / 1000) × 7,500 = 1,500 HITZ
```

### Result

- Entries with more engagement get more rewards
- Stakers can claim proportionally from reward pools
- Treasury still has 14,992,500 HITZ for tomorrow

---

## Implementation

### Bot Code Location

`packages/api/src/treasury/bot.ts`

### Key Constants

```typescript
// 0.05% = 5 basis points per day
const DAILY_DISTRIBUTION_RATE_BPS = 5;

// Minimum 1 HITZ to distribute
const MIN_DISTRIBUTION_AMOUNT = BigInt(10_000_000);
```

### Main Function

```typescript
export async function runTreasuryBot(env: Env): Promise<TreasuryRunResult> {
  // 1. Get treasury balance
  const balance = await contract.getHitzBalance(treasuryAddress);
  
  // 2. Calculate 0.05% distribution
  const amount = balance * 5n / 10000n;
  
  // 3. Skip if below minimum
  if (amount < MIN_DISTRIBUTION_AMOUNT) {
    return { status: 'skipped', reason: 'Below minimum' };
  }
  
  // 4. Distribute via batched method
  const result = await contract.distributeRewardsBatch(
    treasurySecretKey,
    amount
  );
  
  // 5. Sync APRs
  await syncAllAPRsToAlgolia(env);
  
  return { status: 'submitted', hitzDistributed: amount.toString() };
}
```

---

## Scheduling

### Cloudflare Worker Cron

```toml
# wrangler.toml
[triggers]
crons = ["0 0 * * *"]  # Daily at midnight UTC
```

### Manual Trigger

The bot can also be triggered manually via HTTP endpoint for testing or emergency distribution.

---

## Configuration

### Environment Variables

```bash
TREASURY_SEED=S...          # Treasury wallet secret key
CORE_CONTRACT_ID=C...       # Core contract address
HITZ_TOKEN_ID=C...          # HITZ token address
STELLAR_NETWORK=mainnet     # Network (mainnet/testnet)
```

### Thresholds

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Distribution Rate | 0.05% | Bitcoin-like curve |
| Minimum Distribution | 1 HITZ | Skip tiny amounts |
| Escrow Batch Size | 40 | Read-only phase |
| Distribution Batch Size | 15 | Write phase |

---

## Monitoring

### Console Output

```
================================================
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

================================================
🎉 TREASURY BOT COMPLETED
================================================
   Distributed: 7,500 HITZ (0.05% of 15,000,000 HITZ)
   To entries: 125
   Remaining in treasury: 14,992,500 HITZ
```

### Key Metrics

1. **Treasury Balance**: Remaining HITZ
2. **Daily Distribution**: 0.05% of balance
3. **Entries Updated**: Count per run
4. **Total Escrow**: Platform engagement metric
5. **APR Changes**: Track across entries

---

## Security

### Rate Limiting

Even if compromised, attacker can only:
- Distribute 0.05% of treasury per day
- This is normal expected behavior
- No ability to drain treasury quickly

### No Oracle Updates

The bot does NOT update oracle prices:
- Price frozen for safety
- No price manipulation possible
- 1:1 staking eliminates oracle dependency

### Wallet Separation

| Wallet | Purpose | Risk if Compromised |
|--------|---------|---------------------|
| Admin | Governance | High (cold storage) |
| Treasury | Distributions | Low (rate-limited) |

---

## Error Handling

### Common Scenarios

**Below Minimum**:
```typescript
if (amount < MIN_DISTRIBUTION_AMOUNT) {
  return { status: 'skipped', reason: 'Below minimum (1 HITZ)' };
}
```

**No Escrow**:
```
Contract panics: "No escrow to distribute to"
```

**Network Errors**:
- Bot logs error and exits
- Can retry on next scheduled run
- No state corruption possible

---

## Manual Operations

### Manual Distribution

If needed, admin can manually trigger distribution:

```typescript
import { runTreasuryBot } from './treasury/bot';

// Trigger manually
await runTreasuryBot(env);
```

### Allocate to Specific Entry

For promotions or special events (Admin-only):

```typescript
await coreContract.allocate_rewards({
  entry_id: 'entry-id-here',
  hitz_amount: 1000_0000000n  // 1000 HITZ
});
```

---

## Comparison: V1 vs V2

| Aspect | V1 (XLM Conversion) | V2 (Rate-Limited) |
|--------|---------------------|-------------------|
| Source | XLM fees → buy HITZ | Existing HITZ |
| Rate | All accumulated | 0.05% daily |
| Oracle | Updated | Frozen |
| Minting | Triggered | Disabled |
| Sustainability | Variable | 12+ years |

---

## FAQ

**Q: How long will treasury last?**
A: With 0.05% daily rate, treasury provides 12+ years of distributions.

**Q: What if bot crashes?**
A: Treasury keeps accumulating. Next run distributes normally.

**Q: Can we change the rate?**
A: Yes, but requires code change. Consider implications carefully.

**Q: Why not distribute more frequently?**
A: Daily is optimal for gas efficiency and APR smoothness.

**Q: What if treasury runs low?**
A: Distributions get smaller (0.05% of smaller balance). Never depletes fully.

---

## Summary

The V2 Treasury Bot:

1. **Simple**: Just distributes 0.05% daily
2. **Safe**: Rate-limited, no oracle, no minting
3. **Sustainable**: 12+ year emission curve
4. **Automatic**: Runs via Cloudflare cron
5. **Scalable**: 3-phase batch for many entries

The bot implements Bitcoin's proven emission model for sustainable long-term rewards.
