# HITZ V2: Post-Exhaustion Security Model

## Executive Summary

Following a vulnerability exploit that resulted in the premature issuance of the HITZ supply (~20M of 21M tokens), the Skyhitz contract has been redesigned to operate in a **post-exhaustion distribution-only mode**. This document outlines what happened, why it happened, and how the V2 model prevents future issues.

---

## What Happened: The Exploit

### The Vulnerability

The original contract had an **inverse price-reward relationship** that could be exploited:

```
Original formula: reward = (base_fee × 10^7) / oracle_price
```

When the oracle price dropped to near-zero (dust values), the reward calculation would produce extremely large rewards:

| Oracle Price | Fee Paid | Reward Calculated |
|--------------|----------|-------------------|
| $0.10 (1M stroops) | 0.1 HITZ | 1 HITZ |
| $0.001 (10K stroops) | 0.1 HITZ | 100 HITZ |
| $0.00001 (100 stroops) | 0.1 HITZ | 10,000 HITZ |

### How It Was Exploited

1. **Oracle Manipulation**: The attacker found a way to influence the oracle price
2. **Reward Inflation**: With a near-zero oracle price, each action yielded massive rewards
3. **Supply Drain**: Repeated actions quickly minted most of the remaining supply

### Why It Happened So Fast

The original design had **no safeguards**:
- No minimum oracle price floor
- No maximum reward per action
- No rate limiting on minting
- Oracle bot blindly accepted market prices without validation

---

## The V2 Post-Exhaustion Model

Since the supply is already issued, the V2 model fundamentally changes how the contract operates.

### Key Changes

#### 1. No More Minting

```rust
// REMOVED: All minting functions
// - safe_mint_with_cap()
// - compute_unit_reward()
// - compute_epoch_index()
```

**Why This Helps**: With no minting, there's nothing to exploit. The total supply is fixed and cannot be inflated.

#### 2. Transfer-Based Staking (1:1 Ratio)

**Before (Vulnerable)**:
```rust
// Oracle-dependent stake calculation
stake = (fee × 10^7) / oracle_price
// Could be manipulated via oracle
```

**After (Safe)**:
```rust
// Simple 1:1 transfer
stake = fee  // What you pay IS your stake
safe_transfer(&e, &hitz_token, &caller, &contract_addr, &fee, "stake deposit");
```

**Why This Helps**: 
- No oracle dependency = no oracle manipulation risk
- User's fee goes directly to contract as stake
- What you invest is exactly what you stake

#### 3. Fee Flow Redesign

**Staking Actions (mine/invest)**:
```
User → Contract (stake)
          ↓
    User's stake recorded
          ↓
    Can claim rewards later
```

**Non-Staking Actions (stream/like/download)**:
```
User → Treasury (fee)
          ↓
    Escrow recorded for entry
          ↓
    Treasury distributes to reward pools
```

#### 4. Rate-Limited Distribution (Bitcoin-Like Curve)

```typescript
// 0.05% of treasury distributed daily
const DAILY_DISTRIBUTION_RATE_BPS = 5; // 0.05% = 5 basis points

// Creates a 12+ year emission curve:
// Year 4:  ~52% distributed
// Year 8:  ~77% distributed
// Year 12: ~88% distributed
```

**Why This Helps**:
- Prevents market flooding from large distributions
- Sustainable 12+ year reward runway
- Mimics Bitcoin's proven halving model

---

## Security Improvements Summary

| Attack Vector | Before (V1) | After (V2) |
|--------------|-------------|------------|
| Oracle Manipulation | Vulnerable - rewards scaled inversely with price | Eliminated - no oracle-dependent calculations |
| Minting Overflow | Possible - checked but rate unlimited | Eliminated - no minting |
| Reward Inflation | Critical - near-zero price = infinite rewards | Eliminated - rewards from fixed treasury |
| Supply Drain | Fast - no rate limits | Impossible - supply exhausted |
| Stake Manipulation | Possible - oracle-based stake amounts | Eliminated - 1:1 fee-to-stake |
| Liquidity Drain | Possible - large distributions | Mitigated - 0.05% daily cap |

---

## What's Still Preserved

The V2 model maintains all legitimate functionality:

✅ **User Actions**: stream, like, download, mine, invest all work  
✅ **Staking**: Users can stake via mine/invest actions  
✅ **Claiming**: Stakers claim rewards proportional to stake  
✅ **Artist Equity**: Non-dilutable artist rewards still work  
✅ **APR Calculation**: Accurate APR based on actual distributions  
✅ **Entry Management**: Create, merge, remove entries  
✅ **Unstaking**: Users can withdraw their stake at any time  

---

## Distribution Projections

With 15M HITZ in treasury and 0.05% daily distribution:

| Year | Balance | Daily Distribution | Cumulative | % Issued |
|------|---------|-------------------|------------|----------|
| 1 | 12.5M | 6,250 HITZ | 2.5M | 16.7% |
| 2 | 10.4M | 5,200 HITZ | 4.6M | 30.7% |
| 4 | 7.2M | 3,600 HITZ | 7.8M | **52%** |
| 8 | 3.5M | 1,750 HITZ | 11.5M | **77%** |
| 12 | 1.7M | 850 HITZ | 13.3M | **88.8%** |

This matches Bitcoin's emission curve where ~88% is issued by year 12.

---

## Conclusion

The V2 post-exhaustion model transforms a vulnerability into a feature. By eliminating minting entirely and using a simple 1:1 staking model, we've removed all oracle-dependent attack vectors while maintaining full functionality for users.

The Bitcoin-like distribution curve ensures sustainable rewards for 12+ years, creating long-term value for the ecosystem rather than short-term inflation.

