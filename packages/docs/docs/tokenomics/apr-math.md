---
id: apr-math
title: APR Calculation & Math
---

This page explains how APR (Annual Percentage Rate) is calculated in the post-exhaustion HITZ token system.

## Units

- **HITZ**: 1 HITZ = 10,000,000 stroops (7 decimals)
- Contract values use `i128` stroops for precision
- APR returned in basis points (100 = 1%, 10000 = 100%)

## APR System

In the post-exhaustion model, APR represents the annualized return rate for stakers based on HITZ reward pool growth from treasury distributions.

### APR Formula

```
APR = ((reward_pool / total_staked) / days_since_creation) × 365 × 10000
```

**Returns**: APR in basis points (1% = 100, 10% = 1000, 100% = 10000)

### Formula Components

| Component | Description | Units |
|-----------|-------------|-------|
| `reward_pool` | Total HITZ allocated to entry from treasury distributions | HITZ (stroops) |
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
   - Example: 2.433 × 10000 = 24,330 basis points

## APR Examples

### Example 1: New Entry with Early Rewards

```
Entry Stats:
- Created: 30 days ago
- Total Staked: 500 HITZ
- Reward Pool: 100 HITZ

Calculation:
- Daily return: 100 / 500 = 0.2 = 20%
- Daily rate: 20% / 30 = 0.667% per day
- Annual rate: 0.667% × 365 = 243.3%
- APR: 24,330 basis points
```

**Interpretation**: If reward accumulation continues at this rate, stakers could expect ~243% annual returns.

### Example 2: Mature Entry with Stable Rewards

```
Entry Stats:
- Created: 90 days ago
- Total Staked: 2000 HITZ
- Reward Pool: 500 HITZ

Calculation:
- Daily return: 500 / 2000 = 0.25 = 25%
- Daily rate: 25% / 90 = 0.278% per day
- Annual rate: 0.278% × 365 = 101.4%
- APR: 10,140 basis points
```

### Example 3: Highly Staked Entry

```
Entry Stats:
- Created: 60 days ago
- Total Staked: 5000 HITZ
- Reward Pool: 1000 HITZ

Calculation:
- Daily return: 1000 / 5000 = 0.2 = 20%
- Daily rate: 20% / 60 = 0.333% per day
- Annual rate: 0.333% × 365 = 121.7%
- APR: 12,170 basis points
```

### Example 4: New Entry, Low Activity

```
Entry Stats:
- Created: 7 days ago
- Total Staked: 1000 HITZ
- Reward Pool: 50 HITZ

Calculation:
- Daily return: 50 / 1000 = 0.05 = 5%
- Daily rate: 5% / 7 = 0.714% per day
- Annual rate: 0.714% × 365 = 260.7%
- APR: 26,070 basis points
```

### APR Comparison Table

| Pool Size | Total Stake | Days Elapsed | Daily Return | APR (%) | APR (bps) |
|-----------|-------------|--------------|--------------|---------|-----------|
| 100 HITZ | 500 HITZ | 30 | 20% | 243% | 24,330 |
| 500 HITZ | 2000 HITZ | 60 | 25% | 152% | 15,210 |
| 1000 HITZ | 5000 HITZ | 90 | 20% | 81% | 8,110 |
| 50 HITZ | 1000 HITZ | 7 | 5% | 261% | 26,070 |
| 2000 HITZ | 10000 HITZ | 120 | 20% | 61% | 6,080 |

## Factors Affecting APR

### 1. Treasury Distribution Rate

The treasury distributes 0.05% of its balance daily:
- Larger treasury = more HITZ distributed
- More entries with escrow = more dilution
- Entry's escrow share determines allocation

### 2. Entry Engagement (Escrow)

Entries with more engagement get more treasury distributions:
- More streams → higher escrow → larger distribution share
- More likes → higher escrow → larger distribution share
- Higher escrow → faster reward pool growth → higher APR

### 3. Staking Competition

As more users stake in an entry:
- Total stake increases
- Individual ownership decreases (dilution)
- APR decreases (same rewards, more stakers)
- First movers get advantage

### 4. Time Factor

APR normalizes over time:
- New entries may show volatile APRs
- Mature entries show more stable APRs
- APR averages over entire entry lifetime

### 5. Artist Equity

If entry has artist equity:
- Staker pool = reward_pool × (1 - artist_equity%)
- APR calculated on staker pool, not total pool
- Example: 20% artist equity → stakers share 80% of rewards

## APR vs. Actual Returns

**Important**: APR is an **annualized projection**, not a guarantee.

### What APR Shows
- Historical rate of reward accumulation
- Projected return if current rate continues
- Comparison metric between entries

### What APR Doesn't Account For
- Future treasury distribution changes
- Changes in total stake (dilution)
- Entry engagement trends
- Artist equity claims
- Unstaking by other users

### Example Variance

```
Current State:
- APR: 200% (20,000 basis points)
- Your stake: 100 HITZ
- Projected annual return: 200 HITZ

Future Scenarios:

Scenario A: More stakers join
- 500 more HITZ staked
- Your ownership drops
- Actual return: 100 HITZ (lower than projected)

Scenario B: Entry becomes popular
- More streams/likes → higher escrow
- Entry gets larger treasury share
- Actual return: 300 HITZ (higher than projected)

Scenario C: Treasury depletes
- Distribution rate stays 0.05%
- But 0.05% of smaller balance = less HITZ
- Actual return: 150 HITZ (lower than projected)
```

## On-Chain Calculation

The APR calculation is performed on-chain in the Core contract:

```rust
pub fn calculate_apr(e: Env, entry_id: String) -> i128 {
    let entry = get_entry(&e, &entry_id);
    let total_stake = get_stake_total(&e, entry_id.clone());
    let reward_pool = get_reward_pool(&e, entry_id);
    
    if total_stake == 0 {
        return 0;
    }
    
    let now = e.ledger().timestamp();
    let seconds_elapsed = now.saturating_sub(entry.created_at);
    let days_elapsed = seconds_elapsed / 86_400;
    
    if days_elapsed == 0 {
        return 0;
    }
    
    // (pool / stake / days) × 365 × 10000
    let daily_return = reward_pool
        .checked_mul(10_000)
        .and_then(|v| v.checked_div(total_stake))
        .unwrap_or(i128::MAX);
        
    let annual_return = daily_return
        .checked_mul(365)
        .and_then(|v| v.checked_div(days_elapsed as i128))
        .unwrap_or(i128::MAX);

    // Cap at 1,000,000% (10,000,000 basis points)
    annual_return.min(10_000_000)
}
```

## APR with Artist Equity

When an entry has artist equity, the APR shown is for the **staker pool**:

```
Staker Pool = Reward Pool × (10000 - artist_equity_bps) / 10000

Staker APR = ((staker_pool / total_stake) / days) × 365 × 10000
```

### Example with 20% Artist Equity

```
Entry Stats:
- Created: 30 days ago
- Total Staked: 500 HITZ
- Reward Pool: 100 HITZ
- Artist Equity: 20% (2000 bps)

Staker Pool: 100 × 80% = 80 HITZ

APR Calculation:
- Daily return: 80 / 500 = 0.16 = 16%
- Daily rate: 16% / 30 = 0.533% per day
- Annual rate: 0.533% × 365 = 194.7%
- APR: 19,470 basis points
```

## Practical Implications

### For Users

1. **Higher APR = Better Returns** (generally)
   - But consider entry age and stability
   - Young entries may have inflated APRs

2. **Staking Early = Higher APR**
   - Less competition = higher ownership
   - But also higher risk if entry doesn't perform

3. **Popular Entries = More Rewards**
   - Higher escrow = more treasury distributions
   - But also attracts more stakers (dilution)

4. **Long-term Strategy**
   - Stake in quality entries with consistent engagement
   - Diversify across multiple entries
   - Claim rewards periodically

### For Platform Monitoring

1. **APR Trends**
   - Track APR across entries over time
   - Identify high-performing entries
   - Monitor for unusual APR spikes

2. **Treasury Health**
   - APR depends on treasury distributions
   - Monitor treasury balance projections
   - 0.05% rate ensures 12+ year runway

3. **Engagement Correlation**
   - High escrow entries should have higher APR
   - Low engagement = low distributions = low APR

## Summary

- **APR Formula**: `(pool / stake / days) × 365 × 10000`
- **Units**: Basis points (10000 = 100%)
- **Source**: Treasury distributions (0.05% daily)
- **Factors**: Escrow, stake, time, artist equity
- **Purpose**: Compare investment opportunities
- **Limitation**: Historical projection, not guarantee
