# UI Integration Guide - Post-Exhaustion V2

## Overview

This guide documents the integration between the Skyhitz UI and the V2 smart contract operating in **post-exhaustion distribution mode**.

### Key V2 Changes

| Aspect | V1 | V2 (Current) |
|--------|-----|--------------|
| Token source | Minted on actions | Treasury distribution |
| Fee currency | XLM | HITZ |
| Staking | Oracle-dependent | 1:1 (fee = stake) |
| Instant rewards | Yes (minting) | No (via treasury) |
| Distribution | Per-action | Daily batch (0.05%) |

## Contract Interface

### Core Functions

```typescript
// Record user action (main entrypoint)
record_action(caller, entry_id, kind, amount?)

// Claim staker rewards
claim_rewards(entry_id, claimer) -> i128

// Claim artist equity
claim_artist_equity(entry_id, artist) -> i128

// Unstake tokens
unstake(entry_id, caller, amount) -> i128

// Create entry (admin)
create_entry(entry_id)

// View functions
get_stake(entry_id, owner) -> i128
get_stake_total(entry_id) -> i128
get_claimable_rewards(entry_id, user) -> i128
get_reward_pool(entry_id) -> i128
calculate_apr(entry_id) -> i128
get_entry_stats(entry_id) -> (tvl, escrow, stake, pool, apr)
get_entry(entry_id) -> Entry

// Artist equity
set_artist_equity(entry_id, artist, equity_bps)
get_artist_equity(entry_id, artist) -> (bps, claimed, claimable)
get_total_artist_equity(entry_id) -> u32
```

### Action Types

| Action | Kind Symbol | Fee (HITZ) | Stakes? |
|--------|-------------|------------|---------|
| Stream | `stream` | 0.1 HITZ | No |
| Like | `like` | 0.2 HITZ | No |
| Download | `download` | 0.3 HITZ | No |
| Mine | `mine` | 1.0 HITZ | Yes (1:1) |
| Invest | `invest` | 3+ HITZ | Yes (1:1) |

### Entry Data Structure

```typescript
interface Entry {
  tvl_xlm: i128;      // Total Value Locked (staked HITZ)
  escrow_xlm: i128;   // Accumulated fees (distribution metric)
  created_at: u64;    // Timestamp
}
```

---

## Backend Integration

### GraphQL Resolvers

#### Record Action (All Action Types)

```typescript
// packages/api/src/graphql/record-action.ts

import ContractClient from '../../contract';

export async function recordActionResolver(
  _: any,
  { id, kind, amount }: { id: string; kind: string; amount?: number },
  context: Context
) {
  const user = requireAuth(context);
  const contract = new ContractClient(context.env);
  
  // Convert amount to stroops if provided (for invest)
  const amountStroops = amount ? BigInt(Math.floor(amount * 10_000_000)) : undefined;
  
  // Call contract
  await contract.recordAction(
  await encryption.decrypt(user.seed),
  id,
    kind,  // 'stream' | 'like' | 'download' | 'mine' | 'invest'
    amountStroops
);

  // Update Algolia
  const entry = await contract.getEntry(id);
const stats = await contract.getEntryStats(id);

await algolia.partialUpdateEntry({
  objectID: id,
    tvl: Number(entry.tvl_xlm) / 10_000_000,
    escrow: Number(entry.escrow_xlm) / 10_000_000,
    apr: Number(stats[4]) / 100,  // basis points to percentage
});

  // For staking actions, update user shares
  if (kind === 'mine' || kind === 'invest') {
const userStake = await contract.getStake(id, user.publicKey);
await algolia.updateShares(id, user.id, Number(userStake));
  }
  
  return { success: true };
}
```

#### Claim Rewards

```typescript
// packages/api/src/graphql/claim-rewards.ts

export async function claimRewardsResolver(
  _: any,
  { entryId }: { entryId: string },
  context: Context
) {
  const user = requireAuth(context);
  const contract = new ContractClient(context.env);
  
  // Check claimable first
  const claimable = await contract.getClaimableRewards(entryId, user.publicKey);
  
  if (claimable <= 0n) {
    return {
      success: false,
      message: 'No rewards to claim',
      claimedAmount: 0,
    };
  }
  
  // Claim rewards
  const claimed = await contract.claimRewards(
    await encryption.decrypt(user.seed),
    entryId
  );
  
return {
  success: true,
    claimedAmount: Number(claimed) / 10_000_000,
    message: `Claimed ${(Number(claimed) / 10_000_000).toFixed(2)} HITZ`,
  };
}
```

#### Unstake

```typescript
// packages/api/src/graphql/unstake-entry.ts

export async function unstakeEntryResolver(
  _: any,
  { entryId, amount }: { entryId: string; amount: number },
  context: Context
) {
  const user = requireAuth(context);
  const contract = new ContractClient(context.env);
  
  const amountStroops = BigInt(Math.floor(amount * 10_000_000));
  
  // Unstake
  const unstaked = await contract.unstake(
    await encryption.decrypt(user.seed),
    entryId,
    amountStroops
  );
  
  // Update Algolia
  const stats = await contract.getEntryStats(entryId);
  await algolia.partialUpdateEntry({
    objectID: entryId,
    tvl: Number(stats[0]) / 10_000_000,
  });
  
  const userStake = await contract.getStake(entryId, user.publicKey);
  await algolia.updateShares(entryId, user.id, Number(userStake));
  
  return {
    success: true,
    unstakedAmount: Number(unstaked) / 10_000_000,
  };
}
```

### GraphQL Schema

```graphql
type Query {
  # Existing queries...
  
  # HITZ balance
  userHitzBalance: Float!
  
  # Claimable rewards for an entry
  getClaimableRewards(entryId: String!): Float!
  
  # User's stake in an entry
  getStake(entryId: String!): Float!
  
  # Artist equity info
  getArtistEquity(entryId: String!): ArtistEquityInfo
}

type Mutation {
  # Record any action (stream/like/download/mine/invest)
  recordAction(id: String!, kind: String!, amount: Float): ActionResult!
  
  # Claim staker rewards
  claimRewards(entryId: String!): ClaimResult!
  
  # Claim artist equity
  claimArtistEquity(entryId: String!): ClaimResult!
  
  # Unstake from entry
  unstakeEntry(entryId: String!, amount: Float!): UnstakeResult!
}

type ActionResult {
  success: Boolean!
  message: String
}

type ClaimResult {
  success: Boolean!
  claimedAmount: Float
  message: String
}

type UnstakeResult {
  success: Boolean!
  unstakedAmount: Float
}

type ArtistEquityInfo {
  equityBps: Int!
  claimed: Float!
  claimable: Float!
}

type Entry {
  id: String!
  title: String!
  artist: String!
  tvl: Float
  escrow: Float
  apr: Float
  rewardPool: Float
  totalStake: Float
  artistEquity: Int  # basis points
}
```

---

## Frontend Integration

### Action Hooks

#### Stream Action (on playback complete)

```typescript
// packages/solito/packages/app/hooks/usePlayback.ts

import { useMutation } from '@apollo/client';
import { RECORD_ACTION } from 'app/api/graphql/operations';

export function usePlayback() {
  const [recordAction] = useMutation(RECORD_ACTION);
  
  const handlePlayComplete = async (entryId: string) => {
    try {
      await recordAction({
        variables: {
          id: entryId,
          kind: 'stream',
        }
      });
    } catch (e) {
      console.error('Failed to record stream:', e);
      // Non-blocking - don't interrupt playback
    }
  };
  
  // ... rest of hook
}
```

#### Like Action

```typescript
// packages/solito/packages/app/ui/buttons/likeButton.tsx

const handleLike = async () => {
try {
    await recordAction({
    variables: {
      id: entry.id,
      kind: 'like',
      }
    });
    toast.show('Liked!', { type: 'success' });
  } catch (e) {
    toast.show('Failed to like', { type: 'error' });
  }
};
```

#### Invest Action

```typescript
// packages/solito/packages/app/features/entry/InvestModal.tsx

const handleInvest = async (amount: number) => {
  // Minimum 3 HITZ
  if (amount < 3) {
    toast.show('Minimum investment is 3 HITZ');
    return;
  }
  
  try {
    await recordAction({
  variables: {
    id: entry.id,
        kind: 'invest',
        amount: amount,  // HITZ amount
      }
    });
    
    toast.show(`Invested ${amount} HITZ!`);
    refetchEntry();
  } catch (e) {
    toast.show('Investment failed', { type: 'error' });
  }
};
```

### Claim Rewards UI

```tsx
// packages/solito/packages/app/features/entry/ClaimSection.tsx

import { useQuery, useMutation } from '@apollo/client';
import { GET_CLAIMABLE_REWARDS, CLAIM_REWARDS } from 'app/api/graphql/operations';

export function ClaimSection({ entryId }: { entryId: string }) {
  const { data: claimableData, refetch } = useQuery(GET_CLAIMABLE_REWARDS, {
    variables: { entryId },
    pollInterval: 60000,  // Refresh every minute
  });
  
  const [claimRewards, { loading }] = useMutation(CLAIM_REWARDS);
  
  const claimable = claimableData?.getClaimableRewards || 0;
  
  const handleClaim = async () => {
    try {
      const { data } = await claimRewards({
        variables: { entryId }
      });
      
      if (data?.claimRewards?.success) {
        toast.show(`Claimed ${data.claimRewards.claimedAmount} HITZ!`);
        refetch();
      }
    } catch (e) {
      toast.show('Claim failed', { type: 'error' });
    }
  };
  
  if (claimable <= 0) return null;
  
  return (
    <View className="...">
      <P>Claimable: {claimable.toFixed(4)} HITZ</P>
      <Button onPress={handleClaim} disabled={loading}>
        Claim Rewards
      </Button>
          </View>
  );
}
```

### Unstake UI

```tsx
// packages/solito/packages/app/features/entry/UnstakeModal.tsx

export function UnstakeModal({ entryId, userStake, onClose }) {
  const [amount, setAmount] = useState('');
  const [unstake, { loading }] = useMutation(UNSTAKE_ENTRY);
  
  const handleUnstake = async () => {
    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > userStake) {
      toast.show('Invalid amount');
      return;
    }
    
    try {
      const { data } = await unstake({
        variables: { entryId, amount: amountNum }
      });
      
      if (data?.unstakeEntry?.success) {
        toast.show(`Unstaked ${data.unstakeEntry.unstakedAmount} HITZ`);
        onClose();
      }
    } catch (e) {
      toast.show('Unstake failed', { type: 'error' });
    }
  };
  
  return (
    <Modal onClose={onClose}>
      <P>Your stake: {userStake.toFixed(4)} HITZ</P>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="Amount to unstake"
        keyboardType="numeric"
      />
      <Button onPress={handleUnstake} disabled={loading}>
        Unstake
      </Button>
      <P className="text-sm text-gray-500">
        Warning: Unstaking reduces your ownership and future rewards.
      </P>
    </Modal>
  );
}
```

### Entry Stats Display

```tsx
// packages/solito/packages/app/features/entry/EntryStats.tsx

export function EntryStats({ entry }) {
  return (
    <View className="...">
      <StatItem
        label="TVL"
        value={`${entry.tvl?.toFixed(2) || 0} HITZ`}
        tooltip="Total Value Locked - sum of all stakes"
      />
      <StatItem
        label="Escrow"
        value={`${entry.escrow?.toFixed(2) || 0} HITZ`}
        tooltip="Accumulated fees from streams/likes/downloads"
      />
      <StatItem
        label="APR"
        value={`${entry.apr?.toFixed(1) || 0}%`}
        tooltip="Annualized return rate for stakers"
      />
      <StatItem
        label="Reward Pool"
        value={`${entry.rewardPool?.toFixed(2) || 0} HITZ`}
        tooltip="Available rewards from treasury distributions"
      />
      {entry.artistEquity > 0 && (
        <StatItem
          label="Artist Equity"
          value={`${(entry.artistEquity / 100).toFixed(1)}%`}
          tooltip="Non-dilutable artist share of rewards"
        />
      )}
    </View>
  );
}
```

---

## Artist Equity Integration

### Upload Screen (Verified Artists)

```tsx
// packages/solito/packages/app/features/upload/screen.tsx

export function UploadScreen() {
  const { user } = useAuth();
  const [artistEquity, setArtistEquity] = useState(0);
  
  const isVerifiedArtist = user?.verifiedArtist === true;
  
  const handleUpload = async (file, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    
    // Add artist equity if verified
    if (isVerifiedArtist && artistEquity > 0) {
      formData.append('artistEquityBps', String(Math.floor(artistEquity * 100)));
    }
    
    await upload(formData);
  };
  
  return (
    <View>
      {/* ... existing upload UI */}
      
      {isVerifiedArtist && (
        <View className="mt-4">
          <P className="font-bold">Artist Equity</P>
          <P className="text-sm text-gray-500 mb-2">
            Set your non-dilutable share of all future rewards
          </P>
          
    <Slider
      minimumValue={0}
      maximumValue={99.9}
            step={0.1}
            value={artistEquity}
            onValueChange={setArtistEquity}
          />
          
          <View className="flex-row justify-between mt-2">
            <P>Your equity: {artistEquity.toFixed(1)}%</P>
            <P>Fan pool: {(100 - artistEquity).toFixed(1)}%</P>
          </View>
  </View>
)}
    </View>
  );
}
```

### Artist Claim Section

```tsx
// packages/solito/packages/app/features/entry/ArtistClaimSection.tsx

export function ArtistClaimSection({ entryId }) {
  const { user } = useAuth();
  
  const { data } = useQuery(GET_ARTIST_EQUITY, {
    variables: { entryId },
    skip: !user?.verifiedArtist,
  });
  
  const [claimArtistEquity, { loading }] = useMutation(CLAIM_ARTIST_EQUITY);
  
  const equity = data?.getArtistEquity;
  
  if (!equity || equity.equityBps === 0) return null;
  
  return (
    <View className="bg-purple-50 p-4 rounded-lg">
      <P className="font-bold">Artist Rewards</P>
      <P>Your equity: {(equity.equityBps / 100).toFixed(1)}%</P>
      <P>Claimed: {equity.claimed.toFixed(4)} HITZ</P>
      <P>Claimable: {equity.claimable.toFixed(4)} HITZ</P>
      
      {equity.claimable > 0 && (
        <Button
          onPress={() => claimArtistEquity({ variables: { entryId } })}
          disabled={loading}
        >
          Claim Artist Rewards
        </Button>
      )}
    </View>
  );
}
```

---

## Key Differences from V1

### No Instant Rewards

V1: User performs action → instantly receives HITZ (minted)

V2: User performs action → pays HITZ fee → treasury distributes daily

**UI Implication**: Don't show "You earned X HITZ!" after actions. Instead show "Fee paid: X HITZ" or "Staked: X HITZ".

### HITZ-Only Economy

V1: XLM for fees, HITZ for rewards

V2: HITZ for everything

**UI Implication**: Update all fee displays to show HITZ, not XLM. Check user's HITZ balance before actions.

### 1:1 Staking

V1: Stake calculated based on oracle price

V2: Stake = fee paid (simple 1:1)

**UI Implication**: When investing 10 HITZ, tell user "You will stake 10 HITZ" (not a calculated amount).

### Unstaking Available

V1: No unstaking

V2: Users can unstake anytime

**UI Implication**: Add unstake button/modal to entry detail pages.

---

## Testing Checklist

### Actions
- [ ] Stream action fires on playback complete
- [ ] Like action deducts 0.2 HITZ and updates escrow
- [ ] Download action deducts 0.3 HITZ and enables download
- [ ] Mine action creates entry and stakes 1 HITZ
- [ ] Invest action validates minimum (3 HITZ) and stakes

### Claims
- [ ] Claimable preview shows correct amount
- [ ] Claim transfers HITZ to user wallet
- [ ] Claimed record updates (no double claims)
- [ ] Artist equity claim works separately

### Staking
- [ ] User stake displayed correctly
- [ ] Ownership percentage calculated right
- [ ] Unstake returns HITZ to wallet
- [ ] Stake decreases after unstake

### Stats
- [ ] TVL, escrow, APR display correctly
- [ ] Artist equity shown if present
- [ ] Reward pool updates after distributions

---

## Support

- Contract docs: `packages/api/contract/README.md`
- Tokenomics: `packages/api/contract/TOKENOMICS_AND_FLOWS.md`
- Treasury bot: `packages/api/contract/TREASURY_BOT_FLOW.md`
- Security audit: `HITZ_SECURITY_AUDIT_REPORT.md`
