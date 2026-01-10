# HITZ V2: Post-Exhaustion Security Model Roadmap

## Background: The Exploit

The original contract had a vulnerability where **oracle price manipulation** could drain the HITZ supply:

```
Original formula: reward = (base_fee × 10^7) / oracle_price

When oracle price dropped to near-zero, rewards exploded:
- At $0.10/HITZ → 1 HITZ reward
- At $0.001/HITZ → 100 HITZ reward  
- At $0.00001/HITZ → 10,000 HITZ reward
```

**Result**: ~20M of 21M HITZ tokens were prematurely issued.

## V2 Solution: Post-Exhaustion Model

Since the supply is already issued, we're transitioning to a **distribution-only mode** with these core changes:

1. **No more minting** - Supply is fixed at 21M
2. **1:1 Transfer-based staking** - User pays HITZ, gets exact amount staked
3. **Rate-limited treasury distribution** - 0.05% daily (12+ year runway)
4. **Timelock on stakes** - 24h lock to prevent flash-loan arbitrage

## Why 3 PRs Instead of 1?

Per admin feedback on PR #13: *"Something bigger than +1000 -1000 for the diff is usually not realistic for a good review."*

Original V2 changes: **+3,600 / -10,600 lines** (way over limit)

### PR Breakdown

| PR | Focus | Lines | Complexity | Dependencies |
|----|-------|-------|------------|--------------|
| **#14** | 24h Timelock | +193/-25 | Low | None |
| **#15** | Admin Recovery | ~+50 | Low | None |
| **#16** | V2 Economic Model | ~+300/-400 | High | #14 + #15 |

### Why This Order?

1. **PR #14 (Timelock)** - Adds security without breaking anything. Works with current V1 model AND future V2.

2. **PR #15 (Admin Recovery)** - Emergency tools (`admin_set_total_minted`, `force_oracle_price`) needed for post-exploit recovery. Also standalone.

3. **PR #16 (V2 Model)** - The core economic change. Removes oracle dependency from staking, switches to 1:1 transfer model. Needs #14's timelock to prevent new attack vectors.

## PR #14: 24-Hour Staking Timelock (THIS PR)

### What It Does
- Adds `UserStake` struct with `amount` and `unlock_time`
- Stakes are locked for 24 hours after deposit
- Prevents flash-loan style arbitrage

### Why It's Needed
Without timelock, attackers could:
1. Stake large amounts
2. Claim rewards or manipulate prices
3. Unstake immediately

The 24h lock ensures **intentionality** and eliminates fast arbitrage.

### Behavior
- **Top-up extends lock**: Adding to stake resets the 24h timer
- **Partial unstake preserved**: Withdrawing some doesn't extend lock
- **Migration safe**: Existing stakes (unlock_time=0) can unstake immediately

---

## PR #15: Admin Recovery Tools (NEXT)

### What It Adds
```rust
// Emergency: Reset minted counter if desynced
admin_set_total_minted(e: Env, new_minted: i128)

// Emergency: Force oracle price if bot is down
force_oracle_price(e: Env, new_price: i128)
```

### Why It's Needed
After the exploit, the `TotalMinted` counter may be desynced. Admin needs ability to correct it. Similarly, if the oracle bot fails, admin needs manual override.

---

## PR #16: V2 Post-Exhaustion Model (FINAL)

### Core Changes
1. **Remove minting**: `safe_mint_with_cap()` → Transfer from treasury
2. **1:1 Staking**: `stake = fee` (no oracle calculation)
3. **Fee flow redesign**: 
   - Invest/Mine: User pays HITZ → Contract (stake)
   - Stream/Like/Download: User pays XLM → Treasury (fee)

### Attack Vectors Eliminated
| Vector | Before (V1) | After (V2) |
|--------|-------------|------------|
| Oracle Manipulation | 🔴 Vulnerable | ✅ No oracle dependency |
| Minting Overflow | 🔴 Possible | ✅ No minting |
| Reward Inflation | 🔴 Critical | ✅ Fixed treasury |
| Flash-loan Arbitrage | 🔴 Possible | ✅ 24h timelock (PR #14) |

---

## Questions?

Contact: security@skyhitz.io
