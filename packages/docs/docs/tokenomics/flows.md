---
id: flows
title: User Action Flows
---

This page documents the complete flows for all user actions in the Skyhitz platform, showing how the post-exhaustion distribution model works.

## Action Flow Overview

All user actions follow this general pattern:

1. **User initiates action** (stream, like, download, mine, invest)
2. **Backend validates** user authentication and action parameters
3. **Core contract called** via `record_action(caller, entry_id, kind, amount?)`
4. **Core contract**:
   - Validates action and calculates fee
   - For non-staking: Transfers fee to Treasury, updates escrow
   - For staking: Transfers fee to Contract, records stake
5. **Backend updates** Algolia index with new entry stats
6. **User completes** action (no instant minting - rewards come from treasury)

**Key Difference from V1**: No instant HITZ rewards. Users pay fees, and rewards accumulate through treasury distribution.

## Non-Staking Actions (Escrow)

These actions increase the entry's `escrow` without granting equity stakes.

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
       │ 2. Validate user session & HITZ balance
       │ 3. Call Core contract
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  record_action()         │
│  (kind = 'stream')       │
└─┬───────────────────────┘
  │
  │ 4. Calculate fee: 0.1 HITZ (base_fee × 1)
  │
  │ 5. Transfer 0.1 HITZ from user to Treasury
  ▼
┌──────────┐
│ Treasury │ Collects fee
│  Wallet  │
└──────────┘
  │
  │ 6. Update entry.escrow += 0.1 HITZ
  │
  │ NOTE: No minting - supply exhausted
  ▼
┌─────────────────┐
│ Backend GraphQL │ 7. Update Algolia entry.escrow
└─────────────────┘
```

**Result**: 
- User pays 0.1 HITZ
- Entry's escrow increases by 0.1 HITZ
- Entry gets larger share of future treasury distributions
- No instant reward (rewards come from treasury distribution)

### Like Action Flow

Similar to Stream, but:
- **Fee**: 0.2 HITZ (base_fee × 2)
- **Difficulty**: 2
- **Effect**: entry.escrow += 0.2 HITZ

### Download Action Flow

Similar to Stream/Like, but:
- **Fee**: 0.3 HITZ (base_fee × 3)
- **Difficulty**: 3
- **Effect**: entry.escrow += 0.3 HITZ
- **Additional**: Backend authorizes download of audio file from R2

## Staking Actions (TVL)

These actions increase the entry's `tvl` and stake HITZ tokens, granting proportional equity.

### Mine External Entry Flow

Mining brings external music (Audius, etc.) into Skyhitz and stakes the miner as the initial owner.

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
       │ 2. Validate user has 1+ HITZ balance
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
└─┬───────────────────────┘
  │
  │ 10. Calculate fee: 1.0 HITZ (base_fee × 10)
  │
  │ 11. Transfer 1 HITZ from user to Contract
  │     (fee becomes stake - 1:1 ratio)
  ▼
┌─────────────────┐
│ Skyhitz Core    │
│ (stake storage) │
└─────────────────┘
  │
  │ 12. Record stake:
  │     stakes[user][entry] = 1 HITZ
  │     entry.total_stake = 1 HITZ
  │     entry.tvl = 1 HITZ
  │
  │ NOTE: No minting - stake IS the fee
  ▼
┌─────────────────┐
│ Backend GraphQL │ 13. Index to Algolia:
│                 │     - Entry metadata
│                 │     - tvl = 1 HITZ
│                 │     - total_staked = 1 HITZ
│                 │ 14. Update user's stakes
└─────────────────┘
```

**Result**: 
- User pays 1 HITZ as stake
- Entry created with tvl = 1 HITZ, total_stake = 1 HITZ
- User owns 100% of entry (1 / 1)
- User can claim future rewards proportionally
- No instant reward

### Invest on Existing Entry Flow

Investing increases your stake in an existing entry.

```
┌─────────────┐
│    User     │ Views entry, clicks "Invest 10 HITZ"
└──────┬──────┘
       │
       │ 1. Frontend validates: user has 10+ HITZ
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ investEntry     │
└──────┬──────────┘
       │
       │ 2. Validate user session
       │ 3. Validate amount >= 3 HITZ minimum
       │
       │ 4. Call Core contract record_action
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  record_action()         │
│  (kind = 'invest',       │
│   amount = 10 HITZ)      │
└─┬───────────────────────┘
  │
  │ 5. Validate: amount >= 3 HITZ (minimum)
  │
  │ 6. Transfer 10 HITZ from user to Contract
  │    (fee = stake, 1:1 ratio)
  ▼
┌─────────────────┐
│ Skyhitz Core    │
│ (stake storage) │
└─────────────────┘
  │
  │ 7. Update stakes:
  │    stakes[user][entry] += 10 HITZ
  │    entry.total_stake += 10 HITZ
  │    entry.tvl += 10 HITZ
  │
  │ NOTE: No minting - stake IS the fee
  ▼
┌─────────────────┐
│ Backend GraphQL │ 8. Update Algolia:
│                 │    - entry.tvl
│                 │    - entry.total_staked
│                 │ 9. Update user's stake
└─────────────────┘
```

**Result**:
- User pays 10 HITZ as stake
- Entry's tvl increases by 10 HITZ
- Entry's total_stake increases by 10 HITZ
- User's ownership percentage: `user_stake / total_stake`
- User can claim proportional rewards

## Treasury Distribution Flow

The Treasury bot distributes HITZ to entry reward pools daily.

```
┌──────────────────┐
│  Treasury Bot    │ Runs daily (0.05% rate)
│  (Automated)     │
└────────┬─────────┘
         │
         │ 1. Check Treasury HITZ balance
         │    (e.g., 15,000,000 HITZ)
         │
         │ 2. Calculate daily distribution:
         │    15,000,000 × 0.05% = 7,500 HITZ
         │
         │ 3. Call Core contract (3-phase batch)
         ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  distribute_rewards()    │
│  (caller = Treasury)     │
└─┬────────────────────────┘
  │
  │ Phase 1: Calculate total escrow
  │   for each entry batch (40 at a time):
  │     total_escrow += entry.escrow
  │
  │ Phase 2: Initialize distribution
  │   Transfer 7,500 HITZ from Treasury to Contract
  │
  │ Phase 3: Distribute to entries
  │   for each entry batch (15 at a time):
  │     if entry.escrow > 0:
  │       share = (entry.escrow / total_escrow) × 7,500
  │       entry.reward_pool += share
  │
  ▼        ▼        ▼
Entry A  Entry B  Entry C
+3,750   +2,250   +1,500
HITZ     HITZ     HITZ
(50%)    (30%)    (20%)
```

**Example Distribution**:
```
Total HITZ to distribute: 7,500
Total escrow: 1,000 HITZ

Entry A: 500 HITZ escrow (50%) → gets 3,750 HITZ
Entry B: 300 HITZ escrow (30%) → gets 2,250 HITZ
Entry C: 200 HITZ escrow (20%) → gets 1,500 HITZ

Stakers in each entry can then claim proportionally.
```

**Key Points**:
- Only 0.05% of treasury distributed per day
- Distribution proportional to escrow (engagement)
- Entries with more activity get more rewards
- Creates sustainable 12+ year emission curve

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
│ getClaimable    │ 2. Read-only calculation:
└──────┬──────────┘     staker_pool = pool × (1 - artist_equity)
       │                claimable = (stake/total) × staker_pool - claimed
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
  │ 7. Calculate staker pool (exclude artist equity)
  │ 8. Calculate ownership: user_stake / total_stake
  │ 9. Calculate claimable:
  │    share = ownership × staker_pool
  │    claimable = share - claimed[user]
  │
  │ 10. Update claimed[user] += claimable
  │
  │ 11. Transfer HITZ from contract to user
  ▼
┌─────────────────┐
│ HITZ Token      │
│ transfer()      │ 12. Transfer claimable HITZ to user
└────────┬────────┘
         │
         │ 13. Return claimed amount
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

**Key Difference from Staker Claims**:
- Artist equity is calculated BEFORE staker pool
- Artist share = `reward_pool × artist_equity_bps / 10000`
- Staker pool = `reward_pool × (10000 - total_artist_equity_bps) / 10000`
- Artist claim doesn't depend on stake, only on equity percentage

## Unstaking Flow

Users can withdraw their staked HITZ at any time.

```
┌─────────────┐
│    User     │ Wants to unstake 50 HITZ
└──────┬──────┘
       │
       │ 1. Frontend calls unstake API
       ▼
┌─────────────────┐
│ Backend GraphQL │
│ unstakeEntry    │
└──────┬──────────┘
       │
       │ 2. Call Core contract unstake
       ▼
┌──────────────────────────┐
│  Skyhitz Core Contract   │
│  unstake()               │
└─┬────────────────────────┘
  │
  │ 3. Verify user has enough stake
  │
  │ 4. Update stakes:
  │    stakes[user][entry] -= 50 HITZ
  │    entry.total_stake -= 50 HITZ
  │
  │ 5. Transfer 50 HITZ back to user
  ▼
┌─────────────────┐
│ HITZ Token      │
│ transfer()      │ 6. Transfer 50 HITZ to user
└────────┬────────┘
         │
         ▼
     ┌────────┐
     │  User  │ Receives 50 HITZ
     └────────┘
```

**Result**:
- User receives their staked HITZ back
- User's stake in entry decreases
- User's ownership percentage decreases
- User keeps any already-claimed rewards

## Admin Operations

### Remove Entry Flow

Admin can remove entries when necessary (takedowns, violations, etc.):

```
1. Admin calls remove_entry(entry_id, stakers) on Core contract
2. Contract returns stakes to all stakers
3. Contract removes entry data
4. Backend detects removal
5. Backend deletes from Algolia index
6. Backend deletes from R2 storage (metadata, audio, image)
```

**Note**: Stakes are automatically returned to users via the stakers list.

### Merge Entry Flow

Admin can merge duplicate entries:

```
1. Admin calls merge_entries(from_id, into_id, stakers) on Core contract
2. Contract migrates stakes from from_id to into_id
3. Contract migrates escrow, tvl, reward_pool
4. Contract removes from_id entry
5. Backend updates Algolia index
```

## Key Differences: V1 vs V2

| Aspect | V1 (Minting) | V2 (Distribution) |
|--------|------------|-------------------|
| **Rewards** | Instant HITZ mint on action | No instant reward |
| **Fee currency** | XLM | HITZ |
| **Staking** | Oracle-dependent calculation | 1:1 (fee = stake) |
| **Reward source** | Minting | Treasury distribution |
| **Distribution** | Per-action | Daily batch (0.05%) |
| **Supply risk** | Inflation possible | Fixed supply |

## Flow Summary

1. **Non-staking** (stream/like/download): Pay HITZ fee → treasury → entry escrow increases → future distribution share
2. **Staking** (mine/invest): Pay HITZ as stake → contract → ownership → claim rewards
3. **Treasury**: 0.05% daily → proportional to escrow → entry reward pools
4. **Claiming**: Stakers claim proportional share; artists claim equity share
5. **Unstaking**: Withdraw stake anytime → lose future ownership
