---
id: graphql
title: GraphQL API
---

The GraphQL API runs on Cloudflare Workers. It handles user interactions, Soroban contract calls, and Algolia synchronization.

## Key Resolvers

### Search

- **Internal**: Queries `entriesIndex` and `usersIndex` in Algolia
- **External**: `searchExternalMusic` queries Audius for music discovery

### Playback

- `externalAudioUrl`: Resolves playable stream URLs for Audius tracks

### Mining

`mineExternalEntry` orchestrates the full mining flow:

1. Validate user has sufficient HITZ balance
2. Pin media to R2 (audio/video)
3. Pin metadata to R2 (CID becomes entry ID)
4. Call contract `recordAction("mine", ...)` with HITZ fee
5. Index in Algolia only after Soroban succeeds
6. Update user's stake in `sharesIndex`

### Investing

`investEntry` allows users to stake additional HITZ:

1. Validate user's HITZ balance
2. Call contract `recordAction("invest", ...)` with fee = stake amount
3. Update Algolia entry (TVL, totalStaked)
4. Update user's stake in `sharesIndex`

### Streaming/Engagement

`recordAction` tracks non-staking actions:

- `stream`: User plays a track
- `like`: User likes a track
- `download`: User downloads a track

Each action:
1. Transfers HITZ fee from user to treasury
2. Increases entry's escrow balance
3. Updates Algolia escrow field

### Rewards

- `claimableEarningsPreview`: Read-only calculation of claimable HITZ
- `claimEarnings`: Executes `claim_rewards` on contract, transfers HITZ to user

### Unstaking

`unstakeEntry` allows users to withdraw staked HITZ:

1. Call contract `unstake(entry_id, amount)`
2. Update Algolia entry (TVL, totalStaked)
3. Update or remove user's stake in `sharesIndex`
4. User receives HITZ back to wallet

### Artist Equity

- `setArtistEquity(entryId, basisPoints)`: Artists set their non-dilutable equity
- `claimArtistEquity(entryId)`: Artists claim their equity portion of rewards

### Admin Tools

- `mergeEntries(fromId, toId)`: Merges two entries, migrating stakes
- `removeEntry(id)`: Removes entry, refunds stakes, deletes R2 assets

## Mining Highlights

### Balance Validation

```typescript
// Check user has enough HITZ for mining fee
const userBalance = await getHitzBalance(userId);
const miningFee = getBaseFee(); // 0.1 HITZ
if (userBalance < miningFee) {
  throw new Error("Insufficient HITZ balance");
}
```

### 1:1 Staking

In V2, the fee paid IS the stake:

```typescript
// No complex calculation needed
const stake = fee;  // 1:1 ratio
await recordAction("mine", entryId, fee);
```

### Error Handling

Strict ordering ensures consistency:

```typescript
// 1. Upload to R2 first (reversible)
const mediaUrl = await pinToR2(media);
const metadataUrl = await pinToR2(metadata);

// 2. Soroban transaction (authoritative)
const result = await contract.recordAction(/*...*/);

// 3. Only index if Soroban succeeds
if (result.ok) {
  await algolia.indexEntry(/*...*/);
}
```

## APR Calculation

```typescript
function calculateAPR(entryId: string): number {
  const entry = await getEntry(entryId);
  const rewardPool = await getRewardPool(entryId);
  const totalStaked = await getTotalStaked(entryId);
  
  const daysSinceCreation = (Date.now() - entry.createdAt) / (1000 * 60 * 60 * 24);
  
  if (totalStaked === 0 || daysSinceCreation === 0) return 0;
  
  // APR in basis points
  return ((rewardPool / totalStaked) / daysSinceCreation) * 365 * 10000;
}
```

## Environment Requirements

| Variable | Description |
|----------|-------------|
| `ALGOLIA_ADMIN_KEY` | Write access to indices |
| `CONTRACT_ID` | Skyhitz Core contract |
| `HITZ_TOKEN_ID` | HITZ token contract |
| `ISSUER_SEED` | Platform wallet for operations |
| `TREASURY_SEED` | Treasury wallet for distributions |
