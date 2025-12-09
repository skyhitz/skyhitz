---
id: flows
title: User Action Flows
---

This page documents the complete flows for all user actions in the Skyhitz platform, showing how the dual-contract system (HITZ Token + Core Contract) work together.

## Action Flow Overview

All user actions follow this general pattern:

1. **User initiates action** (stream, like, download, mine, invest)
2. **Backend validates** user authentication and action parameters
3. **Core contract called** via `record_action(caller, entry_id, kind, amount_xlm?)`
4. **Core contract**:
   - Validates action and calculates difficulty
   - Transfers XLM fee from user to Treasury
   - Updates entry stats (escrow_xlm or tvl_xlm)
   - Requests HITZ reward from token contract
   - For mine/invest: locks user's HITZ stake
5. **HITZ token contract**:
   - Calculates current epoch and unit reward
   - Mints HITZ reward (difficulty × unit_reward)
   - Transfers HITZ to user
6. **Backend updates** Algolia index with new entry stats
7. **User receives** instant HITZ reward (and equity stake if mine/invest)

## Micro-spend Actions (Escrow)

These actions increase the entry's `escrow_xlm` without granting equity stakes. They earn instant HITZ rewards.

### Stream Action Flow

```
┌─────────────┐
│    User     │ Listens to track until completion
└──────┬──────┘
       │
       │ 1. Frontend detects playback completion
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ recordAction    │
└──────┬──────────┘
       │
       │ 2. Validate user session
       │ 3. Call Core contract
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  record_action()         │
└─┬───────┬────────┬───────┘
  │       │        │
  │       │        │ 4. Transfer 0.01 XLM to Treasury
  │       │        ▼
  │       │   ┌──────────┐
  │       │   │ Treasury │
  │       │   │  Wallet  │
  │       │   └──────────┘
  │       │
  │       │ 5. Update entry.escrow_xlm += 0.01
  │       │
  │       │ 6. Request reward (difficulty = 1)
  │       ▼
  │   ┌─────────────────┐
  │   │ HITZ Token      │
  │   │ mint_reward()   │ 7. Calculate: 1 × 0.3 = 0.3 HITZ
  │   └────────┬────────┘
  │            │
  │            │ 8. Mint and transfer to user
  │            ▼
  │        ┌────────┐
  │        │  User  │ Receives 0.3 HITZ
  │        └────────┘
  │
  │ 9. Return success
  ▼
┌─────────────────┐
│ Backend GraphQL │ 10. Update Algolia entry.escrow
└─────────────────┘
```

**Result**: User earns 0.3 HITZ instantly; entry's escrow increases by 0.01 XLM; no equity stake granted.

### Like Action Flow

Similar to Stream, but:
- **Fee**: 0.02 XLM (2× base fee)
- **Difficulty**: 2
- **Reward**: 0.6 HITZ (epoch 0)
- **Effect**: entry.escrow_xlm += 0.02

### Download Action Flow

Similar to Stream/Like, but:
- **Fee**: 0.03 XLM (3× base fee)
- **Difficulty**: 3
- **Reward**: 0.9 HITZ (epoch 0)
- **Effect**: entry.escrow_xlm += 0.03
- **Additional**: Backend authorizes download of audio file from R2

## Equity Actions (TVL)

These actions increase the entry's `tvl_xlm` and require staking HITZ tokens, granting proportional equity.

### Mine External Entry Flow

Mining brings external music (Audius, Sound.xyz) into Skyhitz and stakes the miner as the initial owner.

```
┌─────────────┐
│    User     │ Searches external sources, selects track
└──────┬──────┘
       │
       │ 1. User clicks "Mine" on external result
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ mineExternal    │
└──────┬──────────┘
       │
       │ 2. Validate user has 50+ HITZ balance
       │ 3. Fetch external metadata (title, artist, etc.)
       │ 4. Resolve audio stream URL
       │ 5. Pin audio file to R2 storage → audioCid
       │ 6. Pin image to R2 storage → imageCid
       │ 7. Build metadata JSON
       │ 8. Pin metadata to R2 → metaCid (entry ID)
       │
       │ 9. Call Core contract record_action
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  record_action()         │
│  (kind = 'mine')         │
└─┬───────┬────────┬───────┘
  │       │        │
  │       │        │ 10. Transfer 0.1 XLM to Treasury
  │       │        ▼
  │       │   ┌──────────┐
  │       │   │ Treasury │
  │       │   │  Wallet  │
  │       │   └──────────┘
  │       │
  │       │ 11. Update entry.tvl_xlm += 0.1
  │       │ 12. Create entry if doesn't exist
  │       │
  │       │ 13. Pull 50 HITZ from user
  │       ▼
  │   ┌─────────────────┐
  │   │ HITZ Token      │
  │   │ transfer()      │ 14. Transfer 50 HITZ from user to contract
  │   └────────┬────────┘
  │            │
  │            │ 15. Record user stake: stakes[user][entry] = 50
  │            │     entry.total_staked = 50
  │            │
  │            │ 16. Request reward (difficulty = 10)
  │            ▼
  │        ┌─────────────────┐
  │        │ HITZ Token      │
  │        │ mint_reward()   │ 17. Calculate: 10 × 0.3 = 3.0 HITZ
  │        └────────┬────────┘
  │                 │
  │                 │ 18. Mint and transfer to user
  │                 ▼
  │             ┌────────┐
  │             │  User  │ Receives 3.0 HITZ
  │             └────────┘
  │
  │ 19. Return success
  ▼
┌─────────────────┐
│ Backend GraphQL │ 20. Index to Algolia:
│                 │     - Entry metadata
│                 │     - tvl_xlm = 0.1
│                 │     - total_staked = 50 HITZ
│                 │ 21. Update user's stakes in Algolia
└─────────────────┘
```

**Result**: 
- User pays 0.1 XLM + stakes 50 HITZ
- User earns 3.0 HITZ instantly (net cost: 47 HITZ)
- Entry created with tvl = 0.1 XLM, total_staked = 50 HITZ
- User owns 100% of entry (50 / 50)
- User can claim future rewards proportionally

### Invest on Existing Entry Flow

Investing increases your stake in an existing entry.

```
┌─────────────┐
│    User     │ Views entry, clicks "Invest 1 XLM"
└──────┬──────┘
       │
       │ 1. Frontend validates: user has 1 XLM + 50 HITZ
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ investEntry     │
└──────┬──────────┘
       │
       │ 2. Validate user session
       │ 3. Calculate difficulty: 1 XLM = 10 difficulty
       │ 4. Required stake: 10 × 5 = 50 HITZ
       │
       │ 5. Call Core contract record_action
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  record_action()         │
│  (kind = 'invest',       │
│   amount_xlm = 1.0)      │
└─┬───────┬────────┬───────┘
  │       │        │
  │       │        │ 6. Transfer 1.0 XLM to Treasury
  │       │        ▼
  │       │   ┌──────────┐
  │       │   │ Treasury │
  │       │   │  Wallet  │
  │       │   └──────────┘
  │       │
  │       │ 7. Update entry.tvl_xlm += 1.0
  │       │
  │       │ 8. Pull 50 HITZ from user
  │       ▼
  │   ┌─────────────────┐
  │   │ HITZ Token      │
  │   │ transfer()      │ 9. Transfer 50 HITZ from user to contract
  │   └────────┬────────┘
  │            │
  │            │ 10. Update stakes:
  │            │     stakes[user][entry] += 50
  │            │     entry.total_staked += 50
  │            │
  │            │ 11. Request reward (difficulty = 10)
  │            ▼
  │        ┌─────────────────┐
  │        │ HITZ Token      │
  │        │ mint_reward()   │ 12. Calculate: 10 × 0.3 = 3.0 HITZ
  │        └────────┬────────┘
  │                 │
  │                 │ 13. Mint and transfer to user
  │                 ▼
  │             ┌────────┐
  │             │  User  │ Receives 3.0 HITZ
  │             └────────┘
  │
  │ 14. Return success
  ▼
┌─────────────────┐
│ Backend GraphQL │ 15. Fetch updated entry stats
│                 │ 16. Update Algolia:
│                 │     - entry.tvl_xlm
│                 │     - entry.total_staked
│                 │ 17. Update user's stake
└─────────────────┘
```

**Result**:
- User pays 1 XLM + stakes 50 HITZ
- User earns 3.0 HITZ instantly (net cost: 47 HITZ)
- Entry's tvl increases by 1 XLM
- Entry's total_staked increases by 50 HITZ
- User's ownership percentage: `user_stake / total_staked`
- User can claim proportional rewards

## Claiming Rewards Flow

Users with stakes can claim accumulated HITZ rewards from entry pools.

```
┌─────────────┐
│    User     │ Views entry, sees claimable rewards
└──────┬──────┘
       │
       │ 1. Frontend calls preview API
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ getClaimable    │ 2. Read-only: calculate claimable
└──────┬──────────┘     = (user_stake/total) × pool - claimed
       │
       │ 3. If claimable > 0, enable "Claim" button
       │ 4. User clicks "Claim"
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ claimRewards    │
└──────┬──────────┘
       │
       │ 5. Call Core contract claim_rewards
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  claim_rewards()         │
└─┬────────────────────────┘
  │
  │ 6. Verify user has stake in entry
  │ 7. Calculate ownership: user_stake / total_staked
  │ 8. Calculate claimable:
  │    share = ownership × reward_pool
  │    claimable = share - claimed_rewards[user]
  │
  │ 9. Update claimed_rewards[user] += claimable
  │
  │ 10. Transfer HITZ from contract to user
  ▼
┌─────────────────┐
│ HITZ Token      │
│ transfer()      │ 11. Transfer claimable HITZ to user
└────────┬────────┘
         │
         │ 12. Return claimed amount
         ▼
     ┌────────┐
     │  User  │ Receives claimed HITZ
     └────────┘
```

**Result**:
- User receives claimable HITZ
- User's stake remains unchanged
- User's claimed record updated
- User can claim again when pool grows

## Artist Equity Claim Flow

Verified artists with non-dilutable equity can claim their share of rewards.

```
┌─────────────┐
│   Artist    │ Verified artist with 20% equity on entry
└──────┬──────┘
       │
       │ 1. Frontend calls preview API
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ getArtistEquity │ 2. Read-only: get equity info
└──────┬──────────┘     (equity_bps, claimed, claimable)
       │
       │ 3. If claimable > 0, enable "Claim" button
       │ 4. Artist clicks "Claim"
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ claimArtistEquity│
└──────┬──────────┘
       │
       │ 5. Call Core contract claim_artist_equity
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  claim_artist_equity()   │
└─┬────────────────────────┘
  │
  │ 6. Verify artist has equity on this entry
  │ 7. Calculate artist's share:
  │    total_share = reward_pool × (equity_bps / 10000)
  │    claimable = total_share - already_claimed
  │
  │ 8. Update artist's claimed record
  │
  │ 9. Transfer HITZ from contract to artist
  ▼
┌─────────────────┐
│ HITZ Token      │
│ transfer()      │ 10. Transfer claimable HITZ to artist
└────────┬────────┘
         │
         │ 11. Return claimed amount
         ▼
     ┌────────┐
     │ Artist │ Receives claimed HITZ
     └────────┘
```

**Result**:
- Artist receives their non-dilutable share of rewards
- Artist's claimed record updated
- Staker rewards are unaffected (calculated separately)
- Artist can claim again when pool grows

**Key Difference from Staker Claims**:
- Artist equity is calculated BEFORE staker pool
- Artist share = `reward_pool × artist_equity_bps / 10000`
- Staker pool = `reward_pool × (10000 - total_artist_equity_bps) / 10000`
- Artist claim doesn't depend on stake, only on equity percentage

## Treasury Bot Flow

The Treasury bot automates conversion of XLM fees to HITZ rewards and distribution.

```
┌──────────────────┐
│  Treasury Bot    │ Runs on schedule (hourly/daily)
│  (Automated)     │
└────────┬─────────┘
         │
         │ 1. Check Treasury wallet XLM balance
         │ 2. If balance > threshold, proceed
         │
         │ 3. Buy HITZ on Stellar DEX
         ▼
┌────────────────────┐
│   Stellar DEX      │
│   (XLM/HITZ pair)  │ 4. Convert accumulated XLM → HITZ
└────────┬───────────┘
         │
         │ 5. Treasury now has HITZ tokens
         │ 6. Call Core contract distribute_rewards
         ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  distribute_rewards()    │
│  (caller = Treasury)     │
└─┬────────────────────────┘
  │
  │ 7. Verify caller is Treasury address
  │ 8. Transfer HITZ from Treasury to contract
  │
  │ 9. Calculate total escrow across all entries
  │    total_escrow = sum(all entry.escrow_xlm)
  │
  │ 10. For each entry with escrow > 0:
  │     entry_share = (entry.escrow_xlm / total_escrow) × hitz_amount
  │     entry.reward_pool += entry_share
  │
  │ 11. All reward pools updated proportionally
  │
  │ 12. Return success
  ▼
┌──────────────────┐
│  Treasury Bot    │ 13. Log distribution results
└──────────────────┘
```

**Key Points**:
- Bot only handles XLM → HITZ conversion
- Contract handles all distribution logic
- Distribution is proportional to escrow performance
- Entries with more stream/like/download activity get more rewards
- This benefits stakers proportionally

**Example Distribution**:
```
Total HITZ to distribute: 1000

Entry A: 500 XLM escrow (50%) → gets 500 HITZ
Entry B: 300 XLM escrow (30%) → gets 300 HITZ
Entry C: 200 XLM escrow (20%) → gets 200 HITZ

Stakers in each entry can then claim proportionally.
```

## Admin Operations

### Remove Entry Flow

Admin can remove entries when necessary (takedowns, violations, etc.):

```
1. Admin calls remove_entry(entry_id) on Core contract
2. Contract marks entry as removed
3. Backend detects removal
4. Backend deletes from Algolia index
5. Backend deletes from R2 storage (metadata, audio, image)
```

**Note**: In the current implementation, stakes are not automatically returned. Future versions may implement pro-rata returns.

## Key Flow Differences from Old System

| Aspect | Old System | New System |
|--------|------------|------------|
| **Contract Calls** | `invest(user, id, amount)` | `record_action(caller, id, kind, amount?)` |
| **Rewards** | None (only earned via APR) | Instant HITZ on every action |
| **Equity** | Shares granted if amount > 0.3 XLM | Stakes granted for mine/invest only |
| **Claiming** | `claim_earnings()` (XLM escrow) | `claim_rewards()` (HITZ from pool) |
| **APR Source** | Excess XLM escrow | HITZ reward pool growth |
| **Selling** | `sell_shares()` available | Not available (stake to earn only) |

## Flow Summary

1. **Micro-spends** (stream/like/download): Pay small XLM fee → earn instant HITZ → increase entry escrow
2. **Equity** (mine/invest): Pay XLM + stake HITZ → earn instant HITZ → gain ownership → earn ongoing rewards
3. **Treasury**: Collects XLM → buys HITZ → distributes to entry pools based on escrow
4. **Claiming**: Stakers claim proportional rewards from entry pools
5. **Result**: Sustainable economy where engagement (escrow) drives reward distribution to investors (stakers)
