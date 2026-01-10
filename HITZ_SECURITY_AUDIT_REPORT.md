# HITZ Token Exploit - Independent Security Audit Report

**Date:** January 9, 2026  
**Auditor:** AI Security Analysis  
**Incident Date:** January 8, 2026  
**Severity:** Critical - Complete Token Supply Exhaustion

---

## Executive Summary

On January 8, 2026, the Skyhitz protocol experienced a catastrophic inflation event that minted approximately 20 million HITZ tokens (95% of the total 21M supply cap) in under 90 minutes. This report provides an independent analysis of the root causes, design flaws, and comprehensive remediation recommendations.

**Key Finding:** The vulnerability was not a single bug, but a **systemic design failure** stemming from three interconnected weaknesses:

1. **Oracle without sanity bounds** - No minimum price floor
2. **Uncapped reward formula** - Price directly determines mint amount  
3. **No rate limiting** - Unlimited transaction throughput allowed

---

## Part 1: Technical Root Cause Analysis

### 1.1 The Vulnerable Formula

The core vulnerability existed in the `compute_unit_reward()` function:

```rust
// THE VULNERABLE FORMULA (before fix):
let value_adjusted_reward = if hitz_price_usdc > 0 {
    base_fee
        .checked_mul(10_000_000)
        .and_then(|v| v.checked_div(hitz_price_usdc))
        // ...
}
```

**Formula:** `reward = (base_fee × 10^7) / oracle_price`

With:
- `base_fee` = 1,000,000 stroops (0.1 HITZ)
- `oracle_price` = 1 stroop (exploited value)

**Result:** `reward = (1,000,000 × 10,000,000) / 1 = 10,000,000,000,000 stroops` (10 trillion per action)

### 1.2 The Oracle Vulnerability

The oracle bot fetched prices from Soroswap without any sanity checks:

```typescript
// oracle-bot.ts - THE MISSING VALIDATION
const priceImpact = quote.priceImpactPct || '0';
console.log(`   Price impact: ${priceImpact}%`); // <-- LOGGED BUT IGNORED

// No rejection of high price impact quotes!
return usdcPerHitz; // Pushed 1 stroop price to contract
```

**Critical Flaw:** The bot:
- Queried with only $50 USDC (thin market sampling)
- Ignored the `priceImpactPct` warning signal
- Had no minimum price floor
- Had no maximum deviation check from previous price

### 1.3 The Contract's Only Defense (Insufficient)

The contract only checked:

```rust
// lib.rs - THE WEAK VALIDATION
if new_price <= 0 {
    panic!("Price must be positive");
}
```

**Fatal Flaw:** A price of `1 stroop` is technically "positive" but economically absurd. This allowed:
- Price = 0.0000001 USDC per HITZ (essentially zero)
- 10,000,000x reward multiplier per action

---

## Part 2: The Attack Chain

### Timeline Reconstruction

| Time (UTC) | Event | Technical Details |
|------------|-------|-------------------|
| 05:36 | Oracle Failure | Pool skew → Quote returned ~1B HITZ per 100 XLM |
| 05:36 | Price Update | Transaction `a7cc86f0...` set oracle to 1 stroop |
| 05:36-06:54 | Mass Minting | ~300 transactions minted ~20M HITZ |
| 06:54 | Cap Reached | `MAX_HITZ_SUPPLY` (21M) halted minting |
| 07:11 | Dump | Bot accidentally distributed to pool |
| 07:11-15:42 | Recovery Race | Claims recovered ~20M (split 5M/15M) |

### Mathematical Analysis

**Per-Action Minting:**
- Base fee: 0.1 HITZ (1,000,000 stroops)
- Oracle price: 1 stroop
- Reward formula: `(1,000,000 × 10,000,000) / 1 = 10^13 stroops`
- Per action: 1,000,000 HITZ (!)

**But Wait - There Should Have Been a Cap?**

Looking at the current code, there's a `min()` operation:

```rust
let final_reward = if value_adjusted_reward < base_reward {
    value_adjusted_reward
} else {
    base_reward  // Cap at halving schedule
};
```

**Conclusion:** This `min()` cap was likely **added after the exploit** as a security fix. The original design allowed the value-adjusted reward to be used directly, creating the infinite mint vector.

---

## Part 3: Design Flaw Analysis

### 3.1 Economic Model Flaw: Oracle-Dependent Minting

**The Core Problem:** The reward formula `(fee × 10^7) / price` creates an **inverse relationship** between price and minting. This is economically dangerous:

| Oracle Price | Reward per 0.1 HITZ Fee |
|--------------|-------------------------|
| $0.10 (normal) | 1.0 HITZ |
| $0.01 (crash) | 10.0 HITZ |
| $0.001 (exploit) | 100.0 HITZ |
| $0.0000001 (1 stroop) | 1,000,000 HITZ |

**Design Intent vs Reality:**
- **Intent:** "Users get more HITZ when price is low" (value parity)
- **Reality:** Creates arbitrage loop → low price → more minting → price crashes → more minting

### 3.2 Oracle Trust Model Flaw

The system treated DEX spot prices as **ground truth** without:
- Price impact validation
- Liquidity depth requirements  
- Time-weighted average prices (TWAP)
- Multiple oracle sources
- Circuit breakers

### 3.3 Missing Defense-in-Depth

| Layer | Defense | Status |
|-------|---------|--------|
| Oracle Bot | Price impact check | ❌ Missing |
| Oracle Bot | Min/max price bounds | ❌ Missing |
| Oracle Bot | Rate of change limit | ❌ Missing |
| Contract | Minimum price floor | ❌ Missing (only > 0) |
| Contract | Per-action reward cap | ⚠️ Added post-exploit |
| Contract | Per-block mint limit | ❌ Missing |
| Contract | Emergency pause | ❌ Missing |

---

## Part 4: Comprehensive Fix Recommendations

### 4.1 Contract-Level Fixes (Critical)

#### A. Minimum Oracle Price Floor

```rust
// RECOMMENDED: Add to lib.rs constants
const MIN_ORACLE_PRICE: i128 = 10_000; // 0.001 USDC minimum (dust protection)
const MAX_ORACLE_PRICE: i128 = 100_000_000_000; // $10,000 maximum (sanity cap)

// In update_oracle_price():
pub fn update_oracle_price(e: Env, caller: Address, new_price: i128) {
    caller.require_auth();
    
    let treasury: Address = e.storage().instance().get(&DataKey::Treasury).unwrap();
    if caller != treasury {
        panic!("Only Treasury can update oracle price");
    }
    
    // CRITICAL: Enforce price bounds
    if new_price < MIN_ORACLE_PRICE {
        panic!("Oracle price {} below minimum {}", new_price, MIN_ORACLE_PRICE);
    }
    if new_price > MAX_ORACLE_PRICE {
        panic!("Oracle price {} above maximum {}", new_price, MAX_ORACLE_PRICE);
    }
    
    // CRITICAL: Limit rate of change (max 50% per update)
    let current_price: i128 = e.storage().instance()
        .get(&DataKey::OraclePrice)
        .unwrap_or(1_000_000);
    
    let max_change = current_price / 2; // 50% max change
    let price_diff = if new_price > current_price {
        new_price - current_price
    } else {
        current_price - new_price
    };
    
    if price_diff > max_change {
        panic!("Oracle price change {}% exceeds 50% limit", 
               (price_diff * 100) / current_price);
    }
    
    e.storage().instance().set(&DataKey::OraclePrice, &new_price);
    e.storage().instance().set(&DataKey::OracleLastUpdate, &e.ledger().timestamp());
}
```

#### B. Per-Action Reward Cap (Already Partially Implemented)

The current `min(value_adjusted, base_reward)` is good but needs strengthening:

```rust
// RECOMMENDED: Add absolute per-action cap
const MAX_REWARD_PER_ACTION: i128 = 10_000_000; // 1 HITZ max per action

fn compute_unit_reward(e: &Env) -> i128 {
    // ... existing logic ...
    
    // Apply halving schedule cap
    let final_reward = if value_adjusted_reward < base_reward {
        value_adjusted_reward
    } else {
        base_reward
    };
    
    // CRITICAL: Absolute maximum per action (defense in depth)
    if final_reward > MAX_REWARD_PER_ACTION {
        log!(e, "Reward {} capped at maximum {}", final_reward, MAX_REWARD_PER_ACTION);
        return MAX_REWARD_PER_ACTION;
    }
    
    final_reward
}
```

#### C. Per-Block/Time Mint Rate Limit

```rust
// RECOMMENDED: Add minting rate limit
const MAX_MINT_PER_HOUR: i128 = 100_000_000_000; // 10,000 HITZ per hour
const RATE_LIMIT_WINDOW: u64 = 3600; // 1 hour in seconds

#[contracttype]
pub enum DataKey {
    // ... existing keys ...
    MintRateWindow, // (start_timestamp, amount_minted)
}

fn check_and_update_mint_rate(e: &Env, amount: i128) {
    let now = e.ledger().timestamp();
    let (window_start, window_minted): (u64, i128) = e.storage()
        .instance()
        .get(&DataKey::MintRateWindow)
        .unwrap_or((now, 0));
    
    if now - window_start > RATE_LIMIT_WINDOW {
        // New window
        e.storage().instance().set(&DataKey::MintRateWindow, &(now, amount));
    } else {
        // Same window - check limit
        let new_total = window_minted + amount;
        if new_total > MAX_MINT_PER_HOUR {
            panic!("Mint rate limit exceeded: {} / {} HITZ this hour", 
                   new_total, MAX_MINT_PER_HOUR);
        }
        e.storage().instance().set(&DataKey::MintRateWindow, &(window_start, new_total));
    }
}
```

#### D. Emergency Pause Mechanism

```rust
// RECOMMENDED: Add emergency pause
#[contracttype]
pub enum DataKey {
    // ... existing keys ...
    Paused,
}

pub fn pause(e: Env, caller: Address) {
    caller.require_auth();
    let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
    if caller != admin {
        panic!("Only admin can pause");
    }
    e.storage().instance().set(&DataKey::Paused, &true);
    log!(&e, "CONTRACT PAUSED by {}", caller);
}

pub fn unpause(e: Env, caller: Address) {
    caller.require_auth();
    let admin: Address = e.storage().instance().get(&DataKey::Admin).unwrap();
    if caller != admin {
        panic!("Only admin can unpause");
    }
    e.storage().instance().set(&DataKey::Paused, &false);
    log!(&e, "CONTRACT UNPAUSED by {}", caller);
}

fn require_not_paused(e: &Env) {
    let paused: bool = e.storage().instance().get(&DataKey::Paused).unwrap_or(false);
    if paused {
        panic!("Contract is paused");
    }
}

// Add to record_action():
pub fn record_action(e: Env, caller: Address, entry_id: String, kind: Symbol, amount: Option<i128>) {
    require_not_paused(&e);
    // ... rest of function
}
```

### 4.2 Oracle Bot Fixes (Critical)

#### A. Price Impact Validation

```typescript
// oracle-bot.ts - REQUIRED FIX
const MAX_ACCEPTABLE_PRICE_IMPACT = 5.0; // 5% max

async function fetchMarketPriceFromSoroswap(...): Promise<number> {
    // ... existing fetch logic ...
    
    const priceImpact = parseFloat(quote.priceImpactPct || '0');
    
    // CRITICAL: Reject high price impact quotes
    if (priceImpact > MAX_ACCEPTABLE_PRICE_IMPACT) {
        throw new Error(
            `Price impact ${priceImpact}% exceeds maximum ${MAX_ACCEPTABLE_PRICE_IMPACT}%. ` +
            `Market may be illiquid or manipulated.`
        );
    }
    
    // ... rest of function
}
```

#### B. Minimum Price Floor

```typescript
// oracle-bot.ts - REQUIRED FIX
const MIN_ACCEPTABLE_PRICE_USDC = 0.0001; // $0.0001 minimum
const MAX_ACCEPTABLE_PRICE_USDC = 1000;   // $1000 maximum

async function fetchMarketPriceFromSoroswap(...): Promise<number> {
    // ... existing logic ...
    
    // CRITICAL: Enforce price bounds before returning
    if (usdcPerHitz < MIN_ACCEPTABLE_PRICE_USDC) {
        throw new Error(
            `Market price ${usdcPerHitz} USDC below minimum ${MIN_ACCEPTABLE_PRICE_USDC}. ` +
            `Possible market manipulation or illiquidity.`
        );
    }
    
    if (usdcPerHitz > MAX_ACCEPTABLE_PRICE_USDC) {
        throw new Error(
            `Market price ${usdcPerHitz} USDC above maximum ${MAX_ACCEPTABLE_PRICE_USDC}. ` +
            `Possible data error or extreme market conditions.`
        );
    }
    
    return usdcPerHitz;
}
```

#### C. Maximum Price Change Rate

```typescript
// oracle-bot.ts - REQUIRED FIX
const MAX_PRICE_CHANGE_PERCENT = 30; // 30% max change per update

export async function runOracleBot(env: Env): Promise<OracleRunResult> {
    // ... existing logic ...
    
    const priceChange = Math.abs(marketPriceUsdc - currentPriceUsdc) / currentPriceUsdc;
    
    // CRITICAL: Reject extreme price movements
    if (priceChange > MAX_PRICE_CHANGE_PERCENT / 100) {
        console.error(`⚠️ ORACLE SAFETY: Price change ${(priceChange * 100).toFixed(2)}% exceeds ${MAX_PRICE_CHANGE_PERCENT}% limit`);
        console.error(`   Current: $${currentPriceUsdc.toFixed(6)}, Market: $${marketPriceUsdc.toFixed(6)}`);
        
        return {
            status: 'skipped',
            reason: `Price change ${(priceChange * 100).toFixed(2)}% exceeds safety limit of ${MAX_PRICE_CHANGE_PERCENT}%`,
            oldPrice: currentPriceUsdc.toFixed(6),
            newPrice: marketPriceUsdc.toFixed(6),
        };
    }
    
    // ... proceed with update
}
```

#### D. TWAP Instead of Spot Price (Advanced)

```typescript
// oracle-bot.ts - RECOMMENDED IMPROVEMENT
// Use Time-Weighted Average Price over multiple samples

interface PriceSample {
    timestamp: number;
    price: number;
}

const TWAP_SAMPLES = 3;
const SAMPLE_INTERVAL_MS = 60000; // 1 minute between samples

async function fetchTWAPPrice(env: Env): Promise<number> {
    const samples: PriceSample[] = [];
    
    for (let i = 0; i < TWAP_SAMPLES; i++) {
        const price = await fetchMarketPriceFromSoroswap(env.STELLAR_NETWORK, env.SOROSWAP_API_KEY);
        samples.push({ timestamp: Date.now(), price });
        
        if (i < TWAP_SAMPLES - 1) {
            await new Promise(resolve => setTimeout(resolve, SAMPLE_INTERVAL_MS));
        }
    }
    
    // Time-weighted average
    const avgPrice = samples.reduce((sum, s) => sum + s.price, 0) / samples.length;
    
    // Also check standard deviation to detect volatility
    const variance = samples.reduce((sum, s) => sum + Math.pow(s.price - avgPrice, 2), 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / avgPrice;
    
    if (volatility > 0.1) { // 10% volatility = unstable market
        throw new Error(`Market too volatile (${(volatility * 100).toFixed(2)}% std dev). Skipping update.`);
    }
    
    return avgPrice;
}
```

### 4.3 Economic Model Recommendations

#### A. Remove Oracle Dependency from Minting

**The Fundamental Problem:** Tying mint rate to market price creates a feedback loop. Consider:

```rust
// ALTERNATIVE: Fixed emission based only on halving schedule
fn compute_unit_reward(e: &Env) -> i128 {
    let epoch = compute_epoch_index(e);
    let epoch0_reward: i128 = e
        .storage()
        .instance()
        .get(&DataKey::EmissionEpoch0UnitReward)
        .unwrap_or(3_000_000);
    
    if epoch >= 64 { return 0; }
    
    // Simple halving - no oracle dependency for minting!
    epoch0_reward >> epoch
}
```

The oracle can still be used for:
- Staking calculations
- Display purposes
- Analytics

But NOT for determining mint amounts.

#### B. If Oracle-Based Minting is Required, Add Dampening

```rust
// Dampen oracle's effect on rewards
const ORACLE_WEIGHT: i128 = 30; // Oracle affects 30% of reward calculation

fn compute_unit_reward(e: &Env) -> i128 {
    let base_reward = /* halving schedule */;
    let oracle_adjusted = /* current formula */;
    
    // Weighted average: 70% halving schedule, 30% oracle-adjusted
    let dampened = (base_reward * (100 - ORACLE_WEIGHT) + oracle_adjusted * ORACLE_WEIGHT) / 100;
    
    // Still cap at base_reward
    if dampened > base_reward { base_reward } else { dampened }
}
```

---

## Part 5: Testing Requirements

### 5.1 New Test Cases Required

```rust
#[test]
#[should_panic(expected = "Oracle price")]
fn test_oracle_price_floor() {
    // Should reject price = 1 stroop
    client.update_oracle_price(&treasury, &1i128);
}

#[test]
#[should_panic(expected = "price change")]
fn test_oracle_rate_limit() {
    // Should reject >50% price change in single update
    client.update_oracle_price(&treasury, &1_000_000i128);
    client.update_oracle_price(&treasury, &100_000i128); // 90% drop
}

#[test]
fn test_mint_rate_limit() {
    // Should prevent mass minting within time window
    for i in 0..1000 {
        client.record_action(&user, &entry_id, &symbol_short!("mine"), &None);
    }
    // Assert rate limit hit before draining supply
}

#[test]
fn test_emergency_pause() {
    client.pause(&admin);
    // All actions should fail
    assert!(client.record_action(&user, &entry_id, &symbol_short!("stream"), &None).is_err());
    
    client.unpause(&admin);
    // Actions should work again
    assert!(client.record_action(&user, &entry_id, &symbol_short!("stream"), &None).is_ok());
}
```

---

## Part 6: Incident Response Recommendations

### 6.1 Immediate Actions

1. **✅ Deploy Emergency Fixes** - Minimum price floor in contract
2. **✅ Update Oracle Bot** - Add all validation layers
3. **⚠️ Consider Token Reset** - If 95% of supply is in wrong hands

### 6.2 Token Recovery Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **Do Nothing** | Accept current distribution | Simple | 95% supply compromised |
| **Burn & Reissue** | New token, airdrop to legitimate holders | Clean slate | Complex, trust issues |
| **Governance Vote** | Let holders decide | Democratic | Attacker has 95% votes |
| **Admin Clawback** | If contract allows | Fast | May not be possible |

### 6.3 Long-Term Recommendations

1. **Multi-sig for Oracle Updates** - Require 2-of-3 signatures
2. **Timelock on Parameter Changes** - 24-48 hour delay for significant updates
3. **Formal Verification** - Audit critical invariants mathematically
4. **Bug Bounty Program** - Incentivize responsible disclosure
5. **Insurance Fund** - Reserve tokens for incident recovery

---

## Appendix A: Vulnerability Summary Table

| ID | Vulnerability | Severity | Status | Fix |
|----|---------------|----------|--------|-----|
| V1 | No minimum oracle price | Critical | ❌ Open | Add MIN_ORACLE_PRICE constant |
| V2 | No price change rate limit | High | ❌ Open | Add 50% max change per update |
| V3 | Price impact ignored in oracle | Critical | ❌ Open | Reject >5% impact quotes |
| V4 | Uncapped value-adjusted reward | Critical | ⚠️ Partial | Add absolute MAX_REWARD_PER_ACTION |
| V5 | No mint rate limiting | High | ❌ Open | Add per-hour mint cap |
| V6 | No emergency pause | High | ❌ Open | Add pause/unpause functions |
| V7 | Single oracle source | Medium | ❌ Open | Consider multi-source oracle |
| V8 | No TWAP, only spot price | Medium | ❌ Open | Implement TWAP sampling |

---

## Appendix B: Quick Reference - All Constants to Add

```rust
// Contract constants (lib.rs)
const MIN_ORACLE_PRICE: i128 = 10_000;           // 0.001 USDC minimum
const MAX_ORACLE_PRICE: i128 = 100_000_000_000;  // $10,000 maximum  
const MAX_ORACLE_CHANGE_PCT: i128 = 50;          // 50% max change per update
const MAX_REWARD_PER_ACTION: i128 = 10_000_000;  // 1 HITZ max per action
const MAX_MINT_PER_HOUR: i128 = 100_000_000_000; // 10,000 HITZ per hour
```

```typescript
// Oracle bot constants (oracle-bot.ts)
const MIN_ACCEPTABLE_PRICE_USDC = 0.0001;
const MAX_ACCEPTABLE_PRICE_USDC = 1000;
const MAX_PRICE_CHANGE_PERCENT = 30;
const MAX_ACCEPTABLE_PRICE_IMPACT = 5.0;
```

---

## Conclusion

This exploit was entirely preventable with basic security practices:
- Input validation with reasonable bounds
- Rate limiting on sensitive operations
- Defense in depth (multiple safety layers)
- Skepticism of external data sources

The tokenomics design that ties minting rate inversely to price creates an inherently unstable system. Consider decoupling oracle price from minting entirely, using it only for staking calculations where the risk is contained to individual users rather than total supply.

**The most important fix is also the simplest:** Add `MIN_ORACLE_PRICE = 10_000` to the contract. This single constant would have prevented the entire exploit.

---

*Report generated January 9, 2026*


