---
id: apr-math
title: APR Calculation & Math
---

This page explains how APR (Annual Percentage Rate) is calculated in the new HITZ token system and how it differs from the old system.

## Units

- **XLM**: 1 XLM = 10,000,000 stroops
- **HITZ**: 1 HITZ = 10,000,000 stroops (7 decimals)
- Contract values use `i128` stroops for precision
- Proportional math uses `SCALE = 1_000_000` (6 decimals) to reduce rounding errors

## New APR System (HITZ Rewards)

In the new system, APR represents the annualized return rate for stakers based on HITZ reward pool growth.

### APR Formula

```
APR = ((reward_pool / total_staked) / days_since_creation) × 365 × 10000
```

**Returns**: APR in basis points (1% = 100, 10% = 1000, 100% = 10000)

### Formula Components

| Component | Description | Units |
|-----------|-------------|-------|
| `reward_pool` | Total HITZ allocated to entry from Treasury distributions | HITZ (stroops) |
| `total_staked` | Sum of all users' HITZ stakes in this entry | HITZ (stroops) |
| `days_since_creation` | Days elapsed since entry was created | Days |
| `365` | Days in a year for annualization | Days |
| `10000` | Conversion to basis points | Multiplier |

### Calculation Steps

1. **Daily Return**: `reward_pool / total_staked`
   - This is the total return available to stakers
   - Example: 100 HITZ rewards / 500 HITZ staked = 0.2 = 20% total return

2. **Daily Rate**: `daily_return / days_since_creation`
   - Averages the return over time
   - Example: 20% / 30 days = 0.667% per day

3. **Annualized Rate**: `daily_rate × 365`
   - Projects the daily rate to a full year
   - Example: 0.667% × 365 = 243.3% annual

4. **Basis Points**: `annual_rate × 10000`
   - Converts percentage to basis points for storage
   - Example: 243.3% × 100 = 24,330 basis points

### APR Example Scenarios

#### Scenario 1: New Entry with Early Rewards

```
Entry Stats:
- Created: 30 days ago
- Total Staked: 500 HITZ
- Reward Pool: 100 HITZ (from Treasury distributions)

Calculation:
- Daily return: 100 / 500 = 0.2 = 20%
- Daily rate: 20% / 30 = 0.667% per day
- Annual rate: 0.667% × 365 = 243.3%
- APR: 24,330 basis points (243.3%)
```

**Interpretation**: Stakers can expect ~243% annual returns if reward accumulation continues at this rate.

#### Scenario 2: Mature Entry with Stable Rewards

```
Entry Stats:
- Created: 90 days ago
- Total Staked: 2000 HITZ
- Reward Pool: 500 HITZ

Calculation:
- Daily return: 500 / 2000 = 0.25 = 25%
- Daily rate: 25% / 90 = 0.278% per day
- Annual rate: 0.278% × 365 = 101.4%
- APR: 10,140 basis points (101.4%)
```

#### Scenario 3: Highly Staked Entry

```
Entry Stats:
- Created: 60 days ago
- Total Staked: 5000 HITZ
- Reward Pool: 1000 HITZ

Calculation:
- Daily return: 1000 / 5000 = 0.2 = 20%
- Daily rate: 20% / 60 = 0.333% per day
- Annual rate: 0.333% × 365 = 121.7%
- APR: 12,170 basis points (121.7%)
```

#### Scenario 4: New Entry, Low Activity

```
Entry Stats:
- Created: 7 days ago
- Total Staked: 1000 HITZ
- Reward Pool: 50 HITZ

Calculation:
- Daily return: 50 / 1000 = 0.05 = 5%
- Daily rate: 5% / 7 = 0.714% per day
- Annual rate: 0.714% × 365 = 260.7%
- APR: 26,070 basis points (260.7%)
```

### APR Comparison Table

| Pool Size | Total Stake | Days Elapsed | Daily Return | Daily Rate | APR (%) | APR (basis points) |
|-----------|-------------|--------------|--------------|------------|---------|-------------------|
| 100 HITZ | 500 HITZ | 30 | 20% | 0.667% | 243.3% | 24,330 |
| 500 HITZ | 2000 HITZ | 60 | 25% | 0.417% | 152.1% | 15,210 |
| 1000 HITZ | 5000 HITZ | 90 | 20% | 0.222% | 81.1% | 8,110 |
| 50 HITZ | 1000 HITZ | 7 | 5% | 0.714% | 260.7% | 26,070 |
| 2000 HITZ | 10000 HITZ | 120 | 20% | 0.167% | 60.8% | 6,080 |

### Factors Affecting APR

1. **Treasury Bot Activity**
   - More frequent distributions → faster reward pool growth
   - Higher HITZ purchases → larger distributions

2. **Entry Performance (Escrow)**
   - More streams/likes/downloads → higher escrow
   - Higher escrow → larger share of Treasury distributions
   - Larger distributions → higher APR

3. **Staking Competition**
   - More stakers → higher total_staked
   - Higher total_staked → lower APR (diluted)
   - First movers get advantage

4. **Time Factor**
   - Newer entries show higher APR (less time to average)
   - Mature entries show more stable APR
   - APR normalizes over time

5. **Epoch Changes (Halving)**
   - Every 4 years, HITZ emission halves
   - Less HITZ minted → slower reward pool growth
   - Lower reward growth → declining APRs over time

### APR vs. Actual Returns

**Important**: APR is an **annualized projection**, not a guarantee.

- APR projects current rate over 365 days
- Actual returns depend on:
  - Future Treasury distributions
  - Changes in total stake (dilution)
  - Entry performance trends
  - Epoch transitions

**Example**:
```
Current APR: 200%
Your stake: 100 HITZ
Projected annual return: 200 HITZ

BUT actual return may vary based on:
- If 500 more HITZ are staked → dilution → lower returns
- If Treasury distributes more → higher returns
- If entry loses popularity → lower distributions → lower returns
```

## Old System (For Reference)

In the old system, APR was based on excess XLM escrow:

### Old APR Formula

```
if tvl == 0 or escrow <= tvl:
  apr = 0
else:
  apr = ((escrow - tvl) * 100) / tvl
```

This calculated a simple percentage based on how much escrow exceeded TVL.

### Old Mining Partition

The old system also used "top APR" to determine mining allocation:

1. Fetch top APR from Algolia
2. Calculate escrow allocation: `min(1 XLM × topAPR% / 100, 0.3 XLM)`
3. Remaining split 50/50: issuer payment and user equity

**Example**:
```
Top APR: 25%
Escrow allocation: min(1 × 0.25, 0.3) = 0.25 XLM
Remaining: 1 - 0.25 = 0.75 XLM
Issuer payment: 0.375 XLM
User equity: 0.375 XLM
```

This approach is **no longer used** in the new system.

## Key Differences: Old vs. New

| Aspect | Old System | New System |
|--------|------------|------------|
| **APR Source** | Excess XLM escrow over TVL | HITZ reward pool growth |
| **APR Unit** | Percentage (0-100+) | Basis points (0-100,000+) |
| **APR Formula** | `(escrow - tvl) / tvl × 100` | `(pool / stake / days) × 365 × 10000` |
| **Returns** | XLM from escrow | HITZ from reward pools |
| **Time Factor** | Not considered | Annualized over days elapsed |
| **Mining Use** | Determines escrow allocation | Not used (fixed 0.1 XLM mine cost) |

## Practical Implications

### For Users

1. **Higher APR = Better Returns** (generally)
   - But consider entry age and stability
   - Young entries may have inflated APRs

2. **Staking Early = Higher APR**
   - Less competition = higher returns
   - But also higher risk if entry doesn't perform

3. **Popular Entries = More Rewards**
   - Higher escrow = more Treasury distributions
   - But also attracts more stakers (dilution)

4. **Long-term Strategy**
   - Stake in quality entries with consistent engagement
   - Diversify across multiple entries
   - Claim rewards periodically

### For Platform

1. **APR Drives Staking Decisions**
   - High APR attracts stakers
   - Must balance reward distribution fairly

2. **Treasury Bot Frequency Matters**
   - More frequent distributions = smoother APR
   - Less frequent = spikier APR

3. **Emission Schedule Impact**
   - Early years: abundant HITZ, high APRs
   - Later years: scarce HITZ, lower APRs, higher token value

## On-Chain Calculation

The APR calculation is performed on-chain in the Core contract:

```rust
pub fn calculate_apr(e: Env, entry_id: String) -> i128 {
    let entry = get_entry_or_panic(&e, &entry_id);
    
    if entry.total_staked == 0 {
        return 0;
    }
    
    let now = e.ledger().timestamp();
    let days_elapsed = (now - entry.created_at) / 86400;
    
    if days_elapsed == 0 {
        return 0;
    }
    
    // reward_pool / total_staked / days × 365 × 10000
    let daily_rate = (entry.reward_pool * SCALE) / entry.total_staked;
    let annual_rate = (daily_rate * 365) / days_elapsed;
    (annual_rate * 10000) / SCALE
}
```

**Note**: This calculation is also performed automatically whenever:
- Rewards are distributed
- Rewards are claimed
- Stakes are added

The result is stored in `entry.apr` and synced to Algolia for search/filtering.

## Summary

- **New APR**: Annualized return rate based on HITZ reward pool growth over time
- **Formula**: `(reward_pool / total_staked / days) × 365 × 10000` (basis points)
- **Dynamic**: Changes with Treasury distributions, staking activity, and time
- **Projection**: Not guaranteed; actual returns may vary
- **Purpose**: Helps users compare entry investment opportunities
