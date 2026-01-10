---
id: algolia
title: Algolia Indices
---

## Indices

- `entriesIndex`: Core entry documents with metadata, APR, reward pools
- `ratingReplicaIndex`: Replica sorted by APR desc (used to compute top APR)
- `sharesIndex`: Per-user stake amounts per entry (legacy name, now tracks HITZ stakes)

## Data Model (V2)

### Entry Document

```typescript
interface AlgoliaEntry {
  objectID: string;           // Entry ID
  title: string;
  artist: string;
  imageUrl: string;
  videoUrl: string;
  tvl: number;                // Total Value Locked in HITZ
  escrow: number;             // Accumulated escrow in HITZ
  rewardPool: number;         // Claimable rewards in HITZ
  apr: number;                // Annualized return rate (basis points)
  totalStaked: number;        // Sum of all user stakes in HITZ
  artistEquity?: number;      // Artist's non-dilutable equity (basis points)
  createdAt: number;          // Timestamp for APR calculation
}
```

### Shares Document (Stakes)

```typescript
interface AlgoliaShares {
  objectID: string;           // `${entryId}_${userId}`
  entryId: string;
  userId: string;
  shares: number;             // User's stake amount in HITZ stroops
}
```

## Update Flows

### After Staking Actions (Mine/Invest)

When a user mines or invests in an entry via `recordAction`:

1. **Update Entry**:
   ```typescript
   partialUpdateEntry(entryId, {
     tvl: onChainEntry.tvl_xlm,      // Now HITZ
     escrow: onChainEntry.escrow_xlm, // Now HITZ
     apr: calculateAPR(entryId),
     rewardPool: getRewardPool(entryId)
   });
   ```

2. **Update User Stake**:
   ```typescript
   updateShares(entryId, userId, userStake);
   ```

### After Non-Staking Actions (Stream/Like/Download)

These actions pay fees to treasury, increasing entry escrow:

1. **Update Entry Escrow**:
   ```typescript
   partialUpdateEntry(entryId, {
     escrow: onChainEntry.escrow_xlm  // Now HITZ
   });
   ```

### After Treasury Distribution

When the treasury bot distributes HITZ:

1. **Refresh All Entry Reward Pools**:
   ```typescript
   for (const entry of entriesWithEscrow) {
     partialUpdateEntry(entry.id, {
       rewardPool: getRewardPool(entry.id),
       apr: calculateAPR(entry.id)
     });
   }
   ```

### After Claim Rewards

When a user claims rewards:

1. **Update Entry Reward Pool**:
   ```typescript
   partialUpdateEntry(entryId, {
     rewardPool: getRewardPool(entryId)
   });
   ```

### After Unstake

When a user unstakes HITZ:

1. **Update Entry TVL**:
   ```typescript
   partialUpdateEntry(entryId, {
     tvl: onChainEntry.tvl_xlm,
     totalStaked: getTotalStaked(entryId)
   });
   ```

2. **Update User Stake**:
   ```typescript
   updateShares(entryId, userId, newStakeAmount);
   // Or delete if stake is zero
   ```

### After Artist Equity Changes

When an artist sets their equity:

1. **Update Entry**:
   ```typescript
   partialUpdateEntry(entryId, {
     artistEquity: getArtistEquity(entryId)
   });
   ```

## Admin Helpers

For entry merges and removals:

- `getSharesByEntry(entryId)`: Get all stakes for an entry
- `deleteSharesByEntry(entryId)`: Remove all stake documents for entry
- `bulkUpdateShares(updates)`: Sync on-chain stakes → Algolia

## Sync Script

Periodic reconciliation between on-chain state and Algolia:

```bash
# Run from API package
yarn sync:algolia
```

This script:
1. Fetches all entries from contract
2. Compares with Algolia state
3. Updates any discrepancies
4. Reports sync status
