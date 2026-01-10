# UI Integration Guide for New Skyhitz Contracts

## Overview
This guide provides a comprehensive list of all changes needed to integrate the new Skyhitz smart contracts with the UI.

## Contract Changes Summary

### New Contract Interface
- `record_action(caller, entry_id, kind, amount?)` - Unified action handler for stream/like/download/mine/invest
- `claim_rewards(entry_id, claimer)` - Claims HITZ rewards from entry pool
- `create_entry(entry_id)` - Creates new entry in contract
- `get_stake(entry_id, owner)` - Gets user's stake in entry
- `get_claimable_rewards(entry_id, user)` - Preview claimable rewards
- `calculate_apr(entry_id)` - On-chain APR calculation
- `get_entry_stats(entry_id)` - Returns {total_staked, reward_pool, apr}

### Artist Equity Functions (NEW)
- `set_artist_equity(entry_id, artist, equity_bps)` - Admin sets artist's non-dilutable equity
- `claim_artist_equity(entry_id, artist)` - Artist claims their share of rewards
- `get_artist_equity(entry_id, artist)` - Returns (equity_bps, claimed, claimable)
- `get_total_artist_equity(entry_id)` - Returns total artist equity in basis points

### Removed Methods
- `sellShares()` - No longer supported
- `mergeEntries()` - No longer supported

### Updated Data Structures
```typescript
interface Entry {
  created_at: u64;
  escrow: i128;  // Escrow for non-staking actions (in HITZ stroops)
  tvl: i128;     // Total Value Locked (staking actions) (in HITZ stroops)
}
```

---

## Implementation Checklist

### ✅ Phase 1: Contract Client (COMPLETED)

#### packages/api/contract/index.ts
- [x] Added `createEntry(entryId: string)`
- [x] Added `recordAction(secret, entryId, kind, amount?)`
- [x] Added `getStake(entryId, owner)`
- [x] Added `getStakeTotal(entryId)`
- [x] Added `getClaimableRewards(entryId, user)`
- [x] Added `claimRewards(secret, entryId)`
- [x] Added `calculateApr(entryId)`
- [x] Added `getEntryStats(entryId)`
- [ ] Update `getEntry()` to handle new Entry interface
- [ ] Remove/deprecate old methods (sellShares, mergeEntries)

---

### Phase 2: Backend GraphQL Resolvers

#### packages/api/src/graphql/invest-entry.ts
```typescript
// OLD:
const res = await contract.invest(await encryption.decrypt(user.seed), id, amount);

// NEW:
const res = await contract.recordAction(
  await encryption.decrypt(user.seed),
  id,
  'invest',
  amount
);

// Update Algolia sync:
const sorobanEntry = await contract.getEntry(id);
const stats = await contract.getEntryStats(id);

await algolia.partialUpdateEntry({
    tvl: sorobanEntry.tvl,
    escrow: sorobanEntry.escrow,
  apr: stats.apr,
  objectID: id,
});

// Update shares -> stakes:
const userStake = await contract.getStake(id, user.publicKey);
await algolia.updateShares(id, user.id, Number(userStake));
```

#### packages/api/src/graphql/mine-external-entry.ts
```typescript
// Replace all invest() calls with recordAction():

// OLD:
await contract.invest(userSeed, metaCid, toStroops(investEscrow));
await contract.invest(userSeed, metaCid, toStroops(half));

// NEW:
await contract.recordAction(userSeed, metaCid, 'invest', toStroops(investEscrow));
await contract.recordAction(userSeed, metaCid, 'invest', toStroops(half));
```

#### packages/api/src/graphql/claim-earnings.ts
```typescript
// OLD:
const result = await contract.claimEarnings(user.publicKey, entryId, await encryption.decrypt(user.seed));

// NEW:
const result = await contract.claimRewards(await encryption.decrypt(user.seed), entryId);

// Update response:
return {
  success: true,
  totalClaimedAmount: result.claimedAmount / 10_000_000, // Convert stroops to XLM
  claimedEntries: [{
    entryId,
    amount: result.claimedAmount / 10_000_000
  }],
  message: `Successfully claimed ${(result.claimedAmount / 10_000_000).toFixed(2)} HITZ`,
  lastClaimTime: new Date().toISOString(),
};
```

#### packages/api/src/graphql/sell-shares.ts
**ACTION: DELETE THIS FILE** - Sell shares is no longer supported. Users can only invest/stake.

#### packages/api/src/graphql/user-credits.ts
Add HITZ balance support:
```typescript
export const userHitzBalanceResolver = async (_: any, __: any, context: Context) => {
  const user = requireAuth(context);
  const { env } = context;
  const contract = new ContractClient(env);
  
  // Get HITZ token balance
  // TODO: Add hitzTokenClient.balance() method to contract client
  return 0; // Placeholder
};
```

#### packages/api/src/graphql/resolvers.ts
```typescript
const Query = {
  // ... existing queries
  userHitzBalance: userHitzBalanceResolver,
};

const Mutation = {
  // ... existing mutations
  // REMOVE: sellShares: sellSharesResolver,
};
```

#### packages/api/src/graphql/schema.ts
```typescript
type Query {
  // ... existing queries
  userHitzBalance: Float!
}

type Mutation {
  // ... existing mutations
  # REMOVE: sellShares(id: String!, amount: Float!): Boolean!
}

type EntryDetails {
  imageUrl: String!
  videoUrl: String!
  description: String
  title: String!
  id: String!
  artist: String!
  holders: [EntryHolder!]
  history: [EntryActivity!]
  tvl: Float
  apr: Float
  escrow: Float  # ADD THIS
}
```

---

### Phase 3: Frontend GraphQL Operations

#### packages/solito/packages/app/api/graphql/operations.ts
```typescript
// Add new operations:
export const RECORD_ACTION = gql`
  mutation RecordAction($id: String!, $kind: String!, $amount: Float) {
    recordAction(id: $id, kind: $kind, amount: $amount) {
      success
      message
    }
  }
`

export const USER_HITZ_BALANCE = gql`
  query UserHitzBalance {
    userHitzBalance
  }
`

export const GET_CLAIMABLE_REWARDS = gql`
  query GetClaimableRewards($id: String!) {
    getClaimableRewards(id: $id)
  }
`

// Update INVEST_ENTRY to match new interface (already exists, just verify)
export const INVEST_ENTRY = gql`
  mutation InvestEntry($id: String!, $amount: Float!) {
    investEntry(id: $id, amount: $amount) {
      success
      message
    }
  }
`
```

---

### Phase 4: UI Components - Actions

#### packages/solito/packages/app/hooks/usePlayback.ts
Add stream tracking:
```typescript
import { useMutation } from '@apollo/client'
import { RECORD_ACTION } from 'app/api/graphql/operations'

export function usePlayback() {
  const [recordAction] = useMutation(RECORD_ACTION)
  
  // Add in the playback logic where song starts playing:
  const handlePlay = async (entry: Entry) => {
    // ... existing play logic
    
    // Record stream action
    try {
      await recordAction({
        variables: {
          id: entry.id,
          kind: 'stream',
        }
      })
    } catch (e) {
      console.error('Failed to record stream action', e)
    }
  }
  
  // ... rest of hook
}
```

#### packages/solito/packages/app/ui/buttons/likeButton.tsx
```typescript
// REMOVE the invest() workaround (lines 66-97)
// Replace with:
try {
  const { data } = await recordAction({
    variables: {
      id: entry.id,
      kind: 'like',
    },
  })
  
  if (data?.recordAction?.success) {
    toast.show('Liked!', { type: 'success' })
  }
} catch (error) {
  // Revert cache on error
  isLiked ? addLikeToCache(entry) : removeLikeFromCache(entry)
  toast.show('Failed to like entry', { type: 'danger' })
}
```

#### packages/solito/packages/app/ui/buttons/download/web.tsx
```typescript
// Replace invest() call with recordAction():
const { data } = await recordAction({
  variables: {
    id: entry.id,
    kind: 'download',
  }
})

const ok = !!data?.recordAction?.success
```

#### packages/solito/packages/app/features/search/.../combinedSearchResultList.tsx
```typescript
// Update mine button:
const res = await mineExternal({ variables: { input }, errorPolicy: 'none' as any })
// The backend mine resolver will handle calling recordAction('mine')
```

---

### Phase 5: Asset Management (HITZ Support)

#### 1. Create State Management

**packages/solito/packages/app/state/asset.ts** (NEW FILE)
```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AssetType = 'XLM' | 'HITZ'

interface AssetState {
  selectedAsset: AssetType
  setSelectedAsset: (asset: AssetType) => void
  xlmBalance: number
  hitzBalance: number
  setXlmBalance: (balance: number) => void
  setHitzBalance: (balance: number) => void
}

export const useAssetStore = create<AssetState>()(
  persist(
    (set) => ({
      selectedAsset: 'XLM',
      xlmBalance: 0,
      hitzBalance: 0,
      setSelectedAsset: (asset) => set({ selectedAsset: asset }),
      setXlmBalance: (balance) => set({ xlmBalance: balance }),
      setHitzBalance: (balance) => set({ hitzBalance: balance }),
    }),
    {
      name: 'asset-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

#### 2. Create HITZ Icon Component

**packages/solito/packages/app/ui/icons/hitz.tsx** (NEW FILE)
```typescript
import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  size?: number
  fill?: string
  className?: string
}

function Hitz({ size = 24, fill = 'currentColor', className }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      {/* TODO: Add your HITZ logo SVG path here */}
      <Path
        d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
        fill={fill}
      />
    </Svg>
  )
}

export default Hitz
```

#### 3. Update Profile Screen

**packages/solito/packages/app/features/profile/index.tsx**
```typescript
import { useAssetStore } from 'app/state/asset'
import Hitz from 'app/ui/icons/hitz'
import { useQuery } from '@apollo/client'
import { USER_HITZ_BALANCE } from 'app/api/graphql/operations'

export function ProfileScreen({ user }: { user: User }) {
  const { selectedAsset, setSelectedAsset } = useAssetStore()
  const { data: xlmCredits } = useQuery(USER_CREDITS, { fetchPolicy: 'network-only' })
  const { data: hitzData } = useQuery(USER_HITZ_BALANCE, { fetchPolicy: 'network-only' })
  
  const displayBalance = selectedAsset === 'XLM' 
    ? xlmCredits?.userCredits || 0
    : hitzData?.userHitzBalance || 0
  
  const AssetIcon = selectedAsset === 'XLM' ? Stellar : Hitz
  
  return (
    <SafeAreaView className="bg-[--bg-color]">
      {/* ... */}
      
      <View className="mt-8 w-full items-center justify-center px-4">
        <View className="mb-0.5 flex w-full flex-row items-center justify-between">
          <View className="ml-2 flex flex-row items-center gap-2">
            {/* Asset Selector Dropdown */}
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value as AssetType)}
              className="bg-transparent border-none text-[--text-color] font-unbounded"
            >
              <option value="XLM">XLM</option>
              <option value="HITZ">HITZ</option>
            </select>
            
            <P className="flex flex-row items-center font-bold font-unbounded text-[--text-color] gap-2">
              <AssetIcon size={18} />
              {`${displayBalance.toFixed(2)} ${selectedAsset}`}
            </P>
          </View>
          
          {/* ... rest of component */}
        </View>
      </View>
    </SafeAreaView>
  )
}
```

#### 4. Update InvestSection

**packages/solito/packages/app/features/entry/InvestSection.tsx**
```typescript
// Add stake info:
const { data: stakeData } = useQuery(GET_STAKE, {
  variables: { id: entry.id, owner: user?.publicKey },
  skip: !user
})

const userStake = stakeData?.getStake || 0
const stakePercentage = entry.tvl ? (userStake / Number(entry.tvl)) * 100 : 0

// Display:
<View className="flex-row">
  <P className="text-[--text-secondary-color] mr-1 font-unbounded text-xs">
    Your Stake:{' '}
  </P>
  <P className="text-[--text-color] font-unbounded text-xs">
    {`${stroopsToLumens(userStake)} XLM (${stakePercentage.toFixed(2)}%)`}
  </P>
</View>
```

---

### Phase 6: Algolia Sync

#### packages/api/src/algolia/algolia.ts
```typescript
export interface EntryAlgoliaObject {
  objectID: string
  title: string
  artist: string
  description?: string
  imageUrl: string
  videoUrl: string
  tvl?: number
  apr?: number
  escrow?: number  // ADD THIS
}

export class AlgoliaClient {
  // Update partialUpdateEntry to handle new fields:
  async partialUpdateEntry(entry: Partial<EntryAlgoliaObject> & { objectID: string }) {
    try {
      await this.entriesIndex.partialUpdateObject(entry)
    } catch (e) {
      console.error('Failed to update entry in Algolia', e)
      throw e
    }
  }
  
  // Update updateShares to work with stakes:
  async updateShares(entryId: string, userId: string, stakeAmount: number) {
    // Implementation depends on your Algolia schema for tracking user stakes
    // You might need a separate index or nested object structure
  }
}
```

---

## Testing Checklist

### Backend
- [ ] Test `recordAction` for each action type (stream/like/download/mine/invest)
- [ ] Test `claimRewards` returns correct amounts
- [ ] Test Algolia sync updates tvl, apr, escrow correctly
- [ ] Test stake tracking per user

### Frontend
- [ ] Stream action fires when song plays
- [ ] Like button calls correct action
- [ ] Download button calls correct action
- [ ] Mine button works correctly
- [ ] Invest section shows correct staking info
- [ ] Asset selector switches between XLM and HITZ
- [ ] Balances update correctly
- [ ] Claim rewards works and updates balance

### Integration
- [ ] Full user flow: mine → invest → earn rewards → claim
- [ ] APR calculations display correctly
- [ ] TVL and escrow tracked separately
- [ ] Error handling for all actions

---

## Migration Notes

### Database/Algolia
- Entry schema needs `escrow` field added
- Consider migrating existing `tvl` data (all goes to `tvl_xlm`, `escrow_xlm` starts at 0)

### User Communication
- Announce new features: HITZ token, staking rewards, APR
- Explain difference between escrow (stream/like/download) and staking (mine/invest)
- Provide migration guide for existing users

---

## Deployment Strategy

1. **Deploy Contract** (Testnet first)
2. **Update Backend** (GraphQL resolvers, Algolia sync)
3. **Test Backend** (Postman/Playground)
4. **Update Frontend** (Actions, then Asset management)
5. **Test Frontend** (Manual QA)
6. **Deploy to Production** (Gradual rollout)

---

## Known Issues / TODOs

- [ ] HITZ token client methods need to be added to contract client
- [ ] Asset selector needs proper mobile UI (not just `<select>`)
- [ ] HITZ logo SVG needs to be created
- [ ] Error messages need to be user-friendly
- [ ] Loading states for all async operations
- [ ] Optimistic UI updates for better UX

---

## Phase 7: Artist Equity Integration (NEW)

### Backend Changes (COMPLETED)

#### packages/api/src/util/types.ts
```typescript
// User type - added verifiedArtist field
export type User = {
  // ... existing fields
  verifiedArtist?: boolean;  // NEW: Whether user can set artist equity
}

// PendingUpload type - added artist equity fields
export interface PendingUpload {
  // ... existing fields
  isVerifiedArtist?: boolean;   // NEW: Was uploader verified at upload time
  artistEquityBps?: number;      // NEW: Artist's equity in basis points (0-9990)
}
```

#### packages/api/src/graphql/schema.ts
```graphql
type User {
  # ... existing fields
  verifiedArtist: Boolean  # NEW
}

type PendingUpload {
  # ... existing fields
  isVerifiedArtist: Boolean  # NEW
  artistEquityBps: Int        # NEW
}
```

#### packages/api/src/upload-complete.ts
- Parses `artistEquityBps` from upload form data
- Validates range (0-9990 basis points)
- Stores `isVerifiedArtist` and `artistEquityBps` in pending upload

#### packages/api/src/graphql/pending-uploads.ts
- After entry approval, calls `contract.setArtistEquity()` if upload has equity

#### packages/api/contract/index.ts
```typescript
// New methods added:
setArtistEquity(entryId, artistAddress, equityBps)
getArtistEquity(entryId, artistAddress) -> { equityBps, claimed, claimable }
getTotalArtistEquity(entryId) -> number
claimArtistEquity(secret, entryId) -> { claimedAmount }
```

### Frontend Changes (COMPLETED)

#### Upload Screen (packages/solito/.../features/upload/screen.tsx)
- Added equity slider (0-99.9%) for verified artists only
- Shows equity split preview (artist vs fan pool)
- Sends `artistEquityBps` to backend when uploading

```tsx
// Only visible if user.verifiedArtist === true
{isVerifiedArtist && (
  <View className="...">
    <P>Artist Equity</P>
    <Slider
      minimumValue={0}
      maximumValue={99.9}
      value={artistEquityPercent}
      onValueChange={setArtistEquityPercent}
    />
    <P>Your equity: {artistEquityPercent.toFixed(1)}%</P>
    <P>Fan pool: {(100 - artistEquityPercent).toFixed(1)}%</P>
  </View>
)}
```

#### Pending Upload Entry (packages/solito/.../pending-uploads/PendingUploadEntry.tsx)
- Shows "✓ Artist" badge for verified artist uploads
- Displays equity percentage in track info

#### Approval Modal (packages/solito/.../pending-uploads/ApprovalModal.tsx)
- Shows artist equity breakdown when reviewing uploads
- Displays artist vs fan pool percentages

### GraphQL Operations (packages/solito/.../api/graphql/operations.ts)
```typescript
// Updated SIGN_IN_WITH_TOKEN to include verifiedArtist
export const SIGN_IN_WITH_TOKEN = gql`
  mutation SignInWithToken($uid: String!, $token: String!) {
    signInWithToken(uid: $uid, token: $token) {
      # ... existing fields
      verifiedArtist  # NEW
    }
  }
`

// Updated PENDING_UPLOADS to include artist equity fields
export const PENDING_UPLOADS = gql`
  query PendingUploads {
    pendingUploads {
      # ... existing fields
      isVerifiedArtist  # NEW
      artistEquityBps   # NEW
    }
  }
`
```

### Testing Checklist (Artist Equity)

#### Backend
- [x] `setArtistEquity` sets equity correctly
- [x] `getArtistEquity` returns correct values
- [x] `getTotalArtistEquity` sums all artists
- [x] `claimArtistEquity` transfers correct amount
- [x] Staker rewards exclude artist equity portion
- [x] Multiple artists (collaboration) works correctly
- [x] Max equity (99.9%) enforced
- [x] Error cases handled (duplicate, overflow, etc.)

#### Frontend
- [x] Equity slider only visible for verified artists
- [x] Slider range 0-99.9%
- [x] Fan pool percentage updates in real-time
- [x] Equity sent with upload form data
- [x] Curator sees equity info in pending uploads
- [x] Approval modal shows equity breakdown

---

## Support

For questions or issues during integration, refer to:
- Contract documentation: `packages/api/contract/README.md`
- Tokenomics: `packages/api/contract/TOKENOMICS_AND_FLOWS.md`
- Contract review: `packages/api/contract/CONTRACT_REVIEW.md`

